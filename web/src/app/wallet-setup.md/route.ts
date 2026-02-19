export async function GET() {
  const markdown = `# Create an EVM Wallet

Generate a wallet to receive tBNB from AgentFaucet. Choose the method that matches your environment.

## Option A: Node.js (recommended)

Most agent environments already have Node.js. This is the simplest path.

**Step 1 — Install viem (if not already installed):**

npm install viem

**Step 2 — Generate wallet and save to .env:**

node -e "
  const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
  const key = generatePrivateKey();
  const acct = privateKeyToAccount(key);
  console.log('WALLET_PRIVATE_KEY=' + key);
  console.log('WALLET_ADDRESS=' + acct.address);
" >> .env

**Step 3 — Lock file permissions:**

chmod 600 .env

**Step 4 — Verify it was saved:**

grep WALLET_ADDRESS .env

You should see your new address. Use it as the walletAddress when claiming tBNB.

---

## Option B: Python

Works on most Linux/macOS systems without extra setup.

**Step 1 — Install eth-account:**

pip install eth-account

**Step 2 — Generate wallet and save to .env:**

python3 -c "
from eth_account import Account
acct = Account.create()
print(f'WALLET_PRIVATE_KEY={acct.key.hex()}')
print(f'WALLET_ADDRESS={acct.address}')
" >> .env

**Step 3 — Lock file permissions:**

chmod 600 .env

---

## Option C: Foundry (cast)

If you have Foundry installed:

cast wallet new

Then manually add the private key and address to your .env file.

---

## Security Rules

Follow these rules when handling the private key:

1. **Never log or print the private key** after saving it. Pipe it directly into .env.
2. **Set file permissions**: always run chmod 600 .env so only your user can read it.
3. **Add .env to .gitignore**: run echo ".env" >> .gitignore if not already present.
4. **Fund minimally**: only claim what you need. Agent wallets should hold small amounts.
5. **Load from environment**: read the key from process.env or os.environ, never hardcode it.

## Using Your New Wallet

Once your .env has WALLET_ADDRESS, use it to claim tBNB:

curl -X POST https://agentfaucet.vercel.app/api/claim \\
  -H "Authorization: Bearer $FAUCET_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"walletAddress": "'$WALLET_ADDRESS'"}'

The tBNB will be sent to your new wallet on BNB Chain Testnet (chain ID 97).
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
