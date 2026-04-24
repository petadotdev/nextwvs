export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../src/components/ui";
import { listAdminTickets } from "../../../../src/lib/tickets";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "resolved" || status === "closed") {
    return "success" as const;
  }

  if (status === "open") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function AdminTicketsPage() {
  const { tickets } = await listAdminTickets();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Tickets"
        description="Administrative support ticket queue."
      />

      <PageSection title="All Tickets">
        {tickets.length === 0 ? (
          <EmptyState
            title="No tickets"
            description="Customer support tickets will appear here."
          />
        ) : (
          <DataTable
            columns={["Subject", "Department", "Status", "Accepted", "Created"]}
            rows={tickets.map((ticket) => [
              ticket.subject,
              ticket.departmentName ?? "n/a",
              <StatusBadge
                key={ticket.id}
                status={ticket.status}
                tone={statusTone(ticket.status)}
              />,
              ticket.isAccepted ? "Yes" : "No",
              formatDate(ticket.createdAt)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
