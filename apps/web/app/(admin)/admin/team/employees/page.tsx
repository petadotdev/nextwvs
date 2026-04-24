export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminTeamEmployeesPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Team Employees"
      description="Employee administration and onboarding flows will land here."
      routePath="/admin/team/employees"
    />
  );
}
