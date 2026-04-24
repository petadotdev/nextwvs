export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminRevenueReportPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Revenue Report"
      description="Revenue reporting is scaffolded on this route."
      routePath="/admin/reports/revenue"
    />
  );
}
