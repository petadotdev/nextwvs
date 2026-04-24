export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listCustomerDepartments } from "../../../../../src/lib/customer-workspace";

export default async function UserTeamDepartmentsPage() {
  const departments = await listCustomerDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer Team"
        title="Departments"
        description="Department listing is now tenant-scoped and backed by the customer-team repositories and API routes."
      />
      <PageSection
        title="Department Directory"
        description="Mutations are available through `/api/v1/customer-team/departments*`; the page is server-rendered first for stable list loading."
      >
        {departments.length === 0 ? (
          <EmptyState
            title="No departments yet"
            description="Create departments through the customer-team API routes or later server-action forms."
          />
        ) : (
          <DataTable
            columns={["Department", "Status", "Roles", "Employees"]}
            rows={departments.map((department) => [
              department.name,
              <StatusBadge
                key={`${department.id}-status`}
                status={department.status}
                tone={department.status === "active" ? "success" : "warning"}
              />,
              String(department.roleCount),
              String(department.employeeCount)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
