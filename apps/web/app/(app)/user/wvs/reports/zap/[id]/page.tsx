export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../../../src/components/ui";
import { getWvsZapReport } from "../../../../../../../src/lib/wvs";

function riskTone(risk: string) {
  if (risk === "High") {
    return "danger" as const;
  }

  if (risk === "Medium") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function WvsZapReportPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { report } = await getWvsZapReport(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="ZAP Report"
        description={`Stored ZAP report for ${report.targetUrl}`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Status</p>
          <div className="mt-3">
            <StatusBadge status={report.status} />
          </div>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Progress</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {report.progress}%
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Findings</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {report.vulnerabilities.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Artifact</p>
          <p className="mt-3 break-all text-sm text-[var(--foreground)]">
            {report.outputFilePath ?? "n/a"}
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Findings"
        description="Grouped by alert name and risk."
      >
        {report.vulnerabilities.length === 0 ? (
          <EmptyState
            title="No ZAP findings"
            description="No extracted ZAP alerts were present in the stored payload."
          />
        ) : (
          <DataTable
            columns={["Name", "Risk", "Instances", "URLs"]}
            rows={report.vulnerabilities.map((item) => [
              item.name,
              <StatusBadge
                key={`${item.scanRunId}-${item.name}`}
                status={item.risk}
                tone={riskTone(item.risk)}
              />,
              item.count,
              item.urls.slice(0, 3).join(", ") || "n/a"
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
