export const dynamic = "force-dynamic";

import {
  DataTable,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { CustomerFeedbackForm } from "../../../../src/components/customer-profile-forms";
import { getCustomerWorkspaceDashboard } from "../../../../src/lib/customer-workspace";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function UserDashboardPage() {
  const dashboard = await getCustomerWorkspaceDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title="Dashboard"
        description="Phase 4 replaces the placeholder with tenant-scoped summary cards, service entitlement indicators, recent activity, and a persisted feedback flow."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "WVS Targets",
            value: dashboard.summary.wvsTargets,
            subtext: `${dashboard.summary.wvsScans} recorded scan runs`
          },
          {
            label: "DMS Monitoring",
            value: dashboard.summary.dmsTargets,
            subtext: `${dashboard.summary.dmsActiveTargets} active`
          },
          {
            label: "DNS Targets",
            value: dashboard.summary.dnsTargets,
            subtext: `${dashboard.summary.dnsActiveTargets} active`
          },
          {
            label: "Open Tickets",
            value: dashboard.summary.openTickets,
            subtext: `${dashboard.summary.activeTeamMembers} active team members`
          }
        ].map((card) => (
          <PageSection key={card.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-[var(--foreground)]">{card.value}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{card.subtext}</p>
          </PageSection>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <PageSection title="Entitlements" description="Current service-plan indicators from the authenticated customer record.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <p className="text-sm text-[var(--muted)]">WVS scans</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {dashboard.servicePlans.wvs.availableScans}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">DMS slots</p>
                <StatusBadge
                  status={dashboard.servicePlans.dms.active ? "Active" : "Expired"}
                  tone={dashboard.servicePlans.dms.active ? "success" : "warning"}
                />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {dashboard.servicePlans.dms.slots}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">DNSMS slots</p>
                <StatusBadge
                  status={dashboard.servicePlans.dnsms.active ? "Active" : "Expired"}
                  tone={dashboard.servicePlans.dnsms.active ? "success" : "warning"}
                />
              </div>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {dashboard.servicePlans.dnsms.slots}
              </p>
            </div>
          </div>
        </PageSection>

        <PageSection
          title="Feedback"
          description="This is the first live Phase 4 mutation on the dashboard. Submissions persist to the feedback table."
        >
          <CustomerFeedbackForm />
        </PageSection>
      </div>

      <PageSection
        title="Recent Activity"
        description="Recent tenant activity is loaded server-side from persisted customer activity logs."
      >
        <DataTable
          columns={["Action", "Route", "Timestamp"]}
          rows={dashboard.summary.recentActivity.map((item) => [
            item.action,
            item.route ?? "n/a",
            formatDate(item.timestampAt)
          ])}
        />
      </PageSection>
    </div>
  );
}
