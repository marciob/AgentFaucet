import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function connectWallet(): Promise<Address> {
  if (!window.ethereum) throw new Error("No wallet found");
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts[0]) throw new Error("No account returned");
  return accounts[0] as Address;
}

export async function ensureBscTestnet(): Promise<void> {
  if (!window.ethereum) throw new Error("No wallet found");

  const chainId = (await window.ethereum.request({
    method: "eth_chainId",
  })) as string;

  if (chainId === "0x61") return; // already on BSC Testnet (97)

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x61" }],
    });
  } catch (err: unknown) {
    // 4902 = chain not added yet
    if ((err as { code?: number }).code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x61",
            chainName: "BNB Smart Chain Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export function getBrowserWalletClient(account: Address) {
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: custom(window.ethereum!),
  });
}

export function getBrowserPublicClient() {
  return createPublicClient({
    chain: bscTestnet,
    transport: http("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
  });
}
