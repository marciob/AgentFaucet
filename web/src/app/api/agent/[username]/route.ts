import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/agent/:username
 *
 * Serves the ERC-8004 agent registration file (agentURI content).
 * This is the JSON-LD document that the on-chain tokenURI points to.
 * Dynamic HTTPS endpoint — no IPFS needed.
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

  const agentFile = {
    "@context": "https://schema.org",
    "@type": "SoftwareAgent",
    name: `AgentFaucet: ${profile.github_username}`,
    description: `AI agent identity for ${profile.github_username} on AgentFaucet (BNB Chain Testnet)`,
    identifier: profile.agent_token_id
      ? `erc8004:bsc-testnet:${profile.agent_token_id}`
      : null,
    provider: {
      "@type": "Organization",
      name: "AgentFaucet",
      url: origin,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "githubUsername",
        value: profile.github_username,
      },
      {
        "@type": "PropertyValue",
        name: "githubId",
        value: profile.github_id,
      },
      {
        "@type": "PropertyValue",
        name: "reputationScore",
        value: profile.reputation_score,
      },
      {
        "@type": "PropertyValue",
        name: "tier",
        value: profile.tier,
      },
      {
        "@type": "PropertyValue",
        name: "chain",
        value: "bsc-testnet",
      },
    ],
  };

  return NextResponse.json(agentFile, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
