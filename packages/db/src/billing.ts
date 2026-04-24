import {
  BaseRepository,
  type JsonValue,
  type RepositoryContext
} from "./index";

export type BillingCurrency = "INR" | "USD";
export type BillingServiceType = "WVS" | "DMS" | "DNSMS";

export interface BillingPackageRecord {
  id: string;
  serviceType: BillingServiceType;
  packageName: string;
  rescansPriceInr: string;
  rescansPriceUsd: string;
  rescans: number;
  priceInr: string;
  priceUsd: string;
  teamManageAccess: boolean;
  status: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingTaxRecord {
  id: string;
  taxType: string;
  cgst: string | null;
  sgst: string | null;
  igst: string | null;
  taxName: string | null;
  otherTax: string | null;
  status: string;
}

export interface BillingCouponRecord {
  id: string;
  name: string;
  code: string;
  discountType: string;
  discountValue: string;
  expiryDate: string;
  usageLimit: number;
  status: string;
  usageCount: number;
  usedByUser: boolean;
}

export interface BillingPurchaseRecord {
  id: string;
  tenantId: string;
  userId: string;
  orderNumber: string | null;
  invoiceNumber: string | null;
  price: string;
  subtotal: string | null;
  totalTaxAmount: string | null;
  priceCurrency: string;
  paymentGateway: string;
  purchaseDate: string | null;
  status: string;
  paymentStatus: string;
  paymentDatetime: string | null;
  orderId: string | null;
  paymentId: string | null;
  paypalOrderId: string | null;
  paypalPaymentId: string | null;
  paymentAmount: string | null;
  currency: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPurchaseItemRecord {
  id: string;
  purchaseId: string;
  packageId: string | null;
  packageName: string;
  serviceType: BillingServiceType;
  scans: number;
  basePricePerScan: string;
  finalPricePerScan: string;
  totalBasePrice: string;
  totalTaxAmount: string;
  totalFinalPrice: string;
  taxes: BillingPurchaseItemTaxRecord[];
}

export interface BillingPurchaseItemTaxRecord {
  id: string;
  purchaseItemId: string;
  taxType: string;
  taxName: string | null;
  percentage: string;
  amount: string;
}

export interface BillingPurchaseDiscountRecord {
  id: string;
  purchaseId: string;
  code: string;
  name: string | null;
  discountType: string;
  discountValue: string;
  discountAmount: string;
}

export interface BillingPurchaseDetailRecord extends BillingPurchaseRecord {
  items: BillingPurchaseItemRecord[];
  discount: BillingPurchaseDiscountRecord | null;
}

export interface BillingPendingPurchaseInput {
  tenantId: string;
  userId: string;
  orderNumber: string;
  price: number;
  subtotal: number;
  totalTaxAmount: number;
  priceCurrency: BillingCurrency;
  paymentGateway: string;
  legacyPackageId: string | null;
  legacyRescans: number;
  items: Array<{
    packageId: string;
    packageName: string;
    serviceType: BillingServiceType;
    scans: number;
    basePricePerScan: number;
    finalPricePerScan: number;
    totalBasePrice: number;
    totalTaxAmount: number;
    totalFinalPrice: number;
    taxes: Array<{
      taxType: string;
      taxName: string | null;
      percentage: number;
      amount: number;
    }>;
  }>;
  discount?: {
    code: string;
    name: string | null;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null;
}

export interface BillingFinalizePaymentInput {
  purchaseId: string;
  invoiceNumber: string;
  paymentId: string;
  paymentAmount: number;
  currency: string;
  signature?: string | null;
  paypalPaymentId?: string | null;
  bankReferenceNumber?: string | null;
}

export interface BillingPaymentEventInput {
  provider: string;
  providerEventId: string;
  purchaseId?: string | null;
  tenantId?: string | null;
  eventType: string;
  signatureValid: boolean;
  payload: Record<string, JsonValue>;
}

function toJsonObject(value: JsonValue): Record<string, JsonValue> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function groupTaxesByItem(rows: BillingPurchaseItemTaxRecord[]) {
  return rows.reduce<Record<string, BillingPurchaseItemTaxRecord[]>>(
    (groups, row) => {
      groups[row.purchaseItemId] ??= [];
      groups[row.purchaseItemId]?.push(row);
      return groups;
    },
    {}
  );
}

export class BillingRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listActivePackages(serviceType?: BillingServiceType) {
    const rows = serviceType
      ? await this.db<BillingPackageRecord[]>`
          select
            id,
            service_type as "serviceType",
            package_name as "packageName",
            rescans_price_inr as "rescansPriceInr",
            rescans_price_usd as "rescansPriceUsd",
            rescans,
            price_inr as "priceInr",
            price_usd as "priceUsd",
            team_manage_access as "teamManageAccess",
            status,
            is_deleted as "isDeleted",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from public.packages
          where status = 'active'
            and is_deleted = false
            and service_type = ${serviceType}
          order by service_type asc, price_inr asc, package_name asc
        `
      : await this.db<BillingPackageRecord[]>`
          select
            id,
            service_type as "serviceType",
            package_name as "packageName",
            rescans_price_inr as "rescansPriceInr",
            rescans_price_usd as "rescansPriceUsd",
            rescans,
            price_inr as "priceInr",
            price_usd as "priceUsd",
            team_manage_access as "teamManageAccess",
            status,
            is_deleted as "isDeleted",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from public.packages
          where status = 'active'
            and is_deleted = false
          order by service_type asc, price_inr asc, package_name asc
        `;

    return rows;
  }

  async findActivePackagesByIds(packageIds: string[]) {
    if (packageIds.length === 0) {
      return [];
    }

    return this.db<BillingPackageRecord[]>`
      select
        id,
        service_type as "serviceType",
        package_name as "packageName",
        rescans_price_inr as "rescansPriceInr",
        rescans_price_usd as "rescansPriceUsd",
        rescans,
        price_inr as "priceInr",
        price_usd as "priceUsd",
        team_manage_access as "teamManageAccess",
        status,
        is_deleted as "isDeleted",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.packages
      where status = 'active'
        and is_deleted = false
        and id = any(${packageIds})
    `;
  }

  async listActiveTaxes() {
    return this.db<BillingTaxRecord[]>`
      select
        id,
        tax_type as "taxType",
        cgst,
        sgst,
        igst,
        tax_name as "taxName",
        other_tax as "otherTax",
        status
      from public.taxes
      where status = 'active'
      order by tax_type asc, tax_name asc nulls first
    `;
  }

  async findCouponForUser(code: string, userId: string) {
    const [row] = await this.db<BillingCouponRecord[]>`
      select
        coupons.id,
        coupons.name,
        coupons.code,
        coupons.discount_type as "discountType",
        coupons.discount_value as "discountValue",
        coupons.expiry_date as "expiryDate",
        coupons.usage_limit as "usageLimit",
        coupons.status,
        count(usages.id)::int as "usageCount",
        bool_or(usages.user_id = ${userId}) as "usedByUser"
      from public.discount_coupons coupons
      left join public.discount_coupon_usages usages
        on usages.coupon_id = coupons.id
      where lower(coupons.code) = lower(${code})
      group by coupons.id
      limit 1
    `;

    return row ?? null;
  }

  async listPurchasesByTenantId(tenantId: string) {
    return this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where tenant_id = ${tenantId}
      order by created_at desc
      limit 50
    `;
  }

  async findPurchaseInvoice(tenantId: string, invoiceId: string) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where tenant_id = ${tenantId}
        and (id::text = ${invoiceId} or invoice_number = ${invoiceId})
      limit 1
    `;

    if (!purchase) {
      return null;
    }

    const [items, taxes, [discount]] = await Promise.all([
      this.db<Omit<BillingPurchaseItemRecord, "taxes">[]>`
        select
          id,
          purchase_id as "purchaseId",
          package_id as "packageId",
          package_name as "packageName",
          service_type as "serviceType",
          scans,
          base_price_per_scan as "basePricePerScan",
          final_price_per_scan as "finalPricePerScan",
          total_base_price as "totalBasePrice",
          total_tax_amount as "totalTaxAmount",
          total_final_price as "totalFinalPrice"
        from public.purchase_items
        where purchase_id = ${purchase.id}
        order by created_at asc
      `,
      this.db<BillingPurchaseItemTaxRecord[]>`
        select
          taxes.id,
          taxes.purchase_item_id as "purchaseItemId",
          taxes.tax_type as "taxType",
          taxes.tax_name as "taxName",
          taxes.percentage,
          taxes.amount
        from public.purchase_item_taxes taxes
        join public.purchase_items items
          on items.id = taxes.purchase_item_id
        where items.purchase_id = ${purchase.id}
        order by taxes.tax_type asc, taxes.tax_name asc nulls first
      `,
      this.db<BillingPurchaseDiscountRecord[]>`
        select
          id,
          purchase_id as "purchaseId",
          code,
          name,
          discount_type as "discountType",
          discount_value as "discountValue",
          discount_amount as "discountAmount"
        from public.purchase_discounts
        where purchase_id = ${purchase.id}
        limit 1
      `
    ]);

    const taxesByItem = groupTaxesByItem(taxes);

    return {
      ...purchase,
      items: items.map((item) => ({
        ...item,
        taxes: taxesByItem[item.id] ?? []
      })),
      discount: discount ?? null
    } satisfies BillingPurchaseDetailRecord;
  }

  async findPurchaseByRazorpayOrderId(tenantId: string, orderId: string) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where tenant_id = ${tenantId}
        and order_id = ${orderId}
      limit 1
    `;

    return purchase ?? null;
  }

  async findPurchaseByRazorpayOrderIdAnyTenant(orderId: string) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where order_id = ${orderId}
      limit 1
    `;

    return purchase ?? null;
  }

  async findPurchaseByPayPalOrderId(tenantId: string, orderId: string) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where tenant_id = ${tenantId}
        and paypal_order_id = ${orderId}
      limit 1
    `;

    return purchase ?? null;
  }

  async getBillingOverview(tenantId: string) {
    const [packages, taxes, purchases] = await Promise.all([
      this.listActivePackages(),
      this.listActiveTaxes(),
      this.listPurchasesByTenantId(tenantId)
    ]);

    return {
      packages,
      taxes,
      purchases,
      metadata: toJsonObject({})
    };
  }

  async createPendingPurchase(input: BillingPendingPurchaseInput) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      insert into public.purchases (
        tenant_id,
        user_id,
        order_number,
        legacy_package_id,
        legacy_rescans,
        price,
        subtotal,
        total_tax_amount,
        price_currency,
        payment_gateway,
        status,
        payment_status,
        currency
      ) values (
        ${input.tenantId},
        ${input.userId},
        ${input.orderNumber},
        ${input.legacyPackageId},
        ${input.legacyRescans},
        ${input.price},
        ${input.subtotal},
        ${input.totalTaxAmount},
        ${input.priceCurrency},
        ${input.paymentGateway},
        'pending',
        'pending',
        ${input.priceCurrency}
      )
      returning
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    for (const item of input.items) {
      const [purchaseItem] = await this.db<{ id: string }[]>`
        insert into public.purchase_items (
          purchase_id,
          package_id,
          package_name,
          service_type,
          scans,
          base_price_per_scan,
          final_price_per_scan,
          total_base_price,
          total_tax_amount,
          total_final_price
        ) values (
          ${purchase.id},
          ${item.packageId},
          ${item.packageName},
          ${item.serviceType},
          ${item.scans},
          ${item.basePricePerScan},
          ${item.finalPricePerScan},
          ${item.totalBasePrice},
          ${item.totalTaxAmount},
          ${item.totalFinalPrice}
        )
        returning id
      `;

      for (const tax of item.taxes) {
        await this.db`
          insert into public.purchase_item_taxes (
            purchase_item_id,
            tax_type,
            tax_name,
            percentage,
            amount
          ) values (
            ${purchaseItem.id},
            ${tax.taxType},
            ${tax.taxName},
            ${tax.percentage},
            ${tax.amount}
          )
        `;
      }
    }

    if (input.discount && input.discount.discountAmount > 0) {
      await this.db`
        insert into public.purchase_discounts (
          purchase_id,
          code,
          name,
          discount_type,
          discount_value,
          discount_amount
        ) values (
          ${purchase.id},
          ${input.discount.code},
          ${input.discount.name},
          ${input.discount.discountType},
          ${input.discount.discountValue},
          ${input.discount.discountAmount}
        )
      `;
    }

    return purchase;
  }

  async attachRazorpayOrder(purchaseId: string, orderId: string) {
    await this.db`
      update public.purchases
      set order_id = ${orderId}
      where id = ${purchaseId}
    `;
  }

  async attachPayPalOrder(purchaseId: string, orderId: string) {
    await this.db`
      update public.purchases
      set paypal_order_id = ${orderId}
      where id = ${purchaseId}
    `;
  }

  async markPurchaseOrderFailed(purchaseId: string, remark: string) {
    await this.db`
      update public.purchases
      set
        status = 'failed',
        payment_status = 'failed',
        remark = ${remark}
      where id = ${purchaseId}
        and payment_status <> 'paid'
    `;
  }

  async createPaymentEvent(input: BillingPaymentEventInput) {
    const [row] = await this.db<{ id: string }[]>`
      insert into public.payment_events (
        provider,
        provider_event_id,
        purchase_id,
        tenant_id,
        event_type,
        signature_valid,
        payload
      ) values (
        ${input.provider},
        ${input.providerEventId},
        ${input.purchaseId ?? null},
        ${input.tenantId ?? null},
        ${input.eventType},
        ${input.signatureValid},
        ${JSON.stringify(input.payload)}::jsonb
      )
      on conflict (provider, provider_event_id) do nothing
      returning id
    `;

    return {
      id: row?.id ?? null,
      inserted: Boolean(row)
    };
  }

  async markPaymentEventProcessed(
    provider: string,
    providerEventId: string,
    result: string,
    purchaseId?: string | null,
    tenantId?: string | null
  ) {
    await this.db`
      update public.payment_events
      set
        processed_at = timezone('utc', now()),
        processing_result = ${result},
        purchase_id = coalesce(${purchaseId ?? null}, purchase_id),
        tenant_id = coalesce(${tenantId ?? null}, tenant_id)
      where provider = ${provider}
        and provider_event_id = ${providerEventId}
    `;
  }

  async finalizePaidPurchase(input: BillingFinalizePaymentInput) {
    const [purchase] = await this.db<BillingPurchaseRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.purchases
      where id = ${input.purchaseId}
      for update
    `;

    if (!purchase) {
      return null;
    }

    if (purchase.paymentStatus === "paid") {
      return {
        purchase,
        finalized: false
      };
    }

    const items = await this.db<
      Array<{ serviceType: BillingServiceType; scans: number }>
    >`
      select
        service_type as "serviceType",
        scans
      from public.purchase_items
      where purchase_id = ${purchase.id}
    `;

    const totals = items.reduce(
      (summary, item) => ({
        wvs: summary.wvs + (item.serviceType === "WVS" ? item.scans : 0),
        dms: summary.dms + (item.serviceType === "DMS" ? item.scans : 0),
        dnsms: summary.dnsms + (item.serviceType === "DNSMS" ? item.scans : 0)
      }),
      { wvs: 0, dms: 0, dnsms: 0 }
    );

    const [updated] = await this.db<BillingPurchaseRecord[]>`
      update public.purchases
      set
        invoice_number = coalesce(invoice_number, ${input.invoiceNumber}),
        status = 'active',
        payment_status = 'paid',
        purchase_date = coalesce(purchase_date, timezone('utc', now())),
        payment_datetime = timezone('utc', now()),
        payment_id = ${input.paymentId},
        paypal_payment_id = coalesce(${input.paypalPaymentId ?? null}, paypal_payment_id),
        signature = coalesce(${input.signature ?? null}, signature),
        payment_amount = ${input.paymentAmount},
        currency = ${input.currency},
        bank_reference_number = coalesce(
          ${input.bankReferenceNumber ?? null},
          bank_reference_number
        )
      where id = ${purchase.id}
      returning
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        order_number as "orderNumber",
        invoice_number as "invoiceNumber",
        price,
        subtotal,
        total_tax_amount as "totalTaxAmount",
        price_currency as "priceCurrency",
        payment_gateway as "paymentGateway",
        purchase_date as "purchaseDate",
        status,
        payment_status as "paymentStatus",
        payment_datetime as "paymentDatetime",
        order_id as "orderId",
        payment_id as "paymentId",
        paypal_order_id as "paypalOrderId",
        paypal_payment_id as "paypalPaymentId",
        payment_amount as "paymentAmount",
        currency,
        remark,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    await this.db`
      update public.users
      set
        total_scan = total_scan + ${totals.wvs},
        dms_monitoring_slots = dms_monitoring_slots + ${totals.dms},
        dms_plan_start_at = case
          when ${totals.dms} > 0 then coalesce(dms_plan_start_at, timezone('utc', now()))
          else dms_plan_start_at
        end,
        dms_plan_next_billing_at = case
          when ${totals.dms} > 0 then greatest(
            coalesce(dms_plan_next_billing_at, timezone('utc', now())),
            timezone('utc', now())
          ) + interval '30 days'
          else dms_plan_next_billing_at
        end,
        dms_plan_status = case
          when ${totals.dms} > 0 then 'active'::public.plan_status_enum
          else dms_plan_status
        end,
        dnsms_monitoring_slots = dnsms_monitoring_slots + ${totals.dnsms},
        dnsms_plan_start_at = case
          when ${totals.dnsms} > 0 then coalesce(dnsms_plan_start_at, timezone('utc', now()))
          else dnsms_plan_start_at
        end,
        dnsms_plan_next_billing_at = case
          when ${totals.dnsms} > 0 then greatest(
            coalesce(dnsms_plan_next_billing_at, timezone('utc', now())),
            timezone('utc', now())
          ) + interval '30 days'
          else dnsms_plan_next_billing_at
        end,
        dnsms_plan_status = case
          when ${totals.dnsms} > 0 then 'active'::public.plan_status_enum
          else dnsms_plan_status
        end
      where id = ${purchase.tenantId}
    `;

    await this.db`
      insert into public.discount_coupon_usages (
        coupon_id,
        user_id,
        tenant_id
      )
      select
        coupons.id,
        ${purchase.userId},
        ${purchase.tenantId}
      from public.purchase_discounts discounts
      join public.discount_coupons coupons
        on lower(coupons.code) = lower(discounts.code)
      where discounts.purchase_id = ${purchase.id}
      on conflict (coupon_id, user_id) do nothing
    `;

    return {
      purchase: updated,
      finalized: true
    };
  }
}
