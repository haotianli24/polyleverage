import { NextRequest, NextResponse } from 'next/server'
import { solanaDepositService } from '@/lib/solana-deposit'
import { depositStore } from '@/lib/deposit-store'

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

    // Check if deposit already exists (prevent duplicate verification)
    if (depositStore.hasDeposit(signature)) {
      const existingDeposit = depositStore.getDeposit(signature)
      // Verify it belongs to this user
      if (existingDeposit?.userAddress === userAddress) {
        return NextResponse.json({
          success: true,
          verified: true,
          amount: existingDeposit.amount,
          timestamp: existingDeposit.timestamp,
          signature,
          message: `Deposit of ${existingDeposit.amount.toFixed(4)} SOL already verified`
        })
      } else {
        return NextResponse.json(
          { error: 'This transaction signature has already been verified for a different user' },
          { status: 400 }
        )
      }
    }

    // Verify transaction is confirmed
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

    // Store the verified deposit - this creates the contract/record associating tx hash with user
    depositStore.addDeposit({
      userAddress,
      signature, // Transaction hash
      amount: details.amount,
      timestamp: details.timestamp,
      verified: true
    })

    console.log(`Deposit verified: ${signature} - ${details.amount} SOL from ${userAddress} to ${DEPOSIT_ADDRESS_STRING}`)

    return NextResponse.json({
      success: true,
      verified: true,
      amount: details.amount,
      timestamp: details.timestamp,
      signature,
      message: `Deposit of ${details.amount.toFixed(4)} SOL confirmed and recorded`
    })

  } catch (error) {
    console.error('Error verifying deposit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify deposit' },
      { status: 500 }
    )
  }
}
