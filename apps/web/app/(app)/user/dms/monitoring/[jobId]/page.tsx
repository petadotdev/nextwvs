export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../src/components/scaffold-page";

export default async function DmsMonitoringDetailPage(props: {
  params: Promise<{ jobId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="DMS"
      title="Monitoring Detail"
      description="Job status, phase, progress, and live log stream belong on this route."
      routePath={`/user/dms/monitoring/${params.jobId || "[jobId]"}`}
    />
  );
}
