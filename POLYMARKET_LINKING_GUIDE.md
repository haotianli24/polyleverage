# Polymarket Account Linking Guide

## Overview

This guide explains how to link your Polymarket account (Polygon blockchain) to your Solana-based PolyLeverage platform. This linkage is required to execute real trades on Polymarket on behalf of your account.

## Architecture

- **Your App**: Runs on Solana (Phantom Wallet)
- **Polymarket**: Runs on Polygon (EVM-compatible)
- **The Bridge**: API credentials that allow your backend to execute trades

## Why Link Your Account?

When you link your Polymarket account:

1. Your platform can execute trades on your behalf
2. You can view real-time positions and orders
3. Leverage trading becomes possible with your Polymarket positions
4. All operations remain secure through API key authentication

## How It Works

### Step 1: Connect Your Solana Wallet

First, connect your Solana wallet (Phantom or Solflare) to the PolyLeverage platform.

### Step 2: Link Your Polymarket Account

There are two methods to link your Polymarket account:

#### Method 1: Wallet Connection (Recommended)

**Best for:** Users who log in to Polymarket with MetaMask, Phantom (EVM mode), or other wallet providers.

**Steps:**

1. Click "Link Polymarket" in your Portfolio page
2. Select the "Wallet" tab
3. Click "Connect Polygon Wallet"
4. Approve the connection request in your wallet
5. Switch to Polygon network (Chain ID: 137) if prompted
6. Sign the authentication message
7. Your credentials are automatically derived and stored

**What happens behind the scenes:**

- Your wallet signs an EIP-712 message
- A secure API key, secret, and passphrase are derived from the signature
- These credentials are stored (encrypted in production) linked to your Solana address
- Your private key is NEVER stored

#### Method 2: Private Key Import

**Best for:** Users who log in to Polymarket via email (Magic Link).

**Steps:**

1. Go to [Polymarket Settings](https://polymarket.com/settings)
2. Navigate to Security → Export Private Key
3. Copy your private key
4. Return to PolyLeverage Portfolio page
5. Click "Link Polymarket"
6. Select the "Private Key" tab
7. Paste your private key (it will never be stored)
8. Click "Link Account"

**Security Notes:**

- Your private key is used ONLY to derive API credentials
- The private key is processed client-side and immediately discarded
- Only the derived API credentials (key, secret, passphrase) are stored
- These credentials can only execute trades, not withdraw funds directly

## What Gets Stored

When you link your account, the following information is stored:

```typescript
{
  apiKey: string          // Used to authenticate API requests
  secret: string          // Used to sign API requests
  passphrase: string      // Additional authentication layer
  polygonAddress: string  // Your Polygon/Polymarket address
  solanaAddress: string   // Your Solana wallet address
  createdAt: number       // Timestamp of linking
}
```

**Important:** Your private key is NEVER stored. Only the derived API credentials are kept.

## Security Considerations

### For Production Deployment

1. **Encrypt Credentials**: All stored credentials should be encrypted at rest
2. **Use Secure Database**: Move from in-memory storage to encrypted database
3. **Implement Rate Limiting**: Prevent API abuse
4. **Add 2FA**: Require two-factor authentication for sensitive operations
5. **Audit Logs**: Track all API operations for security monitoring
6. **Credential Rotation**: Allow users to regenerate credentials periodically

### Current Implementation (Development)

The current implementation stores credentials in memory. This is suitable for development and testing but should be upgraded for production:

```typescript
// Current: In-memory storage
const credentialsStore = new Map<string, PolymarketCredentials>()

// Production: Should use encrypted database
// Example: PostgreSQL with pgcrypto, or AWS KMS
```

## Using Linked Accounts

Once linked, your account credentials are automatically used for:

- **Placing Orders**: Creating buy/sell orders on Polymarket
- **Viewing Positions**: Fetching your current positions
- **Canceling Orders**: Canceling pending orders
- **Market Data**: Accessing real-time market information

## API Endpoints

### Link Account

```typescript
POST /api/polymarket/link-account
Body: {
  solanaAddress: string,
  // Option 1: Provide credentials directly
  apiKey?: string,
  secret?: string,
  passphrase?: string,
  polygonAddress?: string,
  // Option 2: Provide private key to derive credentials
  privateKey?: string
}
```

### Check Link Status

```typescript
GET /api/polymarket/link-account?solanaAddress={address}
Response: {
  linked: boolean,
  polygonAddress?: string,
  linkedAt?: number
}
```

### Unlink Account

```typescript
DELETE /api/polymarket/link-account?solanaAddress={address}
```

## Troubleshooting

### "No Wallet Found"

**Problem:** EVM wallet not detected.

**Solution:**

- Install MetaMask extension, or
- Enable Phantom's Ethereum support in settings

### "Wrong Network"

**Problem:** Wallet connected to wrong network.

**Solution:**

- The app will automatically prompt you to switch to Polygon (Chain ID: 137)
- Approve the network switch request

### "Invalid Private Key"

**Problem:** The provided private key is not valid.

**Solution:**

- Ensure you copied the complete key from Polymarket
- Private keys should be 64 characters (hex) or 66 with "0x" prefix
- No spaces or extra characters

### "Failed to Link Account"

**Problem:** Server error during linking process.

**Solution:**

- Check your internet connection
- Ensure you're connected to your Solana wallet
- Try refreshing the page
- Check browser console for detailed error messages

## FAQ

**Q: Can I change my linked Polymarket account?**

A: Yes, simply unlink your current account and link a different one.

**Q: What happens if I lose access to my Solana wallet?**

A: Your Polymarket credentials are tied to your Solana address. If you lose access, you'll need to relink with a new Solana wallet.

**Q: Are my funds safe?**

A: Yes. The API credentials can only execute trades on Polymarket. They cannot withdraw funds to different addresses. Your actual funds remain in your Polymarket account controlled by your Polygon private key.

**Q: How do I revoke access?**

A: Click the "Unlink Account" button in the Portfolio page. This removes the stored credentials from our system.

**Q: Do I need to link my account every time?**

A: No. Once linked, your credentials persist until you explicitly unlink or clear your browser storage (in current dev version).

**Q: Can someone else use my credentials?**

A: The credentials are tied to your Solana wallet address and require authentication. However, for production use, additional security measures (2FA, IP whitelisting) should be implemented.

## Development Notes

### Adding Database Storage

Replace in-memory storage with database:

```typescript
// lib/polymarket-credentials.ts

import { db } from './database'

export async function storeCredentials(
  solanaAddress: string,
  credentials: PolymarketCredentials
): Promise<void> {
  await db.encryptedCredentials.upsert({
    where: { solanaAddress },
    create: {
      solanaAddress,
      encryptedData: encrypt(JSON.stringify(credentials)),
      createdAt: new Date(),
    },
    update: {
      encryptedData: encrypt(JSON.stringify(credentials)),
      updatedAt: new Date(),
    },
  })
}
```

### Adding the Package

The `@polymarket/clob-client` package has been added to `package.json`. To install:

```bash
pnpm install
```

If you encounter store location issues:

```bash
pnpm config set store-dir ~/.pnpm-store --global
pnpm install
```

## Next Steps

1. **Test the Flow**: Try both wallet and private key methods
2. **Implement Database**: Move credentials to encrypted database
3. **Add Security**: Implement 2FA and audit logging
4. **Monitor Usage**: Track API calls for rate limiting
5. **User Education**: Create in-app tutorials for linking process

## Support

For issues or questions:

- Check the browser console for detailed error messages
- Review the troubleshooting section above
- Ensure all prerequisites are met (wallets installed, correct network)

---

**Remember:** Never share your private keys or API credentials with anyone. The platform will never ask for them outside of the secure linking flow.

