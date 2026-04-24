type AuthLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#08111f,#142b4d_45%,#f3b64c_140%)] px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-black/15 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
            Authentication
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Secure account access</h1>
          <p className="mt-3 text-sm text-slate-300">
            Minimal auth shell with shared alerts, verification flows, and no application
            sidebar.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
