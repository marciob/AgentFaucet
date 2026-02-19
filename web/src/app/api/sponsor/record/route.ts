import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { publicClient, FAUCET_POOL_ADDRESS } from "@/lib/contract";
import { faucetPoolAbi } from "@/lib/abi";
import { decodeEventLog, isAddress, type Hash } from "viem";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, sponsorAddress, campaignName } = body as {
      txHash?: string;
      sponsorAddress?: string;
      campaignName?: string;
    };

    if (!txHash || !sponsorAddress || !isAddress(sponsorAddress)) {
      return NextResponse.json(
        { error: "txHash and valid sponsorAddress are required" },
        { status: 400 }
      );
    }

    // Verify the transaction on-chain
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as Hash,
    });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 400 }
      );
    }

    if (
      receipt.to?.toLowerCase() !== FAUCET_POOL_ADDRESS.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Transaction is not to the FaucetPool contract" },
        { status: 400 }
      );
    }

    // Find and decode the SponsorDeposited event
    let depositAmount: bigint | null = null;
    let eventSender: string | null = null;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: faucetPoolAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "SponsorDeposited") {
          const args = decoded.args as {
            sender: string;
            amount: bigint;
            campaignId: string;
            metadata: string;
          };
          eventSender = args.sender;
          depositAmount = args.amount;
          break;
        }
      } catch {
        // Not a matching event, skip
      }
    }

    if (!depositAmount || !eventSender) {
      return NextResponse.json(
        { error: "SponsorDeposited event not found in transaction" },
        { status: 400 }
      );
    }

    // Verify sender matches claimed sponsor
    if (eventSender.toLowerCase() !== sponsorAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Transaction sender does not match sponsorAddress" },
        { status: 400 }
      );
    }

    // Prevent duplicate recording
    const serviceClient = createSupabaseServiceClient();

    const { data: existing } = await serviceClient
      .from("af_campaigns")
      .select("id")
      .eq("deposit_tx_hash", txHash)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This deposit has already been recorded" },
        { status: 409 }
      );
    }

    // Insert campaign record
    const { error: insertError } = await serviceClient
      .from("af_campaigns")
      .insert({
        sponsor_address: sponsorAddress.toLowerCase(),
        name: campaignName || "Unnamed Deposit",
        deposit_tx_hash: txHash,
        amount_wei: depositAmount.toString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record deposit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Sponsor record error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
