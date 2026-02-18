import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { calculateReputation } from "@/lib/reputation";
import { signAgentToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  // Create a supabase client that can set cookies on the response
  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const user = data.session.user;
  const providerToken = data.session.provider_token;

  // Use service client to write to af_profiles (bypasses RLS)
  const serviceClient = createSupabaseServiceClient();

  // Check if profile exists
  const { data: existingProfile } = await serviceClient
    .from("af_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingProfile) {
    // Calculate reputation from GitHub data
    let score = 0;
    let tier = 1;
    let dailyLimitWei = "500000000000000000";
    let githubUsername = user.user_metadata?.user_name || "";
    let githubId = user.user_metadata?.provider_id
      ? parseInt(user.user_metadata.provider_id)
      : 0;

    if (providerToken) {
      try {
        const reputation = await calculateReputation(providerToken);
        score = reputation.score;
        tier = reputation.tier;
        dailyLimitWei = reputation.dailyLimitWei;
      } catch (e) {
        console.error("Reputation calculation failed:", e);
      }
    }

    // Generate agent JWT
    const agentJwt = await signAgentToken({
      sub: `github:${githubId}`,
      username: githubUsername,
      score,
      tier,
      dailyLimitWei,
      agentTokenId: null,
      provider: "github",
    });

    // Create profile
    await serviceClient.from("af_profiles").insert({
      id: user.id,
      github_username: githubUsername,
      github_id: githubId,
      avatar_url: user.user_metadata?.avatar_url || "",
      reputation_score: score,
      tier,
      daily_limit_wei: dailyLimitWei,
      jwt_token: agentJwt,
    });
  }

  return response;
}
