import { NextRequest, NextResponse } from 'next/server'
import { depositStore } from '@/lib/deposit-store'

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

    const userDeposits = depositStore.getUserDeposits(address)
    const total = depositStore.getUserTotalDeposits(address)
    
    return NextResponse.json({
      success: true,
      address,
      depositCount: userDeposits.length,
      totalDepositsSOL: total,
      deposits: userDeposits.map(d => ({
        signature: d.signature,
        amount: d.amount,
        timestamp: d.timestamp,
        verified: d.verified
      }))
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get debug info' },
      { status: 500 }
    )
  }
}

