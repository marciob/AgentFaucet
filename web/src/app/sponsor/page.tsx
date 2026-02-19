import { StatCard } from "@/components/stat-card";

export default function SponsorPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="animate-in">
        <h1 className="text-3xl font-bold tracking-tight">
          Sponsor Dashboard
        </h1>
        <p className="mt-1.5 text-muted">
          Fund the pool and track agent activity from your campaigns.
        </p>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3">
        <div className="animate-in stagger-1">
          <StatCard label="Your deposits" value="— tBNB" />
        </div>
        <div className="animate-in stagger-2">
          <StatCard label="Agents funded" value="—" />
        </div>
        <div className="animate-in stagger-3 col-span-2 sm:col-span-1">
          <StatCard label="Campaign status" value="—" />
        </div>
      </div>

      {/* Deposit section */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Deposit to pool
        </h2>
        <p className="mt-1 text-sm text-muted">
          Sponsor testnet tokens for AI agents building on BNB Chain.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Amount (tBNB)"
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted/50"
          />
          <input
            type="text"
            placeholder="Campaign ID (optional)"
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted/50"
          />
          <button
            disabled
            className="shrink-0 rounded-lg bg-accent/50 px-6 py-3 text-sm font-medium text-black"
          >
            Deposit
          </button>
        </div>
      </section>

      {/* Activity */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaign activity
        </h2>
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
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium">No campaign activity yet</p>
          <p className="mt-1 text-sm text-muted">
            Activity will appear here once campaigns are active.
          </p>
        </div>
      </section>
    </main>
  );
}
