export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import {
  DataTable,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { getBillingInvoice } from "../../../../../src/lib/billing";

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

export default async function UserInvoicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { invoice } = await getBillingInvoice(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title={invoice.invoiceNumber ?? "Pending invoice"}
        description={`Purchase ${invoice.orderNumber ?? invoice.id} through ${invoice.gateway}.`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Total</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {formatMoney(invoice.price, invoice.currency)}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Payment</p>
          <div className="mt-3">
            <StatusBadge
              status={invoice.paymentStatus}
              tone={invoice.paymentStatus === "paid" ? "success" : "warning"}
            />
          </div>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Purchase</p>
          <div className="mt-3">
            <StatusBadge
              status={invoice.status}
              tone={invoice.status === "active" ? "success" : "neutral"}
            />
          </div>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Paid At</p>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            {formatDate(invoice.paidAt)}
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Line Items"
        description="Invoice rows are persisted purchase item snapshots."
      >
        <DataTable
          columns={["Package", "Service", "Scans", "Subtotal", "Tax", "Total"]}
          rows={invoice.items.map((item) => [
            item.packageName,
            item.serviceType,
            item.scans,
            formatMoney(item.totalBasePrice, invoice.currency),
            formatMoney(item.tax, invoice.currency),
            formatMoney(item.total, invoice.currency)
          ])}
        />
      </PageSection>

      <PageSection title="Totals">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-[var(--muted)]">Subtotal</p>
            <p className="mt-2 font-semibold text-[var(--foreground)]">
              {formatMoney(invoice.subtotal, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-[var(--muted)]">Discount</p>
            <p className="mt-2 font-semibold text-[var(--foreground)]">
              {formatMoney(invoice.discount?.amount ?? 0, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-[var(--muted)]">Tax</p>
            <p className="mt-2 font-semibold text-[var(--foreground)]">
              {formatMoney(invoice.tax, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-[var(--muted)]">Total</p>
            <p className="mt-2 font-semibold text-[var(--foreground)]">
              {formatMoney(invoice.price, invoice.currency)}
            </p>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
