export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listCustomerEmployees } from "../../../../../src/lib/customer-workspace";

export default async function UserTeamEmployeesPage() {
  const employees = await listCustomerEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer Team"
        title="Employees"
        description="Managed customer members are loaded tenant-safely with department and role joins in Phase 4."
      />
      <PageSection
        title="Employee Directory"
        description="Create, update, status, and delete APIs are live under `/api/v1/customer-team/employees*`."
      >
        {employees.length === 0 ? (
          <EmptyState
            title="No team members found"
            description="Customer members will appear here once created through the Phase 4 customer-team APIs."
          />
        ) : (
          <DataTable
            columns={["Employee", "Department", "Role", "Status", "Access"]}
            rows={employees.map((employee) => [
              `${employee.name} (${employee.email})`,
              employee.departmentName ?? "Unassigned",
              employee.roleName ?? "Unassigned",
              <StatusBadge
                key={`${employee.id}-status`}
                status={employee.status}
                tone={employee.status === "active" ? "success" : "warning"}
              />,
              employee.isPrimaryAccount
                ? "Primary account"
                : employee.teamManageAccess
                  ? "Team manager"
                  : "Standard member"
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
