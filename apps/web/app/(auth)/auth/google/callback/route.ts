export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { completeGoogleOAuthSignIn } from "../../../../../src/lib/auth/api";
import {
  getRequestActivityContext,
  logCustomerActivity
} from "../../../../../src/lib/auth/activity";
import { createSupabaseServerClient } from "../../../../../src/lib/supabase/server";

function extractGoogleIdentity(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  identities?: Array<{
    provider?: string;
    id?: string;
  }> | null;
}) {
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google"
  );

  return {
    supabaseAuthUserId: user.id,
    email: user.email ?? null,
    name:
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      null,
    googleId:
      (typeof googleIdentity?.id === "string" && googleIdentity.id) ||
      (typeof user.user_metadata?.sub === "string" && user.user_metadata.sub) ||
      null
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/user/wvs/dashboard";

  if (!code) {
    redirect("/auth/signin?error=missing_google_code");
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    redirect("/auth/signin?error=google_code_exchange_failed");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/signin?error=google_user_fetch_failed");
  }

  try {
    const result = await completeGoogleOAuthSignIn(extractGoogleIdentity(data.user));
    await logCustomerActivity({
      tenantId: result.tenantId,
      userId: result.userId,
      action: result.created ? "google_signup_success" : "google_signin_success",
      request: getRequestActivityContext(request),
      metadata: {
        provider: "google"
      }
    });
    redirect(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "google_auth_failed";
    redirect(`/auth/signin?error=${encodeURIComponent(message)}`);
  }
}
