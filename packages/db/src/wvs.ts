import {
  BaseRepository,
  type JsonValue,
  type RepositoryContext
} from "./index";

export type WvsScanEngine = "ZAP" | "NMAP";
export type WvsScanStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface WvsTargetRecord {
  id: string;
  tenantId: string;
  createdBy: string | null;
  targetUrl: string;
  normalizedTarget: string;
  verificationStatus: string;
  verificationExpiresAt: string | null;
  scheduleEnabled: boolean;
  scheduleDate: string | null;
  scheduleTime: string | null;
  scheduleType: string | null;
  limits: number | null;
  runCount: number;
  lastRunAt: string | null;
  scheduleStatus: string | null;
  failedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WvsScanRunRecord {
  id: string;
  tenantId: string;
  batchId: string;
  targetId: string;
  engine: WvsScanEngine;
  status: WvsScanStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  outputFilePath: string | null;
  scanByEmail: string | null;
  scanByName: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WvsScanBatchRecord {
  id: string;
  tenantId: string;
  targetId: string;
  requestedBy: string | null;
  status: WvsScanStatus;
  selectedEngines: WvsScanEngine[];
  autoRetry: boolean;
  maxRetries: number;
  currentRetryCount: number;
  retryIntervalHours: number;
  parentBatchId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WvsScanBatchWithRunsRecord extends WvsScanBatchRecord {
  targetUrl: string;
  normalizedTarget: string;
  runs: WvsScanRunRecord[];
}

export interface WvsScanRunArtifactRecord extends WvsScanRunRecord {
  targetUrl: string;
  normalizedTarget: string;
  resultPayload: JsonValue | null;
}

export class WvsRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listTargets(tenantId: string) {
    return this.db<WvsTargetRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.wvs_targets
      where tenant_id = ${tenantId}
      order by created_at desc
    `;
  }

  async findTargetById(tenantId: string, targetId: string) {
    const [row] = await this.db<WvsTargetRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.wvs_targets
      where tenant_id = ${tenantId}
        and id = ${targetId}
      limit 1
    `;

    return row ?? null;
  }

  async createTarget(input: {
    tenantId: string;
    createdBy: string;
    targetUrl: string;
    normalizedTarget: string;
  }) {
    const [row] = await this.db<WvsTargetRecord[]>`
      insert into public.wvs_targets (
        tenant_id,
        created_by,
        target_url,
        normalized_target
      ) values (
        ${input.tenantId},
        ${input.createdBy},
        ${input.targetUrl},
        ${input.normalizedTarget}
      )
      returning
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async setVerificationToken(
    tenantId: string,
    targetId: string,
    tokenHash: string,
    expiresAt: Date
  ) {
    const [row] = await this.db<WvsTargetRecord[]>`
      update public.wvs_targets
      set
        verification_status = 'pending',
        verification_token_hash = ${tokenHash},
        verification_expires_at = ${expiresAt}
      where tenant_id = ${tenantId}
        and id = ${targetId}
      returning
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async verifyTarget(tenantId: string, targetId: string, tokenHash: string) {
    const [row] = await this.db<WvsTargetRecord[]>`
      update public.wvs_targets
      set
        verification_status = 'verified',
        verification_token_hash = null,
        verification_expires_at = null
      where tenant_id = ${tenantId}
        and id = ${targetId}
        and verification_token_hash = ${tokenHash}
        and verification_expires_at > timezone('utc', now())
      returning
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async deleteTarget(tenantId: string, targetId: string) {
    const result = await this.db`
      delete from public.wvs_targets
      where tenant_id = ${tenantId}
        and id = ${targetId}
    `;

    return result.count > 0;
  }

  async findActiveBatchForTarget(tenantId: string, targetId: string) {
    const [row] = await this.db<{ id: string; status: WvsScanStatus }[]>`
      select id, status
      from public.wvs_scan_batches
      where tenant_id = ${tenantId}
        and target_id = ${targetId}
        and status in ('pending', 'running')
      order by created_at desc
      limit 1
    `;

    return row ?? null;
  }

  async consumeScanCredit(tenantId: string) {
    const [row] = await this.db<{ totalScan: number }[]>`
      update public.users
      set total_scan = total_scan - 1
      where id = ${tenantId}
        and total_scan > 0
      returning total_scan as "totalScan"
    `;

    return row ?? null;
  }

  async createScanBatchWithRuns(input: {
    tenantId: string;
    targetId: string;
    requestedBy: string;
    engines: WvsScanEngine[];
    scanByEmail: string;
    scanByName: string;
  }) {
    const [batch] = await this.db<WvsScanBatchRecord[]>`
      insert into public.wvs_scan_batches (
        tenant_id,
        target_id,
        requested_by,
        selected_engines
      ) values (
        ${input.tenantId},
        ${input.targetId},
        ${input.requestedBy},
        ${input.engines}::text[]
      )
      returning
        id,
        tenant_id as "tenantId",
        target_id as "targetId",
        requested_by as "requestedBy",
        status,
        selected_engines as "selectedEngines",
        auto_retry as "autoRetry",
        max_retries as "maxRetries",
        current_retry_count as "currentRetryCount",
        retry_interval_hours as "retryIntervalHours",
        parent_batch_id as "parentBatchId",
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const runs: WvsScanRunRecord[] = [];

    for (const engine of input.engines) {
      const [run] = await this.db<WvsScanRunRecord[]>`
        insert into public.wvs_scan_runs (
          tenant_id,
          batch_id,
          target_id,
          engine,
          scan_by_email,
          scan_by_name
        ) values (
          ${input.tenantId},
          ${batch.id},
          ${input.targetId},
          ${engine},
          ${input.scanByEmail},
          ${input.scanByName}
        )
        returning
          id,
          tenant_id as "tenantId",
          batch_id as "batchId",
          target_id as "targetId",
          engine,
          status,
          progress,
          started_at as "startedAt",
          completed_at as "completedAt",
          output_file_path as "outputFilePath",
          scan_by_email as "scanByEmail",
          scan_by_name as "scanByName",
          error_message as "errorMessage",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      runs.push(run);
    }

    await this.db`
      update public.wvs_targets
      set
        run_count = run_count + 1,
        last_run_at = timezone('utc', now())
      where tenant_id = ${input.tenantId}
        and id = ${input.targetId}
    `;

    return { batch, runs };
  }

  async listScanBatches(tenantId: string) {
    return this.db<WvsScanBatchWithRunsRecord[]>`
      select
        batches.id,
        batches.tenant_id as "tenantId",
        batches.target_id as "targetId",
        batches.requested_by as "requestedBy",
        batches.status,
        batches.selected_engines as "selectedEngines",
        batches.auto_retry as "autoRetry",
        batches.max_retries as "maxRetries",
        batches.current_retry_count as "currentRetryCount",
        batches.retry_interval_hours as "retryIntervalHours",
        batches.parent_batch_id as "parentBatchId",
        batches.started_at as "startedAt",
        batches.finished_at as "finishedAt",
        batches.created_at as "createdAt",
        batches.updated_at as "updatedAt",
        targets.target_url as "targetUrl",
        targets.normalized_target as "normalizedTarget",
        coalesce(
          json_agg(
            json_build_object(
              'id', runs.id,
              'tenantId', runs.tenant_id,
              'batchId', runs.batch_id,
              'targetId', runs.target_id,
              'engine', runs.engine,
              'status', runs.status,
              'progress', runs.progress,
              'startedAt', runs.started_at,
              'completedAt', runs.completed_at,
              'outputFilePath', runs.output_file_path,
              'scanByEmail', runs.scan_by_email,
              'scanByName', runs.scan_by_name,
              'errorMessage', runs.error_message,
              'createdAt', runs.created_at,
              'updatedAt', runs.updated_at
            )
            order by runs.created_at asc
          ) filter (where runs.id is not null),
          '[]'::json
        ) as runs
      from public.wvs_scan_batches batches
      inner join public.wvs_targets targets
        on targets.id = batches.target_id
      left join public.wvs_scan_runs runs
        on runs.batch_id = batches.id
      where batches.tenant_id = ${tenantId}
      group by batches.id, targets.target_url, targets.normalized_target
      order by batches.created_at desc
      limit 100
    `;
  }

  async findScanBatchById(tenantId: string, scanBatchId: string) {
    const [row] = await this.db<WvsScanBatchWithRunsRecord[]>`
      select
        batches.id,
        batches.tenant_id as "tenantId",
        batches.target_id as "targetId",
        batches.requested_by as "requestedBy",
        batches.status,
        batches.selected_engines as "selectedEngines",
        batches.auto_retry as "autoRetry",
        batches.max_retries as "maxRetries",
        batches.current_retry_count as "currentRetryCount",
        batches.retry_interval_hours as "retryIntervalHours",
        batches.parent_batch_id as "parentBatchId",
        batches.started_at as "startedAt",
        batches.finished_at as "finishedAt",
        batches.created_at as "createdAt",
        batches.updated_at as "updatedAt",
        targets.target_url as "targetUrl",
        targets.normalized_target as "normalizedTarget",
        coalesce(
          json_agg(
            json_build_object(
              'id', runs.id,
              'tenantId', runs.tenant_id,
              'batchId', runs.batch_id,
              'targetId', runs.target_id,
              'engine', runs.engine,
              'status', runs.status,
              'progress', runs.progress,
              'startedAt', runs.started_at,
              'completedAt', runs.completed_at,
              'outputFilePath', runs.output_file_path,
              'scanByEmail', runs.scan_by_email,
              'scanByName', runs.scan_by_name,
              'errorMessage', runs.error_message,
              'createdAt', runs.created_at,
              'updatedAt', runs.updated_at
            )
            order by runs.created_at asc
          ) filter (where runs.id is not null),
          '[]'::json
        ) as runs
      from public.wvs_scan_batches batches
      inner join public.wvs_targets targets
        on targets.id = batches.target_id
      left join public.wvs_scan_runs runs
        on runs.batch_id = batches.id
      where batches.tenant_id = ${tenantId}
        and batches.id = ${scanBatchId}
      group by batches.id, targets.target_url, targets.normalized_target
      limit 1
    `;

    return row ?? null;
  }

  async cancelScanBatch(tenantId: string, scanBatchId: string) {
    const [batch] = await this.db<WvsScanBatchRecord[]>`
      update public.wvs_scan_batches
      set
        status = 'cancelled',
        finished_at = coalesce(finished_at, timezone('utc', now()))
      where tenant_id = ${tenantId}
        and id = ${scanBatchId}
        and status in ('pending', 'running')
      returning
        id,
        tenant_id as "tenantId",
        target_id as "targetId",
        requested_by as "requestedBy",
        status,
        selected_engines as "selectedEngines",
        auto_retry as "autoRetry",
        max_retries as "maxRetries",
        current_retry_count as "currentRetryCount",
        retry_interval_hours as "retryIntervalHours",
        parent_batch_id as "parentBatchId",
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (!batch) {
      return null;
    }

    await this.db`
      update public.wvs_scan_runs
      set
        status = 'cancelled',
        completed_at = coalesce(completed_at, timezone('utc', now())),
        error_message = coalesce(error_message, 'Cancelled by user')
      where tenant_id = ${tenantId}
        and batch_id = ${scanBatchId}
        and status in ('pending', 'running')
    `;

    return batch;
  }

  async scheduleTarget(input: {
    tenantId: string;
    targetId: string;
    scheduleDate: Date;
    scheduleTime: string;
    scheduleType: string;
    limits: number;
  }) {
    const [row] = await this.db<WvsTargetRecord[]>`
      update public.wvs_targets
      set
        schedule_enabled = true,
        schedule_date = ${input.scheduleDate},
        schedule_time = ${input.scheduleTime},
        schedule_type = ${input.scheduleType},
        limits = ${input.limits},
        schedule_status = 'scheduled',
        failed_reason = null
      where tenant_id = ${input.tenantId}
        and id = ${input.targetId}
      returning
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async cancelTargetSchedule(tenantId: string, targetId: string) {
    const [row] = await this.db<WvsTargetRecord[]>`
      update public.wvs_targets
      set
        schedule_enabled = false,
        schedule_date = null,
        schedule_time = null,
        schedule_type = null,
        limits = null,
        schedule_status = 'cancelled',
        schedule_token_hash = null,
        failed_reason = null
      where tenant_id = ${tenantId}
        and id = ${targetId}
        and schedule_enabled = true
      returning
        id,
        tenant_id as "tenantId",
        created_by as "createdBy",
        target_url as "targetUrl",
        normalized_target as "normalizedTarget",
        verification_status as "verificationStatus",
        verification_expires_at as "verificationExpiresAt",
        schedule_enabled as "scheduleEnabled",
        schedule_date as "scheduleDate",
        schedule_time as "scheduleTime",
        schedule_type as "scheduleType",
        limits,
        run_count as "runCount",
        last_run_at as "lastRunAt",
        schedule_status as "scheduleStatus",
        failed_reason as "failedReason",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async updateRetryConfig(input: {
    tenantId: string;
    scanBatchId: string;
    autoRetry: boolean;
    maxRetries: number;
    retryIntervalHours: number;
  }) {
    const [row] = await this.db<WvsScanBatchRecord[]>`
      update public.wvs_scan_batches
      set
        auto_retry = ${input.autoRetry},
        max_retries = ${input.maxRetries},
        current_retry_count = 0,
        retry_interval_hours = ${input.retryIntervalHours}
      where tenant_id = ${input.tenantId}
        and id = ${input.scanBatchId}
      returning
        id,
        tenant_id as "tenantId",
        target_id as "targetId",
        requested_by as "requestedBy",
        status,
        selected_engines as "selectedEngines",
        auto_retry as "autoRetry",
        max_retries as "maxRetries",
        current_retry_count as "currentRetryCount",
        retry_interval_hours as "retryIntervalHours",
        parent_batch_id as "parentBatchId",
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async findRunArtifact(input: {
    tenantId: string;
    scanId: string;
    engine: WvsScanEngine;
  }) {
    const [row] = await this.db<WvsScanRunArtifactRecord[]>`
      select
        runs.id,
        runs.tenant_id as "tenantId",
        runs.batch_id as "batchId",
        runs.target_id as "targetId",
        runs.engine,
        runs.status,
        runs.progress,
        runs.started_at as "startedAt",
        runs.completed_at as "completedAt",
        runs.result_payload_encrypted as "resultPayload",
        runs.output_file_path as "outputFilePath",
        runs.scan_by_email as "scanByEmail",
        runs.scan_by_name as "scanByName",
        runs.error_message as "errorMessage",
        runs.created_at as "createdAt",
        runs.updated_at as "updatedAt",
        targets.target_url as "targetUrl",
        targets.normalized_target as "normalizedTarget"
      from public.wvs_scan_runs runs
      inner join public.wvs_targets targets
        on targets.id = runs.target_id
      where runs.tenant_id = ${input.tenantId}
        and runs.engine = ${input.engine}
        and (
          runs.id = ${input.scanId}
          or runs.batch_id = ${input.scanId}
        )
      order by runs.created_at desc
      limit 1
    `;

    return row ?? null;
  }

  async listRunArtifactsByEngine(tenantId: string, engine: WvsScanEngine) {
    return this.db<WvsScanRunArtifactRecord[]>`
      select
        runs.id,
        runs.tenant_id as "tenantId",
        runs.batch_id as "batchId",
        runs.target_id as "targetId",
        runs.engine,
        runs.status,
        runs.progress,
        runs.started_at as "startedAt",
        runs.completed_at as "completedAt",
        runs.result_payload_encrypted as "resultPayload",
        runs.output_file_path as "outputFilePath",
        runs.scan_by_email as "scanByEmail",
        runs.scan_by_name as "scanByName",
        runs.error_message as "errorMessage",
        runs.created_at as "createdAt",
        runs.updated_at as "updatedAt",
        targets.target_url as "targetUrl",
        targets.normalized_target as "normalizedTarget"
      from public.wvs_scan_runs runs
      inner join public.wvs_targets targets
        on targets.id = runs.target_id
      where runs.tenant_id = ${tenantId}
        and runs.engine = ${engine}
      order by runs.created_at desc
      limit 200
    `;
  }
}
