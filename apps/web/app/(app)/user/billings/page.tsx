export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { getBillingOverview } from "../../../../src/lib/billing";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function UserBillingsPage() {
  const billing = await getBillingOverview();
  const paidPurchases = billing.purchases.filter(
    (purchase) => purchase.paymentStatus === "paid"
  );
  const pendingPurchases = billing.purchases.filter(
    (purchase) => purchase.paymentStatus !== "paid"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Billings"
        description="Phase 5 starts with server-rendered package, tax, purchase, and invoice state from the billing tables."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Available packages</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {billing.packages.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Paid purchases</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {paidPurchases.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Pending or failed</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {pendingPurchases.length}
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Purchases"
        description="Tenant-scoped purchases are loaded from `purchases`; invoice detail links resolve by invoice number or purchase id."
      >
        {billing.purchases.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="New orders will appear here as pending purchases before payment finalization marks them paid."
          />
        ) : (
          <DataTable
            columns={["Invoice", "Amount", "Gateway", "Status", "Created"]}
            rows={billing.purchases.map((purchase) => [
              purchase.invoiceNumber ? (
                <Link
                  className="text-[var(--accent)] underline-offset-4 hover:underline"
                  href={`/user/invoices/${purchase.invoiceNumber}`}
                >
                  {purchase.invoiceNumber}
                </Link>
              ) : (
                <Link
                  className="text-[var(--accent)] underline-offset-4 hover:underline"
                  href={`/user/invoices/${purchase.id}`}
                >
                  Pending invoice
                </Link>
              ),
              formatMoney(purchase.price, purchase.currency),
              purchase.gateway,
              <StatusBadge
                key={purchase.id}
                status={`${purchase.status}/${purchase.paymentStatus}`}
                tone={purchase.paymentStatus === "paid" ? "success" : "warning"}
              />,
              formatDate(purchase.createdAt)
            ])}
          />
        )}
      </PageSection>

      <PageSection
        title="Active Taxes"
        description="Checkout calculations use the active tax rows currently configured in the billing schema."
      >
        <DataTable
          columns={["Type", "Name", "Percentage", "Status"]}
          rows={billing.taxes.map((tax) => [
            tax.type,
            tax.name ?? "Default",
            `${tax.percentage}%`,
            <StatusBadge key={tax.id} status={tax.status} tone="success" />
          ])}
        />
      </PageSection>
    </div>
  );
}
