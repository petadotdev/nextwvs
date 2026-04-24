import { AppShell } from "../../src/components/app-shell";

type PublicLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AppShell
      title="Public Shell"
      subtitle="Marketing and unauthenticated entry routes live here."
      principal={null}
      navItems={[
        { href: "/", label: "Home" },
        { href: "/auth/signin", label: "Sign in" },
        { href: "/auth/signup", label: "Sign up" },
        { href: "/admin/login", label: "Admin" }
      ]}
      tone="public"
    >
      {children}
    </AppShell>
  );
}
