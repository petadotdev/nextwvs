import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getServerSupabaseEnv } from "./env";

export function createSupabaseAdminClient() {
  const env = getServerSupabaseEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client");
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
