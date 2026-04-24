export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminDashboardScopedPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Dashboard"
      description="Administrative overview and operational widgets are scaffolded on this route."
      routePath="/admin/dashboard"
    />
  );
}
