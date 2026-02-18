"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/stat-card";
import type { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [copied, setCopied] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        loadProfile(data.user.id);
        loadClaims(data.user.id);
      }
    });
  }, [supabase.auth]);

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

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-4 text-muted">
          Sign in with GitHub to access your dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted">
        Welcome back, {profile?.github_username || user.user_metadata?.user_name}
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reputation score"
          value={profile ? `${profile.reputation_score}/100` : "..."}
        />
        <StatCard
          label="Tier"
          value={
            profile
              ? `${profile.tier} — ${TIER_NAMES[profile.tier]}`
              : "..."
          }
        />
        <StatCard
          label="Daily limit"
          value={
            profile ? `${formatWei(profile.daily_limit_wei)} tBNB` : "..."
          }
        />
        <StatCard
          label="ERC-8004 ID"
          value={profile?.agent_token_id ? `#${profile.agent_token_id}` : "Pending"}
        />
      </div>

      {/* Token section */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">Agent JWT Token</h2>
        <p className="mt-1 text-sm text-muted">
          Set this as{" "}
          <code className="font-mono text-accent">FAUCET_TOKEN</code> in your
          agent&apos;s environment.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 overflow-hidden rounded-lg border border-card-border bg-background px-4 py-3 font-mono text-sm text-muted">
            {profile?.jwt_token
              ? `${profile.jwt_token.slice(0, 40)}...`
              : "Loading..."}
          </div>
          <button
            onClick={copyToken}
            disabled={!profile?.jwt_token}
            className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>

      {/* Recent claims */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">Recent claims</h2>
        {claims.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-card-border">
            <table className="w-full text-sm">
              <thead className="bg-card text-left text-muted">
                <tr>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Tx Hash</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-t border-card-border"
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
        ) : (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-8 text-center text-sm text-muted">
            No claims yet. Use your agent JWT token to start claiming tBNB.
          </div>
        )}
      </section>
    </main>
  );
}
