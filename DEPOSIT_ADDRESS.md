# Deposit Address Configuration

## Central Deposit Address

**Public Key (Deposit Address):** `CXi538rhqgJx56Edrqg1HMmZK4xfKgTDz7r2df4CnJQL`

This is the central Solana address where all user deposits are sent.

## Security Notes

⚠️ **IMPORTANT:** The private key for this address must be kept secure!

**Private Key (Base64):** `d71Z/uYNydsfKiZjGWZw9NvndpVHQPAQtcjSSPKvaZCrTmsChe71fnEzmha4SEpV7Lz9WbVuAJvo3fgFQvkQxQ==`

### Recommendations:

1. **Store the private key securely:**
   - Use a hardware wallet or secure key management system
   - Consider using a multisig wallet for additional security
   - Never commit the private key to version control

2. **For production:**
   - Move the deposit address to an environment variable
   - Use a program-derived address (PDA) if possible
   - Consider using a multisig wallet for better security

3. **Monitoring:**
   - Set up monitoring for deposits to this address
   - Implement automated withdrawal/processing of deposits
   - Track all incoming transactions

## Usage

The deposit address is configured in `app/page.tsx` and is used when users deposit SOL through the frontend interface.

## Network

Currently configured for: **Devnet** (as per `lib/solana-deposit.ts`)

For mainnet, update the RPC endpoint and ensure the address has been created on mainnet.

