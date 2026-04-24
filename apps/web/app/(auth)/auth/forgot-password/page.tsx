export default function ForgotPasswordPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-rose-300">
        Recovery
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Forgot password</h1>
      <p className="mt-4 text-slate-300">
        Start reset with `POST /api/v1/auth/forgot-password`.
      </p>
    </section>
  );
}
