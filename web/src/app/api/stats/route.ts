import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getPoolBalance } from "@/lib/contract";
import { formatEther } from "viem";

export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  try {
    const serviceClient = createSupabaseServiceClient();

    // Pool balance from contract
    const poolBalance = await getPoolBalance();

    // Total claims
    const { count: totalClaims } = await serviceClient
      .from("af_claims")
      .select("id", { count: "exact", head: true });

    // Unique developers
    const { count: uniqueDevs } = await serviceClient
      .from("af_profiles")
      .select("id", { count: "exact", head: true });

    // Total tokens returned
    const { data: returns } = await serviceClient
      .from("af_token_returns")
      .select("amount_wei");

    const totalReturned = (returns || []).reduce(
      (sum: bigint, r: { amount_wei: string }) => sum + BigInt(r.amount_wei),
      0n
    );

    // Total distributed (sum of all claims)
    const { data: claims } = await serviceClient
      .from("af_claims")
      .select("amount_wei");

    const totalDistributed = (claims || []).reduce(
      (sum: bigint, c: { amount_wei: string }) => sum + BigInt(c.amount_wei),
      0n
    );

    return NextResponse.json({
      poolBalance: formatEther(poolBalance),
      totalClaims: totalClaims || 0,
      uniqueDevelopers: uniqueDevs || 0,
      totalDistributed: formatEther(totalDistributed),
      totalReturned: formatEther(totalReturned),
    });
  } catch (error: unknown) {
    console.error("Stats error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
