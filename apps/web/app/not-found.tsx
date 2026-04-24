import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="min-h-screen bg-[#08111f] px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-black/20 p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Not Found</p>
        <h1 className="mt-4 text-3xl font-semibold">This route does not exist</h1>
        <p className="mt-4 text-sm text-slate-300">
          Phase 3 provides explicit not-found handling for the App Router shell.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
