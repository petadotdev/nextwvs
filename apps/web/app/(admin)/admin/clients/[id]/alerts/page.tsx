export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../../src/components/scaffold-page";

export default async function AdminClientAlertsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Client Alerts"
      description="Client-level alert review workflows are scaffolded here."
      routePath={`/admin/clients/${params.id || "[id]"}/alerts`}
    />
  );
}
