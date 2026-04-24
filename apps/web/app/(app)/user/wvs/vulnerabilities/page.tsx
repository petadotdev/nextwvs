export const dynamic = "force-dynamic";

import {
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatusBadge
} from "../../../../../src/components/ui";
import { listWvsVulnerabilities } from "../../../../../src/lib/wvs";

function riskTone(risk: string) {
  if (risk === "High") {
    return "danger" as const;
  }

  if (risk === "Medium") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function WvsVulnerabilitiesPage() {
  const { vulnerabilities } = await listWvsVulnerabilities();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WVS"
        title="Vulnerabilities"
        description="Grouped vulnerabilities extracted from completed ZAP result payloads."
      />

      <PageSection
        title="Vulnerability Inventory"
        description="URLs are grouped per vulnerability name and risk level."
      >
        {vulnerabilities.length === 0 ? (
          <EmptyState
            title="No vulnerabilities found"
            description="Completed ZAP reports with alert payloads will appear here."
          />
        ) : (
          <DataTable
            columns={["Name", "Risk", "Target", "Instances", "URLs"]}
            rows={vulnerabilities.map((item) => [
              item.name,
              <StatusBadge
                key={`${item.scanRunId}-${item.name}`}
                status={item.risk}
                tone={riskTone(item.risk)}
              />,
              item.targetUrl,
              item.count,
              item.urls.slice(0, 3).join(", ") || "n/a"
            ])}
          />
        )}
      </PageSection>
    </div>
  );
}
