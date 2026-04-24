export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminCreateClientPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Create Client"
      description="Client onboarding and creation flows will attach to this route."
      routePath="/admin/clients/create"
    />
  );
}
