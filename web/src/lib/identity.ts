import { parseAbi, decodeEventLog } from "viem";
import { publicClient, getWalletClient } from "./contract";

export const IDENTITY_REGISTRY_ADDRESS =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;

export const identityRegistryAbi = parseAbi([
  "function register(string agentURI) external returns (uint256 agentId)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

/**
 * Mint an ERC-8004 agent identity on the BSC Testnet IdentityRegistry.
 * Uses the relayer wallet (same PRIVATE_KEY as the faucet) as the caller.
 * Returns the on-chain agentId (token ID).
 */
export async function mintAgentIdentity(agentURI: string): Promise<bigint> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: identityRegistryAbi,
    functionName: "register",
    args: [agentURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "reverted") {
    throw new Error("Identity registration transaction reverted");
  }

  // Extract agentId from the Registered event
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: identityRegistryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "Registered") {
        return (decoded.args as { agentId: bigint }).agentId;
      }
    } catch {
      // Not our event, skip
    }
  }

  throw new Error("Registered event not found in transaction receipt");
}
