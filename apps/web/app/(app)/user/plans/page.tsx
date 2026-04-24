export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function UserPlansPage() {
  return (
    <ScaffoldPage
      eyebrow="User"
      title="Plans"
      description="Plan inspection, upgrades, and entitlement details are scaffolded here."
      routePath="/user/plans"
    />
  );
}
