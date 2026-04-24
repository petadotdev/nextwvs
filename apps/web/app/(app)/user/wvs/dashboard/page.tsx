export const dynamic = "force-dynamic";

import { getCustomerSessionPrincipal } from "../../../../../src/lib/auth/server";

export default async function UserWvsDashboardPage() {
  const principal =
    process.env.NEXT_PHASE === "phase-production-build"
      ? null
      : await getCustomerSessionPrincipal();

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900 p-8">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
        Protected Route
      </p>
      <h1 className="mt-4 text-4xl font-semibold">WVS Dashboard</h1>
      <p className="mt-4 text-slate-300">
        Customer session resolved for {principal?.email}.
      </p>
    </section>
  );
}
