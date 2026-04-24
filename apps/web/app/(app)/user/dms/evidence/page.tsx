export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DmsEvidencePage() {
  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Evidence"
      description="Evidence grid and screenshot-driven review workflows will render here."
      routePath="/user/dms/evidence"
    />
  );
}
