export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSessionPrincipal } from "../../../src/lib/auth/server";

export default async function AdminDashboardPage() {
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
  const principal = isBuildTime ? null : await getAdminSessionPrincipal();

  if (!principal && !isBuildTime) {
    redirect("/admin/login");
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-8">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
        Protected Route
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Admin dashboard</h1>
      <p className="mt-4 text-stone-300">
        Admin session resolved for {principal?.email}.
      </p>
    </section>
  );
}
