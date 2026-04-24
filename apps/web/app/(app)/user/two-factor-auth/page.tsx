export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function UserTwoFactorAuthPage() {
  return (
    <ScaffoldPage
      eyebrow="User"
      title="Two-Factor Authentication"
      description="2FA enrollment and management will attach to this settings route."
      routePath="/user/two-factor-auth"
    />
  );
}
