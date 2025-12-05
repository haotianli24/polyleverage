# Network Configuration Guide

## Solana Network Settings

The application has been configured to use **Solana Mainnet** by default. This means users will see their actual SOL balances from mainnet when depositing.

## Current Configuration

### Default Network
- **Network**: Mainnet-beta (Solana Mainnet)
- **Default RPC**: `https://api.mainnet-beta.solana.com`
- **Status**: ✅ Configured for production

### Files Updated
1. `app/providers.tsx` - Wallet provider uses mainnet
2. `lib/solana-deposit.ts` - Deposit service uses mainnet
3. `app/api/deposits/balance/route.ts` - Balance API returns mainnet data
4. `scripts/check-deposit-balance.js` - Utility script uses mainnet

## Using Custom RPC Endpoints (Recommended)

For better performance and reliability, especially in production, use a dedicated RPC provider instead of the public endpoint.

### Why Use a Custom RPC?
- ✅ Higher rate limits
- ✅ Better uptime and reliability
- ✅ Faster response times
- ✅ Priority access to network
- ✅ Better support

### Recommended Providers

#### 1. Helius (Recommended)
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```
- Free tier: 100 requests/second
- Excellent for production
- Great documentation
- Sign up: https://helius.dev

#### 2. QuickNode
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_TOKEN/
```
- Free tier available
- Enterprise-grade infrastructure
- Global edge network
- Sign up: https://quicknode.com

#### 3. Alchemy
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```
- Free tier: 300M compute units/month
- Multi-chain support
- Enhanced APIs
- Sign up: https://alchemy.com

#### 4. Triton
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://YOUR_ENDPOINT.rpcpool.com/YOUR_TOKEN
```
- High performance
- Dedicated endpoints
- Professional support
- Sign up: https://triton.one

## Setup Instructions

### 1. Create Environment File
Copy the example environment file:
```bash
cp .env.example .env.local
```

### 2. Add Your RPC URL
Edit `.env.local` and add your custom RPC endpoint:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-endpoint.com
```

### 3. Restart Development Server
```bash
pnpm dev
```

The application will automatically use your custom RPC endpoint.

## Testing Network Configuration

### Check Current Network
1. Connect your wallet to the application
2. Open browser console (F12)
3. Check the network logs when fetching balance
4. Should show "mainnet-beta"

### Verify Balance
1. Go to Portfolio page
2. Click "Refresh" in the Deposit SOL section
3. Balance should match your actual mainnet balance
4. Compare with Phantom wallet or Solscan

### Using the Check Script
Run the utility script to check the deposit address:
```bash
node scripts/check-deposit-balance.js
```

This will show:
- Current network (Mainnet/Devnet/Custom)
- Balance of the deposit address
- Recent transactions

## Switching Between Networks

### For Development/Testing (Use Devnet)
If you need to test with devnet instead of mainnet:

1. Update `app/providers.tsx`:
```typescript
const network = WalletAdapterNetwork.Devnet;
```

2. Update `lib/solana-deposit.ts`:
```typescript
constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
```

3. Or use environment variable:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### For Production (Use Mainnet)
Already configured! Just ensure you have a reliable RPC endpoint.

## Rate Limiting

### Public Endpoints
- Free to use but rate limited
- May experience 403 errors during high traffic
- Not recommended for production

### Custom RPC Endpoints
- Much higher rate limits
- Dedicated capacity
- Better for production use

## Monitoring

### Check RPC Health
Monitor your RPC provider's status:
- Helius: https://status.helius.dev
- QuickNode: https://status.quicknode.com
- Alchemy: https://status.alchemy.com

### Track Usage
Most providers offer dashboards to track:
- Request count
- Rate limit status
- Error rates
- Response times

## Troubleshooting

### "RPC Rate Limit" Error
**Problem**: Too many requests to public endpoint

**Solutions**:
1. Use a custom RPC provider (recommended)
2. Implement request caching
3. Add retry logic with backoff

### Balance Shows 0 on Mainnet
**Problem**: Address has no mainnet balance

**Solutions**:
1. Verify you're connected to mainnet wallet
2. Check address on Solscan: https://solscan.io
3. Ensure wallet has actual SOL (not devnet SOL)
4. Try refreshing the page

### "403 Forbidden" Error
**Problem**: Public RPC endpoint blocking requests

**Solutions**:
1. Switch to a custom RPC provider
2. Wait a few minutes and retry
3. Check if endpoint is down

### Wrong Network Displayed
**Problem**: Shows devnet instead of mainnet

**Solutions**:
1. Clear browser cache
2. Check .env.local configuration
3. Restart development server
4. Verify providers.tsx settings

## Security Considerations

### RPC Endpoint Security
- ✅ Store RPC URLs in environment variables
- ✅ Never commit API keys to git
- ✅ Use different endpoints for dev/prod
- ✅ Rotate keys periodically

### Network Validation
- ✅ Always verify network before transactions
- ✅ Display current network to users
- ✅ Warn users about network mismatches
- ✅ Confirm transactions on correct network

## FAQ

**Q: Will users lose devnet SOL?**
A: No, devnet and mainnet are separate. Devnet SOL has no real value.

**Q: Do I need to change the deposit address?**
A: The deposit address works on both networks. Ensure it has mainnet SOL if using mainnet.

**Q: What if my custom RPC goes down?**
A: The app will fall back to the default endpoint. Consider using multiple RPC providers.

**Q: Can I use the free public endpoint?**
A: Yes, but it's rate limited and not recommended for production.

**Q: How do I know which network I'm on?**
A: Check the balance API response - it includes a `network` field showing "mainnet-beta" or "devnet".

## Support

For RPC provider support:
- Helius: https://docs.helius.dev
- QuickNode: https://www.quicknode.com/docs
- Alchemy: https://docs.alchemy.com
- Triton: https://docs.triton.one

---

**Last Updated**: December 2025
**Network**: Mainnet-beta ✅

