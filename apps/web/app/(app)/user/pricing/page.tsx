export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { listBillingPackages } from "../../../../src/lib/billing";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export default async function UserPricingPage() {
  const billing = await listBillingPackages({});
  const serviceCounts = billing.packages.reduce<Record<string, number>>(
    (counts, pkg) => {
      counts[pkg.serviceType] = (counts[pkg.serviceType] ?? 0) + 1;
      return counts;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Pricing"
        description="Package browsing is backed by active, non-deleted package rows and grouped by service entitlement."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {["WVS", "DMS", "DNSMS"].map((serviceType) => (
          <PageSection key={serviceType}>
            <p className="text-sm text-[var(--muted)]">
              {serviceType} packages
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {serviceCounts[serviceType] ?? 0}
            </p>
          </PageSection>
        ))}
      </section>

      <PageSection
        title="Available Packages"
        description="The checkout write path will build on this package and pricing contract in the next Phase 5 slice."
      >
        {billing.packages.length === 0 ? (
          <EmptyState
            title="No active packages"
            description="Admin package configuration must seed or publish active packages before checkout can start."
          />
        ) : (
          <DataTable
            columns={[
              "Package",
              "Service",
              "Scans",
              "Price",
              "Team Access",
              "Status"
            ]}
            rows={billing.packages.map((pkg) => [
              pkg.name,
              pkg.serviceType,
              pkg.scans,
              formatMoney(pkg.price, pkg.currency),
              pkg.teamManageAccess ? "Included" : "Not included",
              <StatusBadge key={pkg.id} status={pkg.status} tone="success" />
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
