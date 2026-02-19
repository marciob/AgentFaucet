import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

export { faucetPoolAbi } from "./abi";

export const FAUCET_POOL_ADDRESS = process.env
  .FAUCET_POOL_ADDRESS as `0x${string}`;

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
});

export function getWalletClient() {
  const account = privateKeyToAccount(
    process.env.PRIVATE_KEY as `0x${string}`
  );
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
  });
}

export async function getPoolBalance(): Promise<bigint> {
  return publicClient.getBalance({ address: FAUCET_POOL_ADDRESS });
}
