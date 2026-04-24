export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminCreatePackagePage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Create Package"
      description="Package creation flows are scaffolded for later billing-phase work."
      routePath="/admin/packages/create"
    />
  );
}
