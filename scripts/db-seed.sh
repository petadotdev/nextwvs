#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run seeds" >&2
  exit 1
fi

psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -v seed_default_admin_department="${SEED_DEFAULT_ADMIN_DEPARTMENT:-Operations}" \
  -v seed_default_admin_role="${SEED_DEFAULT_ADMIN_ROLE:-Super Admin}" \
  -v seed_default_admin_email="${SEED_DEFAULT_ADMIN_EMAIL:-}" \
  -v seed_default_admin_name="${SEED_DEFAULT_ADMIN_NAME:-}" \
  -v seed_default_admin_password_hash="${SEED_DEFAULT_ADMIN_PASSWORD_HASH:-}" \
  <<'SQL'
select public.set_runtime_setting('app.seed_default_admin_department', :'seed_default_admin_department');
select public.set_runtime_setting('app.seed_default_admin_role', :'seed_default_admin_role');
select public.set_runtime_setting('app.seed_default_admin_email', :'seed_default_admin_email');
select public.set_runtime_setting('app.seed_default_admin_name', :'seed_default_admin_name');
select public.set_runtime_setting('app.seed_default_admin_password_hash', :'seed_default_admin_password_hash');
\i ./supabase/seed.sql
SQL
