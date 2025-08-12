"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_UID, googleSignIn, signOutUser } from "../../config/firebase";
import { useMemo } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  {
    href: "/all",
    label: "All-time log",
    match: (p: string) => p.startsWith("/all"),
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  const items = useMemo(
    () =>
      isAdmin
        ? [
            ...NAV_ITEMS,
            {
              href: "/admin",
              label: "🔒 My space",
              match: (p: string) => p.startsWith("/admin"),
            },
          ]
        : NAV_ITEMS,
    [isAdmin]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-surface/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between">
        <Link
          href="/"
          className="relative select-none rounded-2xl px-3 py-1.5 text-lg font-semibold tracking-tight text-primary
                     bg-surface/70 shadow-neo-out hover:shadow-neo-out-lg transition-shadow"
        >
          hyperpoly<span className="text-foreground">log</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {items.map(({ href, label, match }) => {
            const active = match(pathname || "");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  // base
                  "relative inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                  "bg-surface/70 shadow-neo-out hover:shadow-neo-out-lg active:shadow-neo-in",
                  "hover:-translate-y-[1px] active:translate-y-0",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  // text/state
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="relative z-10">{label}</span>
                {/* Active halo */}
                {active && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full
                               ring-1 ring-primary/20"
                    aria-hidden
                  />
                )}
                {/* Active underline glow */}
                {active && (
                  <span
                    className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full
                               bg-primary/30 blur-[6px]"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}

          <div className="mx-1 h-6 w-px bg-surface" />

          {loading ? (
            <div
              aria-label="Loading"
              className="h-8 w-20 rounded-full bg-surface/60 shadow-neo-in animate-pulse"
            />
          ) : user ? (
            <button
              onClick={signOutUser}
              className="inline-flex items-center rounded-full bg-surface/70 px-3.5 py-1.5 text-sm font-medium
                         text-foreground shadow-neo-out hover:shadow-neo-out-lg active:shadow-neo-in transition-all
                         hover:-translate-y-[1px] active:translate-y-0"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="https://www.filippofonseca.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer transition-all hover:scale-[1.02]"
            >
              <button
                // onClick={googleSignIn}
                className="cursor-pointer inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium
                         text-primary-foreground bg-primary shadow-neo-out hover:shadow-neo-out-lg active:shadow-neo-in
                         transition-all hover:-translate-y-[1px] active:translate-y-0"
              >
                About me
              </button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
