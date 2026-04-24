import { createHmac, randomUUID } from "node:crypto";
import { hasPermission } from "@petadot/auth";
import { requireRazorpayRuntimeEnv } from "@petadot/config";
import {
  BillingRepository,
  CustomerWorkspaceRepository,
  withTransaction,
  type BillingCurrency,
  type BillingCouponRecord,
  type BillingPackageRecord,
  type BillingServiceType,
  type BillingTaxRecord
} from "@petadot/db";
import {
  capturePayPalOrder,
  createPayPalOrder,
  createRazorpayOrder
} from "@petadot/integrations";
import type {
  BillingCouponValidateInput,
  BillingOrderCreateInput,
  BillingPackageQueryInput,
  PayPalPaymentCaptureInput,
  RazorpayPaymentVerifyInput
} from "@petadot/validation";
import { ApiError, errorResponse, successResponse } from "./auth/api";
import { getCustomerSessionPrincipal } from "./auth/server";

type BillingActorContext = {
  userId: string;
  tenantId: string;
};

function asMoney(value: string | number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function getPackageUnitPrice(
  pkg: BillingPackageRecord,
  currency: BillingCurrency
) {
  return asMoney(currency === "INR" ? pkg.priceInr : pkg.priceUsd);
}

function getTaxPercentage(tax: BillingTaxRecord) {
  if (tax.taxType === "GST") {
    return asMoney(tax.cgst) + asMoney(tax.sgst);
  }

  if (tax.taxType === "IGST") {
    return asMoney(tax.igst);
  }

  return asMoney(tax.otherTax);
}

function normalizeDiscountType(discountType: string) {
  const normalized = discountType.trim().toLowerCase();

  if (["percentage", "percent", "pct"].includes(normalized)) {
    return "percentage";
  }

  return "fixed";
}

async function getBillingActorContext(): Promise<BillingActorContext> {
  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Customer session is required");
  }

  const profile = await new CustomerWorkspaceRepository().findProfileByUserId(
    principal.userId
  );

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (
    !profile.isPrimaryAccount &&
    !hasPermission(principal.permissions, "billing", "view")
  ) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have permission to view billing"
    );
  }

  return {
    userId: principal.userId,
    tenantId: principal.tenantId
  };
}

function mapPackage(pkg: BillingPackageRecord, currency: BillingCurrency) {
  return {
    id: pkg.id,
    serviceType: pkg.serviceType,
    name: pkg.packageName,
    scans: pkg.rescans,
    price: getPackageUnitPrice(pkg, currency),
    currency,
    priceInr: asMoney(pkg.priceInr),
    priceUsd: asMoney(pkg.priceUsd),
    rescansPriceInr: asMoney(pkg.rescansPriceInr),
    rescansPriceUsd: asMoney(pkg.rescansPriceUsd),
    teamManageAccess: pkg.teamManageAccess,
    status: pkg.status
  };
}

function calculateCheckoutPricing(input: {
  packages: BillingPackageRecord[];
  taxes: BillingTaxRecord[];
  items: BillingCouponValidateInput["items"];
  currency: BillingCurrency;
  discount?: {
    type: string;
    value: number;
  };
}) {
  const packagesById = new Map(input.packages.map((pkg) => [pkg.id, pkg]));
  const subtotal = input.items.reduce((total, item) => {
    const pkg = packagesById.get(item.packageId);

    if (!pkg) {
      throw new ApiError(
        422,
        "PACKAGE_UNAVAILABLE",
        "A selected package is unavailable"
      );
    }

    return total + getPackageUnitPrice(pkg, input.currency) * item.quantity;
  }, 0);

  const normalizedDiscountType = input.discount
    ? normalizeDiscountType(input.discount.type)
    : null;
  const rawDiscount = input.discount
    ? normalizedDiscountType === "percentage"
      ? subtotal * (input.discount.value / 100)
      : input.discount.value
    : 0;
  const discountAmount = Math.min(asMoney(rawDiscount), asMoney(subtotal));
  const discountedSubtotal = asMoney(subtotal - discountAmount);
  const taxPercentage = input.taxes.reduce(
    (total, tax) => total + getTaxPercentage(tax),
    0
  );
  const tax = asMoney(discountedSubtotal * (taxPercentage / 100));

  return {
    subtotal: asMoney(subtotal),
    discount: discountAmount,
    discountedSubtotal,
    tax,
    total: asMoney(discountedSubtotal + tax)
  };
}

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/g, "");
}

function createOrderNumber() {
  return `PD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function createInvoiceNumber(purchaseId: string) {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${purchaseId
    .slice(0, 8)
    .toUpperCase()}`;
}

function verifyRazorpaySignature(input: RazorpayPaymentVerifyInput) {
  const env = requireRazorpayRuntimeEnv(process.env);
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return expected === input.razorpaySignature;
}

function buildLineItems(input: {
  packages: BillingPackageRecord[];
  taxes: BillingTaxRecord[];
  items: BillingOrderCreateInput["items"];
  currency: BillingCurrency;
  subtotal: number;
  discountAmount: number;
}) {
  const packagesById = new Map(input.packages.map((pkg) => [pkg.id, pkg]));

  return input.items.map((item) => {
    const pkg = packagesById.get(item.packageId);

    if (!pkg) {
      throw new ApiError(
        422,
        "PACKAGE_UNAVAILABLE",
        "A selected package is unavailable"
      );
    }

    const unitPrice = getPackageUnitPrice(pkg, input.currency);
    const totalBasePrice = asMoney(unitPrice * item.quantity);
    const discountShare =
      input.subtotal > 0
        ? asMoney(input.discountAmount * (totalBasePrice / input.subtotal))
        : 0;
    const taxableAmount = asMoney(totalBasePrice - discountShare);
    const taxes = input.taxes.map((tax) => {
      const percentage = getTaxPercentage(tax);

      return {
        taxType: tax.taxType,
        taxName: tax.taxName,
        percentage,
        amount: asMoney(taxableAmount * (percentage / 100))
      };
    });
    const totalTaxAmount = asMoney(
      taxes.reduce((total, tax) => total + tax.amount, 0)
    );
    const totalFinalPrice = asMoney(taxableAmount + totalTaxAmount);
    const scans = pkg.rescans * item.quantity;

    return {
      packageId: pkg.id,
      packageName: pkg.packageName,
      serviceType: pkg.serviceType,
      scans,
      basePricePerScan:
        scans > 0 ? asMoney(totalBasePrice / scans) : totalBasePrice,
      finalPricePerScan:
        scans > 0 ? asMoney(totalFinalPrice / scans) : totalFinalPrice,
      totalBasePrice,
      totalTaxAmount,
      totalFinalPrice,
      taxes
    };
  });
}

function validateCouponState(coupon: BillingCouponRecord | null) {
  if (!coupon) {
    throw new ApiError(422, "COUPON_NOT_FOUND", "Coupon not found");
  }

  if (coupon.status !== "active") {
    throw new ApiError(422, "COUPON_DISABLED", "Coupon is disabled");
  }

  if (new Date(coupon.expiryDate).getTime() <= Date.now()) {
    throw new ApiError(422, "COUPON_EXPIRED", "Coupon has expired");
  }

  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(
      422,
      "COUPON_USAGE_LIMIT_REACHED",
      "Coupon usage limit has been reached"
    );
  }

  if (coupon.usedByUser) {
    throw new ApiError(422, "COUPON_ALREADY_USED", "Coupon was already used");
  }
}

async function resolveOrderQuote(
  repository: BillingRepository,
  context: BillingActorContext,
  input: BillingOrderCreateInput
) {
  const packageIds = [...new Set(input.items.map((item) => item.packageId))];
  const [packages, taxes, coupon] = await Promise.all([
    repository.findActivePackagesByIds(packageIds),
    repository.listActiveTaxes(),
    input.couponCode
      ? repository.findCouponForUser(input.couponCode, context.userId)
      : Promise.resolve(null)
  ]);

  if (packages.length !== packageIds.length) {
    throw new ApiError(
      422,
      "PACKAGE_UNAVAILABLE",
      "A selected package is unavailable"
    );
  }

  if (input.couponCode) {
    validateCouponState(coupon);
  }

  const discount = coupon
    ? {
        type: normalizeDiscountType(coupon.discountType),
        value: asMoney(coupon.discountValue)
      }
    : undefined;
  const pricing = calculateCheckoutPricing({
    packages,
    taxes,
    items: input.items,
    currency: input.currency,
    discount
  });
  const lineItems = buildLineItems({
    packages,
    taxes,
    items: input.items,
    currency: input.currency,
    subtotal: pricing.subtotal,
    discountAmount: pricing.discount
  });

  return {
    packages,
    taxes,
    coupon,
    pricing,
    lineItems
  };
}

export async function listBillingPackages(query: BillingPackageQueryInput) {
  await getBillingActorContext();
  const repository = new BillingRepository();
  const packages = await repository.listActivePackages(
    query.serviceType as BillingServiceType | undefined
  );

  return {
    packages: packages.map((pkg) => mapPackage(pkg, "INR"))
  };
}

export async function getBillingOverview() {
  const context = await getBillingActorContext();
  const repository = new BillingRepository();
  const overview = await repository.getBillingOverview(context.tenantId);

  return {
    packages: overview.packages.map((pkg) => mapPackage(pkg, "INR")),
    taxes: overview.taxes.map((tax) => ({
      id: tax.id,
      type: tax.taxType,
      name: tax.taxName,
      percentage: getTaxPercentage(tax),
      status: tax.status
    })),
    purchases: overview.purchases.map((purchase) => ({
      id: purchase.id,
      orderNumber: purchase.orderNumber,
      invoiceNumber: purchase.invoiceNumber,
      price: asMoney(purchase.price),
      subtotal: asMoney(purchase.subtotal),
      tax: asMoney(purchase.totalTaxAmount),
      currency: purchase.currency ?? purchase.priceCurrency,
      gateway: purchase.paymentGateway,
      status: purchase.status,
      paymentStatus: purchase.paymentStatus,
      paidAt: purchase.paymentDatetime,
      createdAt: purchase.createdAt
    }))
  };
}

export async function listBillingPurchases() {
  const context = await getBillingActorContext();
  const purchases = await new BillingRepository().listPurchasesByTenantId(
    context.tenantId
  );

  return {
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      orderNumber: purchase.orderNumber,
      invoiceNumber: purchase.invoiceNumber,
      price: asMoney(purchase.price),
      subtotal: asMoney(purchase.subtotal),
      tax: asMoney(purchase.totalTaxAmount),
      currency: purchase.currency ?? purchase.priceCurrency,
      gateway: purchase.paymentGateway,
      status: purchase.status,
      paymentStatus: purchase.paymentStatus,
      paidAt: purchase.paymentDatetime,
      createdAt: purchase.createdAt
    }))
  };
}

export async function getBillingInvoice(invoiceId: string) {
  const context = await getBillingActorContext();
  const invoice = await new BillingRepository().findPurchaseInvoice(
    context.tenantId,
    invoiceId
  );

  if (!invoice) {
    throw new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  }

  return {
    invoice: {
      id: invoice.id,
      orderNumber: invoice.orderNumber,
      invoiceNumber: invoice.invoiceNumber,
      price: asMoney(invoice.price),
      subtotal: asMoney(invoice.subtotal),
      tax: asMoney(invoice.totalTaxAmount),
      currency: invoice.currency ?? invoice.priceCurrency,
      gateway: invoice.paymentGateway,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      paidAt: invoice.paymentDatetime,
      createdAt: invoice.createdAt,
      discount: invoice.discount
        ? {
            code: invoice.discount.code,
            name: invoice.discount.name,
            type: normalizeDiscountType(invoice.discount.discountType),
            value: asMoney(invoice.discount.discountValue),
            amount: asMoney(invoice.discount.discountAmount)
          }
        : null,
      items: invoice.items.map((item) => ({
        id: item.id,
        packageId: item.packageId,
        packageName: item.packageName,
        serviceType: item.serviceType,
        scans: item.scans,
        basePricePerScan: asMoney(item.basePricePerScan),
        finalPricePerScan: asMoney(item.finalPricePerScan),
        totalBasePrice: asMoney(item.totalBasePrice),
        tax: asMoney(item.totalTaxAmount),
        total: asMoney(item.totalFinalPrice),
        taxes: item.taxes.map((tax) => ({
          type: tax.taxType,
          name: tax.taxName,
          percentage: asMoney(tax.percentage),
          amount: asMoney(tax.amount)
        }))
      }))
    }
  };
}

export async function validateBillingCoupon(input: BillingCouponValidateInput) {
  const context = await getBillingActorContext();
  const repository = new BillingRepository();
  const packageIds = [...new Set(input.items.map((item) => item.packageId))];
  const [packages, taxes, coupon] = await Promise.all([
    repository.findActivePackagesByIds(packageIds),
    repository.listActiveTaxes(),
    repository.findCouponForUser(input.code, context.userId)
  ]);

  if (packages.length !== packageIds.length) {
    throw new ApiError(
      422,
      "PACKAGE_UNAVAILABLE",
      "A selected package is unavailable"
    );
  }

  const invalidResponse = (reason: string) => ({
    valid: false,
    reason,
    discount: null,
    pricing: calculateCheckoutPricing({
      packages,
      taxes,
      items: input.items,
      currency: input.currency
    })
  });

  if (!coupon) {
    return invalidResponse("COUPON_NOT_FOUND");
  }

  if (coupon.status !== "active") {
    return invalidResponse("COUPON_DISABLED");
  }

  if (new Date(coupon.expiryDate).getTime() <= Date.now()) {
    return invalidResponse("COUPON_EXPIRED");
  }

  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return invalidResponse("COUPON_USAGE_LIMIT_REACHED");
  }

  if (coupon.usedByUser) {
    return invalidResponse("COUPON_ALREADY_USED");
  }

  const discountType = normalizeDiscountType(coupon.discountType);
  const discountValue = asMoney(coupon.discountValue);
  const pricing = calculateCheckoutPricing({
    packages,
    taxes,
    items: input.items,
    currency: input.currency,
    discount: {
      type: discountType,
      value: discountValue
    }
  });

  return {
    valid: true,
    discount: {
      code: coupon.code,
      type: discountType,
      value: discountValue,
      amount: pricing.discount
    },
    pricing
  };
}

async function createPendingPurchaseForOrder(input: {
  context: BillingActorContext;
  order: BillingOrderCreateInput;
  gateway: "razorpay" | "paypal";
}) {
  const repository = new BillingRepository();
  const quote = await resolveOrderQuote(repository, input.context, input.order);
  const orderNumber = createOrderNumber();

  const purchase = await withTransaction(async (tx) => {
    const txRepository = new BillingRepository({ db: tx });

    return txRepository.createPendingPurchase({
      tenantId: input.context.tenantId,
      userId: input.context.userId,
      orderNumber,
      price: quote.pricing.total,
      subtotal: quote.pricing.subtotal,
      totalTaxAmount: quote.pricing.tax,
      priceCurrency: input.order.currency,
      paymentGateway: input.gateway,
      legacyPackageId: quote.packages[0]?.id ?? null,
      legacyRescans: quote.lineItems.reduce(
        (total, item) => total + item.scans,
        0
      ),
      items: quote.lineItems,
      discount: quote.coupon
        ? {
            code: quote.coupon.code,
            name: quote.coupon.name,
            discountType: normalizeDiscountType(quote.coupon.discountType),
            discountValue: asMoney(quote.coupon.discountValue),
            discountAmount: quote.pricing.discount
          }
        : null
    });
  });

  return {
    purchase,
    quote,
    orderNumber
  };
}

export async function createRazorpayBillingOrder(
  input: BillingOrderCreateInput
) {
  const context = await getBillingActorContext();
  const { purchase, quote, orderNumber } = await createPendingPurchaseForOrder({
    context,
    order: input,
    gateway: "razorpay"
  });
  const repository = new BillingRepository();

  try {
    const providerOrder = await createRazorpayOrder({
      amountMinor: Math.round(quote.pricing.total * 100),
      currency: input.currency,
      receipt: orderNumber,
      notes: {
        purchaseId: purchase.id,
        tenantId: context.tenantId
      }
    });
    await repository.attachRazorpayOrder(purchase.id, providerOrder.id);

    return {
      purchase: {
        id: purchase.id,
        orderNumber,
        amount: quote.pricing.total,
        currency: input.currency,
        status: purchase.status,
        paymentStatus: purchase.paymentStatus
      },
      pricing: quote.pricing,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID ?? null,
        orderId: providerOrder.id,
        amount: providerOrder.amount,
        currency: providerOrder.currency,
        status: providerOrder.status
      }
    };
  } catch (error) {
    await repository.markPurchaseOrderFailed(
      purchase.id,
      error instanceof Error ? error.message : "Razorpay order creation failed"
    );
    throw new ApiError(
      502,
      "RAZORPAY_ORDER_CREATE_FAILED",
      "Razorpay order creation failed"
    );
  }
}

export async function createPayPalBillingOrder(input: BillingOrderCreateInput) {
  const context = await getBillingActorContext();
  const { purchase, quote, orderNumber } = await createPendingPurchaseForOrder({
    context,
    order: input,
    gateway: "paypal"
  });
  const repository = new BillingRepository();
  const baseUrl = getAppBaseUrl();

  try {
    const providerOrder = await createPayPalOrder({
      amount: quote.pricing.total,
      currency: input.currency,
      referenceId: purchase.id,
      returnUrl: `${baseUrl}/user/billings?paypal_order=${purchase.id}`,
      cancelUrl: `${baseUrl}/user/billings?paypal_cancel=${purchase.id}`
    });
    await repository.attachPayPalOrder(purchase.id, providerOrder.id);

    return {
      purchase: {
        id: purchase.id,
        orderNumber,
        amount: quote.pricing.total,
        currency: input.currency,
        status: purchase.status,
        paymentStatus: purchase.paymentStatus
      },
      pricing: quote.pricing,
      paypal: {
        orderId: providerOrder.id,
        status: providerOrder.status,
        approvalUrl: providerOrder.approvalUrl
      }
    };
  } catch (error) {
    await repository.markPurchaseOrderFailed(
      purchase.id,
      error instanceof Error ? error.message : "PayPal order creation failed"
    );
    throw new ApiError(
      502,
      "PAYPAL_ORDER_CREATE_FAILED",
      "PayPal order creation failed"
    );
  }
}

export async function verifyRazorpayBillingPayment(
  input: RazorpayPaymentVerifyInput
) {
  const context = await getBillingActorContext();

  if (!verifyRazorpaySignature(input)) {
    throw new ApiError(
      422,
      "INVALID_PAYMENT_SIGNATURE",
      "Payment signature is invalid"
    );
  }

  const repository = new BillingRepository();
  const purchase = await repository.findPurchaseByRazorpayOrderId(
    context.tenantId,
    input.razorpayOrderId
  );

  if (!purchase) {
    throw new ApiError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  }

  const result = await withTransaction(async (tx) => {
    const txRepository = new BillingRepository({ db: tx });

    return txRepository.finalizePaidPurchase({
      purchaseId: purchase.id,
      invoiceNumber: purchase.invoiceNumber ?? createInvoiceNumber(purchase.id),
      paymentId: input.razorpayPaymentId,
      paymentAmount: asMoney(purchase.price),
      currency: purchase.currency ?? purchase.priceCurrency,
      signature: input.razorpaySignature
    });
  });

  if (!result) {
    throw new ApiError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  }

  return {
    finalized: result.finalized,
    purchase: {
      id: result.purchase.id,
      orderNumber: result.purchase.orderNumber,
      invoiceNumber: result.purchase.invoiceNumber,
      status: result.purchase.status,
      paymentStatus: result.purchase.paymentStatus,
      amount: asMoney(result.purchase.price),
      currency: result.purchase.currency ?? result.purchase.priceCurrency
    }
  };
}

export async function capturePayPalBillingPayment(
  input: PayPalPaymentCaptureInput
) {
  const context = await getBillingActorContext();
  const repository = new BillingRepository();
  const purchase = await repository.findPurchaseByPayPalOrderId(
    context.tenantId,
    input.paypalOrderId
  );

  if (!purchase) {
    throw new ApiError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  }

  if (purchase.paymentStatus === "paid") {
    return {
      finalized: false,
      purchase: {
        id: purchase.id,
        orderNumber: purchase.orderNumber,
        invoiceNumber: purchase.invoiceNumber,
        status: purchase.status,
        paymentStatus: purchase.paymentStatus,
        amount: asMoney(purchase.price),
        currency: purchase.currency ?? purchase.priceCurrency
      }
    };
  }

  const capture = await capturePayPalOrder(input.paypalOrderId);

  if (capture.status !== "COMPLETED") {
    throw new ApiError(
      422,
      "PAYPAL_CAPTURE_INCOMPLETE",
      "PayPal capture is not complete"
    );
  }

  const result = await withTransaction(async (tx) => {
    const txRepository = new BillingRepository({ db: tx });

    return txRepository.finalizePaidPurchase({
      purchaseId: purchase.id,
      invoiceNumber: purchase.invoiceNumber ?? createInvoiceNumber(purchase.id),
      paymentId: capture.captureId,
      paypalPaymentId: capture.captureId,
      paymentAmount: capture.amount,
      currency: capture.currency
    });
  });

  if (!result) {
    throw new ApiError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  }

  return {
    finalized: result.finalized,
    purchase: {
      id: result.purchase.id,
      orderNumber: result.purchase.orderNumber,
      invoiceNumber: result.purchase.invoiceNumber,
      status: result.purchase.status,
      paymentStatus: result.purchase.paymentStatus,
      amount: asMoney(result.purchase.price),
      currency: result.purchase.currency ?? result.purchase.priceCurrency
    }
  };
}

export { errorResponse, successResponse };
