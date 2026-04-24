export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DmsDashboardPage() {
  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Dashboard"
      description="Target counts, active monitoring, and evidence summaries will appear here."
      routePath="/user/dms/dashboard"
    />
  );
}
