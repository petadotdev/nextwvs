export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../../src/components/scaffold-page";

export default async function DmsTargetOverviewPage(props: {
  params: Promise<{ targetId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Target Overview"
      description="Target-level monitoring insights are scaffolded here."
      routePath={`/user/dms/targets/${params.targetId || "[targetId]"}/overview`}
    />
  );
}
