#!/usr/bin/env bash
set -euo pipefail

# AgentFaucet — Check allocation status
# Usage: bash status.sh

BASE_URL="${FAUCET_URL:-https://agentfaucet.app}"
TOKEN="${FAUCET_TOKEN:?FAUCET_TOKEN environment variable is required}"

response=$(curl -s -w "\n%{http_code}" \
  -X GET "${BASE_URL}/api/status" \
  -H "Authorization: Bearer ${TOKEN}")

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "$body"
else
  echo "Error (HTTP ${http_code}): ${body}" >&2
  exit 1
fi
