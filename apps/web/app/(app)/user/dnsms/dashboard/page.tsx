export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DnsDashboardPage() {
  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Dashboard"
      description="Health summaries and recent report status will render on this route."
      routePath="/user/dnsms/dashboard"
    />
  );
}
