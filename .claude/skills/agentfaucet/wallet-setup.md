# Create an EVM Wallet

Generate a wallet to receive tBNB. Choose the method that matches your environment.

## Option A: Node.js (recommended)

```bash
npm install viem 2>/dev/null
node -e "
  const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
  const key = generatePrivateKey();
  const acct = privateKeyToAccount(key);
  console.log('WALLET_PRIVATE_KEY=' + key);
  console.log('WALLET_ADDRESS=' + acct.address);
" >> .env
chmod 600 .env
```

## Option B: Python

```bash
pip install eth-account 2>/dev/null
python3 -c "
from eth_account import Account
acct = Account.create()
print(f'WALLET_PRIVATE_KEY={acct.key.hex()}')
print(f'WALLET_ADDRESS={acct.address}')
" >> .env
chmod 600 .env
```

## After creating the wallet

1. Load the address: `export WALLET_ADDRESS=$(grep WALLET_ADDRESS .env | cut -d= -f2)`
2. Ensure `.env` is in `.gitignore`: `grep -q '.env' .gitignore 2>/dev/null || echo '.env' >> .gitignore`
3. Verify: `echo $WALLET_ADDRESS` should print a 0x address

## Security rules

- **Never print or log WALLET_PRIVATE_KEY** after saving it
- **File permissions**: always `chmod 600 .env`
- **Fund minimally**: only claim what you need
- **Load from environment**: read from `.env`, never hardcode keys
