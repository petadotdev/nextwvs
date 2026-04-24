export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminClientsPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Clients"
      description="Client list management is scaffolded with a consistent admin table shell."
      routePath="/admin/clients"
    />
  );
}
