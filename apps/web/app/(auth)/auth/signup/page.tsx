import Link from "next/link";

export default function SignUpPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
        Customer Auth
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Create account</h1>
      <p className="mt-4 text-slate-300">
        Submit `POST /api/v1/auth/signup`, then verify the issued email token at
        `POST /api/v1/auth/verify-email`.
      </p>
      <div className="mt-8">
        <Link href="/auth/signin" className="text-amber-300 underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </section>
  );
}
