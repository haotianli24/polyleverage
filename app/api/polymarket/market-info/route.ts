import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Market slug required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.POLYMARKET_API_KEY
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets?slug=${slug}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch market: ${response.status}`)
    }

    const markets = await response.json()
    
    if (!markets || markets.length === 0) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    const market = markets[0]
    
    let clobTokenIds = market.clobTokenIds
    if (typeof clobTokenIds === 'string') {
      try {
        clobTokenIds = JSON.parse(clobTokenIds)
      } catch (e) {
        clobTokenIds = []
      }
    }

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        conditionId: market.conditionId,
        slug: market.slug,
        question: market.question,
        description: market.description,
        outcomes: typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes,
        active: market.active,
        closed: market.closed,
        endDate: market.endDate,
        volume: parseFloat(market.volume || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        clobTokenIds: clobTokenIds
      }
    })

  } catch (error) {
    console.error('Error fetching market info:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch market info' },
      { status: 500 }
    )
  }
}
