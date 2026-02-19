import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "agentfaucet.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  const markdown = `# AgentFaucet

Claim tBNB (BNB Chain testnet tokens) via API. Reputation-based daily limits tied to your developer's GitHub profile.

## Setup checklist

Before claiming, you need two things: a **faucet token** and a **wallet address**. Work through these steps in order.

### 1. Faucet token

Ask the user if they have a faucet token.

- **If the user provides a token**: use it as the Bearer token in API calls below.
  export FAUCET_TOKEN="<the-token>"
- **If the user does NOT have a token**: tell them to sign in at ${baseUrl}/dashboard with GitHub, then copy the agent token and paste it here. Wait for the token before continuing.

### 2. Wallet address

Ask the user: "Do you have an EVM wallet address to receive tBNB?"

- **If the user provides an address**: use it.
  export WALLET_ADDRESS="<the-address>"
- **If the user does NOT have a wallet**: tell them: "No problem — I can create one for you right now and save it securely to your .env file." Then follow the guide at:
  ${baseUrl}/wallet-setup.md
  Read that page and follow the instructions for your environment (Node.js or Python). After creating the wallet, load the address:
  export WALLET_ADDRESS=$(grep WALLET_ADDRESS .env | cut -d= -f2)

## Claim tokens

Call the API to claim tBNB:

curl -s -X POST "${baseUrl}/api/claim" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $FAUCET_TOKEN" \\
  -d '{"walletAddress": "'$WALLET_ADDRESS'", "amount": "0.005"}'

- walletAddress (required): A valid EVM address (0x + 40 hex chars)
- amount (optional): Amount in tBNB. Defaults to "0.005". Must not exceed your daily limit.

**Success response (200):**
  { "success": true, "txHash": "0x...", "amount": "0.005", "remaining": "0.01" }

After a successful claim, show the user the txHash and remaining daily allowance.

## Check status

curl -s "${baseUrl}/api/status" \\
  -H "Authorization: Bearer $FAUCET_TOKEN"

**Response:**
  { "username": "octocat", "score": 65, "tier": 3, "dailyLimit": "0.015", "claimedToday": "0.005", "remaining": "0.01" }

## Check pool stats (no auth needed)

curl -s "${baseUrl}/api/stats"

## Tiers

| Tier | Score | Daily Limit |
|------|-------|-------------|
| 1    | 0–20  | 0.005 tBNB  |
| 2    | 21–50 | 0.01 tBNB   |
| 3    | 51–80 | 0.015 tBNB  |
| 4    | 81+   | 0.02 tBNB   |

## Error handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Invalid address | Check the wallet address format (must be 0x + 40 hex chars) |
| 401 | Invalid/expired token | Ask user to go to the dashboard and click **Regenerate** to get a new token |
| 404 | Profile not found | Ask user to sign in via GitHub OAuth first |
| 429 | Daily limit reached | Show remaining limit, tell user to wait until UTC midnight |
| 500 | Server error | Retry once, then report the error |

## Security

- Never log or expose FAUCET_TOKEN in output
- Never log or expose WALLET_PRIVATE_KEY in output
- Store secrets in .env with chmod 600 permissions
- Tokens expire after 30 days
- If a token is leaked or compromised, the user can regenerate it at ${baseUrl}/dashboard — the old token is immediately invalidated
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
