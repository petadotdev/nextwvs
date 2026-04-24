export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listWvsScans } from "../../../../../src/lib/wvs";

function formatDate(value: string | null) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed" || status === "cancelled") {
    return "danger" as const;
  }

  if (status === "queued" || status === "running") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function WvsScansPage() {
  const { entitlement, scans } = await listWvsScans();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Scans"
        description="Browse tenant-scoped WVS scan batches and child ZAP/Nmap runs."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Available scan credits</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {entitlement.availableScans}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Batches</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {scans.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Queued or running</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {
              scans.filter(
                (scan) => scan.status === "queued" || scan.status === "running"
              ).length
            }
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {scans.filter((scan) => scan.status === "completed").length}
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Scan Batches"
        description="Starting a scan creates a batch plus one child run per selected engine. Workers will consume these pending rows in a later slice."
      >
        {scans.length === 0 ? (
          <EmptyState
            title="No WVS scans"
            description="Start a scan through POST /api/v1/wvs/scans after verifying a target."
          />
        ) : (
          <DataTable
            columns={[
              "Target",
              "Status",
              "Engines",
              "ZAP Run",
              "Nmap Run",
              "Created"
            ]}
            rows={scans.map((scan) => [
              scan.targetUrl,
              <StatusBadge
                key={`${scan.id}-status`}
                status={scan.status}
                tone={statusTone(scan.status)}
              />,
              scan.selectedEngines.join(", "),
              scan.zapScanId ?? "n/a",
              scan.nmapScanId ?? "n/a",
              formatDate(scan.createdAt)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
