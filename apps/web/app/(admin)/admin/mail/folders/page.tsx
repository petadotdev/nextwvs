export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminMailFoldersPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Mail Folders"
      description="Foldered mail management is scaffolded on this route."
      routePath="/admin/mail/folders"
    />
  );
}
