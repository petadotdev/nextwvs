export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../src/components/scaffold-page";

export default async function DnsJobDetailPage(props: {
  params: Promise<{ jobId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Job Detail"
      description="Per-job DNS progress and result state will render here."
      routePath={`/user/dnsms/jobs/${params.jobId || "[jobId]"}`}
    />
  );
}
