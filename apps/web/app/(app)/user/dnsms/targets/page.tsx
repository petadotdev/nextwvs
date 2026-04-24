export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function DnsTargetsPage() {
  return (
    <ScaffoldPage
      eyebrow="DNSMS"
      title="Targets"
      description="Domain health status, score, and registrar indicators will land here."
      routePath="/user/dnsms/targets"
    />
  );
}
