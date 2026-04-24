export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminMailTemplatesPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Mail Templates"
      description="Mail template management and previewing will live here."
      routePath="/admin/mail/templates"
    />
  );
}
