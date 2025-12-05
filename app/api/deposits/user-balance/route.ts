import { NextRequest, NextResponse } from 'next/server'
import { depositStore } from '@/lib/deposit-store'

// SOL to USDC conversion rate (you might want to fetch this from an oracle in production)
const SOL_TO_USDC_RATE = 150 // Approximate rate, should be fetched from price oracle

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

    const totalDepositsSOL = depositStore.getUserTotalDeposits(address)
    const totalDepositsUSDC = totalDepositsSOL * SOL_TO_USDC_RATE

    return NextResponse.json({
      success: true,
      address,
      totalDepositsSOL,
      totalDepositsUSDC,
      deposits: depositStore.getUserDeposits(address)
    })

  } catch (error) {
    console.error('Error getting user deposit balance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get deposit balance' },
      { status: 500 }
    )
  }
}

