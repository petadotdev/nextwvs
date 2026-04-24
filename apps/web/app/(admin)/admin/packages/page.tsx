export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { listAdminPackages } from "../../../../src/lib/admin-billing";

function formatMoney(value: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export default async function AdminPackagesPage() {
  const { packages } = await listAdminPackages();
  const activeCount = packages.filter(
    (item) => item.status === "active" && !item.isDeleted
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Billing"
        title="Packages"
        description="Manage service packages used by customer checkout and entitlement updates."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Active packages</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {activeCount}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Archived packages</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {packages.filter((item) => item.isDeleted).length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Referenced by purchases</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {packages.filter((item) => item.purchaseCount > 0).length}
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Package Inventory"
        description="Delete operations soft-delete packages so historic purchase item references remain stable."
      >
        {packages.length === 0 ? (
          <EmptyState
            title="No packages configured"
            description="Create WVS, DMS, or DNSMS packages through the admin package API."
          />
        ) : (
          <DataTable
            columns={[
              "Package",
              "Service",
              "Scans",
              "INR",
              "USD",
              "Status",
              "Purchases"
            ]}
            rows={packages.map((item) => [
              item.name,
              item.serviceType,
              item.rescans,
              formatMoney(item.priceInr, "INR"),
              formatMoney(item.priceUsd, "USD"),
              <StatusBadge
                key={item.id}
                status={item.isDeleted ? "deleted" : item.status}
                tone={
                  item.isDeleted
                    ? "danger"
                    : item.status === "active"
                      ? "success"
                      : "warning"
                }
              />,
              item.purchaseCount
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
