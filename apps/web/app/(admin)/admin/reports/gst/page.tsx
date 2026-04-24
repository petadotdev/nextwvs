export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../../src/components/scaffold-page";

export default function AdminGstReportPage() {
  return (
    <ScaffoldPage
      eyebrow="Admin"
      title="GST Report"
      description="GST reporting and tax summaries are scaffolded here."
      routePath="/admin/reports/gst"
    />
  );
}
