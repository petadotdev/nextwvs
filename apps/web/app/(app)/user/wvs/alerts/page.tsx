export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listWvsAlerts } from "../../../../../src/lib/wvs";

function riskTone(risk: string) {
  if (risk === "High") {
    return "danger" as const;
  }

  if (risk === "Medium") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function WvsAlertsPage() {
  const { alerts, total, summary } = await listWvsAlerts();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Alerts"
        description="High and medium WVS findings promoted as actionable alerts."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Actionable alerts</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {total}
          </p>
        </PageSection>
        {summary.slice(0, 2).map((item) => (
          <PageSection key={item.risk}>
            <p className="text-sm text-[var(--muted)]">{item.risk}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {item.count}
            </p>
          </PageSection>
        ))}
      </section>

      <PageSection
        title="Alert Queue"
        description="Derived from latest available ZAP payloads until a dedicated alert table is introduced."
      >
        {alerts.length === 0 ? (
          <EmptyState
            title="No active WVS alerts"
            description="High and medium vulnerability findings will populate this queue."
          />
        ) : (
          <DataTable
            columns={["Finding", "Risk", "Target", "Instances", "Run"]}
            rows={alerts.map((item) => [
              item.name,
              <StatusBadge
                key={`${item.scanRunId}-${item.name}`}
                status={item.risk}
                tone={riskTone(item.risk)}
              />,
              item.targetUrl,
              item.count,
              item.scanRunId
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
