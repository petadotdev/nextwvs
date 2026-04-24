export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminSesOverviewPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="SES Overview"
      description="Email provider validation and status overview are scaffolded here."
      routePath="/admin/mail/ses-overview"
    />
  );
}
