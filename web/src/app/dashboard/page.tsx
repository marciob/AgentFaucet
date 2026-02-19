"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/stat-card";
import { PoolStats } from "@/components/pool-stats";
import type { User } from "@supabase/supabase-js";

type Audience = "agent" | "human";

interface Profile {
  github_username: string;
  reputation_score: number;
  tier: number;
  agent_token_id: number | null;
  daily_limit_wei: string;
  jwt_token: string | null;
}

interface Claim {
  id: number;
  wallet_address: string;
  amount_wei: string;
  tx_hash: string;
  created_at: string;
}

const TIER_NAMES: Record<number, string> = {
  1: "Newcomer",
  2: "Developer",
  3: "Active Builder",
  4: "Established",
};

export default function DashboardPage() {
  const [audience, setAudience] = useState<Audience>("human");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [copied, setCopied] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const [baseUrl, setBaseUrl] = useState("");

  // Sliding pill indicator
  const agentRef = useRef<HTMLButtonElement>(null);
  const humanRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    setBaseUrl(window.location.origin);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        loadProfile(data.user.id);
        loadClaims(data.user.id);
      }
    });
  }, [supabase.auth]);

  useEffect(() => {
    const el = audience === "agent" ? agentRef.current : humanRef.current;
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [audience]);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("af_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }

  async function loadClaims(userId: string) {
    const { data } = await supabase
      .from("af_claims")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setClaims(data);
  }

  function copyToken() {
    if (profile?.jwt_token) {
      navigator.clipboard.writeText(profile.jwt_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatWei(wei: string): string {
    return (Number(wei) / 1e18).toFixed(4);
  }

  // ── Not authenticated ────────────────────────────
  if (!user) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-32 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-card-border">
          <svg
            className="h-6 w-6 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted">
          Sign in with GitHub to access your dashboard.
        </p>
      </main>
    );
  }

  const tokenPreview = profile?.jwt_token
    ? `${profile.jwt_token.slice(0, 40)}...`
    : "Loading...";

  const tierRows = [
    { tier: 1, name: "Newcomer", range: "0 – 20", limit: "0.005" },
    { tier: 2, name: "Developer", range: "21 – 50", limit: "0.01" },
    { tier: 3, name: "Active Builder", range: "51 – 80", limit: "0.015" },
    { tier: 4, name: "Established", range: "81 – 100", limit: "0.02" },
  ];

  // ── Authenticated ────────────────────────────────
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* Header + Toggle */}
      <div className="animate-in flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{" "}
          {profile?.github_username || user.user_metadata?.user_name}
        </h1>

        {/* Audience Toggle */}
        <div className="relative mt-6 inline-flex rounded-full border border-card-border/60 bg-card/80 p-1 backdrop-blur-sm">
          {pill.width > 0 && (
            <div
              className="absolute top-1 bottom-1 rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
          <button
            ref={agentRef}
            onClick={() => setAudience("agent")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 sm:px-6 sm:py-2.5 ${
              audience === "agent"
                ? pill.width > 0 ? "text-black" : "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m an Agent
          </button>
          <button
            ref={humanRef}
            onClick={() => setAudience("human")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 sm:px-6 sm:py-2.5 ${
              audience === "human"
                ? pill.width > 0 ? "text-black" : "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m a Human
          </button>
        </div>
      </div>

      {/* ── Agent View ──────────────────────────────── */}
      {audience === "agent" && (
        <div className="mt-12">
          <section className="mx-auto max-w-2xl">
            <p className="mb-5 text-center text-sm text-muted">
              Copy this into your AI agent — it will handle the rest.
            </p>

            {/* Terminal-style command box */}
            <div className="overflow-hidden rounded-xl border border-accent/20 bg-[#0d1117] transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_60px_rgba(240,185,11,0.06)]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-[11px] text-muted/50">
                  prompt
                </span>
              </div>
              <button
                onClick={() => {
                  const text = `Read ${baseUrl}/agents.md and follow the instructions to claim tBNB`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="group relative w-full p-5 text-left"
              >
                <span
                  className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                    copied
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-card-border bg-card text-muted opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Click to copy"
                  )}
                </span>
                <p className="font-mono text-sm leading-relaxed text-foreground/80">
                  Read {baseUrl}/agents.md and follow the instructions to claim
                  tBNB
                </p>
              </button>
            </div>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <svg
                    className="h-4 w-4 text-accent"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold">Gasless claims</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  Your agent never needs gas. The relayer covers all transaction
                  costs.
                </p>
              </div>

              <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <svg
                    className="h-4 w-4 text-accent"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold">Reputation-based</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  Limits scale with your GitHub activity. Build more, claim
                  more.
                </p>
              </div>

              <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <svg
                    className="h-4 w-4 text-accent"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold">One API call</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  POST /api/claim with a wallet address. That&apos;s it.
                </p>
              </div>
            </div>
          </section>

          <PoolStats />
        </div>
      )}

      {/* ── Human View (Dashboard) ──────────────────── */}
      {audience === "human" && (
        <div className="mt-10">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="animate-in stagger-1">
              <StatCard
                label="Reputation"
                value={profile ? `${profile.reputation_score}/100` : "..."}
              />
            </div>
            <div className="animate-in stagger-2">
              <StatCard
                label="Tier"
                value={
                  profile
                    ? `${profile.tier} — ${TIER_NAMES[profile.tier]}`
                    : "..."
                }
              />
            </div>
            <div className="animate-in stagger-3">
              <StatCard
                label="Daily limit"
                value={
                  profile
                    ? `${formatWei(profile.daily_limit_wei)} tBNB`
                    : "..."
                }
              />
            </div>
            <div className="animate-in stagger-4">
              <StatCard
                label="ERC-8004 ID"
                value={
                  profile?.agent_token_id
                    ? `#${profile.agent_token_id}`
                    : "Pending"
                }
              />
            </div>
          </div>

          {/* Agent Token */}
          <section className="mt-12 animate-in stagger-5 rounded-xl border border-card-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Your agent token
            </h2>
            <p className="mt-1 text-sm text-muted">
              Give this token to your AI agent. It already knows how to use it
              — just paste it when the agent asks.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 overflow-hidden rounded-lg border border-card-border bg-background px-4 py-3 font-mono text-sm text-muted">
                {tokenPreview}
              </div>
              <button
                onClick={copyToken}
                disabled={!profile?.jwt_token}
                className={`shrink-0 rounded-lg px-5 py-3 text-sm font-medium transition-all sm:py-2.5 ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-accent text-black hover:bg-accent-hover disabled:opacity-50"
                }`}
              >
                {copied ? "Copied!" : "Copy token"}
              </button>
            </div>
          </section>

          {/* Tier System */}
          <section className="mt-8 rounded-xl border border-card-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Tier system
            </h2>
            <p className="mt-1 text-sm text-muted">
              Your daily limit is based on your GitHub reputation score. Resets
              at UTC midnight.
            </p>

            {/* Desktop table */}
            <div className="mt-5 hidden overflow-hidden rounded-lg border border-card-border sm:block">
              <table className="w-full text-sm">
                <thead className="bg-background text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Score range</th>
                    <th className="px-4 py-3 font-medium">Daily limit</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map((row) => (
                    <tr
                      key={row.tier}
                      className={`border-t border-card-border transition-colors ${
                        profile?.tier === row.tier ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{row.tier}</span>
                        <span className="ml-2 text-muted">{row.name}</span>
                        {profile?.tier === row.tier && (
                          <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted">
                        {row.range}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {row.limit} tBNB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-5 space-y-3 sm:hidden">
              {tierRows.map((row) => (
                <div
                  key={row.tier}
                  className={`rounded-lg border p-4 ${
                    profile?.tier === row.tier
                      ? "border-accent/30 bg-accent/5"
                      : "border-card-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card-border text-xs font-bold">
                        {row.tier}
                      </span>
                      <span className="font-medium text-sm">{row.name}</span>
                      {profile?.tier === row.tier && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent">
                          You
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {row.limit} tBNB
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Score: {row.range}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Claims */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent claims
            </h2>

            {claims.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="mt-4 hidden overflow-hidden rounded-xl border border-card-border sm:block">
                  <table className="w-full text-sm">
                    <thead className="bg-card text-left text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Wallet</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Tx Hash</th>
                        <th className="px-4 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => (
                        <tr
                          key={claim.id}
                          className="border-t border-card-border transition-colors hover:bg-card/50"
                        >
                          <td className="px-4 py-3 font-mono">
                            {claim.wallet_address.slice(0, 6)}...
                            {claim.wallet_address.slice(-4)}
                          </td>
                          <td className="px-4 py-3">
                            {formatWei(claim.amount_wei)} tBNB
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://testnet.bscscan.com/tx/${claim.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-accent hover:underline"
                            >
                              {claim.tx_hash.slice(0, 10)}...
                            </a>
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {new Date(claim.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="rounded-xl border border-card-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">
                          {claim.wallet_address.slice(0, 6)}...
                          {claim.wallet_address.slice(-4)}
                        </span>
                        <span className="text-sm font-medium">
                          {formatWei(claim.amount_wei)} tBNB
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <a
                          href={`https://testnet.bscscan.com/tx/${claim.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-accent hover:underline"
                        >
                          {claim.tx_hash.slice(0, 10)}...
                        </a>
                        <span>
                          {new Date(claim.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-card-border bg-card py-12 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-border/50">
                  <svg
                    className="h-5 w-5 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium">No claims yet</p>
                <p className="mt-1 text-sm text-muted">
                  Use the API above to start claiming tBNB.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
