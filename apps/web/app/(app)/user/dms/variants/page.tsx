export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DmsVariantsPage() {
  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Variants"
      description="Variant enrichment details and suspect state will land here."
      routePath="/user/dms/variants"
    />
  );
}
