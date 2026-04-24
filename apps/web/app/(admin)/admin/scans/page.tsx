export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminScansPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Scans"
      description="Cross-tenant scan oversight is scaffolded for later operational screens."
      routePath="/admin/scans"
    />
  );
}
