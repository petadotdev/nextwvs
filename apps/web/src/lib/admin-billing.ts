import { AdminBillingRepository } from "@petadot/db";
import type {
  AdminCouponMutationInput,
  AdminPackageMutationInput,
  AdminStatusMutationInput,
  AdminTaxMutationInput
} from "@petadot/validation";
import { ApiError, errorResponse, successResponse } from "./auth/api";
import { getAdminSessionPrincipal } from "./auth/server";

function asMoney(value: string | number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

async function requireAdminBillingActor() {
  const principal = await getAdminSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Admin session is required");
  }

  return {
    employeeId: principal.employeeId
  };
}

function mapDatabaseError(
  error: unknown,
  duplicateCode: string,
  duplicateMessage: string
) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);

    if (code === "23505") {
      return new ApiError(409, duplicateCode, duplicateMessage);
    }

    if (code === "23514") {
      return new ApiError(
        422,
        "INVALID_BILLING_CONFIGURATION",
        "Invalid billing configuration"
      );
    }
  }

  return error;
}

function mapPackage(
  row: Awaited<ReturnType<AdminBillingRepository["listPackages"]>>[number]
) {
  return {
    id: row.id,
    serviceType: row.serviceType,
    name: row.packageName,
    rescans: row.rescans,
    priceInr: asMoney(row.priceInr),
    priceUsd: asMoney(row.priceUsd),
    rescansPriceInr: asMoney(row.rescansPriceInr),
    rescansPriceUsd: asMoney(row.rescansPriceUsd),
    teamManageAccess: row.teamManageAccess,
    status: row.status,
    isDeleted: row.isDeleted,
    purchaseCount: row.purchaseCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapTax(
  row: Awaited<ReturnType<AdminBillingRepository["listTaxes"]>>[number]
) {
  return {
    id: row.id,
    type: row.taxType,
    cgst: asMoney(row.cgst),
    sgst: asMoney(row.sgst),
    igst: asMoney(row.igst),
    name: row.taxName,
    otherTax: asMoney(row.otherTax),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapCoupon(
  row: Awaited<ReturnType<AdminBillingRepository["listCoupons"]>>[number]
) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    discountType: row.discountType,
    discountValue: asMoney(row.discountValue),
    expiryDate: row.expiryDate,
    usageLimit: row.usageLimit,
    usageCount: row.usageCount,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function listAdminPackages() {
  await requireAdminBillingActor();
  const rows = await new AdminBillingRepository().listPackages();
  return { packages: rows.map(mapPackage) };
}

export async function createAdminPackage(input: AdminPackageMutationInput) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().createPackage(input);
    return { package: mapPackage(row) };
  } catch (error) {
    throw mapDatabaseError(
      error,
      "PACKAGE_ALREADY_EXISTS",
      "Package already exists"
    );
  }
}

export async function updateAdminPackage(
  packageId: string,
  input: AdminPackageMutationInput
) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().updatePackage(
      packageId,
      input
    );

    if (!row) {
      throw new ApiError(404, "PACKAGE_NOT_FOUND", "Package not found");
    }

    return { package: mapPackage(row) };
  } catch (error) {
    throw mapDatabaseError(
      error,
      "PACKAGE_ALREADY_EXISTS",
      "Package already exists"
    );
  }
}

export async function updateAdminPackageStatus(
  packageId: string,
  input: AdminStatusMutationInput
) {
  await requireAdminBillingActor();
  const row = await new AdminBillingRepository().updatePackageStatus(
    packageId,
    input.status
  );

  if (!row) {
    throw new ApiError(404, "PACKAGE_NOT_FOUND", "Package not found");
  }

  return { package: mapPackage(row) };
}

export async function deleteAdminPackage(packageId: string) {
  await requireAdminBillingActor();
  const deleted = await new AdminBillingRepository().softDeletePackage(
    packageId
  );

  if (!deleted) {
    throw new ApiError(404, "PACKAGE_NOT_FOUND", "Package not found");
  }

  return { deleted: true };
}

export async function listAdminTaxes() {
  await requireAdminBillingActor();
  const rows = await new AdminBillingRepository().listTaxes();
  return { taxes: rows.map(mapTax) };
}

export async function createAdminTax(input: AdminTaxMutationInput) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().createTax(input);
    return { tax: mapTax(row) };
  } catch (error) {
    throw mapDatabaseError(error, "TAX_ALREADY_EXISTS", "Tax already exists");
  }
}

export async function updateAdminTax(
  taxId: string,
  input: AdminTaxMutationInput
) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().updateTax(taxId, input);

    if (!row) {
      throw new ApiError(404, "TAX_NOT_FOUND", "Tax not found");
    }

    return { tax: mapTax(row) };
  } catch (error) {
    throw mapDatabaseError(error, "TAX_ALREADY_EXISTS", "Tax already exists");
  }
}

export async function updateAdminTaxStatus(
  taxId: string,
  input: AdminStatusMutationInput
) {
  await requireAdminBillingActor();
  const row = await new AdminBillingRepository().updateTaxStatus(
    taxId,
    input.status
  );

  if (!row) {
    throw new ApiError(404, "TAX_NOT_FOUND", "Tax not found");
  }

  return { tax: mapTax(row) };
}

export async function deleteAdminTax(taxId: string) {
  await requireAdminBillingActor();
  const deleted = await new AdminBillingRepository().deleteTax(taxId);

  if (!deleted) {
    throw new ApiError(404, "TAX_NOT_FOUND", "Tax not found");
  }

  return { deleted: true };
}

export async function listAdminCoupons() {
  await requireAdminBillingActor();
  const rows = await new AdminBillingRepository().listCoupons();
  return { coupons: rows.map(mapCoupon) };
}

export async function createAdminCoupon(input: AdminCouponMutationInput) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().createCoupon(input);
    return { coupon: mapCoupon(row) };
  } catch (error) {
    throw mapDatabaseError(
      error,
      "COUPON_ALREADY_EXISTS",
      "Coupon already exists"
    );
  }
}

export async function updateAdminCoupon(
  couponId: string,
  input: AdminCouponMutationInput
) {
  await requireAdminBillingActor();

  try {
    const row = await new AdminBillingRepository().updateCoupon(
      couponId,
      input
    );

    if (!row) {
      throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
    }

    return { coupon: mapCoupon(row) };
  } catch (error) {
    throw mapDatabaseError(
      error,
      "COUPON_ALREADY_EXISTS",
      "Coupon already exists"
    );
  }
}

export async function updateAdminCouponStatus(
  couponId: string,
  input: AdminStatusMutationInput
) {
  await requireAdminBillingActor();
  const row = await new AdminBillingRepository().updateCouponStatus(
    couponId,
    input.status
  );

  if (!row) {
    throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }

  return { coupon: mapCoupon(row) };
}

export async function deleteAdminCoupon(couponId: string) {
  await requireAdminBillingActor();
  const deleted = await new AdminBillingRepository().deleteCoupon(couponId);

  if (!deleted) {
    throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }

  return { deleted: true };
}

export { errorResponse, successResponse };
