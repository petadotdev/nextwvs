import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseServerAppEnv } from "./index";

describe("parseServerAppEnv", () => {
  it("parses the Phase 0 bootstrap environment shape", () => {
    const env = parseServerAppEnv({
      NODE_ENV: "development",
      APP_ENV: "development",
      APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:54322/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SESSION_SECRET: "test-session-secret",
      SESSION_COOKIE_NAME_USER: "pd_user_session",
      SESSION_COOKIE_NAME_ADMIN: "pd_admin_session"
    });

    expect(env.APP_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  it("accepts the repository .env.example bootstrap shape", () => {
    const examplePath = path.resolve(
      import.meta.dirname,
      "../../../.env.example"
    );
    const raw = readFileSync(examplePath, "utf8");
    const env = Object.fromEntries(
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map((line) => {
          const separatorIndex = line.indexOf("=");
          return [
            line.slice(0, separatorIndex),
            line.slice(separatorIndex + 1)
          ] as const;
        })
    );

    const parsed = parseServerAppEnv(env);

    expect(parsed.APP_ENV).toBe("development");
    expect(parsed.DATABASE_URL).toBe("postgres://postgres:postgres@127.0.0.1:54322/postgres");
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe("local-service-role-key");
    expect(parsed.CUSTOMER_SESSION_TTL_HOURS).toBe(720);
  });
});
