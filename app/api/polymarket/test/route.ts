import { NextResponse } from 'next/server'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'
const API_KEY = process.env.POLYMARKET_API_KEY

export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY
    }

    console.log('Testing Polymarket API with key:', API_KEY ? 'Present' : 'Missing')

    const response = await fetch(`${GAMMA_API_BASE}/markets?limit=3`, {
      headers,
      cache: 'no-store'
    })

    const statusText = response.statusText
    const status = response.status

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        status,
        statusText,
        error: errorText,
        hasApiKey: !!API_KEY
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      status,
      hasApiKey: !!API_KEY,
      sampleMarket: data[0] ? {
        id: data[0].id,
        question: data[0].question,
        marketSlug: data[0].marketSlug,
        slug: data[0].slug
      } : null,
      totalReturned: data.length
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
