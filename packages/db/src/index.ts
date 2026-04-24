import postgres, {
  type PendingQuery,
  type Sql,
  type TransactionSql
} from "postgres";
import { requireDatabaseRuntimeEnv } from "@petadot/config";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DatabaseClient = Sql<Record<string, unknown>>;
export type DatabaseTransaction = TransactionSql<Record<string, unknown>>;
export type DatabaseQuery<
  T extends readonly postgres.MaybeRow[] = readonly postgres.Row[]
> = PendingQuery<T>;

let databaseClient: DatabaseClient | undefined;

export function createDatabaseClient(connectionString?: string) {
  const env = requireDatabaseRuntimeEnv(process.env);
  const resolvedConnectionString = connectionString ?? env.DATABASE_URL;

  return postgres(resolvedConnectionString, {
    idle_timeout: 20,
    max: 10,
    prepare: false
  });
}

export function getDatabaseClient() {
  databaseClient ??= createDatabaseClient();
  return databaseClient;
}

export async function withTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>
) {
  const client = getDatabaseClient();
  return client.begin(async (tx) => callback(tx));
}

export interface RepositoryContext {
  db?: DatabaseClient | DatabaseTransaction;
}

export function resolveRepositoryDb(context?: RepositoryContext) {
  return (context?.db ?? getDatabaseClient()) as DatabaseClient;
}

export abstract class BaseRepository {
  protected readonly db: DatabaseClient;

  protected constructor(context?: RepositoryContext) {
    this.db = resolveRepositoryDb(context);
  }
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export * from "./auth";
export * from "./admin-billing";
export * from "./billing";
export * from "./customer-workspace";
export * from "./tickets";
export * from "./wvs";
