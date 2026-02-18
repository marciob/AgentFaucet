import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "agentfaucet.app";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  const markdown = `# AgentFaucet

Claim BNB Chain testnet tokens (tBNB) via API. Reputation-based daily limits.

## Setup

1. A human developer must register at ${baseUrl} with GitHub OAuth
2. Sign in and copy the JWT token from the dashboard
3. Set as environment variable:
   export FAUCET_TOKEN="<your-jwt-token>"

## API Endpoints

### POST ${baseUrl}/api/claim

Claim testnet tBNB. Requires authentication.

**Headers:**
  Authorization: Bearer $FAUCET_TOKEN
  Content-Type: application/json

**Request body:**
  {
    "walletAddress": "0xYourWalletAddress",
    "amount": "0.005"
  }

- walletAddress (required): A valid EVM address to receive tBNB
- amount (optional): Amount in tBNB to claim. Defaults to "0.005". Must not exceed your daily remaining limit.

**Success response (200):**
  {
    "success": true,
    "txHash": "0xabc123...",
    "amount": "0.005",
    "remaining": "0.01"
  }

**Error responses:**
- 400: Invalid wallet address
- 401: Missing or invalid token
- 404: Profile not found (register at ${baseUrl} first)
- 429: Daily rate limit exceeded (response includes remaining/limit details)

---

### GET ${baseUrl}/api/status

Check your current tier, daily limit, and remaining allowance. Requires authentication.

**Headers:**
  Authorization: Bearer $FAUCET_TOKEN

**Success response (200):**
  {
    "username": "octocat",
    "score": 65,
    "tier": 3,
    "dailyLimit": "0.015",
    "claimedToday": "0.005",
    "remaining": "0.01",
    "totalClaims": 12
  }

---

### GET ${baseUrl}/api/stats

Public endpoint — no authentication required. Returns pool-wide statistics.

**Success response (200):**
  {
    "poolBalance": "0.5",
    "totalClaims": 42,
    "uniqueDevelopers": 15,
    "totalDistributed": "0.21",
    "totalReturned": "0.05"
  }

## Tiers

Your tier is determined by your GitHub reputation score:

| Tier | Score Range | Daily Limit |
|------|-------------|-------------|
| 1    | 0–20        | 0.005 tBNB  |
| 2    | 21–50       | 0.01 tBNB   |
| 3    | 51–80       | 0.015 tBNB  |
| 4    | 81+         | 0.02 tBNB   |

## Error Codes

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Invalid wallet address               |
| 401    | Missing or invalid authorization     |
| 404    | Profile not found — register first   |
| 429    | Daily rate limit exceeded            |
| 500    | Internal server error                |

## Example (Python)

import requests, os

resp = requests.post(
    "${baseUrl}/api/claim",
    json={"walletAddress": "0xYourAddress", "amount": "0.005"},
    headers={"Authorization": f"Bearer {os.environ['FAUCET_TOKEN']}"}
)
print(resp.json())

## Example (curl)

curl -X POST ${baseUrl}/api/claim \\
  -H "Authorization: Bearer $FAUCET_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"walletAddress": "0xYourAddress", "amount": "0.005"}'

## Source

GitHub: https://github.com/marciob/AgentFaucet
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
