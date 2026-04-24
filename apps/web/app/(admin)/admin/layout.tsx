export const dynamic = "force-dynamic";

import { AppShell } from "../../../src/components/app-shell";
import { getAdminSessionPrincipal } from "../../../src/lib/auth/server";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

  if (isBuildTime) {
    return <main>{children}</main>;
  }

  const principal = await getAdminSessionPrincipal();

  return (
    <AppShell
      title={principal?.name ?? "Admin Authentication"}
      subtitle="Administrative shell with permission-aware operational navigation."
      principal={principal}
      tone="admin"
      navItems={
        principal
          ? [
              { href: "/admin/dashboard", label: "Dashboard" },
              { href: "/admin/visitors", label: "Visitors" },
              { href: "/admin/clients", label: "Clients" },
              { href: "/admin/packages", label: "Packages" },
              { href: "/admin/tickets", label: "Tickets" },
              { href: "/admin/scans", label: "Scans" },
              { href: "/admin/mail/templates", label: "Mail" }
            ]
          : [{ href: "/admin/login", label: "Login" }]
      }
    >
      {children}
    </AppShell>
  );
}
