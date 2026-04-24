export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listCustomerRoles } from "../../../../../src/lib/customer-workspace";

export default async function UserTeamRolesPage() {
  const roles = await listCustomerRoles();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer Team"
        title="Roles"
        description="Role records, status, and permission counts are now loaded from the Phase 4 customer-team service layer."
      />
      <PageSection
        title="Role Directory"
        description="Permission replacement is exposed through `PUT /api/v1/customer-team/roles/:roleId/permissions`."
      >
        {roles.length === 0 ? (
          <EmptyState
            title="No roles configured"
            description="Create roles through the customer-team API routes, then attach permissions and memberships."
          />
        ) : (
          <DataTable
            columns={["Role", "Department", "Status", "Permissions", "Employees"]}
            rows={roles.map((role) => [
              role.name,
              role.departmentName ?? "Unassigned",
              <StatusBadge
                key={`${role.id}-status`}
                status={role.status}
                tone={role.status === "active" ? "success" : "warning"}
              />,
              String(role.permissionCount),
              String(role.employeeCount)
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
