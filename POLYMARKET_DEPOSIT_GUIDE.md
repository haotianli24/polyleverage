# Polymarket Deposit via Solana - User Guide

## Overview

You can now deposit funds from Solana directly to your Polymarket account without leaving the platform! This feature uses Polymarket's native bridge to convert your SOL to USDC on Polygon, making it seamless to fund your trading account.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Solana Wallet (SOL/USDC)                              │
│           ↓                                                  │
│  Polymarket Bridge (1-5 minutes)                            │
│           ↓                                                  │
│  Your Polymarket Account (USDC on Polygon)                  │
└─────────────────────────────────────────────────────────────┘
```

### The Process

1. **You send SOL** from your Phantom/Solflare wallet
2. **Polymarket bridge receives it** at your unique deposit address
3. **Automatic conversion** to USDC on Polygon (1-5 minutes)
4. **Funds appear** in your Polymarket account, ready to trade

## Prerequisites

### Step 1: Link Your Polymarket Account
Before you can deposit, you must:
1. Click "Link Polymarket" in your Portfolio
2. Connect your Polygon wallet OR paste your private key
3. Complete the linking process

See [POLYMARKET_LINKING_GUIDE.md](./POLYMARKET_LINKING_GUIDE.md) for details.

### Step 2: Initialize Your Polymarket Account

If you're a new Polymarket user, you need to initialize your account first:

**Why?** Polymarket uses a "Proxy Wallet" system. Your account needs to be initialized before it can accept deposits via the bridge.

**How to Initialize:**
1. Visit [polymarket.com](https://polymarket.com)
2. Browse any market OR make a small deposit directly on Polymarket
3. Once you've taken any action, your account is initialized
4. Return to PolyLeverage and you can now deposit from Solana!

**Verification:** After linking, the app will automatically verify if your account is initialized. You'll see one of:
- ✅ **"Account Verified"** - Ready to deposit!
- ⚠️ **"Account Needs Initialization"** - Visit Polymarket first

## Using the Deposit Feature

### Step-by-Step Instructions

1. **Open Portfolio Page**
   - Navigate to Portfolio in the sidebar
   - Ensure your Solana wallet is connected

2. **Click "Deposit to Polymarket"**
   - Located next to the "Link Polymarket" button
   - Only enabled if your account is linked

3. **Review Deposit Details**
   - From: Your Solana wallet
   - To: Your Polymarket account (via bridge)
   - You'll see your unique deposit address

4. **Enter Amount**
   - Type the amount of SOL to deposit
   - Use percentage buttons for quick selection (25%, 50%, 75%, Max)
   - See estimated USDC you'll receive

5. **Review Estimates**
   - Bridge fee: ~0.1% (~$0.15 on a $150 deposit)
   - Expected arrival: 1-5 minutes
   - Estimated USDC: Based on current SOL price

6. **Confirm Deposit**
   - Click "Deposit X SOL"
   - Approve transaction in your wallet
   - Wait for confirmation

7. **Track Your Deposit**
   - Transaction signature shown in dialog
   - Click "View on Solscan" to track progress
   - Funds appear in Polymarket within 1-5 minutes

## Deposit Examples

### Example 1: Small Deposit (0.1 SOL)

```
Amount: 0.1 SOL
SOL Price: $150
Bridge Fee: ~$0.15 (0.1%)
You Receive: ~$14.85 USDC
Time: 1-5 minutes
```

### Example 2: Medium Deposit (1 SOL)

```
Amount: 1 SOL
SOL Price: $150
Bridge Fee: ~$0.15 (0.1%)
You Receive: ~$149.85 USDC
Time: 1-5 minutes
```

### Example 3: Large Deposit (10 SOL)

```
Amount: 10 SOL
SOL Price: $150
Bridge Fee: ~$1.50 (0.1%)
You Receive: ~$1,498.50 USDC
Time: 1-5 minutes
```

## Understanding Your Deposit Address

Each Polymarket user has a **unique Solana deposit address**. This is:

- ✅ **Personal to you** - Only deposits to this address credit your account
- ✅ **Permanent** - The address doesn't change
- ✅ **Secure** - Managed by Polymarket's bridge infrastructure
- ✅ **Reusable** - You can deposit multiple times

**Important:** Never send funds to someone else's deposit address!

## Fees and Pricing

### Bridge Fees
- **Fee**: ~0.1% of deposit amount
- **Example**: $0.15 on a $150 deposit
- **Charged by**: Polymarket bridge (not PolyLeverage)

### Conversion Rate
- **Based on**: Current SOL/USDC market rate
- **Updated**: Real-time via oracle
- **Slippage**: Minimal (<0.1% typically)

### Solana Transaction Fee
- **Network fee**: ~0.000005 SOL (~$0.0007)
- **Paid to**: Solana validators
- **Required**: Yes, for sending the transaction

### Total Cost Example
```
Deposit: 1 SOL = $150
- Solana network fee: $0.0007
- Bridge fee: $0.15
- Total fees: $0.1507
- You receive: $149.85 USDC
```

## Timing and Confirmations

### Expected Timeline

1. **Immediate**: Transaction sent from your wallet
2. **30 seconds**: Solana confirmation (finalized)
3. **1-3 minutes**: Bridge processing
4. **1-5 minutes**: USDC appears in Polymarket account

### If Taking Longer

If your deposit takes more than 10 minutes:
1. Check transaction on [Solscan](https://solscan.io)
2. Verify you sent to correct address
3. Check Polymarket account balance
4. Contact Polymarket support if needed

## Safety and Security

### ✅ Safe Practices

1. **Verify Address**: Always check the deposit address matches
2. **Small Test**: Try a small amount first
3. **Use Our Interface**: Don't manually send to deposit addresses
4. **Check Network**: Ensure on Solana Mainnet (not devnet)
5. **Save Signature**: Keep transaction signature for tracking

### ⚠️ Common Mistakes to Avoid

1. ❌ **Wrong Network**: Sending devnet SOL (worthless)
2. ❌ **Wrong Address**: Copy-paste errors
3. ❌ **Unlinked Account**: Deposit without linking first
4. ❌ **Uninitialized Account**: Deposit before Polymarket initialization
5. ❌ **Insufficient Balance**: Trying to send more than you have

### 🔒 Security Features

- **Client-side signing**: Your keys never leave your device
- **Phantom security**: All wallet protections apply
- **Polymarket custody**: Bridge managed by Polymarket
- **Transparent tracking**: Full transaction history on Solscan

## Troubleshooting

### "Deposit to Polymarket" Button Disabled

**Problem**: Button is greyed out

**Solutions**:
1. Connect your Solana wallet
2. Link your Polymarket account (click "Link Polymarket" first)
3. Refresh the page

### "Account Needs Initialization"

**Problem**: Account linked but can't deposit

**Solutions**:
1. Visit [polymarket.com](https://polymarket.com)
2. Browse any market or make any action
3. Wait a few minutes
4. Click "Check Again" in the dialog
5. Try deposit again

### "Deposit Address Not Available"

**Problem**: Can't fetch deposit address

**Solutions**:
1. Ensure account is initialized on Polymarket
2. Check internet connection
3. Try again in a few minutes
4. Contact support if persists

### Deposit Not Showing in Polymarket

**Problem**: Sent deposit but not showing

**Solutions**:
1. Wait full 5 minutes (bridge can be slow)
2. Check transaction on Solscan - confirmed?
3. Verify correct deposit address was used
4. Log into Polymarket directly to check balance
5. Contact Polymarket support with transaction signature

### "Insufficient Balance"

**Problem**: Can't send amount entered

**Solutions**:
1. Check your SOL balance (shown in dialog)
2. Leave some SOL for network fees (~0.01 SOL)
3. Use percentage buttons for safe amounts
4. Try the "Max" button (leaves small amount for fees)

## Advanced Features

### Multiple Deposits

You can make multiple deposits to the same address:
- No limit on number of deposits
- Each tracked independently
- All credit to your Polymarket account
- Bridge handles concurrent deposits

### Tracking Deposits

Every deposit transaction:
- Has a unique Solana signature
- Viewable on Solscan
- Appears in your Phantom history
- Credits your Polymarket account

### Alternative Deposit Methods

While this feature is convenient, you can also:

1. **Direct Polymarket Deposit**
   - Go to polymarket.com
   - Use their native deposit flow
   - More options (USDC, ETH, etc.)

2. **Manual Bridge**
   - Use any Solana-Polygon bridge
   - More control over fees
   - May take longer

3. **On-Ramp Services**
   - Buy USDC directly on Polygon
   - Services like MoonPay, Ramp
   - Higher fees typically

## FAQ

**Q: How long do deposits take?**
A: Typically 1-5 minutes. Up to 10 minutes during high traffic.

**Q: What's the minimum deposit?**
A: No official minimum, but consider fees. Recommend at least 0.1 SOL ($15).

**Q: What's the maximum deposit?**
A: No limit from our side. Bridge may have limits - check Polymarket docs.

**Q: Can I deposit USDC instead of SOL?**
A: Currently only SOL is supported via this interface. For USDC, use Polymarket directly.

**Q: Do I pay gas fees on Polygon?**
A: No. The bridge handles Polygon gas internally.

**Q: What if SOL price changes during deposit?**
A: You receive USDC based on the price when the bridge processes it (usually within 1 minute).

**Q: Can I cancel a deposit?**
A: No. Once sent, the transaction is irreversible. The bridge will process it.

**Q: Is this the same as depositing directly on Polymarket?**
A: Yes, it uses Polymarket's official bridge. The funds are just as secure.

**Q: Can I withdraw back to Solana?**
A: Not directly. You'd need to withdraw from Polymarket to Polygon, then bridge to Solana.

**Q: What happens if I send to the wrong address?**
A: Funds will go to whoever owns that address. Always verify before sending.

**Q: Is there a fee to withdraw from Polymarket later?**
A: Yes, Polymarket has withdrawal fees (varies by chain). Check their docs.

## Support

### For Deposit Issues
- **Transaction Problems**: Check Solscan, verify confirmation
- **Bridge Issues**: Contact Polymarket support
- **App Issues**: Check browser console for errors

### For Account Issues
- **Linking Problems**: See POLYMARKET_LINKING_GUIDE.md
- **Verification Issues**: Ensure account initialized on Polymarket
- **Balance Issues**: Check Polymarket directly

### Resources
- [Polymarket Bridge Docs](https://docs.polymarket.com/#bridge)
- [Solscan Transaction Explorer](https://solscan.io)
- [Polymarket Support](https://polymarket.com/support)

## Best Practices

1. ✅ **Start Small**: Test with small amount first
2. ✅ **Check Status**: Verify account linked and verified
3. ✅ **Save Signatures**: Keep transaction IDs for tracking
4. ✅ **Monitor Balance**: Check Polymarket balance after deposit
5. ✅ **Use Mainnet**: Ensure wallet on Solana Mainnet
6. ✅ **Verify Addresses**: Double-check deposit address
7. ✅ **Keep Records**: Note amounts and timestamps

## Summary

Depositing from Solana to Polymarket is:
- **Fast**: 1-5 minutes
- **Cheap**: ~0.1% fee
- **Easy**: One-click from Portfolio
- **Secure**: Polymarket's official bridge
- **Seamless**: No manual bridge interaction needed

You stay in your Solana wallet, we handle the cross-chain complexity!

---

**Last Updated**: December 2025
**Version**: 1.0

