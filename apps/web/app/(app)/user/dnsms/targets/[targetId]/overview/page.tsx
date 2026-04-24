export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../../src/components/scaffold-page";

export default async function DnsTargetOverviewPage(props: {
  params: Promise<{ targetId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Target Overview"
      description="Target-level DNS posture summaries are scaffolded here."
      routePath={`/user/dnsms/targets/${params.targetId || "[targetId]"}/overview`}
    />
  );
}
