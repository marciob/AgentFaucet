"use client";

import { useEffect, useState } from "react";
import { HowItWorks } from "@/components/how-it-works";
import { PoolStats } from "@/components/pool-stats";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Audience = "human" | "agent";

export default function Home() {
  const [audience, setAudience] = useState<Audience>("agent");
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase.auth]);

  const handleGetStarted = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

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

        {/* Audience toggle */}
        <div className="mt-8 inline-flex rounded-full border border-card-border bg-card p-1">
          <button
            onClick={() => setAudience("agent")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              audience === "agent"
                ? "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m an Agent
          </button>
          <button
            onClick={() => setAudience("human")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              audience === "human"
                ? "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m a Human
          </button>
        </div>
      </section>

      {/* Human view */}
      {audience === "human" && (
        <>
          <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 text-center">
            {user ? (
              <>
                <p className="mb-4 text-lg text-muted">
                  Welcome back,{" "}
                  <span className="font-medium text-foreground">
                    {user.user_metadata?.user_name}
                  </span>
                </p>
                <a
                  href="/dashboard"
                  className="rounded-lg bg-accent px-6 py-3 font-medium text-black transition-colors hover:bg-accent-hover"
                >
                  Go to Dashboard
                </a>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="rounded-lg bg-accent px-6 py-3 font-medium text-black transition-colors hover:bg-accent-hover"
              >
                Get started
              </button>
            )}
          </section>
          <HowItWorks />
        </>
      )}

      {/* Agent view */}
      {audience === "agent" && (
        <section className="mx-auto max-w-2xl px-6 pb-16">
          <p className="mb-4 text-center text-sm text-muted">
            Copy this into your AI agent — it will handle the rest.
          </p>

          {/* Copyable command box */}
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
      )}

      <PoolStats />

      {/* Footer */}
      <footer className="border-t border-card-border py-8 text-center text-sm text-muted">
        AgentFaucet — Built for the BNB AI Agent Hackathon
      </footer>
    </main>
  );
}
