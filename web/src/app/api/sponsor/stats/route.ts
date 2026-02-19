import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isAddress, formatEther } from "viem";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createSupabaseServiceClient();
    const address = request.nextUrl.searchParams.get("address");

    // Global stats: total sponsored across all campaigns
    const { data: allCampaigns } = await serviceClient
      .from("af_campaigns")
      .select("amount_wei");

    const totalSponsored = (allCampaigns || []).reduce(
      (sum: bigint, c: { amount_wei: string }) => sum + BigInt(c.amount_wei),
      0n
    );

    // Unique agents funded (distinct wallet_address from af_claims)
    const { count: agentsFunded } = await serviceClient
      .from("af_claims")
      .select("wallet_address", { count: "exact", head: true });

    // Per-sponsor data if address is provided
    let sponsorDeposits = 0;
    let sponsorTotal = 0n;
    let sponsorCampaigns: Array<{
      id: number;
      name: string;
      amount_wei: string;
      deposit_tx_hash: string;
      created_at: string;
    }> = [];

    if (address && isAddress(address)) {
      const { data: campaigns } = await serviceClient
        .from("af_campaigns")
        .select("id, name, amount_wei, deposit_tx_hash, created_at")
        .eq("sponsor_address", address.toLowerCase())
        .order("created_at", { ascending: false });

      sponsorCampaigns = campaigns || [];
      sponsorDeposits = sponsorCampaigns.length;
      sponsorTotal = sponsorCampaigns.reduce(
        (sum: bigint, c: { amount_wei: string }) => sum + BigInt(c.amount_wei),
        0n
      );
    }

    return NextResponse.json({
      totalSponsored: formatEther(totalSponsored),
      agentsFunded: agentsFunded || 0,
      sponsorDeposits,
      sponsorTotal: formatEther(sponsorTotal),
      sponsorCampaigns: sponsorCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        amount: formatEther(BigInt(c.amount_wei)),
        txHash: c.deposit_tx_hash,
        createdAt: c.created_at,
      })),
    });
  } catch (error: unknown) {
    console.error("Sponsor stats error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
