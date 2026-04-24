export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DnsActiveMonitoringPage() {
  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Active Monitoring"
      description="Current DNS monitoring jobs and progress patterns are scaffolded here."
      routePath="/user/dnsms/active-monitoring"
    />
  );
}
