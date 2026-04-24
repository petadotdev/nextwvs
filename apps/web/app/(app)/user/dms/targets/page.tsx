export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DmsTargetsPage() {
  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Targets"
      description="Monitored targets and start/stop monitoring actions will render here."
      routePath="/user/dms/targets"
    />
  );
}
