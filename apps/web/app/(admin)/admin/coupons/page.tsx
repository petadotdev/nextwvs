export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { listAdminCoupons } from "../../../../src/lib/admin-billing";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDiscount(type: string, value: number) {
  return type === "percentage"
    ? `${value.toFixed(2)}%`
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(value);
}

export default async function AdminCouponsPage() {
  const { coupons } = await listAdminCoupons();
  const activeCoupons = coupons.filter(
    (item) =>
      item.status === "active" &&
      new Date(item.expiryDate).getTime() > Date.now()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Billing"
        title="Coupons"
        description="Manage discount coupons used by customer checkout validation."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Active coupons</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {activeCoupons.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Total uses</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {coupons.reduce((total, item) => total + item.usageCount, 0)}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Expired or inactive</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {coupons.length - activeCoupons.length}
          </p>
        </PageSection>
      </section>

      <PageSection title="Coupon Inventory">
        {coupons.length === 0 ? (
          <EmptyState
            title="No coupons configured"
            description="Create coupons through the admin coupon API before applying discounts in checkout."
          />
        ) : (
          <DataTable
            columns={["Code", "Name", "Discount", "Usage", "Expires", "Status"]}
            rows={coupons.map((item) => [
              item.code,
              item.name,
              formatDiscount(item.discountType, item.discountValue),
              `${item.usageCount}/${item.usageLimit}`,
              formatDate(item.expiryDate),
              <StatusBadge
                key={item.id}
                status={item.status}
                tone={
                  item.status === "active" &&
                  new Date(item.expiryDate).getTime() > Date.now()
                    ? "success"
                    : "warning"
                }
              />
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
