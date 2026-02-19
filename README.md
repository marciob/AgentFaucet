# AgentFaucet

The first faucet built for autonomous AI agents. Reputation-based, gasless claims, powered by ERC-8004 identity on BNB Chain Testnet.

**Live:** https://agentfaucet.vercel.app

## How it works

1. **Developers** sign in with GitHub. A reputation score is calculated from their profile and a daily tBNB limit is assigned.
2. **AI agents** receive a JWT token and claim tBNB via a single API call. The relayer covers gas — agents never need native tokens to start.
3. **Sponsors** connect a wallet and deposit tBNB to fund the pool. Deposits are recorded on-chain and tracked per campaign.
4. **ERC-8004 identity** — each agent gets an on-chain NFT identity linking their GitHub profile to a verifiable token on BSC Testnet.

## For AI agents

Paste this into any AI agent (Claude, ChatGPT, etc.):

```
Read https://agentfaucet.vercel.app/agents.md and follow the instructions to claim tBNB
```

The agent will read the instructions, walk through setup (token + wallet), and claim tokens autonomously. If the agent doesn't have a wallet, it can create one by following the wallet setup guide.

## Architecture

```
├── contracts/          Solidity smart contracts (Foundry)
│   └── src/
│       └── FaucetPool.sol    Claim, deposit, sponsor, return
├── web/                Next.js 16 frontend + API
│   ├── src/app/
│   │   ├── page.tsx          Landing page
│   │   ├── dashboard/        Developer dashboard (GitHub OAuth)
│   │   ├── sponsor/          Sponsor dashboard (wallet connect)
│   │   ├── agents.md/        Agent instructions (served as markdown)
│   │   ├── wallet-setup.md/  Wallet creation guide for agents
│   │   └── api/
│   │       ├── claim/        POST — gasless tBNB claims
│   │       ├── status/       GET — check tier and remaining limit
│   │       ├── stats/        GET — pool-wide statistics
│   │       ├── sponsor/
│   │       │   ├── record/   POST — verify and record deposits
│   │       │   └── stats/    GET — sponsor campaign data
│   │       ├── identity/
│   │       │   └── mint/     POST — mint ERC-8004 agent identity
│   │       └── agent/
│   │           └── [username] GET — NFT metadata (tokenURI)
│   └── src/lib/
│       ├── abi.ts            Contract ABI (shared server + client)
│       ├── contract.ts       Server-side viem clients
│       ├── wallet.ts         Browser wallet utilities
│       ├── identity.ts       ERC-8004 minting logic
│       └── jwt.ts            Agent JWT signing/verification
├── supabase/           Database migrations
└── .claude/skills/     Claude Code skill (agentfaucet)
```

## Smart contracts

**FaucetPool** (`0xA71D77C1451d169A798c8260582B7740704B843A`) — BSC Testnet

- `claim(address, uint256, uint256)` — relayer-only, sends tBNB to agent wallets
- `sponsorDeposit(string, string) payable` — sponsors fund the pool with campaign tracking
- `deposit() payable` — direct pool funding
- `returnTokens(string) payable` — agents return unused tokens

**IdentityRegistry** (`0x8004A818BFB912233c491871b3d84c89A494BD9e`) — BSC Testnet

- ERC-8004 compliant agent identity NFTs
- `register(string agentURI)` — mints identity, links to `/api/agent/:username` metadata

## Tier system

| Tier | GitHub Score | Daily Limit |
|------|-------------|-------------|
| 1 — Newcomer | 0–20 | 0.005 tBNB |
| 2 — Developer | 21–50 | 0.01 tBNB |
| 3 — Active Builder | 51–80 | 0.015 tBNB |
| 4 — Established | 81+ | 0.02 tBNB |

## API quick reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/claim` | POST | Bearer JWT | Claim tBNB to a wallet |
| `/api/status` | GET | Bearer JWT | Check tier, limit, remaining |
| `/api/stats` | GET | None | Pool balance, total claims |
| `/api/sponsor/stats` | GET | None | Sponsor campaign data |
| `/api/sponsor/record` | POST | None | Record verified deposit |
| `/api/identity/mint` | POST | Cookie | Mint ERC-8004 identity |
| `/agents.md` | GET | None | Agent instructions |
| `/wallet-setup.md` | GET | None | Wallet creation guide |

## Development

```bash
# Frontend
cd web
npm install
npm run dev

# Contracts
cd contracts
forge build
forge test
```

## Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Blockchain:** Solidity 0.8.24, viem, BNB Chain Testnet
- **Auth:** GitHub OAuth via Supabase
- **Database:** Supabase (PostgreSQL)
- **Identity:** ERC-8004 on-chain agent identity
- **Deployment:** Vercel

## License

MIT
