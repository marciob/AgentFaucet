import { NextRequest, NextResponse } from "next/server";
import { verifyAgentToken } from "@/lib/jwt";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatEther } from "viem";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = await verifyAgentToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const serviceClient = createSupabaseServiceClient();
    const githubId = payload.sub.split(":")[1];

    const { data: profile } = await serviceClient
      .from("af_profiles")
      .select("*")
      .eq("github_id", parseInt(githubId))
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await serviceClient
      .from("af_daily_usage")
      .select("amount_claimed_wei")
      .eq("profile_id", profile.id)
      .eq("date", today)
      .single();

    const claimedToday = BigInt(usage?.amount_claimed_wei || "0");
    const dailyLimit = BigInt(profile.daily_limit_wei);

    // Get total claims count
    const { count: totalClaims } = await serviceClient
      .from("af_claims")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id);

    return NextResponse.json({
      username: profile.github_username,
      score: profile.reputation_score,
      tier: profile.tier,
      dailyLimit: formatEther(dailyLimit),
      claimedToday: formatEther(claimedToday),
      remaining: formatEther(dailyLimit - claimedToday),
      agentTokenId: profile.agent_token_id,
      totalClaims: totalClaims || 0,
    });
  } catch (error: unknown) {
    console.error("Status error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
