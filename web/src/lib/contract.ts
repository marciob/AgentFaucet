import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

export const FAUCET_POOL_ADDRESS = process.env
  .FAUCET_POOL_ADDRESS as `0x${string}`;

export const faucetPoolAbi = parseAbi([
  "function claim(address recipient, uint256 amount, uint256 agentTokenId) external",
  "function deposit() external payable",
  "function sponsorDeposit(string campaignId, string metadata) external payable",
  "function returnTokens(string developerId) external payable",
  "function setRelayer(address _relayer) external",
  "function setMaxClaimAmount(uint256 _max) external",
  "function emergencyWithdraw(address to) external",
  "function relayer() external view returns (address)",
  "function owner() external view returns (address)",
  "function maxClaimAmount() external view returns (uint256)",
  "event TokensClaimed(address indexed recipient, uint256 amount, uint256 timestamp, uint256 agentTokenId)",
  "event TokensDeposited(address indexed sender, uint256 amount)",
  "event SponsorDeposited(address indexed sender, uint256 amount, string campaignId, string metadata)",
  "event TokensReturned(address indexed sender, uint256 amount, string developerId)",
]);

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
