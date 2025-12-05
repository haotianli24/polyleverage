import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Central deposit address
const DEPOSIT_ADDRESS = 'CXi538rhqgJx56Edrqg1HMmZK4xfKgTDz7r2df4CnJQL'

// RPC endpoint - uses devnet by default
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      )
    }

    const connection = new Connection(RPC_URL, 'confirmed')
    const depositPubkey = new PublicKey(DEPOSIT_ADDRESS)
    const userPubkey = new PublicKey(address)

    // Get all signatures for the deposit address
    const signatures = await connection.getSignaturesForAddress(depositPubkey, { limit: 1000 })

    const deposits = []
    let totalDepositsSOL = 0

    // Fetch transaction details for each signature
    for (const sigInfo of signatures) {
      try {
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0
        })

        if (!tx || !tx.meta) continue

        // Get account keys - handle both versioned and legacy transactions
        const accountKeys = tx.transaction.message.getAccountKeys 
          ? tx.transaction.message.getAccountKeys().keySegments().flat()
          : (tx.transaction.message as any).accountKeys
        
        const accountKeyStrings = accountKeys.map((key: PublicKey) => key.toString())
        
        // Check if this transaction involves the user address
        const userIndex = accountKeyStrings.findIndex((key: string) => key === userPubkey.toString())
        const depositIndex = accountKeyStrings.findIndex((key: string) => key === depositPubkey.toString())

        if (userIndex === -1 || depositIndex === -1) continue

        // Calculate the amount deposited
        const depositPreBalance = tx.meta.preBalances[depositIndex]
        const depositPostBalance = tx.meta.postBalances[depositIndex]
        const amount = (depositPostBalance - depositPreBalance) / LAMPORTS_PER_SOL

        // Only count if amount is positive
        if (amount > 0) {
          deposits.push({
            signature: sigInfo.signature,
            amount,
            timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
            verified: true
          })
          totalDepositsSOL += amount
        }
      } catch (error) {
        console.error(`Error fetching transaction ${sigInfo.signature}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      address,
      depositCount: deposits.length,
      totalDepositsSOL,
      deposits
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get debug info' },
      { status: 500 }
    )
  }
}
