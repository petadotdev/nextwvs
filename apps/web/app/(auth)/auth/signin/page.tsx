import Link from "next/link";

export default function SignInPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
        Customer Auth
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Sign in</h1>
      <p className="mt-4 text-slate-300">
        Use `POST /api/v1/auth/signin` for credentials or continue with Google.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/auth/google"
          className="rounded-full bg-amber-400 px-5 py-3 font-medium text-slate-950"
        >
          Continue with Google
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full border border-white/15 px-5 py-3 font-medium text-white"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
