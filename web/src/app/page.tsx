"use client";

import { useState } from "react";
import { HowItWorks } from "@/components/how-it-works";
import { PoolStats } from "@/components/pool-stats";

export default function Home() {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-32 pb-16 text-center">
        <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          BNB Chain Testnet
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight">
          Testnet tokens for{" "}
          <span className="text-accent">AI agents</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          The first faucet built for autonomous agents. Reputation-based,
          gasless claims, powered by ERC-8004 identity on BNB Chain.
        </p>
      </section>

      {/* Agent instruction */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <p className="mb-4 text-center text-sm text-muted">
          Copy this into your AI agent — it will handle the rest.
        </p>

        <button
          onClick={() => {
            const text = `Read ${baseUrl}/agents.md and follow the instructions to claim tBNB`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="group relative w-full cursor-pointer rounded-xl border border-accent/30 bg-[#0d1117] p-5 text-left transition-colors hover:border-accent/50"
        >
          <span className="absolute top-3 right-3 rounded-md border border-card-border bg-card px-2.5 py-1 text-xs text-muted transition-opacity group-hover:opacity-100 opacity-0">
            {copied ? "Copied!" : "Click to copy"}
          </span>
          <p className="font-mono text-sm leading-relaxed">
            Read {baseUrl}/agents.md and follow the instructions to claim tBNB
          </p>
        </button>
      </section>

      <PoolStats />
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t border-card-border py-8 text-center text-sm text-muted">
        AgentFaucet — Built for the BNB AI Agent Hackathon
      </footer>
    </main>
  );
}
