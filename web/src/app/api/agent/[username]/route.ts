import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const TIER_NAMES: Record<number, string> = {
  1: "Newcomer",
  2: "Developer",
  3: "Active Builder",
  4: "Established",
};

/**
 * GET /api/agent/:username
 *
 * Serves ERC-721 compatible metadata for the ERC-8004 agent identity NFT.
 * The on-chain tokenURI points here. BSCScan and NFT platforms read this.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("af_profiles")
    .select(
      "github_username, github_id, reputation_score, tier, agent_token_id, daily_limit_wei"
    )
    .eq("github_username", username)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  // ERC-721 metadata standard — this is what BSCScan/OpenSea read
  const metadata = {
    name: `AgentFaucet: ${profile.github_username}`,
    description: `AI agent identity for ${profile.github_username} on AgentFaucet (BNB Chain Testnet). Tier ${profile.tier} — ${TIER_NAMES[profile.tier] || "Unknown"}. Reputation score: ${profile.reputation_score}/100.`,
    image: `${origin}/agent-nft.png`,
    external_url: `${origin}/dashboard`,
    attributes: [
      {
        trait_type: "GitHub Username",
        value: profile.github_username,
      },
      {
        trait_type: "Reputation Score",
        value: profile.reputation_score,
        max_value: 100,
      },
      {
        trait_type: "Tier",
        value: TIER_NAMES[profile.tier] || `Tier ${profile.tier}`,
      },
      {
        trait_type: "Chain",
        value: "BNB Chain Testnet",
      },
      {
        display_type: "number",
        trait_type: "Token ID",
        value: profile.agent_token_id,
      },
    ],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
