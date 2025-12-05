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
  groupItemTitle?: string
  groupItemThreshold?: string
  slug?: string
  active?: boolean
  closed?: boolean
  archived?: boolean
  enableOrderBook?: boolean
  acceptingOrders?: boolean
  rewards?: any
  clobTokenIds?: string[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'market'

    if (!slug && !id) {
      return NextResponse.json(
        { error: 'Either slug or id parameter is required' },
        { status: 400 }
      )
    }

    let marketData: PolymarketMarket | null = null

    if (type === 'event' && slug) {
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
          { error: `Failed to fetch event: ${response.statusText}` },
          { status: response.status }
        )
      }

      const events = await response.json()
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      const event = events[0]
      const markets = event.markets || []
      
      if (markets.length === 0) {
        return NextResponse.json(
          { error: 'No markets found in this event' },
          { status: 404 }
        )
      }

      marketData = markets[0]
      console.log('Using first market from event:', marketData?.question)
    } else if (slug && !marketData) {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }
      
      if (API_KEY) {
        headers['X-API-Key'] = API_KEY
      }

      const endpoints = [
        `${GAMMA_API_BASE}/markets?slug=${slug}`,
        `${GAMMA_API_BASE}/market/${slug}`,
        `${GAMMA_API_BASE}/markets/${slug}`,
      ]

      let response: Response | null = null
      let successfulUrl = ''

      for (const endpoint of endpoints) {
        console.log(`Trying endpoint: ${endpoint}`)
        response = await fetch(endpoint, {
          headers,
          cache: 'no-store'
        })

        if (response.ok) {
          successfulUrl = endpoint
          console.log(`Success with endpoint: ${endpoint}`)
          break
        } else {
          console.log(`Failed with ${response.status}: ${endpoint}`)
        }
      }

      if (!response || !response.ok) {
        const errorText = response ? await response.text() : 'No response'
        console.error('All Polymarket API endpoints failed:', {
          slug,
          hasApiKey: !!API_KEY,
          lastStatus: response?.status,
          lastError: errorText
        })
        return NextResponse.json(
          { error: `Market not found. Tried multiple endpoints.`, details: errorText },
          { status: 404 }
        )
      }

      const data = await response.json()
      console.log('API Response:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        type: typeof data,
        keys: data ? Object.keys(data).slice(0, 5) : 'null'
      })
      
      marketData = Array.isArray(data) ? data[0] : data
      
      if (!marketData || (Array.isArray(data) && data.length === 0)) {
        console.error('Empty market data received for slug:', slug)
        return NextResponse.json(
          { error: 'Market not found or data is empty' },
          { status: 404 }
        )
      }
    } else if (id) {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }
      
      if (API_KEY) {
        headers['X-API-Key'] = API_KEY
      }

      const response = await fetch(`${GAMMA_API_BASE}/markets?id=${id}`, {
        headers,
        cache: 'no-store'
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch market data: ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      marketData = Array.isArray(data) ? data[0] : data
    }

    if (!marketData) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    let outcomePrices = marketData.outcomePrices
    if (typeof outcomePrices === 'string') {
      try {
        outcomePrices = JSON.parse(outcomePrices)
      } catch (e) {
        console.error('Failed to parse outcomePrices:', e)
        outcomePrices = []
      }
    }

    const yesPrice = outcomePrices && outcomePrices.length > 0 
      ? parseFloat(outcomePrices[0]) 
      : 0.5

    const volume = marketData.volume ? parseFloat(marketData.volume) : 0
    const liquidity = marketData.liquidity ? parseFloat(marketData.liquidity) : 0

    const plvScore = calculatePLVScore(yesPrice, volume, liquidity)

    let outcomes = marketData.outcomes
    if (typeof outcomes === 'string') {
      try {
        outcomes = JSON.parse(outcomes)
      } catch (e) {
        outcomes = ['Yes', 'No']
      }
    }

    const formattedMarket = {
      id: marketData.id,
      name: marketData.question,
      description: marketData.description || '',
      outcomes: outcomes || ['Yes', 'No'],
      oraclePrice: yesPrice,
      volume: volume,
      liquidity: liquidity,
      plvScore: plvScore,
      slug: marketData.marketSlug || marketData.slug || slug,
      active: marketData.active ?? true,
      closed: marketData.closed ?? false,
      endDate: marketData.endDate,
      clobTokenIds: marketData.clobTokenIds || [],
      enableOrderBook: marketData.enableOrderBook ?? false,
      change24h: 0
    }

    return NextResponse.json(formattedMarket)

  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data from Polymarket' },
      { status: 500 }
    )
  }
}

function calculatePLVScore(price: number, volume: number, liquidity: number): number {
  const priceScore = Math.min((Math.abs(price - 0.5) * 2) * 100, 100)
  
  const volumeScore = Math.min((volume / 1000000) * 100, 100)
  
  const liquidityScore = Math.min((liquidity / 100000) * 100, 100)
  
  const plvScore = (priceScore * 0.3 + volumeScore * 0.3 + liquidityScore * 0.4)
  
  return Math.round(Math.min(plvScore, 100))
}
