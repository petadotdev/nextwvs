export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listWvsTargets } from "../../../../../src/lib/wvs";

function formatDate(value: string | null) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function WvsTargetsPage() {
  const { entitlement, targets } = await listWvsTargets();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Targets"
        description="Manage web vulnerability scan targets and verification state."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Available scan credits</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {entitlement.availableScans}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Targets</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {targets.length}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Verified</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {
              targets.filter(
                (target) => target.verificationStatus === "verified"
              ).length
            }
          </p>
        </PageSection>
      </section>

      <PageSection
        title="Target Inventory"
        description="Targets are tenant-scoped and normalized before storage to prevent duplicates."
      >
        {targets.length === 0 ? (
          <EmptyState
            title="No WVS targets"
            description="Create a target through the WVS target API to begin ownership verification."
          />
        ) : (
          <DataTable
            columns={["Target", "Verification", "Runs", "Last Run", "Created"]}
            rows={targets.map((target) => [
              target.targetUrl,
              <StatusBadge
                key={target.id}
                status={target.verificationStatus}
                tone={
                  target.verificationStatus === "verified"
                    ? "success"
                    : "warning"
                }
              />,
              target.runCount,
              formatDate(target.lastRunAt),
              formatDate(target.createdAt)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
