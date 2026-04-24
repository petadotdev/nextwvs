export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../../src/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/user/wvs/dashboard";
  const callbackUrl = new URL("/auth/google/callback", url.origin);
  callbackUrl.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error || !data.url) {
    redirect(`/auth/signin?error=${encodeURIComponent("google_oauth_start_failed")}`);
  }

  redirect(data.url);
}
