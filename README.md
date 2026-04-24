# petadot-next

Ground-up rebuild workspace for Petadot.

This repository is the implementation workspace only. The spec source of truth remains in `/home/01-Petadot/specs`.

Current status:

- Phase 0 scaffolding only
- no business features implemented
- no secrets committed

Phase 0 scope in this repository is limited to:

- repository and workspace structure
- linting, formatting, TypeScript, and test bootstrap
- shared environment schema scaffolding
- architectural decisions that make SQL/Supabase authoritative over MongoDB-oriented legacy documents

Workspace layout:

- `apps/web`: Next.js application shell
- `apps/worker`: background worker shell
- `packages/config`: shared environment and runtime configuration schemas
- `packages/db`: direct Postgres access, transactions, and repository primitives
- `packages/auth`: reserved boundary for identity and authorization work
- `packages/types`: shared TypeScript types
- `packages/validation`: generic validation helpers
- `packages/ui`: shared UI entrypoint
- `packages/integrations`: provider integration boundary
- `packages/observability`: logging and observability boundary
- `packages/test-utils`: shared test helpers

Decision records live in `docs/decisions`.
# nextwvs
