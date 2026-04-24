export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import {
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../../../src/components/ui";
import { getWvsNmapReport } from "../../../../../../../src/lib/wvs";

export default async function WvsNmapReportPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { report } = await getWvsNmapReport(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Nmap Report"
        description={`Stored Nmap report metadata for ${report.targetUrl}`}
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
          <p className="text-sm text-[var(--muted)]">Payload</p>
          <p className="mt-3 text-sm text-[var(--foreground)]">
            {report.resultAvailable ? "Stored" : "Not available"}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Artifact</p>
          <p className="mt-3 break-all text-sm text-[var(--foreground)]">
            {report.outputFilePath ?? "n/a"}
          </p>
        </PageSection>
      </section>
    </div>
  );
}
