"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";

interface Stats {
  poolBalance: string;
  totalClaims: number;
  uniqueDevelopers: number;
  totalReturned: string;
}

export function PoolStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-bold">Pool stats</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pool balance"
          value={stats ? `${Number(stats.poolBalance).toFixed(4)} tBNB` : "..."}
        />
        <StatCard
          label="Total claims"
          value={stats ? String(stats.totalClaims) : "..."}
        />
        <StatCard
          label="Unique developers"
          value={stats ? String(stats.uniqueDevelopers) : "..."}
        />
        <StatCard
          label="Tokens returned"
          value={stats ? `${Number(stats.totalReturned).toFixed(4)} tBNB` : "..."}
        />
      </div>
    </section>
  );
}
