export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export default async function AdminClientActivityPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-8 text-white">
      <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Admin</p>
      <h1 className="text-4xl font-semibold">Client Activity</h1>
      <p className="text-sm text-stone-300">
        Client activity logs and audit history will render here.
      </p>
      <p className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 font-mono text-sm text-stone-300">
        /admin/clients/{params.id || "[id]"}/activity
      </p>
    </section>
  );
}
