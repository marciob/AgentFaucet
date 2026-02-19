---
name: agentfaucet
description: Claim BNB Chain testnet tokens (tBNB) for AI agent wallets. Use when the user needs testnet tokens, wants to fund a wallet on BNB testnet, or mentions AgentFaucet.
argument-hint: [wallet-address] [amount]
allowed-tools: Bash(bash *), Bash(curl *), Bash(node *), Bash(npm *), Bash(chmod *), Bash(grep *)
---

# AgentFaucet

Claim tBNB (BNB Chain testnet tokens) via API. Reputation-based daily limits tied to your developer's GitHub profile.

## Setup checklist

Before claiming, you need two things: a **faucet token** and a **wallet address**. Work through these steps in order.

### 1. Faucet token

Check if `FAUCET_TOKEN` is set:

```bash
echo "${FAUCET_TOKEN:-(not set)}"
```

- **If set**: proceed to step 2.
- **If not set**: ask the user if they have one.
  - If they provide a token: `export FAUCET_TOKEN="<token>"`
  - If they don't have one: tell them to sign in at https://agentfaucet.vercel.app/dashboard with GitHub, then copy the agent token and paste it here. Wait for the token before continuing.

### 2. Wallet address

Ask the user: "Do you have an EVM wallet address to receive tBNB?"

- **If they provide an address**: use it. `export WALLET_ADDRESS="<their-address>"`
- **If they don't have a wallet**: tell them: "No problem — I can create one for you right now and save it securely to your .env file." Then follow the instructions in [wallet-setup.md](wallet-setup.md) to generate a wallet. After creating it, load the address:
  `export WALLET_ADDRESS=$(grep WALLET_ADDRESS .env | cut -d= -f2)`

## Claim tokens

Call the API to claim tBNB:

```bash
curl -s -X POST "https://agentfaucet.vercel.app/api/claim" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAUCET_TOKEN" \
  -d "{\"walletAddress\": \"$WALLET_ADDRESS\", \"amount\": \"${1:-0.005}\"}"
```

If the user passed arguments: use `$ARGUMENTS[0]` as wallet address, `$ARGUMENTS[1]` as amount (default `0.005`).

**Success response:**
```json
{ "success": true, "txHash": "0x...", "amount": "0.005", "remaining": "0.01" }
```

After a successful claim, show the user the txHash and remaining daily allowance.

## Check status

```bash
curl -s "https://agentfaucet.vercel.app/api/status" \
  -H "Authorization: Bearer $FAUCET_TOKEN"
```

**Response:**
```json
{ "username": "octocat", "score": 65, "tier": 3, "dailyLimit": "0.015", "claimedToday": "0.005", "remaining": "0.01" }
```

## Check pool stats (no auth needed)

```bash
curl -s "https://agentfaucet.vercel.app/api/stats"
```

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
| 401 | Invalid/expired token | Ask user to re-authenticate at the dashboard |
| 404 | Profile not found | Ask user to sign in via GitHub OAuth first |
| 429 | Daily limit reached | Show remaining limit, tell user to wait until UTC midnight |
| 500 | Server error | Retry once, then report the error |

## Security

- Never log or expose `FAUCET_TOKEN` in output
- Never log or expose `WALLET_PRIVATE_KEY` in output
- Store secrets in `.env` with `chmod 600` permissions
- Tokens expire after 30 days
