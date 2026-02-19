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
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Pool stats</h2>
        <span className="flex items-center gap-1.5 rounded-full border border-card-border bg-card px-2.5 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Live
        </span>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="animate-in stagger-1">
          <StatCard
            label="Pool balance"
            value={
              stats ? `${Number(stats.poolBalance).toFixed(4)} tBNB` : "..."
            }
          />
        </div>
        <div className="animate-in stagger-2">
          <StatCard
            label="Total claims"
            value={stats ? String(stats.totalClaims) : "..."}
          />
        </div>
        <div className="animate-in stagger-3">
          <StatCard
            label="Unique developers"
            value={stats ? String(stats.uniqueDevelopers) : "..."}
          />
        </div>
        <div className="animate-in stagger-4">
          <StatCard
            label="Tokens returned"
            value={
              stats
                ? `${Number(stats.totalReturned).toFixed(4)} tBNB`
                : "..."
            }
          />
        </div>
      </div>
    </section>
  );
}
