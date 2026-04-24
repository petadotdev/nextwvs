export function ScaffoldPage(props: {
  eyebrow: string;
  title: string;
  description: string;
  routePath: string;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-black/20 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          {props.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">{props.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {props.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
            Route Ready
          </span>
          <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black">
            Placeholder Action
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Route Contract</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Phase 3 scaffolds the route, loading conventions, and shared shell before domain
          behavior exists.
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3 text-sm text-[var(--muted)]">
          Route: <span className="font-mono text-[var(--foreground)]">{props.routePath}</span>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">List Pattern</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Server-rendered tables and URL-driven filters are the default pattern for stable views.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-black/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--muted)]">
              Search placeholder
            </div>
            <span className="inline-flex rounded-full bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white/80">
              Scaffolded
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Column</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--foreground)]">Primary data source</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">Server</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">
                    Backed by route handlers and server components
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--foreground)]">Filter state</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">URL</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">
                    Search params will own shareable filters
                  </td>
                </tr>
                <tr className="border-t border-[var(--border)]">
                  <td className="px-4 py-4 text-[var(--foreground)]">Mutation state</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">Ephemeral</td>
                  <td className="px-4 py-4 text-[var(--foreground)]">
                    Local UI only until domain actions land
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            <span>Page 1 of 1</span>
            <div className="flex gap-2">
              <span className="rounded-full border border-[var(--border)] px-3 py-1.5">
                Previous
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1.5">Next</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Empty State</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every scaffold includes a consistent fallback shape for pre-domain screens.
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Domain behavior arrives in later phases
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            This route exists so Phase 3 can verify the App Router tree, actor layouts, and
            navigation system before feature implementation.
          </p>
        </div>
      </section>
    </div>
  );
}
