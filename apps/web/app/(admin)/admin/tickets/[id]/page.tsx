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
} from "../../../../../src/components/ui";
import { getAdminTicket } from "../../../../../src/lib/tickets";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminTicketDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { ticket, comments } = await getAdminTicket(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={ticket.subject}
        description={ticket.description}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Status</p>
          <div className="mt-3">
            <StatusBadge status={ticket.status} />
          </div>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Department</p>
          <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
            {ticket.departmentName ?? "n/a"}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Accepted</p>
          <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
            {ticket.isAccepted ? "Yes" : "No"}
          </p>
        </PageSection>
      </section>

      <PageSection title="Conversation">
        {comments.length === 0 ? (
          <EmptyState
            title="No comments"
            description="Ticket comments will appear here."
          />
        ) : (
          <DataTable
            columns={["Author", "Message", "Created"]}
            rows={comments.map((comment) => [
              comment.authorName,
              comment.message,
              formatDate(comment.createdAt)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
