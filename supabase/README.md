Phase 1 database assets live here.

- `migrations/`: ordered SQL migrations for Supabase Postgres
- `seed.sql`: idempotent bootstrap seed script
- `../scripts/db-migrate.sh`: local migration runner using `psql`
- `../scripts/db-seed.sh`: local seed runner that maps process env into Postgres settings

The first migration builds the full schema defined in `POSTGRES_SUPABASE_SCHEMA_SPEC.md`, adds the required `users.supabase_auth_user_id` integration column, and introduces a `files` metadata table for Supabase Storage-backed artifacts.

Seed policy:

- admin departments, roles, and a baseline admin employee can be seeded idempotently
- baseline tax rows are seeded idempotently
- package catalog rows are intentionally left for explicit business-approved values in later seed revisions, because the spec defines structure but not authoritative pricing

Local execution:

- `pnpm db:migrate` applies all migration files in order using `DATABASE_URL`
- `pnpm db:seed` seeds baseline data and passes `SEED_DEFAULT_ADMIN_*` values into PostgreSQL session settings
