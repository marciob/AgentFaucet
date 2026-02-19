"use client";

import { useEffect, useRef, useState } from "react";
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

  // Sliding pill indicator
  const agentRef = useRef<HTMLButtonElement>(null);
  const humanRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase.auth]);

  useEffect(() => {
    const el = audience === "agent" ? agentRef.current : humanRef.current;
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [audience]);

  const handleGetStarted = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <main className="relative overflow-hidden">
      {/* ── Background Glow ─────────────────────────── */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[120px] glow-breathe" />

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-28 pb-12 text-center sm:pt-36 sm:pb-16">
        <span className="animate-in rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium tracking-wide text-accent">
          BNB Chain Testnet
        </span>

        <h1 className="animate-in stagger-1 mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          Testnet tokens for{" "}
          <span className="bg-gradient-to-r from-[#F0B90B] to-[#F5D060] bg-clip-text text-transparent">
            AI agents
          </span>
        </h1>

        <p className="animate-in stagger-2 mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          The first faucet built for autonomous agents. Reputation-based,
          gasless claims, powered by ERC-8004 identity on BNB Chain.
        </p>

        {/* ── Audience Toggle ─────────────────────────── */}
        <div className="animate-in stagger-3 relative mt-10 inline-flex rounded-full border border-card-border/60 bg-card/80 p-1 backdrop-blur-sm">
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width }}
          />
          <button
            ref={agentRef}
            onClick={() => setAudience("agent")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 sm:px-6 sm:py-2.5 ${
              audience === "agent"
                ? "text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m an Agent
          </button>
          <button
            ref={humanRef}
            onClick={() => setAudience("human")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 sm:px-6 sm:py-2.5 ${
              audience === "human"
                ? "text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            I&apos;m a Human
          </button>
        </div>
      </section>

      {/* ── Agent View ──────────────────────────────── */}
      {audience === "agent" && (
        <section className="relative mx-auto max-w-2xl px-6 pb-8">
          <p className="mb-5 text-center text-sm text-muted">
            Copy this into your AI agent — it will handle the rest.
          </p>

          {/* Terminal-style command box */}
          <div className="overflow-hidden rounded-xl border border-accent/20 bg-[#0d1117] transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_60px_rgba(240,185,11,0.06)]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[11px] text-muted/50">
                prompt
              </span>
            </div>
            <button
              onClick={() => {
                const text = `Read ${baseUrl}/agents.md and follow the instructions to claim tBNB`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="group relative w-full p-5 text-left"
            >
              <span
                className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                  copied
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-card-border bg-card text-muted opacity-0 group-hover:opacity-100"
                }`}
              >
                {copied ? (
                  <>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  "Click to copy"
                )}
              </span>
              <p className="font-mono text-sm leading-relaxed text-foreground/80">
                Read {baseUrl}/agents.md and follow the instructions to claim
                tBNB
              </p>
            </button>
          </div>

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <svg
                  className="h-4 w-4 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Gasless claims</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Your agent never needs gas. The relayer covers all transaction
                costs.
              </p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <svg
                  className="h-4 w-4 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Reputation-based</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Limits scale with your GitHub activity. Build more, claim more.
              </p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-[#2a2a2a]">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <svg
                  className="h-4 w-4 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">One API call</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                POST /api/claim with a wallet address. That&apos;s it.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Human View ──────────────────────────────── */}
      {audience === "human" && (
        <>
          {!user && (
            <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 text-center">
              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-[15px] font-semibold text-black transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(240,185,11,0.15)]"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                Get started with GitHub
              </button>
            </section>
          )}
          <HowItWorks />
        </>
      )}

      <PoolStats />

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-card-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-accent">Agent</span>
            <span className="font-bold text-foreground">Faucet</span>
          </div>
          <p className="text-sm text-muted">
            Built for the BNB AI Agent Hackathon
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/marciob/AgentFaucet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="/agents.md"
              target="_blank"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
