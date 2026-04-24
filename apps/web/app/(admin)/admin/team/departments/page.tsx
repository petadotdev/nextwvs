export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminTeamDepartmentsPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Team Departments"
      description="Department administration uses the shared admin table shell here."
      routePath="/admin/team/departments"
    />
  );
}
