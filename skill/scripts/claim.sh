#!/usr/bin/env bash
set -euo pipefail

# AgentFaucet — Claim tBNB tokens
# Usage: bash claim.sh <wallet_address> [amount]

WALLET_ADDRESS="${1:?Usage: bash claim.sh <wallet_address> [amount]}"
AMOUNT="${2:-0.005}"
BASE_URL="${FAUCET_URL:-http://localhost:3000}"
TOKEN="${FAUCET_TOKEN:?FAUCET_TOKEN environment variable is required}"

response=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/api/claim" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"walletAddress\":\"${WALLET_ADDRESS}\",\"amount\":\"${AMOUNT}\"}")

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "$body"
else
  echo "Error (HTTP ${http_code}): ${body}" >&2
  exit 1
fi
