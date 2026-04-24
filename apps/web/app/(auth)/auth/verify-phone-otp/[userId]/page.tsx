import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export function generateStaticParams() {
  return [];
}

export default async function VerifyPhoneOtpPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="Auth"
      title="Verify Phone OTP"
      description="This route hosts the OTP confirmation step for phone verification."
      routePath={`/auth/verify-phone-otp/${params.userId || "[userId]"}`}
    />
  );
}
