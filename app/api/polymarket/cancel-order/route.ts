import { NextRequest, NextResponse } from 'next/server'
import { polymarketCLOB } from '@/lib/polymarket-clob'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, userAddress } = body

    if (!orderId || !userAddress) {
      return NextResponse.json(
        { error: 'Order ID and user address required' },
        { status: 400 }
      )
    }

    const result = await polymarketCLOB.cancelOrder(orderId, userAddress)

    return NextResponse.json({
      success: true,
      result,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
