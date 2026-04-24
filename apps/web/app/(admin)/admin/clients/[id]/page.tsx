export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default async function AdminClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Client Detail"
      description="Client detail management and admin-on-behalf actions belong on this route."
      routePath={`/admin/clients/${params.id || "[id]"}`}
    />
  );
}
