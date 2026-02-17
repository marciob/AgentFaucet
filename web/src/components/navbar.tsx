import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b border-card-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-accent">Agent</span>
          <span className="text-xl font-bold text-foreground">Faucet</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/sponsor"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sponsors
          </Link>
          <LoginButton />
        </div>
      </div>
    </nav>
  );
}

function LoginButton() {
  return (
    <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover">
      Sign in with GitHub
    </button>
  );
}
