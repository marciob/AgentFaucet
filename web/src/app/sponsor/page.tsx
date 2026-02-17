import { StatCard } from "@/components/stat-card";

export default function SponsorPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold">Sponsor Dashboard</h1>
      <p className="mt-2 text-muted">
        Fund the pool and track agent activity from your campaigns.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Your deposits" value="— tBNB" />
        <StatCard label="Agents funded" value="—" />
        <StatCard label="Campaign status" value="—" />
      </div>

      {/* Deposit section */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-semibold">Deposit to pool</h2>
        <p className="mt-1 text-sm text-muted">
          Sponsor testnet tokens for AI agents building on BNB Chain.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Amount (tBNB)"
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Campaign ID (optional)"
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            disabled
            className="rounded-lg bg-accent/50 px-6 py-3 text-sm font-medium text-black"
          >
            Deposit
          </button>
        </div>
      </section>

      {/* Activity */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">Campaign activity</h2>
        <div className="mt-4 rounded-xl border border-card-border bg-card p-8 text-center text-sm text-muted">
          No campaign activity yet.
        </div>
      </section>
    </main>
  );
}
