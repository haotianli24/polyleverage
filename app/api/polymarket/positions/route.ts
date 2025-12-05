import { NextRequest, NextResponse } from 'next/server'

const CLOB_API_BASE = 'https://clob.polymarket.com'
const API_KEY = process.env.POLYMARKET_API_KEY

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY
    }

    const ordersResponse = await fetch(
      `${CLOB_API_BASE}/orders?maker=${address}`,
      {
        headers,
        cache: 'no-store'
      }
    )

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text()
      console.error('Failed to fetch orders:', {
        status: ordersResponse.status,
        error: errorText
      })
      return NextResponse.json(
        { error: 'Failed to fetch user positions' },
        { status: ordersResponse.status }
      )
    }

    const orders = await ordersResponse.json()

    // Separate filled positions and pending orders
    const positions = orders
      .filter((order: any) => order.status === 'MATCHED' || order.status === 'FILLED')
      .map((order: any) => ({
        id: order.id,
        orderId: order.orderID || order.id,
        market: order.market || 'Unknown',
        marketId: order.market,
        tokenId: order.tokenID || order.token_id,
        side: order.side === 'BUY' ? 'long' : 'short',
        size: parseFloat(order.size || '0'),
        price: parseFloat(order.price || '0'),
        status: 'filled',
        timestamp: order.created_at || order.timestamp,
        filledSize: parseFloat(order.filledSize || order.size || '0')
      }))

    const pendingOrders = orders
      .filter((order: any) => order.status === 'OPEN' || order.status === 'PENDING' || order.status === 'PARTIALLY_FILLED')
      .map((order: any) => ({
        id: order.id,
        orderId: order.orderID || order.id,
        market: order.market || 'Unknown',
        marketId: order.market,
        tokenId: order.tokenID || order.token_id,
        side: order.side === 'BUY' ? 'long' : 'short',
        size: parseFloat(order.size || '0'),
        price: parseFloat(order.price || '0'),
        status: order.status.toLowerCase(),
        timestamp: order.created_at || order.timestamp,
        filledSize: parseFloat(order.filledSize || '0')
      }))

    return NextResponse.json({
      address,
      positions,
      pendingOrders,
      totalPositions: positions.length,
      totalPendingOrders: pendingOrders.length
    })

  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}
