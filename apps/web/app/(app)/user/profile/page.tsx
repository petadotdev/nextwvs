export const dynamic = "force-dynamic";

import { CustomerProfileForms } from "../../../../src/components/customer-profile-forms";
import { PageHeader, PageSection, StatusBadge } from "../../../../src/components/ui";
import { getCustomerWorkspaceProfileDetails } from "../../../../src/lib/customer-workspace";

export default async function UserProfilePage() {
  const profile = await getCustomerWorkspaceProfileDetails();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title="Profile"
        description="Phase 4 replaces the placeholder with current account details, billing identity fields, a password-change block, and 2FA status context."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Account status</p>
          <div className="mt-3">
            <StatusBadge
              status={profile.verified ? "Verified" : "Pending"}
              tone={profile.verified ? "success" : "warning"}
            />
          </div>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">Customer role</p>
          <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {profile.isPrimaryAccount ? "Primary account" : "Managed member"}
          </p>
        </PageSection>
        <PageSection>
          <p className="text-sm text-[var(--muted)]">2FA status</p>
          <div className="mt-3">
            <StatusBadge
              status={profile.twoFactorEnabled ? "Enabled" : "Not enabled"}
              tone={profile.twoFactorEnabled ? "success" : "neutral"}
            />
          </div>
        </PageSection>
      </section>

      <PageSection
        title="Account And Billing Details"
        description="The profile mutation is wired to `PATCH /api/v1/me/profile`. Email remains read-only until OTP-backed sensitive updates land."
      >
        <CustomerProfileForms
          initialProfile={{
            name: profile.name,
            email: profile.email,
            contactNumber: profile.contactNumber ?? "",
            countryCode: profile.countryCode ?? "",
            country: profile.country ?? "",
            state: profile.state ?? "",
            companyName: profile.companyName ?? "",
            address: profile.address ?? "",
            gstNumber: profile.gstNumber ?? "",
            taxId: profile.taxId ?? ""
          }}
        />
      </PageSection>
    </div>
  );
}
