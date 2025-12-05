import { NextRequest, NextResponse } from 'next/server'
import { polymarketCLOB } from '@/lib/polymarket-clob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userAddress,
      marketId,
      tokenId,
      side,
      amount,
      price
    } = body

    if (!userAddress || !marketId || !tokenId || !side || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, marketId, tokenId, side, amount' },
        { status: 400 }
      )
    }

    if (side !== 'YES' && side !== 'NO') {
      return NextResponse.json(
        { error: 'Side must be YES or NO' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    const clobSide = side === 'YES' ? 'BUY' : 'SELL'

    let orderPrice = price
    if (!orderPrice || orderPrice <= 0) {
      orderPrice = await polymarketCLOB.getBestPrice(tokenId, clobSide)
    }

    const totalCost = amount * orderPrice

    const result = await polymarketCLOB.createOrder({
      userAddress,
      market: marketId,
      tokenId,
      side: clobSide,
      size: amount,
      price: orderPrice
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: result.orderId,
        market: marketId,
        side,
        amount,
        price: orderPrice,
        totalCost,
        leverage: 1,
        status: 'pending'
      },
      message: `Order placed: ${side} ${amount} shares at $${orderPrice.toFixed(4)}`
    })

  } catch (error) {
    console.error('Error opening position:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to open position' },
      { status: 500 }
    )
  }
}
