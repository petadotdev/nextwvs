import { randomUUID } from "node:crypto";
import { hashOneTimeCode, hasPermission } from "@petadot/auth";
import {
  CustomerWorkspaceRepository,
  WvsRepository,
  withTransaction,
  type WvsScanBatchWithRunsRecord,
  type WvsScanEngine,
  type WvsScanRunArtifactRecord
} from "@petadot/db";
import type {
  WvsRetryConfigInput,
  WvsScanCreateParsedInput,
  WvsScanScheduleInput,
  WvsTargetCreateInput,
  WvsTargetVerifyInput
} from "@petadot/validation";
import { ApiError, errorResponse, successResponse } from "./auth/api";
import { getAuthRuntimeEnv } from "./auth/env";
import { getCustomerSessionPrincipal } from "./auth/server";

async function getWvsActorContext() {
  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Customer session is required");
  }

  const profile = await new CustomerWorkspaceRepository().findProfileByUserId(
    principal.userId
  );

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (
    !profile.isPrimaryAccount &&
    !hasPermission(principal.permissions, "wvs", "view")
  ) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have permission to manage WVS targets"
    );
  }

  return {
    principal,
    profile
  };
}

function normalizeTargetUrl(targetUrl: string) {
  const url = new URL(targetUrl);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/g, "") || "/";
  return url.toString().toLowerCase();
}

function mapTarget(
  target: Awaited<ReturnType<WvsRepository["listTargets"]>>[number]
) {
  return {
    id: target.id,
    targetUrl: target.targetUrl,
    normalizedTarget: target.normalizedTarget,
    verificationStatus: target.verificationStatus,
    verificationExpiresAt: target.verificationExpiresAt,
    scheduleEnabled: target.scheduleEnabled,
    runCount: target.runCount,
    lastRunAt: target.lastRunAt,
    failedReason: target.failedReason,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt
  };
}

function mapRun(run: WvsScanBatchWithRunsRecord["runs"][number]) {
  return {
    id: run.id,
    engine: run.engine,
    status: run.status === "pending" ? "queued" : run.status,
    progress: run.progress,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    outputFilePath: run.outputFilePath,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt
  };
}

function mapScanBatch(batch: WvsScanBatchWithRunsRecord) {
  const zapRun = batch.runs.find((run) => run.engine === "ZAP") ?? null;
  const nmapRun = batch.runs.find((run) => run.engine === "NMAP") ?? null;

  return {
    id: batch.id,
    scanBatchId: batch.id,
    targetId: batch.targetId,
    targetUrl: batch.targetUrl,
    normalizedTarget: batch.normalizedTarget,
    selectedEngines: batch.selectedEngines,
    status: batch.status === "pending" ? "queued" : batch.status,
    zapScanId: zapRun?.id ?? null,
    nmapScanId: nmapRun?.id ?? null,
    runs: batch.runs.map(mapRun),
    startedAt: batch.startedAt,
    finishedAt: batch.finishedAt,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt
  };
}

function calculateBatchProgress(batch: WvsScanBatchWithRunsRecord) {
  if (batch.runs.length === 0) {
    return 0;
  }

  const total = batch.runs.reduce((sum, run) => sum + run.progress, 0);
  return Math.round(total / batch.runs.length);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stripHtml(value: unknown) {
  return asString(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRisk(value: unknown) {
  const raw = asString(value).split("(")[0]?.trim() || asString(value).trim();
  const normalized = raw.toLowerCase();

  if (normalized === "high" || value === 3 || value === "3") {
    return "High";
  }

  if (normalized === "medium" || value === 2 || value === "2") {
    return "Medium";
  }

  if (normalized === "low" || value === 1 || value === "1") {
    return "Low";
  }

  return "Informational";
}

function extractZapSites(payload: unknown): Array<Record<string, unknown>> {
  const root = asRecord(payload);
  const nested = asRecord(root?.result) ?? asRecord(root?.payload) ?? root;
  const site = nested?.site;

  if (Array.isArray(site)) {
    return site.filter((item): item is Record<string, unknown> =>
      Boolean(asRecord(item))
    );
  }

  const singleSite = asRecord(site);
  return singleSite ? [singleSite] : [];
}

function extractZapVulnerabilities(run: WvsScanRunArtifactRecord) {
  const vulnerabilities = new Map<
    string,
    {
      name: string;
      risk: string;
      confidence: string;
      description: string;
      solution: string;
      reference: string;
      urls: Set<string>;
      count: number;
      targetUrl: string;
      scanRunId: string;
      scanBatchId: string;
      completedAt: string | null;
    }
  >();

  for (const site of extractZapSites(run.resultPayload)) {
    const alerts = Array.isArray(site.alerts) ? site.alerts : [];

    for (const alertValue of alerts) {
      const alert = asRecord(alertValue);

      if (!alert) {
        continue;
      }

      const name =
        asString(alert.alert) ||
        asString(alert.name) ||
        "Unknown vulnerability";
      const risk = normalizeRisk(
        alert.riskdesc ?? alert.risk ?? alert.riskcode
      );
      const key = `${name}:${risk}`;
      const item = vulnerabilities.get(key) ?? {
        name,
        risk,
        confidence: asString(alert.confidence) || asString(alert.riskdesc),
        description: stripHtml(alert.desc),
        solution: stripHtml(alert.solution),
        reference: stripHtml(alert.reference),
        urls: new Set<string>(),
        count: 0,
        targetUrl: run.targetUrl,
        scanRunId: run.id,
        scanBatchId: run.batchId,
        completedAt: run.completedAt
      };

      const instances = Array.isArray(alert.instances) ? alert.instances : [];

      for (const instanceValue of instances) {
        const instance = asRecord(instanceValue);
        const uri = asString(instance?.uri);

        if (uri) {
          item.urls.add(uri);
        }
      }

      if (item.urls.size === 0 && asString(site["@name"])) {
        item.urls.add(asString(site["@name"]));
      }

      item.count += Math.max(instances.length, 1);
      vulnerabilities.set(key, item);
    }
  }

  return Array.from(vulnerabilities.values()).map((item) => ({
    name: item.name,
    risk: item.risk,
    confidence: item.confidence,
    description: item.description,
    solution: item.solution,
    reference: item.reference,
    urls: Array.from(item.urls),
    count: item.count,
    targetUrl: item.targetUrl,
    scanRunId: item.scanRunId,
    scanBatchId: item.scanBatchId,
    completedAt: item.completedAt
  }));
}

function summarizeRisks(
  vulnerabilities: Array<ReturnType<typeof extractZapVulnerabilities>[number]>
) {
  const order = ["High", "Medium", "Low", "Informational"];
  return order.map((risk) => ({
    risk,
    count: vulnerabilities.filter((item) => item.risk === risk).length
  }));
}

function mapDatabaseError(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);

    if (code === "23505") {
      return new ApiError(
        409,
        "WVS_TARGET_ALREADY_EXISTS",
        "WVS target already exists"
      );
    }
  }

  return error;
}

export async function listWvsTargets() {
  const context = await getWvsActorContext();
  const targets = await new WvsRepository().listTargets(
    context.principal.tenantId
  );

  return {
    entitlement: {
      availableScans: context.profile.totalScan
    },
    targets: targets.map(mapTarget)
  };
}

export async function createWvsTarget(input: WvsTargetCreateInput) {
  const context = await getWvsActorContext();
  const normalizedTarget = normalizeTargetUrl(input.targetUrl);

  try {
    const target = await new WvsRepository().createTarget({
      tenantId: context.principal.tenantId,
      createdBy: context.principal.userId,
      targetUrl: input.targetUrl,
      normalizedTarget
    });

    return {
      target: mapTarget(target)
    };
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function sendWvsTargetVerification(targetId: string) {
  const context = await getWvsActorContext();
  const repository = new WvsRepository();
  const target = await repository.findTargetById(
    context.principal.tenantId,
    targetId
  );

  if (!target) {
    throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
  }

  if (target.verificationStatus === "verified") {
    return {
      target: mapTarget(target),
      verificationAlreadyComplete: true
    };
  }

  const token = `${randomUUID()}${randomUUID()}`;
  const tokenHash = hashOneTimeCode(token, getAuthRuntimeEnv().sessionSecret);
  const updated = await repository.setVerificationToken(
    context.principal.tenantId,
    targetId,
    tokenHash,
    new Date(Date.now() + 1000 * 60 * 60 * 24)
  );

  if (!updated) {
    throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
  }

  return {
    target: mapTarget(updated),
    verificationToken: token
  };
}

export async function verifyWvsTarget(
  targetId: string,
  input: WvsTargetVerifyInput
) {
  const context = await getWvsActorContext();
  const tokenHash = hashOneTimeCode(
    input.token,
    getAuthRuntimeEnv().sessionSecret
  );
  const target = await new WvsRepository().verifyTarget(
    context.principal.tenantId,
    targetId,
    tokenHash
  );

  if (!target) {
    throw new ApiError(
      422,
      "INVALID_WVS_VERIFICATION",
      "Verification token is invalid or expired"
    );
  }

  return {
    target: mapTarget(target)
  };
}

export async function deleteWvsTarget(targetId: string) {
  const context = await getWvsActorContext();
  const deleted = await new WvsRepository().deleteTarget(
    context.principal.tenantId,
    targetId
  );

  if (!deleted) {
    throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
  }

  return { deleted: true };
}

export async function startWvsScan(input: WvsScanCreateParsedInput) {
  const context = await getWvsActorContext();

  const result = await withTransaction(async (tx) => {
    const repository = new WvsRepository({ db: tx });
    const target = await repository.findTargetById(
      context.principal.tenantId,
      input.targetId
    );

    if (!target) {
      throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
    }

    if (target.verificationStatus !== "verified") {
      throw new ApiError(
        422,
        "WVS_TARGET_NOT_VERIFIED",
        "WVS target must be verified before scanning"
      );
    }

    const activeBatch = await repository.findActiveBatchForTarget(
      context.principal.tenantId,
      input.targetId
    );

    if (activeBatch) {
      throw new ApiError(
        409,
        "WVS_SCAN_ALREADY_ACTIVE",
        "A WVS scan is already queued or running for this target"
      );
    }

    const remainingCredit = await repository.consumeScanCredit(
      context.principal.tenantId
    );

    if (!remainingCredit) {
      throw new ApiError(
        402,
        "WVS_SCAN_CREDITS_EXHAUSTED",
        "No WVS scan credits are available"
      );
    }

    const created = await repository.createScanBatchWithRuns({
      tenantId: context.principal.tenantId,
      targetId: input.targetId,
      requestedBy: context.principal.userId,
      engines: input.scanTypes as WvsScanEngine[],
      scanByEmail: context.principal.email,
      scanByName: context.principal.name
    });

    return {
      created,
      availableScans: remainingCredit.totalScan
    };
  });

  const zapRun =
    result.created.runs.find((run) => run.engine === "ZAP") ?? null;
  const nmapRun =
    result.created.runs.find((run) => run.engine === "NMAP") ?? null;

  return {
    scanBatchId: result.created.batch.id,
    zapScanId: zapRun?.id ?? null,
    nmapScanId: nmapRun?.id ?? null,
    status: "queued",
    entitlement: {
      availableScans: result.availableScans
    }
  };
}

export async function listWvsScans() {
  const context = await getWvsActorContext();
  const scans = await new WvsRepository().listScanBatches(
    context.principal.tenantId
  );

  return {
    entitlement: {
      availableScans: context.profile.totalScan
    },
    scans: scans.map(mapScanBatch)
  };
}

export async function getWvsScan(scanBatchId: string) {
  const context = await getWvsActorContext();
  const scan = await new WvsRepository().findScanBatchById(
    context.principal.tenantId,
    scanBatchId
  );

  if (!scan) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  return {
    scan: mapScanBatch(scan)
  };
}

export async function getWvsScanProgress(scanBatchId: string) {
  const context = await getWvsActorContext();
  const scan = await new WvsRepository().findScanBatchById(
    context.principal.tenantId,
    scanBatchId
  );

  if (!scan) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  return {
    scanBatchId: scan.id,
    status: scan.status === "pending" ? "queued" : scan.status,
    progress: calculateBatchProgress(scan),
    runs: scan.runs.map(mapRun),
    updatedAt: scan.updatedAt
  };
}

export async function cancelWvsScan(scanBatchId: string) {
  const context = await getWvsActorContext();

  const scan = await withTransaction(async (tx) => {
    const repository = new WvsRepository({ db: tx });
    const existing = await repository.findScanBatchById(
      context.principal.tenantId,
      scanBatchId
    );

    if (!existing) {
      throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
    }

    if (existing.status !== "pending" && existing.status !== "running") {
      throw new ApiError(
        409,
        "WVS_SCAN_NOT_CANCELLABLE",
        "Only queued or running WVS scans can be cancelled"
      );
    }

    await repository.cancelScanBatch(context.principal.tenantId, scanBatchId);
    return repository.findScanBatchById(
      context.principal.tenantId,
      scanBatchId
    );
  });

  if (!scan) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  return {
    scan: mapScanBatch(scan)
  };
}

function parseScheduleDateTime(input: WvsScanScheduleInput) {
  const scheduledAt = new Date(
    `${input.scheduleDate}T${input.scheduleTime}:00`
  );

  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    throw new ApiError(
      422,
      "INVALID_WVS_SCHEDULE",
      "Scheduled date and time must be in the future"
    );
  }

  return scheduledAt;
}

export async function scheduleWvsScan(
  scanBatchId: string,
  input: WvsScanScheduleInput
) {
  const context = await getWvsActorContext();
  const repository = new WvsRepository();
  const scan = await repository.findScanBatchById(
    context.principal.tenantId,
    scanBatchId
  );

  if (!scan) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  const target = await repository.findTargetById(
    context.principal.tenantId,
    scan.targetId
  );

  if (!target) {
    throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
  }

  if (target.verificationStatus !== "verified") {
    throw new ApiError(
      422,
      "WVS_TARGET_NOT_VERIFIED",
      "WVS target must be verified before scheduling scans"
    );
  }

  const scheduledAt = parseScheduleDateTime(input);
  const limits = input.scheduleType === "One Time" ? 1 : (input.limits ?? 1);
  const updated = await repository.scheduleTarget({
    tenantId: context.principal.tenantId,
    targetId: scan.targetId,
    scheduleDate: scheduledAt,
    scheduleTime: input.scheduleTime,
    scheduleType: input.scheduleType,
    limits
  });

  if (!updated) {
    throw new ApiError(404, "WVS_TARGET_NOT_FOUND", "WVS target not found");
  }

  return {
    target: mapTarget(updated),
    scan: mapScanBatch(scan)
  };
}

export async function cancelWvsScanSchedule(scanBatchId: string) {
  const context = await getWvsActorContext();
  const repository = new WvsRepository();
  const scan = await repository.findScanBatchById(
    context.principal.tenantId,
    scanBatchId
  );

  if (!scan) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  const updated = await repository.cancelTargetSchedule(
    context.principal.tenantId,
    scan.targetId
  );

  if (!updated) {
    throw new ApiError(
      409,
      "WVS_SCHEDULE_NOT_ACTIVE",
      "WVS scan schedule is not currently active"
    );
  }

  return {
    target: mapTarget(updated),
    scan: mapScanBatch(scan)
  };
}

export async function updateWvsRetryConfig(
  scanBatchId: string,
  input: WvsRetryConfigInput
) {
  const context = await getWvsActorContext();
  const repository = new WvsRepository();
  const existing = await repository.findScanBatchById(
    context.principal.tenantId,
    scanBatchId
  );

  if (!existing) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  const updated = await repository.updateRetryConfig({
    tenantId: context.principal.tenantId,
    scanBatchId,
    autoRetry: input.autoRetry,
    maxRetries: input.autoRetry ? input.maxRetries : 0,
    retryIntervalHours: input.autoRetry ? input.retryIntervalHours : 0
  });

  if (!updated) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "WVS scan not found");
  }

  return {
    scanBatchId: updated.id,
    autoRetry: updated.autoRetry,
    maxRetries: updated.maxRetries,
    currentRetryCount: updated.currentRetryCount,
    retryIntervalHours: updated.retryIntervalHours,
    updatedAt: updated.updatedAt
  };
}

export async function getWvsZapReport(scanId: string) {
  const context = await getWvsActorContext();
  const run = await new WvsRepository().findRunArtifact({
    tenantId: context.principal.tenantId,
    scanId,
    engine: "ZAP"
  });

  if (!run) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "ZAP scan not found");
  }

  return {
    report: {
      scanRunId: run.id,
      scanBatchId: run.batchId,
      targetUrl: run.targetUrl,
      status: run.status === "pending" ? "queued" : run.status,
      progress: run.progress,
      outputFilePath: run.outputFilePath,
      resultAvailable: Boolean(run.resultPayload),
      vulnerabilities: extractZapVulnerabilities(run),
      completedAt: run.completedAt,
      updatedAt: run.updatedAt
    }
  };
}

export async function getWvsNmapReport(scanId: string) {
  const context = await getWvsActorContext();
  const run = await new WvsRepository().findRunArtifact({
    tenantId: context.principal.tenantId,
    scanId,
    engine: "NMAP"
  });

  if (!run) {
    throw new ApiError(404, "WVS_SCAN_NOT_FOUND", "Nmap scan not found");
  }

  return {
    report: {
      scanRunId: run.id,
      scanBatchId: run.batchId,
      targetUrl: run.targetUrl,
      status: run.status === "pending" ? "queued" : run.status,
      progress: run.progress,
      outputFilePath: run.outputFilePath,
      resultAvailable: Boolean(run.resultPayload),
      completedAt: run.completedAt,
      updatedAt: run.updatedAt
    }
  };
}

export async function listWvsRiskSummary() {
  const context = await getWvsActorContext();
  const runs = await new WvsRepository().listRunArtifactsByEngine(
    context.principal.tenantId,
    "ZAP"
  );
  const vulnerabilities = runs.flatMap(extractZapVulnerabilities);

  return {
    summary: summarizeRisks(vulnerabilities),
    total: vulnerabilities.length
  };
}

export async function listWvsVulnerabilities() {
  const context = await getWvsActorContext();
  const runs = await new WvsRepository().listRunArtifactsByEngine(
    context.principal.tenantId,
    "ZAP"
  );

  return {
    vulnerabilities: runs.flatMap(extractZapVulnerabilities)
  };
}

export async function listWvsAlerts() {
  const { vulnerabilities } = await listWvsVulnerabilities();
  const highOrMedium = vulnerabilities.filter(
    (item) => item.risk === "High" || item.risk === "Medium"
  );

  return {
    alerts: highOrMedium,
    total: highOrMedium.length,
    summary: summarizeRisks(vulnerabilities)
  };
}

export { errorResponse, successResponse };
