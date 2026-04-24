export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminTransactionsReportPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Transactions Report"
      description="Financial transaction reporting is scaffolded with the shared report shell."
      routePath="/admin/reports/transactions"
    />
  );
}
