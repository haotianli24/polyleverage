import { NextRequest, NextResponse } from 'next/server'
import { solanaDepositService } from '@/lib/solana-deposit'

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

    const isValid = await solanaDepositService.verifyDeposit(signature)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Deposit not confirmed' },
        { status: 400 }
      )
    }

    const details = await solanaDepositService.getDepositDetails(signature)

    return NextResponse.json({
      success: true,
      verified: true,
      amount: details.amount,
      timestamp: details.timestamp,
      signature,
      message: `Deposit of ${details.amount.toFixed(4)} SOL confirmed`
    })

  } catch (error) {
    console.error('Error verifying deposit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify deposit' },
      { status: 500 }
    )
  }
}
