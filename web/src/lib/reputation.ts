interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  created_at: string;
  public_repos: number;
  followers: number;
}

interface GitHubRepo {
  language: string | null;
  topics: string[];
  pushed_at: string;
}

interface ReputationResult {
  score: number;
  tier: number;
  dailyLimitWei: string;
  breakdown: {
    accountAge: number;
    repoCount: number;
    followers: number;
    web3Repos: number;
    recentActivity: number;
  };
}

const TIER_LIMITS: Record<number, string> = {
  1: "5000000000000000",   // 0.005 tBNB
  2: "10000000000000000",  // 0.01 tBNB
  3: "15000000000000000",  // 0.015 tBNB
  4: "20000000000000000",  // 0.02 tBNB
};

function getTier(score: number): number {
  if (score >= 81) return 4;
  if (score >= 51) return 3;
  if (score >= 21) return 2;
  return 1;
}

export async function calculateReputation(
  accessToken: string
): Promise<ReputationResult> {
  // Fetch profile
  const profileRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile: GitHubProfile = await profileRes.json();

  // Fetch repos (up to 100)
  const reposRes = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const repos: GitHubRepo[] = await reposRes.json();

  // Account age (max 25 points)
  const accountAgeYears =
    (Date.now() - new Date(profile.created_at).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  const accountAge = Math.min(25, Math.floor(accountAgeYears * 5));

  // Public repo count (max 15 points)
  const repoCount = Math.min(15, Math.floor(profile.public_repos / 2));

  // Followers (max 10 points)
  const followers = Math.min(10, Math.floor(profile.followers / 5));

  // Web3/Solidity repos (max 20 points)
  const web3Keywords = [
    "solidity",
    "web3",
    "ethereum",
    "blockchain",
    "smart-contract",
    "defi",
    "nft",
    "bnb",
    "bsc",
    "hardhat",
    "foundry",
    "truffle",
    "wagmi",
    "viem",
    "ethers",
  ];
  const web3RepoCount = repos.filter((repo) => {
    const lang = (repo.language || "").toLowerCase();
    const topics = repo.topics.map((t) => t.toLowerCase());
    return (
      lang === "solidity" ||
      web3Keywords.some((kw) => topics.includes(kw))
    );
  }).length;
  const web3Repos = Math.min(20, web3RepoCount * 4);

  // Recent push activity — last 90 days (max 15 points)
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentPushes = repos.filter(
    (repo) => new Date(repo.pushed_at).getTime() > ninetyDaysAgo
  ).length;
  const recentActivity = Math.min(15, recentPushes * 3);

  // Contribution frequency placeholder (max 15 points) — use recent activity as proxy
  // Full implementation would use the contributions API
  const score = Math.min(
    100,
    accountAge + repoCount + followers + web3Repos + recentActivity
  );
  const tier = getTier(score);

  return {
    score,
    tier,
    dailyLimitWei: TIER_LIMITS[tier],
    breakdown: {
      accountAge,
      repoCount,
      followers,
      web3Repos,
      recentActivity,
    },
  };
}
