export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminMailValidationPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Mail Validation"
      description="Mailbox validation and deliverability tools are scaffolded on this route."
      routePath="/admin/mail/validation"
    />
  );
}
