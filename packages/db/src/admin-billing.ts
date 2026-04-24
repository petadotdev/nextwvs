import { BaseRepository, type RepositoryContext } from "./index";
import type { BillingServiceType } from "./billing";

export interface AdminPackageRecord {
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
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTaxRecord {
  id: string;
  taxType: string;
  cgst: string | null;
  sgst: string | null;
  igst: string | null;
  taxName: string | null;
  otherTax: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponRecord {
  id: string;
  name: string;
  code: string;
  discountType: string;
  discountValue: string;
  expiryDate: string;
  usageLimit: number;
  status: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export class AdminBillingRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listPackages() {
    return this.db<AdminPackageRecord[]>`
      select
        packages.id,
        packages.service_type as "serviceType",
        packages.package_name as "packageName",
        packages.rescans_price_inr as "rescansPriceInr",
        packages.rescans_price_usd as "rescansPriceUsd",
        packages.rescans,
        packages.price_inr as "priceInr",
        packages.price_usd as "priceUsd",
        packages.team_manage_access as "teamManageAccess",
        packages.status,
        packages.is_deleted as "isDeleted",
        count(purchase_items.id)::int as "purchaseCount",
        packages.created_at as "createdAt",
        packages.updated_at as "updatedAt"
      from public.packages
      left join public.purchase_items
        on purchase_items.package_id = packages.id
      group by packages.id
      order by packages.is_deleted asc, packages.service_type asc, packages.price_inr asc
    `;
  }

  async createPackage(input: {
    serviceType: BillingServiceType;
    packageName: string;
    rescansPriceInr: number;
    rescansPriceUsd: number;
    rescans: number;
    priceInr: number;
    priceUsd: number;
    teamManageAccess: boolean;
  }) {
    const [row] = await this.db<AdminPackageRecord[]>`
      insert into public.packages (
        service_type,
        package_name,
        rescans_price_inr,
        rescans_price_usd,
        rescans,
        price_inr,
        price_usd,
        team_manage_access
      ) values (
        ${input.serviceType},
        ${input.packageName},
        ${input.rescansPriceInr},
        ${input.rescansPriceUsd},
        ${input.rescans},
        ${input.priceInr},
        ${input.priceUsd},
        ${input.teamManageAccess}
      )
      returning
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
        0::int as "purchaseCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async updatePackage(
    packageId: string,
    input: {
      serviceType: BillingServiceType;
      packageName: string;
      rescansPriceInr: number;
      rescansPriceUsd: number;
      rescans: number;
      priceInr: number;
      priceUsd: number;
      teamManageAccess: boolean;
    }
  ) {
    const [row] = await this.db<AdminPackageRecord[]>`
      update public.packages
      set
        service_type = ${input.serviceType},
        package_name = ${input.packageName},
        rescans_price_inr = ${input.rescansPriceInr},
        rescans_price_usd = ${input.rescansPriceUsd},
        rescans = ${input.rescans},
        price_inr = ${input.priceInr},
        price_usd = ${input.priceUsd},
        team_manage_access = ${input.teamManageAccess}
      where id = ${packageId}
      returning
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
        0::int as "purchaseCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async updatePackageStatus(packageId: string, status: string) {
    const [row] = await this.db<AdminPackageRecord[]>`
      update public.packages
      set status = ${status}
      where id = ${packageId}
      returning
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
        0::int as "purchaseCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async softDeletePackage(packageId: string) {
    const [row] = await this.db<{ id: string }[]>`
      update public.packages
      set
        is_deleted = true,
        status = 'inactive'
      where id = ${packageId}
      returning id
    `;

    return Boolean(row);
  }

  async listTaxes() {
    return this.db<AdminTaxRecord[]>`
      select
        id,
        tax_type as "taxType",
        cgst,
        sgst,
        igst,
        tax_name as "taxName",
        other_tax as "otherTax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.taxes
      order by status asc, tax_type asc, tax_name asc nulls first
    `;
  }

  async createTax(input: {
    taxType: string;
    cgst: number | null;
    sgst: number | null;
    igst: number | null;
    taxName: string | null;
    otherTax: number | null;
  }) {
    const [row] = await this.db<AdminTaxRecord[]>`
      insert into public.taxes (
        tax_type,
        cgst,
        sgst,
        igst,
        tax_name,
        other_tax
      ) values (
        ${input.taxType},
        ${input.cgst},
        ${input.sgst},
        ${input.igst},
        ${input.taxName},
        ${input.otherTax}
      )
      returning
        id,
        tax_type as "taxType",
        cgst,
        sgst,
        igst,
        tax_name as "taxName",
        other_tax as "otherTax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async updateTax(
    taxId: string,
    input: {
      taxType: string;
      cgst: number | null;
      sgst: number | null;
      igst: number | null;
      taxName: string | null;
      otherTax: number | null;
    }
  ) {
    const [row] = await this.db<AdminTaxRecord[]>`
      update public.taxes
      set
        tax_type = ${input.taxType},
        cgst = ${input.cgst},
        sgst = ${input.sgst},
        igst = ${input.igst},
        tax_name = ${input.taxName},
        other_tax = ${input.otherTax}
      where id = ${taxId}
      returning
        id,
        tax_type as "taxType",
        cgst,
        sgst,
        igst,
        tax_name as "taxName",
        other_tax as "otherTax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async updateTaxStatus(taxId: string, status: string) {
    const [row] = await this.db<AdminTaxRecord[]>`
      update public.taxes
      set status = ${status}
      where id = ${taxId}
      returning
        id,
        tax_type as "taxType",
        cgst,
        sgst,
        igst,
        tax_name as "taxName",
        other_tax as "otherTax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async deleteTax(taxId: string) {
    const result = await this.db`
      delete from public.taxes
      where id = ${taxId}
    `;

    return result.count > 0;
  }

  async listCoupons() {
    return this.db<AdminCouponRecord[]>`
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
        coupons.created_at as "createdAt",
        coupons.updated_at as "updatedAt"
      from public.discount_coupons coupons
      left join public.discount_coupon_usages usages
        on usages.coupon_id = coupons.id
      group by coupons.id
      order by coupons.status asc, coupons.expiry_date desc
    `;
  }

  async createCoupon(input: {
    name: string;
    code: string;
    discountType: string;
    discountValue: number;
    expiryDate: string;
    usageLimit: number;
  }) {
    const [row] = await this.db<AdminCouponRecord[]>`
      insert into public.discount_coupons (
        name,
        code,
        discount_type,
        discount_value,
        expiry_date,
        usage_limit
      ) values (
        ${input.name},
        ${input.code},
        ${input.discountType},
        ${input.discountValue},
        ${input.expiryDate},
        ${input.usageLimit}
      )
      returning
        id,
        name,
        code,
        discount_type as "discountType",
        discount_value as "discountValue",
        expiry_date as "expiryDate",
        usage_limit as "usageLimit",
        status,
        0::int as "usageCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async updateCoupon(
    couponId: string,
    input: {
      name: string;
      code: string;
      discountType: string;
      discountValue: number;
      expiryDate: string;
      usageLimit: number;
    }
  ) {
    const [row] = await this.db<AdminCouponRecord[]>`
      update public.discount_coupons
      set
        name = ${input.name},
        code = ${input.code},
        discount_type = ${input.discountType},
        discount_value = ${input.discountValue},
        expiry_date = ${input.expiryDate},
        usage_limit = ${input.usageLimit}
      where id = ${couponId}
      returning
        id,
        name,
        code,
        discount_type as "discountType",
        discount_value as "discountValue",
        expiry_date as "expiryDate",
        usage_limit as "usageLimit",
        status,
        0::int as "usageCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async updateCouponStatus(couponId: string, status: string) {
    const [row] = await this.db<AdminCouponRecord[]>`
      update public.discount_coupons
      set status = ${status}
      where id = ${couponId}
      returning
        id,
        name,
        code,
        discount_type as "discountType",
        discount_value as "discountValue",
        expiry_date as "expiryDate",
        usage_limit as "usageLimit",
        status,
        0::int as "usageCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async deleteCoupon(couponId: string) {
    const result = await this.db`
      delete from public.discount_coupons
      where id = ${couponId}
    `;

    return result.count > 0;
  }
}
