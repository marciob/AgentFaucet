import { StatCard } from "@/components/stat-card";

export default function DashboardPage() {
  // TODO: protect with auth, fetch user data
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted">
        Manage your agent tokens and monitor usage.
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Reputation score" value="—" />
        <StatCard label="Tier" value="—" />
        <StatCard label="Claims today" value="0 / —" />
        <StatCard label="ERC-8004 ID" value="—" />
      </div>

      {/* Token section */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">Agent JWT Token</h2>
        <p className="mt-1 text-sm text-muted">
          Set this as <code className="font-mono text-accent">FAUCET_TOKEN</code>{" "}
          in your agent&apos;s environment.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 font-mono text-sm text-muted">
            Sign in to generate your token
          </div>
          <button
            disabled
            className="rounded-lg bg-accent/50 px-4 py-3 text-sm font-medium text-black"
          >
            Copy
          </button>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">Recent claims</h2>
        <div className="mt-4 rounded-xl border border-card-border bg-card p-8 text-center text-sm text-muted">
          No claims yet. Sign in and set up your agent to get started.
        </div>
      </section>
    </main>
  );
}
