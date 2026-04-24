import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionPrincipal } from "@petadot/auth";

type NavItem = {
  href: string;
  label: string;
  permission?: { domain: string; action: string };
};

function canAccess(
  principal: SessionPrincipal | null,
  permission?: { domain: string; action: string }
) {
  if (!permission || !principal) {
    return true;
  }

  return principal.permissions.some(
    (item) =>
      item.allowed &&
      item.domain === permission.domain &&
      item.action === permission.action
  );
}

export function AppShell(props: {
  title: string;
  subtitle: string;
  principal: SessionPrincipal | null;
  navItems: NavItem[];
  children: ReactNode;
  tone: "customer" | "admin" | "public";
}) {
  const toneClass =
    props.tone === "admin"
      ? "from-[#171009] via-[#2b1b0f] to-[#09090b]"
      : props.tone === "public"
        ? "from-[#08111f] via-[#102542] to-[#f0b54a]"
        : "from-[#07131f] via-[#123152] to-[#0f172a]";
  const shellLabel =
    props.tone === "admin"
      ? "Admin operations"
      : props.tone === "public"
        ? "Public entry"
        : "Customer workspace";
  const canAddTargets = props.tone === "customer" && props.principal !== null;

  return (
    <main className={`min-h-screen bg-gradient-to-br ${toneClass} text-[var(--foreground)]`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-black/15 px-6 py-6 lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
              Petadot
            </p>
            <h1 className="text-2xl font-semibold">{props.title}</h1>
            <p className="text-sm text-[var(--muted)]">{props.subtitle}</p>
          </div>
          <nav className="mt-8 space-y-2">
            {props.navItems.map((item) =>
              canAccess(props.principal, item.permission) ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--border)] hover:bg-black/10"
                >
                  {item.label}
                </Link>
              ) : null
            )}
          </nav>
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Shell
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{shellLabel}</p>
          </div>
        </aside>
        <div className="px-6 py-8 lg:px-10 lg:py-10">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-black/15 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                {shellLabel}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {props.principal?.email ?? "Unauthenticated visitor"}
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {props.tone === "customer" ? (
                <select className="min-w-44 rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)]">
                  <option>WVS</option>
                  <option>DMS</option>
                  <option>DNSMS</option>
                  <option>Support</option>
                  <option>Billing</option>
                </select>
              ) : null}
              {(props.tone === "customer" || props.tone === "admin") && props.principal ? (
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                    Share feedback
                  </summary>
                  <div className="absolute right-0 top-12 z-20 w-80 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Shared feedback shell
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Phase 3 provides the shared entry point. Submission wiring lands in later
                      phases.
                    </p>
                  </div>
                </details>
              ) : null}
              {canAddTargets ? (
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black">
                    Add target
                  </summary>
                  <div className="absolute right-0 top-12 z-20 w-80 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Shared target entry point
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Target onboarding opens from the shell. Domain-specific forms land in later
                      phases.
                    </p>
                  </div>
                </details>
              ) : null}
            </div>
          </header>
          <div id="main-content">{props.children}</div>
          {props.tone === "public" ? (
            <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-[var(--muted)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p>Petadot public shell for marketing and entry routes.</p>
                <div className="flex gap-4">
                  <Link href="/auth/signin">Sign in</Link>
                  <Link href="/auth/signup">Sign up</Link>
                  <Link href="/admin/login">Admin</Link>
                </div>
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </main>
  );
}
