# AgentFaucet — BNB AI Agent Hackathon Project Plan

---

## 1. Problem Statement

AI agents cannot access testnet faucets. Every existing faucet is designed for humans: CAPTCHAs, browser-only interfaces, social auth walls, manual wallet paste. As AI agents become the primary consumers of testnet infrastructure for smart contract testing and deployment automation, this is a critical gap.

Compounding the problem: agents are ephemeral. They create fresh wallets per test session, use them, and discard them. No existing faucet accommodates this. They all assume the wallet requesting tokens is a persistent identity.

There is also a chicken-and-egg bootstrapping problem: an agent needs gas to interact with the chain, but it needs to already be on-chain to receive gas from most faucets.

BNB Chain deployed ERC-8004 (Trustless Agents) on both BSC Mainnet and Testnet on February 4, 2026, giving agents verifiable on-chain identity and portable reputation. But identity without funding is useless — an agent can prove who it is, but still can't do anything without testnet tokens. AgentFaucet is the missing second step: the first infrastructure that lets an identified agent autonomously fund itself.

---

## 2. Solution

AgentFaucet is a developer-reputation-based testnet token distribution system built for AI agents on BNB Chain, integrated with BNB's ERC-8004 identity infrastructure.

Four components:

1. **Next.js web app + API routes** — unified frontend and backend in a single Next.js 16 application. The frontend handles developer authentication via GitHub/X (powered by Supabase Auth), displays reputation scores, and provides dashboards. The API routes handle relayer logic, JWT issuance, rate limiting, ERC-8004 interactions, and blockchain transactions via viem.
2. **Supabase** — managed PostgreSQL database and authentication provider. Handles GitHub/X OAuth flows, stores developer profiles, claim history, reputation data, and campaign records. Provides real-time subscriptions for live dashboard updates.
3. **FaucetPool smart contract** — holds and distributes testnet BNB, accepts community donations and sponsor deposits, optionally verifies ERC-8004 identity before dispensing
4. **Installable Skill** — published to ClawHub in AgentSkills format. Any AI agent installs the skill, reads the developer's token from an environment variable, and can self-fund any fresh wallet on demand

**Storage layers:**
- **Supabase (PostgreSQL)** — developer profiles, claim history, rate limits, campaign data, reputation scores
- **IPFS** — ERC-8004 agent registration metadata files (immutable, decentralized, referenced by on-chain token URI)

The identity has two layers:
- **Sybil resistance layer (off-chain):** GitHub/X OAuth proves a real developer exists. Reputation scoring determines allocation tier.
- **Agent identity layer (on-chain):** ERC-8004 gives the agent a persistent, portable, composable identity on BNB Chain. Other protocols can read the agent's reputation without depending on AgentFaucet's backend.

Agents can create and discard as many wallets as they want. The rate limit tracks the developer behind them. The ERC-8004 identity persists across sessions regardless of which ephemeral wallet the agent is using.

---

## 3. Target Users

- **Primary:** AI agent developers building on BNB Chain who need their agents to self-fund during automated testing
- **Secondary:** Protocol teams launching on BNB who want AI agents to test their smart contracts (sponsors)
- **Tertiary:** Any developer who wants a programmatic/CLI faucet alternative without fighting CAPTCHAs

---

## 4. Architecture

### 4.1 Components and Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│              NEXT.JS 16 APP (web/)                            │
│                                                              │
│  FRONTEND (React + Tailwind)                                 │
│  - GitHub / X OAuth login (via Supabase Auth)                │
│  - Display reputation score, tier, ERC-8004 agent ID         │
│  - Copy JWT token                                            │
│  - Sponsor dashboard (deposit, view agent activity)          │
│  - Public stats (real-time via Supabase subscriptions)       │
│                                                              │
│  API ROUTES (server-side)                                    │
│  - POST /api/claim    → relayer calls FaucetPool contract    │
│  - GET  /api/status   → check allocation + ERC-8004 identity │
│  - POST /api/return   → record token return                  │
│  - GET  /api/stats    → global pool stats                    │
│  - GET  /api/sponsors → list active campaigns                │
│  - Reputation scoring engine                                 │
│  - JWT issuance and validation                               │
│  - Rate limiting per developer identity                      │
│  - ERC-8004 Identity + Reputation Registry interactions      │
└─────────┬─────────────────────┬──────────────────────────────┘
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│   SUPABASE       │  │         BNB TESTNET (chain 97)       │
│                  │  │                                      │
│  - Auth (GitHub  │  │  ┌─────────────┐ ┌───────────────┐  │
│    + X OAuth)    │  │  │ FaucetPool  │ │ ERC-8004      │  │
│  - PostgreSQL    │  │  │ (our        │ │ Identity +    │  │
│    (profiles,    │  │  │ contract)   │ │ Reputation    │  │
│    claims, rate  │  │  └─────────────┘ │ Registries    │  │
│    limits,       │  │                  │ (BNB's)       │  │
│    campaigns)    │  │                  └───────────────┘  │
│  - Real-time     │  └──────────────────────────────────────┘
│    subscriptions │
└──────────────────┘  ┌──────────────────────────────────────┐
                      │              IPFS                     │
                      │  - ERC-8004 agent registration files  │
                      │  - Immutable metadata storage         │
                      └──────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    AGENT SKILL (skill/)                       │
│  - claim.js   → POST /api/claim with JWT                     │
│  - status.js  → GET  /api/status                             │
│  - return.js  → POST /api/return                             │
│  - sponsors.js → GET /api/sponsors                           │
│  Reads FAUCET_TOKEN from env. Never exposes to LLM.         │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Monorepo Structure

```
AgentFaucet/
├── contracts/          # Foundry — FaucetPool + tests + deploy script
│   ├── src/
│   ├── test/
│   ├── script/
│   ├── lib/
│   └── foundry.toml
├── web/                # Next.js 16 — frontend + API routes
│   ├── src/
│   │   ├── app/            # Pages + API routes
│   │   ├── components/     # React components
│   │   └── lib/            # Shared utilities (supabase, viem, reputation)
│   └── package.json
├── skill/              # Agent skill package
│   ├── SKILL.md
│   ├── scripts/
│   └── package.json
├── docs/
└── .env
```

### 4.3 Key Design Decisions

**Dual-layer identity.** GitHub/X OAuth handles Sybil resistance (proving a real developer exists). ERC-8004 handles on-chain agent identity and composability (giving the agent a portable presence that other BNB protocols can read). These solve different problems and are combined, not alternatives.

**ERC-8004 identity is minted automatically.** The developer never needs to interact with a wallet or pay gas for registration. The backend relayer mints the ERC-8004 agent NFT on their behalf during OAuth flow. Zero friction.

**Rate limiting tracks the human, not the wallet.** The JWT contains the developer's platform user ID. The backend maintains a daily usage counter per user ID. The agent can send tokens to any address — the limit doesn't care which wallet.

**The relayer pays gas, not the agent.** The faucet contract only accepts calls from the relayer address. The agent never needs gas to claim. This solves the bootstrapping problem.

**Reputation is written to ERC-8004, not locked in our system.** When an agent tests contracts, returns tokens, or completes sponsor campaigns, the backend posts reputation signals to BNB's ERC-8004 Reputation Registry. This means the agent's testing reputation is composable — any other protocol on BNB can read it without depending on AgentFaucet.

**The Skill is the primary interface.** The website exists only for initial OAuth and the sponsor dashboard. The real product is the installable skill that agents use autonomously.

**Unified app, no separate backend.** The Next.js API routes handle all server-side logic (relayer, reputation, rate limiting) alongside the frontend. One deployment, one codebase, fewer moving parts — ideal for a hackathon.

**Supabase handles auth and data, not business logic.** Supabase provides GitHub/X OAuth and PostgreSQL out of the box. Business logic (reputation scoring, relayer transactions, ERC-8004 interactions) lives in Next.js API routes where we have full control.

**IPFS for ERC-8004 metadata.** Agent registration files are stored on IPFS (immutable, decentralized). The on-chain token URI points to the IPFS hash. This is the right storage layer for metadata that should be publicly readable and tamper-proof.

**Real-time via Supabase subscriptions.** The dashboard can show live claim updates without polling — Supabase PostgreSQL changes stream directly to the frontend.

### 4.4 What Happens at Each Step

**One-time setup (human, ~30 seconds):**
1. Developer visits the web app
2. Clicks "Sign in with GitHub" (or X)
3. Backend fetches their public profile and repos via the platform API
4. Reputation score is calculated and displayed with breakdown
5. Backend mints an ERC-8004 agent identity NFT on BNB Testnet via the relayer (developer's wallet or relayer-as-operator becomes owner)
6. JWT token is issued and shown with a copy button — includes the ERC-8004 agent token ID
7. Developer sets the token as an environment variable on whatever machine their agents run on

**Every agent session (automated, ~3 seconds):**
1. Agent needs testnet BNB (e.g., to deploy a contract)
2. Agent runs the claim script from the installed skill
3. Script reads the JWT from the environment variable and sends the claim request with the fresh wallet address
4. Backend validates the JWT, checks daily rate limit for that developer, and calls the faucet contract
5. Relayer sends testnet BNB to the agent's fresh wallet
6. Agent receives tokens and proceeds with testing
7. (Optional) Agent returns unused tokens to the pool when done

**After testing activity (automated, background):**
1. Backend monitors on-chain events — contract deployments, interactions, token returns — associated with wallets that received tokens
2. Backend posts reputation feedback to the ERC-8004 Reputation Registry, building the agent's on-chain track record
3. Reputation score updates are reflected in the developer's dashboard and in the agent's status output

---

## 5. ERC-8004 Integration

### 5.1 Background

ERC-8004 ("Trustless Agents") is an Ethereum standard co-authored by MetaMask, Ethereum Foundation, Google, and Coinbase. It defines three lightweight on-chain registries:

- **Identity Registry** — ERC-721-based. Each agent gets a unique on-chain NFT identifier that resolves to a registration file describing what the agent does, its endpoints, and capabilities. Ownership can be transferred or delegated.
- **Reputation Registry** — Standard interface for posting and fetching feedback signals about agent performance. Scoring can happen both on-chain (composable) and off-chain (sophisticated algorithms).
- **Validation Registry** — Hooks for requesting and recording independent checks (zkML verifiers, TEE oracles, trusted judges). Not used in AgentFaucet MVP.

BNB Chain deployed ERC-8004 on both BSC Mainnet and Testnet on February 4, 2026, and simultaneously launched BAP-578 (Non-Fungible Agents), a BNB Application Proposal that extends agents to own wallets and hold assets.

### 5.2 How AgentFaucet Uses ERC-8004

**Identity Registry — agent registration:**
- When a developer authenticates via GitHub/X, the backend calls the registration function on BNB's deployed ERC-8004 Identity Registry contract on the testnet
- This mints an ERC-721 agent NFT owned by the relayer (acting as operator on behalf of the developer)
- The agent's registration URI points to a registration file (hosted on IPFS or as a data URI) containing: agent description, developer's GitHub/X identity hash (not raw username — privacy), reputation tier, faucet endpoint, and supported capabilities
- The ERC-8004 token ID is included in the JWT so the agent can reference its on-chain identity

**Reputation Registry — testing activity feedback:**
- After an agent claims tokens and performs on-chain activity (contract deployments, function calls, token returns), the backend posts structured feedback to the ERC-8004 Reputation Registry
- Feedback signals include: number of contracts deployed, number of unique interactions, tokens returned vs claimed ratio, testing duration
- This makes the agent's testing reputation portable — other BNB protocols can query it without depending on AgentFaucet's backend
- Agents that test more thoroughly and return unused tokens accumulate higher on-chain reputation

**What we do NOT use (MVP scope):**
- Validation Registry — not needed for testnet faucet distribution
- BAP-578 (NFA) agent-owned wallets — interesting for future work where the agent itself holds funds, but out of scope for hackathon

### 5.3 ERC-8004 Agent Registration File Structure

The registration URI for each registered agent resolves to a JSON file following the ERC-8004 specification:

```
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "AgentFaucet-Agent-<github_user_id>",
  "description": "AI testing agent registered via AgentFaucet. 
    Reputation tier: <tier>. Developer verified via GitHub OAuth.",
  "image": "<optional agent avatar>",
  "services": [
    {
      "name": "faucet-claim",
      "endpoint": "https://api.agentfaucet.xyz/claim"
    }
  ]
}
```

### 5.4 Why ERC-8004 Matters for This Project

Without ERC-8004, AgentFaucet's reputation system is a closed silo — useful only within our own platform. With ERC-8004:

- Agent testing reputation becomes a public good on BNB Chain that any protocol can read
- AgentFaucet becomes the first practical application of BNB's newly deployed ERC-8004 infrastructure
- The project directly validates BNB Chain's thesis: "identity is the starting point, and once agents can prove who they are, other things follow" — AgentFaucet is the "other things"
- Hackathon judges see alignment with BNB's strategic direction, not a standalone tool

---

## 6. Reputation Scoring System

### 6.1 GitHub Scoring (primary auth provider)

| Signal | Max Points | Rationale |
|--------|-----------|-----------|
| Account age | 25 | Older accounts are harder to fabricate at scale |
| Public repository count | 15 | General activity signal |
| Contribution frequency (last 12 months) | 15 | Recency of activity |
| Follower count | 10 | Social proof from peers |
| Solidity / Web3 / BNB related repositories (by language and topic tags) | 20 | Domain relevance — strong signal for BNB hackathon judges |
| Recent push activity (last 90 days) | 15 | Currently active developer |
| **Total** | **100** | |

### 6.2 X/Twitter Scoring (secondary auth provider)

| Signal | Max Points | Rationale |
|--------|-----------|-----------|
| Account age | 25 | Same logic as GitHub |
| Follower count | 20 | Reach and social proof |
| Posting frequency | 15 | Activity signal |
| Crypto / Web3 / BNB related content in bio and recent posts | 25 | Domain relevance |
| Verification status | 15 | Identity signal |
| **Total** | **100** | |

### 6.3 Tier System

| Tier | Score Range | Daily tBNB Allocation | Profile |
|------|-----------|----------------------|---------|
| 1 | 0–20 | 0.5 | New or near-empty accounts |
| 2 | 21–50 | 2 | Some developer history |
| 3 | 51–80 | 5 | Active developer |
| 4 | 81–100 | 10 | Established builder |

### 6.4 Reputation Modifiers

**Boosters (reflected both internally and in ERC-8004 Reputation Registry):**
- Returning unused tokens to the pool increases reputation (encourages recycling)
- Having deployed contracts on BSC mainnet (verified via BscScan API) applies a bonus multiplier
- Completing a sponsored testing campaign applies a bonus
- High on-chain activity-to-claim ratio (agent that claims 2 tBNB and deploys 5 contracts scores higher than agent that claims 10 tBNB and deploys 1)

**Penalties:**
- Claiming tokens repeatedly without any on-chain activity (no deployments, no interactions) triggers a flag and potential tier reduction
- Multiple OAuth accounts traced to the same registration session are flagged as potential Sybil

---

## 7. Smart Contract Specification

### 7.1 Contract: FaucetPool (our contract)

**Network:** BNB Chain Testnet (Chapel, chain ID 97)

**Core behavior:**
- Holds a pool of testnet BNB
- Only the designated relayer address can trigger token disbursement
- Anyone can deposit testnet BNB into the pool (community donations)
- Anyone can make sponsored deposits with campaign attribution metadata
- Agents can return unused tokens, tagged with a developer identifier for reputation credit
- Owner can update the relayer address, update the maximum single claim size, and perform emergency withdrawals
- Optionally verifies that the recipient is associated with a valid ERC-8004 agent identity (via a lookup the backend provides, not a direct cross-contract call — keep the contract simple)

**Events emitted (critical for frontend indexing, sponsor analytics, and ERC-8004 reputation posting):**
- Token claimed: recipient address, amount, timestamp, ERC-8004 agent token ID
- Token deposited: sender address, amount
- Sponsor deposit: sender address, amount, campaign ID, metadata string
- Token returned: sender address, amount, developer ID

**Security requirements:**
- Reentrancy protection
- Balance check before every disbursement
- Ownership access control on admin functions
- Use safe value transfer pattern (not fixed gas transfer)
- Built with Foundry, using OpenZeppelin base contracts

**Testing requirements:**
- Only relayer can call the claim function
- Cannot claim more than pool balance
- Sponsor deposits correctly emit metadata
- Token returns are tracked
- Emergency withdraw works
- Edge cases: zero-amount claims, very large claims, concurrent claims

### 7.2 BNB's ERC-8004 Contracts (we interact with, not deploy)

**Identity Registry (deployed by BNB Chain on testnet):**
- We call the registration function to mint agent identity NFTs for new developers
- We call the URI update function to update the agent's registration file when reputation tier changes
- We read ownership and URI data for identity verification

**Reputation Registry (deployed by BNB Chain on testnet):**
- We call the posting function to submit feedback signals after agent testing activity
- Feedback includes: performance metrics, token return ratios, contracts deployed
- We read reputation data to display on the dashboard

**Important:** The backend must discover the deployed contract addresses for BNB's ERC-8004 registries on the testnet. Check BNB Chain documentation and deployment announcements for official addresses. If addresses are not publicly documented, check BscScan for recent ERC-8004-related deployments by BNB Chain's official deployer addresses.

---

## 8. API & Backend Specification

### 8.1 Tech Stack

- **Next.js 16 API routes** — server-side logic co-located with the frontend in `web/src/app/api/`
- **Supabase** — authentication (GitHub/X OAuth) and PostgreSQL database
- **viem** — blockchain interaction (relayer transactions, contract reads, ERC-8004 calls)
- **IPFS** — decentralized storage for ERC-8004 agent registration metadata files
- **jose** — JWT signing and validation for agent tokens

### 8.2 API Routes

All API routes live in `web/src/app/api/` as Next.js route handlers.

**Authentication (handled by Supabase Auth):**
- GitHub OAuth initiation and callback — Supabase handles the OAuth flow natively. After auth, a server-side hook fetches the developer's profile and public repos via GitHub API, calculates reputation, mints ERC-8004 agent identity via relayer, and issues a JWT containing both developer identity and ERC-8004 token ID.
- X/Twitter OAuth initiation and callback — same flow with X-specific signals via Supabase Auth.

**Faucet operations (all require valid JWT in Authorization header):**
- `POST /api/claim` — accepts a wallet address and optional amount. Validates JWT, checks daily rate limit for that developer identity (queried from Supabase), calls the faucet contract via the relayer wallet, records the claim in Supabase, returns the transaction hash, remaining daily allocation, and ERC-8004 agent token ID.
- `GET /api/status` — returns the developer's reputation score, tier, daily limit, amount claimed today, amount remaining, ERC-8004 agent token ID, and on-chain reputation summary.
- `POST /api/return` — records a token return event in Supabase, credits the developer's reputation both internally and on the ERC-8004 Reputation Registry.

**Sponsor operations:**
- `POST /api/sponsors/campaigns` — sponsor defines campaign name, description, target protocol (stored in Supabase)
- `GET /api/sponsors/campaigns` — list active campaigns, public, no auth required
- `GET /api/sponsors/campaigns/[id]/activity` — shows which agents (by ERC-8004 ID) tested, interaction counts, reputation signals posted

**Public:**
- `GET /api/stats` — global stats: total claims, unique developers, pool balance (read from contract), active sponsor count, total ERC-8004 agent identities registered

### 8.3 Supabase Schema

**Tables:**
- `profiles` — developer profiles linked to Supabase auth users. Fields: id (uuid, FK to auth.users), github_username, github_id, reputation_score, tier, agent_token_id (ERC-8004), daily_limit_wei, created_at
- `claims` — claim history. Fields: id, profile_id (FK), wallet_address, amount_wei, tx_hash, agent_token_id, created_at
- `daily_usage` — rate limiting tracker. Fields: profile_id (FK), date, amount_claimed_wei (reset daily at midnight UTC)
- `campaigns` — sponsor campaigns. Fields: id, sponsor_address, name, description, target_protocol, deposit_tx_hash, amount_wei, active, created_at
- `token_returns` — return history. Fields: id, profile_id (FK), amount_wei, tx_hash, developer_id, created_at

**Row Level Security (RLS):**
- Profiles: users can read their own profile, API routes use service role key for writes
- Claims: users can read their own claims
- Campaigns: public read, authenticated write for sponsors
- Daily usage: internal only, accessed via service role key

### 8.4 JWT Token Contents

The token payload includes: platform and user ID (e.g., "github:12345678"), display username, reputation score, tier number, daily limit in wei, auth provider name, ERC-8004 agent token ID on BNB testnet, issued-at timestamp, and expiry (30 days).

Note: This is a separate JWT from the Supabase session token. Supabase Auth handles web session management. The agent JWT is a standalone token signed with a server secret, designed to be used by agents outside the browser context.

### 8.5 Rate Limiting

- Tracked per developer identity (the platform user ID in the JWT), not per wallet or IP
- Daily reset at midnight UTC — implemented via the `daily_usage` Supabase table, queried per claim
- Enforced in the API route before any blockchain transaction (fast, no gas cost)
- Every claim response includes remaining allocation so the agent can make informed decisions

### 8.6 Relayer Wallet

The API routes use a single testnet wallet that serves as the relayer. It is the only address authorized to call the claim function on the FaucetPool contract. It also performs ERC-8004 interactions (minting agent identities, posting reputation). Its private key is stored in an environment variable (`PRIVATE_KEY`), accessible to the Next.js server runtime. It needs to be funded with testnet BNB for gas — initially from the official BNB faucet. Monitor its balance and alert when low.

### 8.7 IPFS Integration

ERC-8004 agent registration files are stored on IPFS:
- When a developer authenticates and an agent identity is minted, the API route generates the registration JSON, uploads it to IPFS (via Pinata, web3.storage, or similar pinning service), and sets the resulting CID as the token URI on the ERC-8004 Identity Registry.
- Registration files are immutable once pinned. If reputation tier changes, a new file is uploaded and the on-chain URI is updated.
- IPFS CIDs are stored in the `profiles` table for reference.

### 8.8 ERC-8004 Reputation Posting Logic

The API routes trigger reputation updates (or a scheduled Supabase Edge Function / cron job) that:
1. Queries Supabase for recent claims and monitors the chain for on-chain activity from wallets that received tokens via AgentFaucet
2. Aggregates activity metrics: contracts deployed, functions called, tokens returned
3. Posts structured feedback to the ERC-8004 Reputation Registry at reasonable intervals (not per-transaction — batch to manage gas)
4. Updates the internal reputation score in Supabase which may adjust the developer's tier for future claims

---

## 9. Agent Skill Specification

### 9.1 Format and Compatibility

The skill follows the AgentSkills standard format: a SKILL.md file with agent-readable instructions plus supporting scripts. It must be compatible with OpenClaw/ClawHub, Claude Code, and any framework supporting the AgentSkills specification.

### 9.2 Structure

The skill directory contains:
- **SKILL.md** — agent-facing instructions: when to use, setup process, available commands, security rules
- **scripts/** — four scripts: claim (request tokens to an address), status (check allocation and ERC-8004 identity), return (send back unused tokens), sponsors (list active campaigns)
- **package.json** — minimal dependencies, only an HTTP client library

### 9.3 SKILL.md Content

The SKILL.md must:
- Describe when to use this skill: "when you need BNB testnet tokens for smart contract testing or deployment"
- Explain setup: visit the website, authenticate with GitHub, copy token, set environment variable
- List each command with clear input/output descriptions
- Mention that the developer's agent has a verifiable ERC-8004 identity on BNB Chain, and that testing activity builds on-chain reputation
- Include a security section: the faucet token must only be read from the environment variable, never outputted to conversation, never logged, never passed as a script argument

### 9.4 Script Behaviors

**Claim script:**
- Accepts: wallet address (required), amount in tBNB (optional, default 0.5)
- Reads the token from the environment variable (never from arguments)
- Calls the backend claim endpoint
- Outputs: success/failure, transaction hash, remaining daily allocation, ERC-8004 agent token ID
- Error messages: expired token, rate limited, pool empty, invalid address

**Status script:**
- No input needed
- Outputs: reputation score, tier, daily limit, claimed today, remaining, ERC-8004 agent token ID, on-chain reputation summary (contracts deployed, tokens returned, activity score)

**Return script:**
- Accepts: amount to return, transaction hash of the return
- Outputs: confirmation, updated reputation score (both internal and on-chain)

**Sponsors script:**
- No authentication needed
- Outputs: list of active campaigns with descriptions and bonus allocations

### 9.5 Security Requirements

- The JWT token must NEVER appear in script arguments — only read from environment
- Scripts must not log the token value in any output
- Scripts must not include the token in any output visible to the LLM context
- All API calls over HTTPS
- SKILL.md must explicitly instruct the agent to never output or discuss the token value

---

## 10. Web Frontend Specification

### 10.1 Tech Stack

- **Next.js 16** with App Router and React 19
- **Tailwind CSS 4** for styling (dark theme with BNB accent color)
- **Supabase client SDK** (`@supabase/supabase-js`) for auth and real-time subscriptions
- **viem** for wallet interactions (sponsor deposits only — wallet connect for on-chain deposits)
- Chart library for statistics visualization (e.g., recharts)

### 10.2 Pages

**Landing page:**
- Hero message: "Give your AI agents testnet tokens. 30 seconds setup."
- Sub-message: "Built on BNB Chain's ERC-8004 identity infrastructure."
- Three-step visual: Authenticate → Get agent identity + token → Agent claims
- Live stats bar: total claims, pool balance, active developers, ERC-8004 agents registered
- Two auth buttons: "Sign in with GitHub" and "Sign in with X"

**Developer dashboard (authenticated):**
- Reputation score with visual breakdown showing which signals contributed what
- Current tier and daily allocation displayed prominently
- ERC-8004 agent identity section: token ID, link to view on BscScan, on-chain reputation summary
- JWT token display with one-click copy button
- Token regeneration button (invalidates old token, issues new one)
- Claim history table: wallet addresses, amounts, timestamps
- Return history: tokens returned, reputation credits earned (both internal and on-chain)

**Sponsor dashboard:**
- Campaign creation form: name, description, target contract/protocol, testnet BNB budget
- Active campaigns list with agent activity metrics (by ERC-8004 agent ID)
- Activity feed: which agents tested, contracts deployed, interaction patterns

**Public stats page:**
- Total tBNB distributed all-time
- Unique developers served
- Total ERC-8004 agent identities registered
- Claims in the last 24 hours
- Current pool balance
- Top sponsors
- Claim activity chart (last 30 days)

---

## 11. Sponsor System

### 11.1 Flow

1. A protocol team launching on BNB testnet visits the sponsor dashboard
2. They connect their wallet and deposit testnet BNB into the FaucetPool contract with campaign metadata
3. They define a campaign: name, description, what they want tested
4. Agents discover the campaign via the sponsors script in the skill
5. When agents claim tokens associated with a campaign, the backend tracks attribution by ERC-8004 agent ID
6. The sponsor dashboard shows real-time activity: how many agents participated (by ERC-8004 identity), what contracts were deployed, interaction traces, on-chain reputation of participating agents

### 11.2 Value for Sponsors

- Verifiable proof that AI agents tested their protocol on testnet, linked to ERC-8004 identities with portable reputation
- Exposure to the active agent developer community on BNB
- Data on how agents interact with their contracts: which functions called, gas patterns, error rates
- Agent reputation data lets sponsors prioritize feedback from high-reputation agents

### 11.3 Future Revenue Model (post-hackathon, mention in pitch only)

- Sponsors pay a small fee in real BNB or USDT for premium campaign placement and visibility
- Analytics tier with detailed reports on agent testing patterns
- This is NOT built for the hackathon — it's the business model narrative

---

## 12. Hackathon Build Priorities

### Tier 1 — MUST HAVE (MVP for demo)

1. FaucetPool smart contract deployed on BNB Testnet ✅ (built, pending deployment)
2. Next.js API routes with Supabase: GitHub OAuth, reputation scoring, JWT issuance, claim endpoint with rate limiting, and relayer logic (via viem)
3. ERC-8004 Identity Registry integration: mint agent identity NFT during OAuth registration, store metadata on IPFS
4. Working Skill with claim and status scripts
5. Frontend wired to Supabase Auth: landing page with GitHub login, dashboard showing score, ERC-8004 agent ID, and token copy (real-time updates via Supabase subscriptions)
6. Live demo: agent installs skill, claims tokens, deploys a contract without human intervention

### Tier 2 — SHOULD HAVE (strengthens the submission)

7. ERC-8004 Reputation Registry integration: post feedback signals after agent testing activity
8. X/Twitter as second OAuth provider
9. Sponsor deposit function and campaign listing
10. Token return flow with reputation boost (both internal and on-chain)
11. Frontend stats page with claim activity visualization
12. Skill published to ClawHub

### Tier 3 — NICE TO HAVE (impressive extras)

13. BscScan API integration for detecting mainnet BNB deployment history as a reputation booster
14. Sponsor dashboard with real-time agent activity feed, filtered by ERC-8004 agent identity
15. Multi-framework demo: show the skill working in both OpenClaw and Claude Code
16. Automatic token recycling: sweep unreturned tokens back to pool after 24 hours of inactivity
17. BAP-578 (NFA) exploration: demo an agent that owns its own wallet funded via AgentFaucet

---

## 13. Demo Script

Follow this exact sequence during the hackathon presentation:

1. **Open the web app.** Show the landing page with live stats and "Built on ERC-8004" branding.
2. **Authenticate with GitHub.** Show the reputation calculation in real-time: "Your account is 4 years old, you have 12 Solidity repos, score: 78, Tier 3 — 5 tBNB per day."
3. **Show the ERC-8004 agent identity.** "Your agent now has an on-chain identity on BNB Chain." Show the token ID, click through to BscScan to view the NFT.
4. **Copy the token.** Show that it's one string, one environment variable.
5. **Switch to a terminal with an AI agent running.** Set the environment variable. Install the skill.
6. **Give the agent a task that requires testnet tokens.** Example: "Deploy this ERC-20 contract on BNB testnet." The agent recognizes it needs tBNB, calls the faucet skill autonomously, gets tokens in seconds.
7. **Show the deployment.** The contract is live, funded by the faucet.
8. **Have the agent create a second fresh wallet and claim again.** Demonstrate that the same token works for any wallet — no re-registration, no friction.
9. **Switch back to the dashboard.** Show claim history updated in real-time.
10. **(If ERC-8004 reputation posting is built)** Show the agent's on-chain reputation on BscScan — "This agent deployed 3 contracts, returned unused tokens, activity score building in the ERC-8004 Reputation Registry. Any protocol on BNB can read this."
11. **(If sponsor system is built)** Show the sponsor view with agent activity metrics.
12. **Closing talking point:** "BNB Chain gave agents identity with ERC-8004. We gave them the funding to act on it. The identity follows the developer, the reputation is composable on-chain, and the agent is free to be ephemeral. This is the first faucet built for how AI agents actually work."

---

## 14. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| GitHub API rate limits during reputation calculation | Cache profile and repo data at auth time, don't refetch on every claim |
| Relayer wallet runs out of gas | Monitor balance, alert when low, prepare a top-up script |
| Faucet pool runs out of testnet tokens | Display pool balance in status endpoint, alert via dashboard |
| JWT token leaked by agent into logs or conversation | Short expiry (30 days), token regeneration endpoint, rate limiting caps damage |
| Multiple GitHub accounts per person | Track device fingerprint or IP at registration time as a flag, not a hard blocker |
| Backend goes down | Contract still holds funds safely, no loss. Agents get a clear error message to retry later |
| GitHub OAuth scope concerns | Request minimum scope: read-only access to public profile and public repos only |
| ERC-8004 contract addresses change or are undocumented | Check BNB Chain official docs and BscScan. Abstract addresses behind config so they can be updated without code changes |
| ERC-8004 reputation posting gas costs accumulate | Batch reputation updates rather than posting per-transaction. Use reasonable intervals |
| ERC-8004 registries on testnet may have different interfaces than mainnet | Test against actual deployed contracts early. Read ABIs from verified contracts on BscScan |

---

## 15. Technical Constraints and References

- BNB Testnet (Chapel): chain ID 97
- BNB Testnet RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
- Testnet BNB has no monetary value
- GitHub OAuth app registration: github.com/settings/developers
- X/Twitter OAuth app registration: developer.twitter.com
- The relayer wallet needs initial funding from the official BNB testnet faucet
- Smart contract development and testing with Foundry
- Frontend + API: Next.js 16 with App Router, deployed as a single application
- Database + Auth: Supabase (PostgreSQL + OAuth), free tier sufficient for hackathon
- Blockchain interaction: viem (lightweight, TypeScript-native, tree-shakeable)
- Metadata storage: IPFS via pinning service (Pinata or web3.storage)
- Contract ABIs must be bundled in the skill package for any direct contract interaction needs
- ERC-8004 specification: https://eips.ethereum.org/EIPS/eip-8004
- BNB Chain ERC-8004 announcement: February 4, 2026
- BNB Chain ERC-8004 developer docs: https://www.bnbchain.org/en/blog/making-agent-identity-practical-with-erc-8004-on-bnb-chain
- BAP-578 (Non-Fungible Agents) specification: check BNB Chain governance proposals
- ERC-8004 deployed contract addresses on BNB Testnet: discover from BNB Chain documentation or BscScan

---

## 16. Project Name

**AgentFaucet** — clear, direct, describes exactly what it is.

---

## 17. Success Criteria

- **Working end-to-end:** Agent gets tokens and deploys a contract with zero human intervention after initial setup
- **Time to first claim:** Under 30 seconds from skill installation to tokens in wallet
- **Architecture clarity:** Clean separation between Sybil resistance (off-chain OAuth), agent identity (on-chain ERC-8004), rate limiting (backend), and token pool (on-chain FaucetPool)
- **BNB ecosystem fit:** Built on BNB testnet, integrated with BNB's ERC-8004 infrastructure deployed February 4 2026, directly useful for BNB developers and agents
- **Innovation:** First agent-native faucet with dual-layer identity (developer reputation + ERC-8004 composable agent identity)
- **Business narrative:** Sponsor model demonstrates a path to sustainability beyond the hackathon
- **Composability:** Agent reputation written to ERC-8004 is readable by any other BNB protocol — not locked in our system
