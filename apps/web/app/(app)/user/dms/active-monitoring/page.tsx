export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DmsActiveMonitoringPage() {
  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Active Monitoring"
      description="Live monitoring state and active jobs are scaffolded here."
      routePath="/user/dms/active-monitoring"
    />
  );
}
