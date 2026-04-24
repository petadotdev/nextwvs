export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listWvsRiskSummary } from "../../../../../src/lib/wvs";

function riskTone(risk: string) {
  if (risk === "High") {
    return "danger" as const;
  }

  if (risk === "Medium") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function WvsRisksPage() {
  const { summary, total } = await listWvsRiskSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Risks"
        description="Severity summary extracted from stored ZAP scan results."
      />

      <section className="grid gap-4 md:grid-cols-4">
        {summary.map((item) => (
          <PageSection key={item.risk}>
            <p className="text-sm text-[var(--muted)]">{item.risk}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {item.count}
            </p>
          </PageSection>
        ))}
      </section>

      <PageSection
        title="Risk Inventory"
        description="Counts represent grouped vulnerability names, not raw alert instances."
      >
        {total === 0 ? (
          <EmptyState
            title="No risks found"
            description="Completed ZAP scan payloads will populate this summary."
          />
        ) : (
          <DataTable
            columns={["Risk", "Grouped vulnerabilities"]}
            rows={summary.map((item) => [
              <StatusBadge
                key={item.risk}
                status={item.risk}
                tone={riskTone(item.risk)}
              />,
              item.count
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
