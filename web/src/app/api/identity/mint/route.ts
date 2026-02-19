import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { mintAgentIdentity } from "@/lib/identity";
import { signAgentToken } from "@/lib/jwt";

/**
 * POST /api/identity/mint
 *
 * Retry endpoint for ERC-8004 identity minting.
 * Authenticated via Supabase session (cookie-based).
 * Idempotent — returns existing ID if already minted.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceClient();

  const { data: profile } = await service
    .from("af_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Idempotent: already minted
  if (profile.agent_token_id) {
    return NextResponse.json({
      success: true,
      agentTokenId: profile.agent_token_id,
      message: "Identity already minted",
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://agentfaucet.vercel.app";
  const agentURI = `${baseUrl}/api/agent/${profile.github_username}`;

  try {
    const agentId = await mintAgentIdentity(agentURI);

    // Re-sign JWT with the real agentTokenId
    const newJwt = await signAgentToken({
      sub: `github:${profile.github_id}`,
      username: profile.github_username,
      score: profile.reputation_score,
      tier: profile.tier,
      dailyLimitWei: profile.daily_limit_wei,
      agentTokenId: Number(agentId),
      provider: "github",
    });

    await service
      .from("af_profiles")
      .update({
        agent_token_id: Number(agentId),
        jwt_token: newJwt,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      agentTokenId: Number(agentId),
      message: "Identity minted successfully",
    });
  } catch (error) {
    console.error("Identity mint failed:", error);
    return NextResponse.json(
      { error: "Mint failed. Please try again." },
      { status: 500 }
    );
  }
}
