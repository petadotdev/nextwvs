export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function AdminReferralsPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Referrals"
      description="Referral management and reporting are scaffolded here."
      routePath="/admin/referrals"
    />
  );
}
