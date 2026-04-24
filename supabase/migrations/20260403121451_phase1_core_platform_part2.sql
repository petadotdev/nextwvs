create table public.wvs_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  created_by uuid null references public.users(id),
  target_url text not null,
  normalized_target text not null,
  verification_status text not null default 'pending',
  verification_token_hash text null,
  verification_expires_at timestamptz null,
  schedule_enabled boolean not null default false,
  schedule_date timestamptz null,
  schedule_time text null,
  schedule_type text null,
  limits integer null,
  run_count integer not null default 0,
  last_run_at timestamptz null,
  schedule_status text null,
  schedule_token_hash text null,
  failed_reason text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (run_count >= 0),
  check (limits is null or limits >= 0)
);

create unique index wvs_targets_tenant_id_normalized_target_key
  on public.wvs_targets (tenant_id, normalized_target);
create index wvs_targets_tenant_id_schedule_enabled_schedule_status_idx
  on public.wvs_targets (tenant_id, schedule_enabled, schedule_status);

create table public.wvs_scan_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  target_id uuid not null references public.wvs_targets(id) on delete cascade,
  requested_by uuid null references public.users(id),
  status public.wvs_scan_status_enum not null default 'pending',
  selected_engines text[] not null default '{}'::text[],
  auto_retry boolean not null default false,
  max_retries integer not null default 0,
  current_retry_count integer not null default 0,
  retry_interval_hours integer not null default 0,
  parent_batch_id uuid null references public.wvs_scan_batches(id),
  started_at timestamptz null,
  finished_at timestamptz null,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (max_retries >= 0),
  check (current_retry_count >= 0),
  check (retry_interval_hours >= 0),
  check (current_retry_count <= max_retries)
);

create index wvs_scan_batches_tenant_id_target_id_created_at_desc_idx
  on public.wvs_scan_batches (tenant_id, target_id, created_at desc);
create index wvs_scan_batches_status_created_at_idx
  on public.wvs_scan_batches (status, created_at);

create table public.wvs_scan_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  batch_id uuid not null references public.wvs_scan_batches(id) on delete cascade,
  target_id uuid not null references public.wvs_targets(id) on delete cascade,
  engine text not null,
  status public.wvs_scan_status_enum not null default 'pending',
  progress integer not null default 0,
  started_at timestamptz null,
  completed_at timestamptz null,
  result_payload_encrypted jsonb null,
  output_file_path text null,
  scan_by_email text null,
  scan_by_name text null,
  error_message text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (progress >= 0 and progress <= 100)
);

create index wvs_scan_runs_batch_id_engine_idx on public.wvs_scan_runs (batch_id, engine);
create index wvs_scan_runs_tenant_id_target_id_created_at_desc_idx
  on public.wvs_scan_runs (tenant_id, target_id, created_at desc);

create table public.dms_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  owner_user_id uuid not null references public.users(id),
  target_url text not null,
  normalized_target text not null,
  monitoring_status public.monitoring_status_enum not null default 'stop',
  started_at timestamptz null,
  last_job_id uuid null,
  last_scheduled_at timestamptz null,
  last_error text null,
  last_failed_at timestamptz null,
  added_by_email text null,
  added_by_name text null,
  schedule_enabled boolean not null default false,
  schedule_days integer not null default 7,
  next_scheduled_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (schedule_days > 0)
);

create unique index dms_targets_tenant_id_normalized_target_key
  on public.dms_targets (tenant_id, normalized_target);

create table public.dms_target_keywords (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.dms_targets(id) on delete cascade,
  keyword text not null
);

create unique index dms_target_keywords_target_id_keyword_key
  on public.dms_target_keywords (target_id, keyword);

create table public.dms_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  target_id uuid not null references public.dms_targets(id) on delete cascade,
  base_domain text null,
  domain text null,
  mode text not null default 'full',
  status public.job_status_enum not null default 'queued',
  phase text not null default 'initializing',
  total integer not null default 0,
  done integer not null default 0,
  progress integer not null default 0,
  started_at timestamptz null,
  ended_at timestamptz null,
  finished_at timestamptz null,
  error text null,
  result jsonb null,
  result_summary jsonb null,
  created_by uuid null references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (total >= 0),
  check (done >= 0),
  check (done <= total),
  check (progress >= 0 and progress <= 100)
);

create index dms_jobs_tenant_id_target_id_created_at_desc_idx
  on public.dms_jobs (tenant_id, target_id, created_at desc);
create index dms_jobs_status_created_at_idx
  on public.dms_jobs (status, created_at);
create unique index dms_jobs_single_active_target_idx
  on public.dms_jobs (target_id)
  where status in ('queued', 'running');

create table public.dms_job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dms_jobs(id) on delete cascade,
  note_time timestamptz not null,
  message text not null
);

create table public.dms_job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dms_jobs(id) on delete cascade,
  log_time timestamptz not null,
  message text not null
);

create table public.dms_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  target_id uuid not null references public.dms_targets(id) on delete cascade,
  base_domain text not null,
  input_tld text null,
  domain text not null,
  fuzzer text null,
  dns_a text[] not null default '{}'::text[],
  dns_aaaa text[] not null default '{}'::text[],
  dns_mx text[] not null default '{}'::text[],
  dns_ns text[] not null default '{}'::text[],
  banner_http text null,
  banner_smtp text null,
  country text null,
  tld text null,
  looks_registered boolean null,
  wx_availability text null,
  wx_checked_at timestamptz null,
  wx_created_date timestamptz null,
  wx_registrar text null,
  newly_registered_at timestamptz null,
  web_ok boolean null,
  web_checked_at timestamptz null,
  web_final_url text null,
  web_status integer null,
  web_title text null,
  web_meta_desc text null,
  web_h1 text[] not null default '{}'::text[],
  web_links integer null,
  web_has_login boolean null,
  web_screenshot text null,
  web_html_hash text null,
  checked_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (web_status is null or web_status >= 0),
  check (web_links is null or web_links >= 0)
);

create unique index dms_variants_target_id_base_domain_domain_key
  on public.dms_variants (target_id, base_domain, domain);

create table public.dms_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  target_id uuid not null references public.dms_targets(id) on delete cascade,
  base_domain text not null,
  domain text not null,
  ip text null,
  asn text null,
  screenshot_path text null,
  html_hash text null,
  crawl_date timestamptz null,
  status text not null default 'normal',
  ss_ref_domain text null,
  ss_phash_ref text null,
  ss_phash_cand text null,
  ss_distance numeric(8,2) null,
  ss_ssim numeric(8,4) null,
  ss_score100 numeric(8,2) null,
  ss_verdict text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index dms_evidence_target_id_base_domain_domain_key
  on public.dms_evidence (target_id, base_domain, domain);

create table public.dms_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  target_id uuid not null references public.dms_targets(id) on delete cascade,
  base_domain text null,
  domain text null,
  type text not null default 'keyword',
  keyword text null,
  html_hash text null,
  matched_at timestamptz null,
  url text null,
  title text null,
  meta_description text null,
  excerpt text null,
  screenshot text null,
  image_ref_id uuid null,
  image_distance numeric(8,2) null,
  image_method text null,
  image_score100 numeric(8,2) null,
  image_asset_url text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index dms_alerts_target_id_base_domain_domain_type_keyword_html_hash_idx
  on public.dms_alerts (target_id, base_domain, domain, type, keyword, html_hash);

create table public.dns_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  owner_user_id uuid not null references public.users(id),
  target_url text not null,
  normalized_target text not null,
  monitoring_status public.monitoring_status_enum not null default 'stop',
  started_at timestamptz null,
  last_job_id uuid null,
  last_scheduled_at timestamptz null,
  schedule_enabled boolean not null default true,
  schedule_days integer not null default 7,
  next_scheduled_at timestamptz null,
  last_error text null,
  last_failed_at timestamptz null,
  added_by_email text null,
  added_by_name text null,
  last_scan_at timestamptz null,
  health_status text not null default 'GOOD',
  last_score integer not null default 0,
  last_issues text[] not null default '{}'::text[],
  registrar text null,
  expires_at timestamptz null,
  ssl_valid boolean null,
  ssl_days_remaining integer null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (schedule_days > 0),
  check (last_score >= 0),
  check (ssl_days_remaining is null or ssl_days_remaining >= 0)
);

create unique index dns_domains_tenant_id_normalized_target_key
  on public.dns_domains (tenant_id, normalized_target);

create table public.dns_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  domain_id uuid not null references public.dns_domains(id) on delete cascade,
  created_by uuid null references public.users(id),
  domain_name text null,
  status public.job_status_enum not null default 'queued',
  phase text not null default 'initializing',
  progress integer not null default 0,
  started_at timestamptz null,
  finished_at timestamptz null,
  result_path text null,
  error text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (progress >= 0 and progress <= 100)
);

create index dns_jobs_tenant_id_domain_id_created_at_desc_idx
  on public.dns_jobs (tenant_id, domain_id, created_at desc);
create index dns_jobs_status_created_at_idx
  on public.dns_jobs (status, created_at);
create unique index dns_jobs_single_active_domain_idx
  on public.dns_jobs (domain_id)
  where status in ('queued', 'running');

create table public.dns_job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dns_jobs(id) on delete cascade,
  log_time timestamptz not null,
  message text not null
);

create table public.dns_scans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  domain_id uuid not null references public.dns_domains(id) on delete cascade,
  domain_name text not null,
  checked_at timestamptz not null default timezone('utc', now()),
  verdict text null,
  score integer null,
  summary text null,
  key_issues text[] not null default '{}'::text[],
  raw_report jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (score is null or score >= 0)
);

create index dns_scans_tenant_id_domain_id_checked_at_desc_idx
  on public.dns_scans (tenant_id, domain_id, checked_at desc);

create table public.dns_diff_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  domain_id uuid not null references public.dns_domains(id) on delete cascade,
  domain_name text not null,
  change_type text not null default 'DNS_DIFF',
  details jsonb not null default '[]'::jsonb,
  summary text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index dns_diff_logs_domain_id_created_at_desc_idx
  on public.dns_diff_logs (domain_id, created_at desc);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  user_id uuid not null references public.users(id),
  department_id uuid not null references public.admin_departments(id),
  subject text not null,
  description text not null,
  status public.ticket_status_enum not null default 'open',
  is_accepted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index tickets_tenant_id_created_at_desc_idx on public.tickets (tenant_id, created_at desc);
create index tickets_department_id_status_idx on public.tickets (department_id, status);

create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  file_id text not null,
  url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ticket_acceptances (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  employee_id uuid not null references public.admin_employees(id),
  accepted_at timestamptz not null
);

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_name text not null,
  author_email text null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ticket_comment_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_comment_id uuid not null references public.ticket_comments(id) on delete cascade,
  file_id text not null,
  url text not null
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  user_id uuid not null references public.users(id),
  rating integer not null,
  message text not null default '',
  feature_request text not null default '',
  repeat_use text not null default 'Yes',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (rating >= 0)
);

create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  first_seen_at timestamptz null,
  last_seen_at timestamptz null,
  lead_source jsonb not null default '{}'::jsonb,
  landing_page text null,
  last_visited_page text null,
  ip inet null,
  user_agent text null,
  has_signed_up boolean not null default false,
  signup_at timestamptz null,
  user_id uuid null references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index visitors_visitor_id_idx on public.visitors (visitor_id);
create index visitors_user_id_idx on public.visitors (user_id);

create table public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  user_id uuid not null references public.users(id),
  action text null,
  method text null,
  route text null,
  ip inet null,
  user_agent text null,
  timestamp_at timestamptz not null,
  date_text text null,
  metadata jsonb not null default '{}'::jsonb
);

create table public.employee_activity_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.admin_employees(id),
  action text null,
  method text null,
  route text null,
  ip inet null,
  user_agent text null,
  timestamp_at timestamptz not null,
  date_text text null,
  metadata jsonb not null default '{}'::jsonb
);

create table public.processed_events (
  id text primary key,
  event text null,
  order_id text null,
  payment_id text null,
  signature text null,
  raw_body bytea null,
  headers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.email_statuses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  type text not null,
  message_id text not null,
  status text not null default 'SENT',
  created_at timestamptz not null default timezone('utc', now()),
  details jsonb not null default '{}'::jsonb
);

create unique index email_statuses_message_id_key on public.email_statuses (message_id);

create table public.email_validations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  response jsonb not null,
  status text not null,
  route text null,
  reason text null,
  meta jsonb not null default '{}'::jsonb,
  validated_at timestamptz not null default timezone('utc', now())
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references public.users(id),
  owner_actor_type text null,
  owner_actor_id uuid null,
  bucket text not null,
  path text not null,
  category text not null,
  original_filename text not null,
  content_type text null,
  byte_size bigint null,
  checksum_sha256 text null,
  visibility public.file_visibility_enum not null default 'private',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz null,
  check (owner_actor_type is null or owner_actor_type in ('customer_user', 'admin_employee', 'system')),
  check (byte_size is null or byte_size >= 0)
);

create unique index files_bucket_path_key on public.files (bucket, path);
create index files_tenant_id_category_created_at_desc_idx
  on public.files (tenant_id, category, created_at desc);
create index files_owner_actor_type_owner_actor_id_idx
  on public.files (owner_actor_type, owner_actor_id);
