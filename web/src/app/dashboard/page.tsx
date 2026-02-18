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
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "node">(
    "curl"
  );
  const supabase = createSupabaseBrowserClient();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

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

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
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

  const tokenPreview = profile?.jwt_token
    ? `${profile.jwt_token.slice(0, 40)}...`
    : "Loading...";

  const curlClaim = `curl -X POST ${baseUrl}/api/claim \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $FAUCET_TOKEN" \\
  -d '{"walletAddress": "0xYOUR_WALLET", "amount": "0.005"}'`;

  const curlStatus = `curl ${baseUrl}/api/status \\
  -H "Authorization: Bearer $FAUCET_TOKEN"`;

  const pythonExample = `import requests, os

TOKEN = os.environ["FAUCET_TOKEN"]
URL = "${baseUrl}"

# Claim tBNB
resp = requests.post(f"{URL}/api/claim", json={
    "walletAddress": "0xYOUR_WALLET",
    "amount": "0.005"
}, headers={"Authorization": f"Bearer {TOKEN}"})

print(resp.json())
# {"success": true, "txHash": "0x...", "amount": "0.005", "remaining": "0.01"}`;

  const nodeExample = `const TOKEN = process.env.FAUCET_TOKEN;
const URL = "${baseUrl}";

// Claim tBNB
const resp = await fetch(\`\${URL}/api/claim\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${TOKEN}\`,
  },
  body: JSON.stringify({
    walletAddress: "0xYOUR_WALLET",
    amount: "0.005",
  }),
});

const data = await resp.json();
console.log(data);
// { success: true, txHash: "0x...", amount: "0.005", remaining: "0.01" }`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted">
        Welcome back,{" "}
        {profile?.github_username || user.user_metadata?.user_name}
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
          value={
            profile?.agent_token_id ? `#${profile.agent_token_id}` : "Pending"
          }
        />
      </div>

      {/* Quick Start Guide */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick start — connect your AI agent</h2>
        <p className="mt-1 text-sm text-muted">
          Follow these steps to let your agent claim testnet tBNB automatically.
        </p>

        {/* Step 1 — Copy token */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              1
            </span>
            <h3 className="text-sm font-semibold">
              Copy your agent token
            </h3>
          </div>
          <div className="mt-3 ml-8 flex items-center gap-3">
            <div className="flex-1 overflow-hidden rounded-lg border border-card-border bg-background px-4 py-3 font-mono text-sm text-muted">
              {tokenPreview}
            </div>
            <button
              onClick={copyToken}
              disabled={!profile?.jwt_token}
              className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Step 2 — Set env var */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              2
            </span>
            <h3 className="text-sm font-semibold">
              Set it as an environment variable
            </h3>
          </div>
          <div className="group relative mt-3 ml-8 rounded-lg border border-card-border bg-background p-4">
            <button
              onClick={() => copyText(`export FAUCET_TOKEN="your_token_here"`)}
              className="absolute right-3 top-3 rounded border border-card-border px-2 py-1 text-xs text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              Copy
            </button>
            <pre className="overflow-x-auto font-mono text-sm text-foreground">
              <span className="text-muted">export</span> FAUCET_TOKEN=<span className="text-accent">&quot;your_token_here&quot;</span>
            </pre>
          </div>
        </div>

        {/* Step 3 — Make API calls */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              3
            </span>
            <h3 className="text-sm font-semibold">
              Your agent calls the API to claim tokens
            </h3>
          </div>

          {/* Language tabs */}
          <div className="mt-3 ml-8">
            <div className="flex gap-1 rounded-lg border border-card-border bg-background p-1">
              {(["curl", "python", "node"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-card-border text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab === "curl"
                    ? "cURL"
                    : tab === "python"
                    ? "Python"
                    : "Node.js"}
                </button>
              ))}
            </div>

            <div className="group relative mt-2 rounded-lg border border-card-border bg-background p-4">
              <button
                onClick={() =>
                  copyText(
                    activeTab === "curl"
                      ? curlClaim
                      : activeTab === "python"
                      ? pythonExample
                      : nodeExample
                  )
                }
                className="absolute right-3 top-3 rounded border border-card-border px-2 py-1 text-xs text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                Copy
              </button>
              <pre className="overflow-x-auto whitespace-pre font-mono text-sm leading-relaxed text-foreground">
                {activeTab === "curl" && curlClaim}
                {activeTab === "python" && pythonExample}
                {activeTab === "node" && nodeExample}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="mt-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">API Reference</h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-card-border bg-background p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-900/50 px-2 py-0.5 font-mono text-xs font-bold text-green-400">
                POST
              </span>
              <code className="font-mono text-sm">/api/claim</code>
            </div>
            <p className="mt-2 text-sm text-muted">
              Claim tBNB to any wallet. The relayer sends the transaction — your agent never needs gas.
            </p>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex gap-2">
                <code className="shrink-0 text-accent">walletAddress</code>
                <span className="text-muted">— Recipient 0x address (required)</span>
              </div>
              <div className="flex gap-2">
                <code className="shrink-0 text-accent">amount</code>
                <span className="text-muted">— tBNB amount as string, e.g. &quot;0.005&quot; (optional, defaults to 0.005)</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-card-border bg-background p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-900/50 px-2 py-0.5 font-mono text-xs font-bold text-blue-400">
                GET
              </span>
              <code className="font-mono text-sm">/api/status</code>
            </div>
            <p className="mt-2 text-sm text-muted">
              Check your tier, daily limit, amount claimed today, and remaining allocation.
            </p>
          </div>

          <div className="rounded-lg border border-card-border bg-background p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-900/50 px-2 py-0.5 font-mono text-xs font-bold text-blue-400">
                GET
              </span>
              <code className="font-mono text-sm">/api/stats</code>
            </div>
            <p className="mt-2 text-sm text-muted">
              Public endpoint — pool balance, total claims, unique developers. No auth required.
            </p>
          </div>
        </div>

        {/* Check status example */}
        <div className="group relative mt-4 rounded-lg border border-card-border bg-background p-4">
          <div className="mb-2 text-xs font-medium text-muted">Check your remaining allocation</div>
          <button
            onClick={() => copyText(curlStatus)}
            className="absolute right-3 top-3 rounded border border-card-border px-2 py-1 text-xs text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          >
            Copy
          </button>
          <pre className="overflow-x-auto whitespace-pre font-mono text-sm text-foreground">
            {curlStatus}
          </pre>
        </div>
      </section>

      {/* Tier table */}
      <section className="mt-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">Tier system</h2>
        <p className="mt-1 text-sm text-muted">
          Your daily limit is based on your GitHub reputation score. Resets at UTC midnight.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-card-border">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-muted">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Score range</th>
                <th className="px-4 py-3">Daily limit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 1, name: "Newcomer", range: "0–20", limit: "0.005" },
                { tier: 2, name: "Developer", range: "21–50", limit: "0.01" },
                { tier: 3, name: "Active Builder", range: "51–80", limit: "0.015" },
                { tier: 4, name: "Established", range: "81–100", limit: "0.02" },
              ].map((row) => (
                <tr
                  key={row.tier}
                  className={`border-t border-card-border ${
                    profile?.tier === row.tier ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {row.tier}
                    </span>
                    <span className="ml-2 text-muted">{row.name}</span>
                    {profile?.tier === row.tier && (
                      <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
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
      </section>

      {/* Recent claims */}
      <section className="mt-8">
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
            No claims yet. Use the API above to start claiming tBNB.
          </div>
        )}
      </section>
    </main>
  );
}
