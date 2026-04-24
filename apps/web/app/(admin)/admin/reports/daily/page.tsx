export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminDailyReportPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="Daily Report"
      description="Daily operational reporting will render here."
      routePath="/admin/reports/daily"
    />
  );
}
