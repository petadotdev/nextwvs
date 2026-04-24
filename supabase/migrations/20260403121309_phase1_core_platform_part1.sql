create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_email(value text)
returns text
language sql
immutable
as $$
  select lower(trim(value));
$$;

create or replace function public.set_runtime_setting(name text, value text)
returns void
language plpgsql
as $$
begin
  perform set_config(name, value, false);
end;
$$;

create or replace function public.prepare_user_row()
returns trigger
language plpgsql
as $$
begin
  new.email_normalized = public.normalize_email(new.email);

  if new.is_primary_account = true and new.tenant_id is null then
    if new.id is null then
      new.id = gen_random_uuid();
    end if;

    new.tenant_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function public.prepare_admin_employee_row()
returns trigger
language plpgsql
as $$
begin
  new.email_normalized = public.normalize_email(new.email);
  return new;
end;
$$;

create type public.user_status_enum as enum ('active', 'inactive');
create type public.plan_status_enum as enum ('active', 'expired');
create type public.admin_status_enum as enum ('active', 'inactive');
create type public.purchase_status_enum as enum ('pending', 'active', 'expired', 'failed');
create type public.payment_status_enum as enum ('pending', 'paid', 'failed');
create type public.wvs_scan_status_enum as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type public.job_status_enum as enum ('queued', 'running', 'completed', 'failed', 'stopped');
create type public.monitoring_status_enum as enum ('start', 'stop');
create type public.ticket_status_enum as enum ('open', 'accepted', 'in_progress', 'resolved', 'closed');
create type public.notification_status_enum as enum ('queued', 'sent', 'failed');
create type public.verification_purpose_enum as enum ('email_verification', 'password_reset', 'admin_login');
create type public.actor_type_enum as enum ('customer_user', 'admin_employee');
create type public.file_visibility_enum as enum ('private', 'public');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  parent_user_id uuid null references public.users(id),
  supabase_auth_user_id uuid unique null,
  is_primary_account boolean not null default false,
  client_code text null,
  google_id text null,
  name text not null,
  email text not null,
  email_normalized text not null,
  password_hash text null,
  employee_code text null,
  contact_number text null,
  country_code text null,
  gst_number text null,
  country text null,
  state text null,
  company_name text null,
  address text null,
  tax_id text null,
  is_email_verified boolean not null default false,
  email_verified_at timestamptz null,
  is_phone_verified boolean not null default false,
  phone_verified_at timestamptz null,
  two_factor_enabled boolean not null default false,
  two_factor_secret_encrypted text null,
  failed_login_attempts integer not null default 0,
  lock_until timestamptz null,
  is_blacklisted boolean not null default false,
  status public.user_status_enum not null default 'inactive',
  last_login_at timestamptz null,
  last_login_ip inet null,
  global_unsub boolean not null default false,
  team_manage_access boolean not null default false,
  total_scan integer not null default 0,
  dms_monitoring_slots integer not null default 0,
  dms_plan_start_at timestamptz null,
  dms_plan_next_billing_at timestamptz null,
  dms_plan_status public.plan_status_enum not null default 'expired',
  dnsms_monitoring_slots integer not null default 0,
  dnsms_plan_start_at timestamptz null,
  dnsms_plan_next_billing_at timestamptz null,
  dnsms_plan_status public.plan_status_enum not null default 'expired',
  mail_prefs jsonb not null default '{}'::jsonb,
  profile_json jsonb not null default '{}'::jsonb,
  billing_profile_json jsonb not null default '{}'::jsonb,
  signup_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (failed_login_attempts >= 0),
  check (total_scan >= 0),
  check (dms_monitoring_slots >= 0),
  check (dnsms_monitoring_slots >= 0),
  check (
    (is_primary_account = true and tenant_id = id and parent_user_id is null)
    or (is_primary_account = false and parent_user_id is not null)
  )
);

create unique index users_email_normalized_key on public.users (email_normalized);
create unique index users_google_id_key on public.users (google_id) where google_id is not null;
create unique index users_client_code_key on public.users (client_code) where client_code is not null;
create index users_tenant_id_status_idx on public.users (tenant_id, status);
create index users_parent_user_id_idx on public.users (parent_user_id);

create table public.user_departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  name text not null,
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index user_departments_tenant_id_name_key on public.user_departments (tenant_id, name);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  department_id uuid null references public.user_departments(id),
  name text not null,
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index user_roles_tenant_id_name_key on public.user_roles (tenant_id, name);
create index user_roles_tenant_id_department_id_idx on public.user_roles (tenant_id, department_id);

create table public.user_role_permissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  role_id uuid not null references public.user_roles(id) on delete cascade,
  domain text not null,
  action text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index user_role_permissions_role_id_domain_action_key
  on public.user_role_permissions (role_id, domain, action);

create table public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  user_id uuid not null references public.users(id) on delete cascade,
  department_id uuid null references public.user_departments(id),
  role_id uuid null references public.user_roles(id),
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index user_memberships_tenant_id_user_id_key on public.user_memberships (tenant_id, user_id);
create index user_memberships_tenant_id_role_id_idx on public.user_memberships (tenant_id, role_id);

create table public.admin_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.admin_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index admin_departments_name_key on public.admin_departments (name);

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid null references public.admin_departments(id),
  name text not null,
  status public.admin_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index admin_roles_department_id_name_key
  on public.admin_roles (department_id, name);

create table public.admin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  domain text not null,
  action text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index admin_role_permissions_role_id_domain_action_key
  on public.admin_role_permissions (role_id, domain, action);

create table public.admin_employees (
  id uuid primary key default gen_random_uuid(),
  department_id uuid null references public.admin_departments(id),
  role_id uuid null references public.admin_roles(id),
  employee_code text null,
  name text not null,
  email text not null,
  email_normalized text not null,
  password_hash text not null,
  contact_number text null,
  status public.admin_status_enum not null default 'active',
  is_email_verified boolean not null default false,
  failed_login_attempts integer not null default 0,
  lock_until timestamptz null,
  last_login_at timestamptz null,
  last_login_ip inet null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (failed_login_attempts >= 0)
);

create unique index admin_employees_email_normalized_key on public.admin_employees (email_normalized);

create table public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.users(id),
  session_token_hash text not null,
  user_agent text null,
  ip_address inet null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_seen_at timestamptz null
);

create unique index customer_sessions_session_token_hash_key
  on public.customer_sessions (session_token_hash);
create index customer_sessions_user_id_revoked_at_expires_at_idx
  on public.customer_sessions (user_id, revoked_at, expires_at);

create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.admin_employees(id) on delete cascade,
  session_token_hash text not null,
  user_agent text null,
  ip_address inet null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_seen_at timestamptz null
);

create unique index admin_sessions_session_token_hash_key
  on public.admin_sessions (session_token_hash);

create table public.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  actor_type public.actor_type_enum not null,
  actor_id uuid not null,
  tenant_id uuid null,
  purpose public.verification_purpose_enum not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index verification_tokens_purpose_token_hash_key
  on public.verification_tokens (purpose, token_hash);
create index verification_tokens_actor_type_actor_id_purpose_used_at_idx
  on public.verification_tokens (actor_type, actor_id, purpose, used_at);

create table public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  actor_type public.actor_type_enum not null,
  actor_id uuid not null,
  tenant_id uuid null,
  provider text not null,
  channel text not null,
  destination_masked text null,
  provider_request_id text null,
  code_hash text null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  verified_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  check (attempt_count >= 0),
  check (max_attempts > 0),
  check (attempt_count <= max_attempts)
);

create index otp_challenges_actor_type_actor_id_verified_at_idx
  on public.otp_challenges (actor_type, actor_id, verified_at);
create index otp_challenges_provider_request_id_idx
  on public.otp_challenges (provider_request_id);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  package_name text not null,
  rescans_price_inr numeric(14,2) not null,
  rescans_price_usd numeric(14,2) not null,
  rescans integer not null,
  price_inr numeric(14,2) not null,
  price_usd numeric(14,2) not null,
  team_manage_access boolean not null default false,
  status public.user_status_enum not null default 'active',
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (service_type in ('WVS', 'DMS', 'DNSMS')),
  check (rescans >= 0),
  check (rescans_price_inr >= 0),
  check (rescans_price_usd >= 0),
  check (price_inr >= 0),
  check (price_usd >= 0)
);

create index packages_service_type_status_is_deleted_idx
  on public.packages (service_type, status, is_deleted);

create table public.taxes (
  id uuid primary key default gen_random_uuid(),
  tax_type text not null,
  cgst numeric(8,2) null,
  sgst numeric(8,2) null,
  igst numeric(8,2) null,
  tax_name text null,
  other_tax numeric(8,2) null,
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (tax_type in ('GST', 'IGST', 'Other Tax')),
  check (coalesce(cgst, 0) between 0 and 100),
  check (coalesce(sgst, 0) between 0 and 100),
  check (coalesce(igst, 0) between 0 and 100),
  check (coalesce(other_tax, 0) between 0 and 100),
  check (
    (tax_type = 'GST' and cgst is not null and sgst is not null and igst is null and other_tax is null)
    or (tax_type = 'IGST' and igst is not null and cgst is null and sgst is null and other_tax is null)
    or (tax_type = 'Other Tax' and other_tax is not null and cgst is null and sgst is null and igst is null)
  )
);

create unique index taxes_tax_type_tax_name_key
  on public.taxes (tax_type, coalesce(tax_name, ''));

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  name text null,
  code text not null,
  scan integer not null default 0,
  max_usage integer not null default 0,
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (scan >= 0),
  check (max_usage >= 0)
);

create unique index referrals_code_key on public.referrals (code);

create table public.referral_usages (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index referral_usages_referral_id_user_id_key
  on public.referral_usages (referral_id, user_id);

create table public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  discount_type text not null,
  discount_value numeric(14,2) not null,
  expiry_date timestamptz not null,
  usage_limit integer not null default 1,
  status public.user_status_enum not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (discount_value >= 0),
  check (usage_limit >= 0)
);

create unique index discount_coupons_code_key on public.discount_coupons (code);

create table public.discount_coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.discount_coupons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index discount_coupon_usages_coupon_id_user_id_key
  on public.discount_coupon_usages (coupon_id, user_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.users(id),
  user_id uuid not null references public.users(id),
  order_number text null,
  invoice_number text null,
  legacy_package_id uuid null references public.packages(id),
  legacy_rescans integer not null default 0,
  price numeric(14,2) not null,
  subtotal numeric(14,2) null,
  total_tax_amount numeric(14,2) null,
  price_currency text not null,
  payment_gateway text not null,
  purchase_date timestamptz null,
  status public.purchase_status_enum not null default 'pending',
  payment_status public.payment_status_enum not null default 'pending',
  payment_datetime timestamptz null,
  order_id text null,
  payment_id text null,
  signature text null,
  paypal_order_id text null,
  paypal_payment_id text null,
  payer_id text null,
  payer_email text null,
  payment_amount numeric(14,2) null,
  currency text null,
  remark text null,
  bank_reference_number text null,
  last_webhook_signature text null,
  last_webhook_event_id text null,
  last_webhook_at timestamptz null,
  raw_body bytea null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (legacy_rescans >= 0),
  check (price >= 0),
  check (subtotal is null or subtotal >= 0),
  check (total_tax_amount is null or total_tax_amount >= 0),
  check (payment_amount is null or payment_amount >= 0)
);

create unique index purchases_order_number_key on public.purchases (order_number) where order_number is not null;
create unique index purchases_invoice_number_key on public.purchases (invoice_number) where invoice_number is not null;
create index purchases_tenant_id_created_at_desc_idx on public.purchases (tenant_id, created_at desc);
create index purchases_status_payment_status_idx on public.purchases (status, payment_status);
create index purchases_order_id_idx on public.purchases (order_id);
create index purchases_paypal_order_id_idx on public.purchases (paypal_order_id);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  package_id uuid null references public.packages(id),
  package_name text not null,
  service_type text not null,
  scans integer not null,
  base_price_per_scan numeric(14,2) not null,
  final_price_per_scan numeric(14,2) not null,
  total_base_price numeric(14,2) not null,
  total_tax_amount numeric(14,2) not null,
  total_final_price numeric(14,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (service_type in ('WVS', 'DMS', 'DNSMS')),
  check (scans >= 0),
  check (base_price_per_scan >= 0),
  check (final_price_per_scan >= 0),
  check (total_base_price >= 0),
  check (total_tax_amount >= 0),
  check (total_final_price >= 0)
);

create index purchase_items_purchase_id_idx on public.purchase_items (purchase_id);

create table public.purchase_item_taxes (
  id uuid primary key default gen_random_uuid(),
  purchase_item_id uuid not null references public.purchase_items(id) on delete cascade,
  tax_type text not null,
  tax_name text null,
  percentage numeric(8,2) not null,
  amount numeric(14,2) not null,
  check (percentage >= 0 and percentage <= 100),
  check (amount >= 0)
);

create table public.purchase_discounts (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.purchases(id) on delete cascade,
  code text not null,
  name text null,
  discount_type text not null,
  discount_value numeric(14,2) not null,
  discount_amount numeric(14,2) not null,
  check (discount_value >= 0),
  check (discount_amount >= 0)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  purchase_id uuid null references public.purchases(id),
  tenant_id uuid null references public.users(id),
  event_type text not null,
  signature_valid boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz null,
  processing_result text null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index payment_events_provider_provider_event_id_key
  on public.payment_events (provider, provider_event_id);
create index payment_events_purchase_id_created_at_desc_idx
  on public.payment_events (purchase_id, created_at desc);
