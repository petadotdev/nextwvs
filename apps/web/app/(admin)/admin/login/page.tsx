export const dynamic = "force-dynamic";

import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#16110b,#25170d_40%,#09090b)] px-6 py-12 text-stone-100">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-black/20 p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
          Admin Auth
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Employee sign in</h1>
        <p className="mt-4 text-stone-300">
          Submit credentials to `POST /api/v1/admin-auth/signin`, then complete
          `POST /api/v1/admin-auth/verify-login`.
        </p>
        <div className="mt-8">
          <Link
            href="/admin/forgot-password"
            className="text-amber-300 underline underline-offset-4"
          >
            Forgot password
          </Link>
        </div>
      </section>
    </main>
  );
}
