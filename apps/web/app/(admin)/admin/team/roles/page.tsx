export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminTeamRolesPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Team Roles"
      description="Role and permission management is scaffolded on this route."
      routePath="/admin/team/roles"
    />
  );
}
