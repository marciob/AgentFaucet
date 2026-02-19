"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sponsor", label: "Sponsors" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/btbnb_2-removebg-preview.png" alt="" width={32} height={32} />
          <span className="text-xl font-bold"><span className="text-accent">Agent</span><span className="text-foreground">Faucet</span></span>
        </Link>

        {/* ── Desktop Nav ──────────────────────────────── */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-card text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="ml-2 h-5 w-px bg-card-border" />

          {user ? (
            <div className="ml-3 flex items-center gap-3">
              <span className="text-sm text-muted">
                {user.user_metadata?.user_name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-card-border px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-[#333] hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Mobile Hamburger ─────────────────────────── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted transition-colors hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* ── Mobile Menu ────────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${
          mobileOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <div className="border-t border-card-border/60 px-6 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-card text-foreground"
                  : "text-muted active:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-card-border" />

          {user ? (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted">
                {user.user_metadata?.user_name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-card-border px-3.5 py-1.5 text-sm text-muted transition-colors active:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
