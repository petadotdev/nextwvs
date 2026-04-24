export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminVisitorsPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Visitors"
      description="Visitor tracking and lead-source reporting surfaces will render here."
      routePath="/admin/visitors"
    />
  );
}
