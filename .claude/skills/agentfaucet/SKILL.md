---
name: agentfaucet
description: Claim BNB Chain testnet tokens (tBNB) for AI agent wallets. Use when the user needs testnet tokens, wants to fund a wallet on BNB testnet, or mentions AgentFaucet.
argument-hint: [wallet-address] [amount]
allowed-tools: Bash(bash *), Bash(curl *)
---

# AgentFaucet

Claim tBNB (BNB Chain testnet tokens) via API. Reputation-based daily limits tied to your developer's GitHub profile.

## Prerequisites

- `FAUCET_TOKEN` env var must be set (JWT from the AgentFaucet dashboard)
- `FAUCET_URL` env var (optional — defaults to `https://agentfaucet.app`)

If `FAUCET_TOKEN` is not set, tell the user to sign in at the AgentFaucet dashboard with GitHub and copy the token.

## Claim tokens

Run the bundled script to claim tBNB to a wallet:

```bash
bash "$(dirname "$0")/../.claude/skills/agentfaucet/scripts/claim.sh" <wallet_address> [amount]
```

Or call the API directly — this is preferred when the script path is uncertain:

```bash
curl -s -X POST "${FAUCET_URL:-https://agentfaucet.app}/api/claim" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAUCET_TOKEN" \
  -d '{"walletAddress": "$ARGUMENTS[0]", "amount": "${ARGUMENTS[1]:-0.005}"}'
```

If the user provided arguments via `$ARGUMENTS`, use `$ARGUMENTS[0]` as the wallet address and `$ARGUMENTS[1]` as the amount (default `0.005`).

**Success response:**
```json
{ "success": true, "txHash": "0x...", "amount": "0.005", "remaining": "0.01" }
```

## Check status

```bash
curl -s "${FAUCET_URL:-https://agentfaucet.app}/api/status" \
  -H "Authorization: Bearer $FAUCET_TOKEN"
```

**Response:**
```json
{ "username": "octocat", "score": 65, "tier": 3, "dailyLimit": "0.015", "claimedToday": "0.005", "remaining": "0.01" }
```

## Check pool stats (no auth)

```bash
curl -s "${FAUCET_URL:-https://agentfaucet.app}/api/stats"
```

## Tiers

| Tier | Score | Daily Limit |
|------|-------|-------------|
| 1    | 0–20  | 0.005 tBNB  |
| 2    | 21–50 | 0.01 tBNB   |
| 3    | 51–80 | 0.015 tBNB  |
| 4    | 81+   | 0.02 tBNB   |

## Errors

| Status | Meaning | What to do |
|--------|---------|------------|
| 401 | Invalid/expired token | Tell user to re-authenticate at the dashboard |
| 404 | Profile not found | Tell user to sign in via GitHub OAuth first |
| 429 | Daily limit reached | Wait until UTC midnight |
| 400 | Invalid address | Check the wallet address format |

## Security

- Never log or expose `FAUCET_TOKEN` in output.
- Tokens expire after 30 days.
