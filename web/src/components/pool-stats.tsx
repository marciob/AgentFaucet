import { StatCard } from "./stat-card";

export function PoolStats() {
  // TODO: fetch from contract / API
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-bold">Pool stats</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pool balance" value="— tBNB" />
        <StatCard label="Total claims" value="—" />
        <StatCard label="Unique agents" value="—" />
        <StatCard label="Tokens returned" value="— tBNB" />
      </div>
    </section>
  );
}
