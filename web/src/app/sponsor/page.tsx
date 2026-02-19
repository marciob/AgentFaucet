"use client";

import { useCallback, useEffect, useState } from "react";
import { parseEther, formatEther, type Address } from "viem";
import { StatCard } from "@/components/stat-card";
import { faucetPoolAbi } from "@/lib/abi";
import {
  hasInjectedWallet,
  connectWallet,
  ensureBscTestnet,
  getBrowserWalletClient,
  getBrowserPublicClient,
} from "@/lib/wallet";

const FAUCET_POOL_ADDRESS = process.env
  .NEXT_PUBLIC_FAUCET_POOL_ADDRESS as Address;

interface Campaign {
  id: number;
  name: string;
  amount: string;
  txHash: string;
  createdAt: string;
}

interface Stats {
  totalSponsored: string;
  agentsFunded: number;
  sponsorDeposits: number;
  sponsorTotal: string;
  sponsorCampaigns: Campaign[];
}

export default function SponsorPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [amount, setAmount] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // MetaMask injects window.ethereum async — poll briefly after mount
  useEffect(() => {
    if (hasInjectedWallet()) {
      setWalletReady(true);
      return;
    }
    // Check a few times in case injection is delayed
    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      if (hasInjectedWallet()) {
        setWalletReady(true);
        clearInterval(id);
      } else if (attempts >= 10) {
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  const fetchStats = useCallback(async (address?: string) => {
    const url = address
      ? `/api/sponsor/stats?address=${address}`
      : "/api/sponsor/stats";
    const res = await fetch(url);
    if (res.ok) {
      setStats(await res.json());
    }
  }, []);

  // Load global stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Re-fetch with address when connected
  useEffect(() => {
    if (account) fetchStats(account);
  }, [account, fetchStats]);

  // Wallet event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0] as Address);
      }
    };

    const handleChainChanged = () => {
      // Reload stats on chain change
      if (account) fetchStats(account);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, fetchStats]);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const addr = await connectWallet();
      await ensureBscTestnet();
      setAccount(addr);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect";
      if (msg.includes("4001") || msg.includes("rejected")) {
        setError("Connection rejected");
      } else {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDeposit() {
    if (!account) return;
    setError(null);
    setTxStatus(null);

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setDepositing(true);
    try {
      await ensureBscTestnet();
      setTxStatus("Confirm in wallet...");

      const walletClient = getBrowserWalletClient(account);
      const publicClient = getBrowserPublicClient();

      const txHash = await walletClient.writeContract({
        address: FAUCET_POOL_ADDRESS,
        abi: faucetPoolAbi,
        functionName: "sponsorDeposit",
        args: [campaignName || "general", ""],
        value: parseEther(amount),
      });

      setTxStatus("Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setTxStatus("Recording deposit...");
      const res = await fetch("/api/sponsor/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          sponsorAddress: account,
          campaignName: campaignName || "Unnamed Deposit",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record deposit");
      }

      setTxStatus("Deposit successful!");
      setAmount("");
      setCampaignName("");
      await fetchStats(account);

      setTimeout(() => setTxStatus(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deposit failed";
      if (msg.includes("4001") || msg.includes("rejected") || msg.includes("denied")) {
        setError("Transaction rejected");
      } else {
        setError(msg);
      }
      setTxStatus(null);
    } finally {
      setDepositing(false);
    }
  }

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="animate-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sponsor Dashboard
          </h1>
          <p className="mt-1.5 text-muted">
            Fund the pool and track agent activity from your campaigns.
          </p>
        </div>

        {/* Wallet connection */}
        {account ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-card px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-sm">
              {truncateAddress(account)}
            </span>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting || !walletReady}
            className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            {!walletReady
              ? "No wallet detected"
              : connecting
                ? "Connecting..."
                : "Connect Wallet"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3">
        <div className="animate-in stagger-1">
          <StatCard
            label="Your deposits"
            value={
              account && stats
                ? `${stats.sponsorTotal} tBNB`
                : account
                  ? "..."
                  : "-- tBNB"
            }
          />
        </div>
        <div className="animate-in stagger-2">
          <StatCard
            label="Agents funded"
            value={stats ? String(stats.agentsFunded) : "..."}
          />
        </div>
        <div className="animate-in stagger-3 col-span-2 sm:col-span-1">
          <StatCard
            label="Total sponsored"
            value={
              stats ? `${stats.totalSponsored} tBNB` : "..."
            }
          />
        </div>
      </div>

      {/* Deposit section */}
      <section className="mt-12 rounded-xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Deposit to pool
        </h2>
        <p className="mt-1 text-sm text-muted">
          Sponsor testnet tokens for AI agents building on BNB Chain.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount (tBNB)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted/50"
          />
          <input
            type="text"
            placeholder="Campaign name (optional)"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted/50"
          />
          <button
            onClick={handleDeposit}
            disabled={!account || depositing || !amount}
            className="shrink-0 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-black transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            {depositing ? "Depositing..." : "Deposit"}
          </button>
        </div>

        {/* Status / error messages */}
        {txStatus && (
          <p className="mt-3 text-sm text-accent">{txStatus}</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
        {!account && (
          <p className="mt-3 text-sm text-muted">
            Connect your wallet to deposit.
          </p>
        )}
      </section>

      {/* Campaign activity */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaign activity
        </h2>

        {stats && stats.sponsorCampaigns.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-card-border sm:block">
              <table className="w-full text-sm">
                <thead className="bg-card text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Tx Hash</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sponsorCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-card-border transition-colors hover:bg-card/50"
                    >
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.amount} tBNB</td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://testnet.bscscan.com/tx/${c.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-accent hover:underline"
                        >
                          {c.txHash.slice(0, 10)}...
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-4 space-y-3 sm:hidden">
              {stats.sponsorCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-card-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-medium">
                      {c.amount} tBNB
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <a
                      href={`https://testnet.bscscan.com/tx/${c.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-accent hover:underline"
                    >
                      {c.txHash.slice(0, 10)}...
                    </a>
                    <span>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-card-border bg-card py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-border/50">
              <svg
                className="h-5 w-5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium">
              {account
                ? "No deposits yet"
                : "No campaign activity yet"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {account
                ? "Make your first deposit above to get started."
                : "Connect your wallet and deposit to see activity."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
