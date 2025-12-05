import { NextRequest, NextResponse } from 'next/server'
import { solanaDepositService } from '@/lib/solana-deposit'

// Central deposit address - SOL deposits are sent to this address
const DEPOSIT_ADDRESS_STRING = "CXi538rhqgJx56Edrqg1HMmZK4xfKgTDz7r2df4CnJQL"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature, userAddress } = body

    if (!signature || !userAddress) {
      return NextResponse.json(
        { error: 'Signature and user address required' },
        { status: 400 }
      )
    }

    // Verify transaction is confirmed on blockchain
    const isValid = await solanaDepositService.verifyDeposit(signature)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Deposit transaction not confirmed on blockchain' },
        { status: 400 }
      )
    }

    // Get deposit details and verify it's from userAddress to depositAddress
    const details = await solanaDepositService.getDepositDetails(
      signature,
      DEPOSIT_ADDRESS_STRING,
      userAddress
    )

    // Verify the transaction is from the correct user
    if (details.fromAddress !== userAddress) {
      return NextResponse.json(
        { error: 'Transaction does not match the provided user address' },
        { status: 400 }
      )
    }

    // Verify the transaction is to the deposit address
    if (details.toAddress !== DEPOSIT_ADDRESS_STRING) {
      return NextResponse.json(
        { error: 'Transaction is not to the deposit address' },
        { status: 400 }
      )
    }

    console.log(`Deposit verified: ${signature} - ${details.amount} SOL from ${userAddress} to ${DEPOSIT_ADDRESS_STRING}`)

    return NextResponse.json({
      success: true,
      verified: true,
      amount: details.amount,
      timestamp: details.timestamp,
      signature,
      message: `Deposit of ${details.amount.toFixed(4)} SOL confirmed on blockchain`
    })

  } catch (error) {
    console.error('Error verifying deposit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify deposit' },
      { status: 500 }
    )
  }
}