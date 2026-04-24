# ADR 0001: SQL and Supabase Are Authoritative

## Status

Accepted

## Context

The specification set contains conflicting persistence guidance. Some legacy documents still describe a MongoDB-oriented model, while the current rebuild plan targets PostgreSQL on Supabase.

Phase 0 requires that this conflict be resolved before any feature or schema implementation begins.

## Decision

The implementation in this repository follows SQL and Supabase as the authoritative persistence direction.

Authoritative documents for persistence and platform decisions:

- `IMPLEMENTATION_PLAN.md`
- `POSTGRES_SUPABASE_SCHEMA_SPEC.md`
- `AUTH_AUTHORIZATION_SPEC.md`
- `API_CONTRACT_SPEC.md`
- `NEXTJS_FRONTEND_SPEC.md`
- `ASYNC_WORKFLOW_SPEC.md`

Non-authoritative when they conflict with the above:

- `MONGODB_SCHEMA_SPEC.md`
- MongoDB references that remain in older planning or migration documents

## Consequences

- Repository bootstrap, environment setup, and package boundaries are designed around a Next.js plus Supabase architecture.
- No MongoDB client, schema, or collection-oriented abstractions should be introduced in Phase 0.
- Database schema, migrations, repositories, and storage contracts are deferred to Phase 1.
