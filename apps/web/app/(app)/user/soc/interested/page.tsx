export const dynamic = "force-dynamic";

import { CustomerSocInterestForm } from "../../../../../src/components/customer-soc-interest-form";
import { PageHeader, PageSection } from "../../../../../src/components/ui";
import { getCustomerWorkspaceProfileDetails } from "../../../../../src/lib/customer-workspace";

export default async function UserSocInterestedPage() {
  const profile = await getCustomerWorkspaceProfileDetails();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title="SOC Interest"
        description="This Phase 4 slice captures customer interest in SOC offerings and persists it into the customer profile payload for later admin follow-up."
      />
      <PageSection
        title="Interest Form"
        description="Duplicate submissions are blocked once an interest record has been persisted for the current account."
      >
        <CustomerSocInterestForm initialInterest={profile.socInterest} />
      </PageSection>
    </div>
  );
}
