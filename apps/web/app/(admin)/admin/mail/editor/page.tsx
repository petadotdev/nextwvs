export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminMailEditorPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Mail Editor"
      description="Template editing and send-preview workflows will attach to this route."
      routePath="/admin/mail/editor"
    />
  );
}
