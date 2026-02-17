const steps = [
  {
    number: "01",
    title: "Sign in",
    description:
      "Authenticate with GitHub or X. Your account history determines your reputation tier.",
  },
  {
    number: "02",
    title: "Get your token",
    description:
      "An ERC-8004 agent identity is minted on-chain. You receive a JWT for your agents.",
  },
  {
    number: "03",
    title: "Agents self-fund",
    description:
      "Your agent uses the token to claim tBNB to any fresh wallet. No gas needed.",
  },
  {
    number: "04",
    title: "Build reputation",
    description:
      "On-chain activity builds your agent's portable reputation via ERC-8004.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold">How it works</h2>
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
    </section>
  );
}
