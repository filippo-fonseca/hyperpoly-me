// components/NavBar.tsx
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_UID, googleSignIn, signOutUser } from "../../config/firebase";

export default function NavBar() {
  const { user, loading } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-lg border-b border-surface">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold tracking-tight text-lg text-primary"
        >
          hyperpoly<span className="text-foreground">log</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/all"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            All-time log
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Admin
            </Link>
          )}
          {!loading && !user && (
            <button
              onClick={googleSignIn}
              className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-neumorphic-sm active:shadow-neumorphic-inset"
            >
              Sign in
            </button>
          )}
          {!loading && user && (
            <button
              onClick={signOutUser}
              className="rounded-xl border border-surface px-3 py-1.5 text-sm font-medium hover:bg-surface/50 transition-colors shadow-neumorphic-sm active:shadow-neumorphic-inset"
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
