export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../src/components/scaffold-page";

export default async function DnsReportPage(props: {
  params: Promise<{ targetId: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Report Overview"
      description="Report summary, SSL status, WHOIS data, and change history will land here."
      routePath={`/user/dnsms/reports/${params.targetId || "[targetId]"}`}
    />
  );
}
