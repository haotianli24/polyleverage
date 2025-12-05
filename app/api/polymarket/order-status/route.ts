import { NextRequest, NextResponse } from 'next/server'
import { polymarketCLOB } from '@/lib/polymarket-clob'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      )
    }

    const orderStatus = await polymarketCLOB.getOrderStatus(orderId)

    return NextResponse.json({
      success: true,
      order: orderStatus
    })

  } catch (error) {
    console.error('Error getting order status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get order status' },
      { status: 500 }
    )
  }
}
