import { NextRequest, NextResponse } from 'next/server'
import { solanaDepositService } from '@/lib/solana-deposit'

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

    const balance = await solanaDepositService.getBalance(address)

    return NextResponse.json({
      success: true,
      address,
      balance,
      balanceSOL: balance,
      network: 'mainnet-beta'
    })

  } catch (error) {
    console.error('Error getting balance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get balance' },
      { status: 500 }
    )
  }
}
