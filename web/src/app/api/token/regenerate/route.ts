import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { signAgentToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Get current user from session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // read-only in route handlers
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch current profile
    const serviceClient = createSupabaseServiceClient();
    const { data: profile } = await serviceClient
      .from("af_profiles")
      .select(
        "github_id, github_username, reputation_score, tier, daily_limit_wei, agent_token_id"
      )
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Sign a fresh JWT with current profile data
    const newJwt = await signAgentToken({
      sub: `github:${profile.github_id}`,
      username: profile.github_username,
      score: profile.reputation_score,
      tier: profile.tier,
      dailyLimitWei: profile.daily_limit_wei,
      agentTokenId: profile.agent_token_id,
      provider: "github",
    });

    // Update in DB
    await serviceClient
      .from("af_profiles")
      .update({ jwt_token: newJwt })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token regeneration error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate token" },
      { status: 500 }
    );
  }
}
