export const dynamic = "force-dynamic";

export default function AdminAlertsPage() {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-8 text-white">
      <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Admin</p>
      <h1 className="text-4xl font-semibold">Alerts</h1>
      <p className="text-sm text-stone-300">
        Administrative alert triage is scaffolded on this route.
      </p>
      <p className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 font-mono text-sm text-stone-300">
        /admin/alerts
      </p>
    </section>
  );
}
