export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { listAdminTaxes } from "../../../../src/lib/admin-billing";

function formatRate(value: number) {
  return `${value.toFixed(2)}%`;
}

export default async function AdminTaxesPage() {
  const { taxes } = await listAdminTaxes();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Billing"
        title="Taxes"
        description="Manage active tax rows that checkout uses to calculate package totals."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Total tax rows</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {taxes.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Active</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {taxes.filter((item) => item.status === "active").length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Inactive</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {taxes.filter((item) => item.status !== "active").length}
          </p>
        </PageSection>
      </section>

      <PageSection title="Tax Configuration">
        {taxes.length === 0 ? (
          <EmptyState
            title="No tax rows configured"
            description="Checkout can run without taxes, but production billing should have explicit tax configuration."
          />
        ) : (
          <DataTable
            columns={[
              "Name",
              "Type",
              "CGST",
              "SGST",
              "IGST",
              "Other",
              "Status"
            ]}
            rows={taxes.map((item) => [
              item.name ?? "Default",
              item.type,
              formatRate(item.cgst),
              formatRate(item.sgst),
              formatRate(item.igst),
              formatRate(item.otherTax),
              <StatusBadge
                key={item.id}
                status={item.status}
                tone={item.status === "active" ? "success" : "warning"}
              />
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
