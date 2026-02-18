const steps = [
  {
    number: "01",
    title: "Sign in with GitHub",
    description:
      "Your GitHub profile is analyzed — account age, repos, web3 activity, followers — to calculate a reputation score.",
  },
  {
    number: "02",
    title: "Get your agent token",
    description:
      "You receive a JWT token from your dashboard. Set it as FAUCET_TOKEN in your agent's environment.",
  },
  {
    number: "03",
    title: "Agent claims via API",
    description:
      'Your agent calls POST /api/claim with a wallet address. The relayer sends tBNB — no gas needed.',
  },
  {
    number: "04",
    title: "Rate-limited by tier",
    description:
      "Daily limits scale with reputation: 0.005 tBNB for newcomers up to 0.02 tBNB for established builders.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold">How it works</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
        Three steps to give your AI agent access to testnet tokens.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col gap-3">
            <span className="font-mono text-sm text-accent">
              {step.number}
            </span>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Code preview */}
      <div className="mx-auto mt-16 max-w-2xl">
        <div className="rounded-xl border border-card-border bg-card">
          <div className="flex items-center gap-2 border-b border-card-border px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-xs text-muted">
              agent.py
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
            <span className="text-muted"># Your AI agent claims testnet tokens in one API call</span>
            {"\n"}
            <span className="text-blue-400">import</span>{" "}
            <span className="text-foreground">requests</span>
            {"\n\n"}
            <span className="text-foreground">resp</span>
            <span className="text-muted"> = </span>
            <span className="text-foreground">requests</span>
            <span className="text-muted">.</span>
            <span className="text-blue-400">post</span>
            <span className="text-muted">(</span>
            <span className="text-green-400">&quot;https://agentfaucet.app/api/claim&quot;</span>
            <span className="text-muted">,</span>
            {"\n"}
            {"    "}
            <span className="text-foreground">json</span>
            <span className="text-muted">=</span>
            <span className="text-muted">{"{"}</span>
            <span className="text-green-400">&quot;walletAddress&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-green-400">&quot;0x...&quot;</span>
            <span className="text-muted">{"}"}</span>
            <span className="text-muted">,</span>
            {"\n"}
            {"    "}
            <span className="text-foreground">headers</span>
            <span className="text-muted">=</span>
            <span className="text-muted">{"{"}</span>
            <span className="text-green-400">&quot;Authorization&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-green-400">f&quot;Bearer </span>
            <span className="text-accent">{"{"}</span>
            <span className="text-foreground">TOKEN</span>
            <span className="text-accent">{"}"}</span>
            <span className="text-green-400">&quot;</span>
            <span className="text-muted">{"}"}</span>
            {"\n"}
            <span className="text-muted">)</span>
            {"\n\n"}
            <span className="text-muted"># {"{"} &quot;success&quot;: true, &quot;txHash&quot;: &quot;0xabc...&quot;, &quot;amount&quot;: &quot;0.005&quot; {"}"}</span>
          </pre>
        </div>
      </div>
    </section>
  );
}
