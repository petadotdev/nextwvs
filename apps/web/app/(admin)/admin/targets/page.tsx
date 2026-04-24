export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminTargetsPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Targets"
      description="Operational oversight of targets is scaffolded here."
      routePath="/admin/targets"
    />
  );
}
