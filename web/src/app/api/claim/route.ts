import { NextRequest, NextResponse } from "next/server";
import { verifyAgentToken } from "@/lib/jwt";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  getWalletClient,
  publicClient,
  FAUCET_POOL_ADDRESS,
  faucetPoolAbi,
} from "@/lib/contract";
import { isAddress, parseEther, formatEther } from "viem";

export async function POST(request: NextRequest) {
  try {
    // Extract JWT from Authorization header
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

    // Parse request body
    const body = await request.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const claimAmount = amount
      ? parseEther(String(amount))
      : parseEther("0.1");

    // Check daily rate limit
    const serviceClient = createSupabaseServiceClient();
    const today = new Date().toISOString().split("T")[0];

    // Find profile by sub (github:id)
    const githubId = payload.sub.split(":")[1];
    const { data: profile } = await serviceClient
      .from("af_profiles")
      .select("id, daily_limit_wei, tier")
      .eq("github_id", parseInt(githubId))
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please authenticate first." },
        { status: 404 }
      );
    }

    // Get or create daily usage
    const { data: usage } = await serviceClient
      .from("af_daily_usage")
      .select("amount_claimed_wei")
      .eq("profile_id", profile.id)
      .eq("date", today)
      .single();

    const claimedToday = BigInt(usage?.amount_claimed_wei || "0");
    const dailyLimit = BigInt(profile.daily_limit_wei);
    const remaining = dailyLimit - claimedToday;

    if (claimAmount > remaining) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          dailyLimit: formatEther(dailyLimit),
          claimedToday: formatEther(claimedToday),
          remaining: formatEther(remaining),
        },
        { status: 429 }
      );
    }

    // Send transaction via relayer
    const walletClient = getWalletClient();
    const agentTokenId = BigInt(payload.agentTokenId || 0);

    const txHash = await walletClient.writeContract({
      address: FAUCET_POOL_ADDRESS,
      abi: faucetPoolAbi,
      functionName: "claim",
      args: [walletAddress as `0x${string}`, claimAmount, agentTokenId],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Update daily usage
    const newClaimed = (claimedToday + claimAmount).toString();
    await serviceClient.from("af_daily_usage").upsert(
      {
        profile_id: profile.id,
        date: today,
        amount_claimed_wei: newClaimed,
      },
      { onConflict: "profile_id,date" }
    );

    // Record claim
    await serviceClient.from("af_claims").insert({
      profile_id: profile.id,
      wallet_address: walletAddress,
      amount_wei: claimAmount.toString(),
      tx_hash: txHash,
      agent_token_id: Number(agentTokenId),
    });

    const newRemaining = dailyLimit - claimedToday - claimAmount;

    return NextResponse.json({
      success: true,
      txHash,
      amount: formatEther(claimAmount),
      remaining: formatEther(newRemaining),
      agentTokenId: Number(agentTokenId),
    });
  } catch (error: unknown) {
    console.error("Claim error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
