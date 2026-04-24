import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function PhoneVerifyPage() {
  return (
    <ScaffoldPage
      eyebrow="Auth"
      title="Phone Verification"
      description="Phone verification remains an auth-scoped flow and will call the OTP APIs introduced in Phase 2."
      routePath="/auth/phone-verify"
    />
  );
}
