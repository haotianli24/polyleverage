import { NextRequest, NextResponse } from 'next/server'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'
const API_KEY = process.env.POLYMARKET_API_KEY

interface PolymarketMarket {
  id: string
  question: string
  description?: string
  outcomes: string[]
  outcomePrices: string[]
  volume: string
  liquidity?: string
  endDate?: string
  marketSlug: string
  clobTokenIds?: string[]
  active?: boolean
  closed?: boolean
  groupItemTitle?: string
  groupItemThreshold?: string
}

interface PolymarketEvent {
  id: string
  title: string
  slug: string
  description?: string
  markets: PolymarketMarket[]
  volume?: string
  liquidity?: string
  endDate?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY
    }

    console.log(`Fetching event: ${slug}`)
    const response = await fetch(`${GAMMA_API_BASE}/events?slug=${slug}`, {
      headers,
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Event API error:', {
        status: response.status,
        body: errorText
      })
      return NextResponse.json(
        { error: `Failed to fetch event: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const events: PolymarketEvent[] = await response.json()
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = events[0]
    
    if (!event.markets || event.markets.length === 0) {
      return NextResponse.json(
        { error: 'No markets found in this event' },
        { status: 404 }
      )
    }

    // Format submarkets
    const submarkets = event.markets.map(market => {
      let outcomePrices = market.outcomePrices
      if (typeof outcomePrices === 'string') {
        try {
          outcomePrices = JSON.parse(outcomePrices)
        } catch (e) {
          outcomePrices = []
        }
      }

      const yesPrice = outcomePrices && outcomePrices.length > 0
        ? parseFloat(outcomePrices[0])
        : 0.5

      const volume = market.volume ? parseFloat(market.volume) : 0

      let clobTokenIds = market.clobTokenIds
      if (typeof clobTokenIds === 'string') {
        try {
          clobTokenIds = JSON.parse(clobTokenIds)
        } catch (e) {
          clobTokenIds = []
        }
      }

      let outcomes = market.outcomes
      if (typeof outcomes === 'string') {
        try {
          outcomes = JSON.parse(outcomes)
        } catch (e) {
          outcomes = ['Yes', 'No']
        }
      }

      return {
        id: market.id,
        name: market.groupItemTitle || market.question,
        question: market.question,
        description: market.description || '',
        outcomes: outcomes || ['Yes', 'No'],
        yesPrice: yesPrice,
        noPrice: 1 - yesPrice,
        volume: volume,
        liquidity: market.liquidity ? parseFloat(market.liquidity) : 0,
        slug: market.marketSlug,
        clobTokenIds: clobTokenIds || [],
        active: market.active ?? true,
        closed: market.closed ?? false,
        endDate: market.endDate,
        threshold: market.groupItemThreshold
      }
    })

    // Calculate aggregate stats
    const totalVolume = submarkets.reduce((sum, m) => sum + m.volume, 0)
    const avgPrice = submarkets.reduce((sum, m) => sum + m.yesPrice, 0) / submarkets.length

    const formattedEvent = {
      id: event.id,
      name: event.title,
      slug: event.slug,
      description: event.description || '',
      isEvent: true,
      submarkets: submarkets,
      volume: totalVolume,
      avgPrice: avgPrice,
      endDate: event.endDate,
      totalMarkets: submarkets.length
    }

    return NextResponse.json(formattedEvent)

  } catch (error) {
    console.error('Error fetching event data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event data from Polymarket' },
      { status: 500 }
    )
  }
}

