export const dynamic = "force-dynamic";

import { CustomerNotificationForm } from "../../../../../src/components/customer-notification-form";
import { PageHeader, PageSection } from "../../../../../src/components/ui";
import { getCustomerNotificationPreferences } from "../../../../../src/lib/customer-workspace";

export default async function UserNotificationSettingsPage() {
  const preferences = await getCustomerNotificationPreferences();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title="Notification Settings"
        description="Mail preference persistence is live in Phase 4 and is backed by the customer record mail-preferences JSON."
      />
      <PageSection
        title="Mail Preferences"
        description="Changes affect future notifications only and are stored through `PUT /api/v1/me/notification-preferences`."
      >
        <CustomerNotificationForm initialPreferences={preferences} />
      </PageSection>
    </div>
  );
}
