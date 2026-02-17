import { HowItWorks } from "@/components/how-it-works";
import { PoolStats } from "@/components/pool-stats";

export default function Home() {
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
        <div className="mt-8 flex gap-4">
          <button className="rounded-lg bg-accent px-6 py-3 font-medium text-black transition-colors hover:bg-accent-hover">
            Get started
          </button>
          <a
            href="https://github.com/marciob/AgentFaucet"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-card-border px-6 py-3 font-medium transition-colors hover:bg-card"
          >
            View on GitHub
          </a>
        </div>
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
