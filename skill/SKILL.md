---
name: agentfaucet
description: Claim BNB Chain testnet tokens (tBNB) for AI agent development and testing.
---

# AgentFaucet Skill

Claim tBNB (BNB Chain testnet tokens) for your AI agent's wallet. Reputation-based allocation with daily limits determined by your GitHub developer profile.

## Setup

The following environment variables must be set:

- `FAUCET_TOKEN` (required) — Your agent JWT obtained from the AgentFaucet dashboard at the deployed app URL. Log in with GitHub, then copy the token from your dashboard.
- `FAUCET_URL` (optional) — API base URL. Defaults to `http://localhost:3000`.

## Commands

### Claim tokens

Request tBNB sent to a wallet address.

```bash
bash ./scripts/claim.sh <wallet_address> [amount]
```

- `wallet_address` — The `0x`-prefixed Ethereum/BNB address to receive tokens.
- `amount` (optional) — Amount in tBNB (e.g. `0.005`). Defaults to `0.005`.

**Example:**
```bash
bash ./scripts/claim.sh 0xYourWalletAddress 0.01
```

**Response (success):**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.01",
  "remaining": "0.005",
  "agentTokenId": 0
}
```

### Check status

View your current allocation, daily usage, and tier.

```bash
bash ./scripts/status.sh
```

**Response:**
```json
{
  "username": "octocat",
  "score": 65,
  "tier": 3,
  "dailyLimit": "0.015",
  "claimedToday": "0.005",
  "remaining": "0.01",
  "totalClaims": 12
}
```

## Tier System

| Tier | Min Score | Daily Limit |
|------|-----------|-------------|
| 1    | 0         | 0.005 tBNB  |
| 2    | 21        | 0.01 tBNB   |
| 3    | 51        | 0.015 tBNB  |
| 4    | 81        | 0.02 tBNB   |

Reputation score is calculated from your GitHub profile: account age, public repos, followers, web3-related repos, and recent activity.

## Error Handling

| HTTP Status | Meaning                  | Action                                      |
|-------------|--------------------------|---------------------------------------------|
| 401         | Invalid/expired token    | Re-authenticate at the dashboard             |
| 404         | Profile not found        | Log in via GitHub OAuth on the dashboard     |
| 429         | Daily rate limit reached | Wait until UTC midnight for limit reset      |
| 400         | Invalid wallet address   | Verify the address is a valid `0x` address   |
| 500         | Server error             | Retry after a short delay                    |

## Security

- Never log or expose `FAUCET_TOKEN` in output. It is read from environment variables only.
- Tokens expire after 30 days. Re-authenticate to get a new one.
- All claims are recorded on-chain via the FaucetPool contract on BNB Testnet.
