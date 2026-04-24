export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppShell } from "../../../src/components/app-shell";
import { getCustomerSessionPrincipal } from "../../../src/lib/auth/server";

type UserLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function UserLayout({ children }: UserLayoutProps) {
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

  if (isBuildTime) {
    return <main>{children}</main>;
  }

  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    redirect("/auth/signin");
  }

  return (
    <AppShell
      title={principal?.name ?? "Customer Workspace"}
      subtitle="Authenticated customer workspace with service-aware navigation."
      principal={principal}
      tone="customer"
      navItems={[
        { href: "/user/dashboard", label: "Dashboard" },
        { href: "/user/profile", label: "Profile" },
        { href: "/user/plans", label: "Plans" },
        { href: "/user/wvs/dashboard", label: "WVS" },
        { href: "/user/dms/dashboard", label: "DMS" },
        { href: "/user/dnsms/dashboard", label: "DNSMS" },
        { href: "/user/support/tickets", label: "Support" },
        { href: "/user/tm/departments", label: "Team", permission: { domain: "team", action: "view" } }
      ]}
    >
      {children}
    </AppShell>
  );
}
