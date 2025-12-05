"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AppLayout } from "@/components/app-layout"
import { Market } from "@/lib/types"

export default function MarketsPage() {
  const router = useRouter()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchMarkets = async () => {
    setLoadingMarkets(true)
    try {
      const response = await fetch('/api/polymarket/markets?limit=6')
      if (response.ok) {
        const data = await response.json()
        setMarkets(data)
      } else {
        console.error('Failed to fetch markets')
      }
    } catch (error) {
      console.error('Error fetching markets:', error)
    } finally {
      setLoadingMarkets(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
  }, [])

  const fetchMarketInfo = async (marketId: string, slug?: string) => {
    try {
      const url = slug 
        ? `/api/polymarket/market?slug=${encodeURIComponent(slug)}`
        : `/api/polymarket/market?id=${encodeURIComponent(marketId)}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null
    } catch (error) {
      console.error('Error fetching market info:', error)
      return null
    }
  }

  const handleMarketClick = async (market: Market) => {
    // Use slug if available, otherwise fall back to ID
    const marketSlug = market.slug || market.id
    
    if (!marketSlug) {
      console.error('Market has no slug or id:', market)
      return
    }
    
    console.log('Navigating to market:', { slug: marketSlug, id: market.id, hasSlug: !!market.slug })
    
    // Navigate directly - the detail page will fetch the full market info
    router.push(`/markets/${encodeURIComponent(marketSlug)}`)
  }

  return (
    <AppLayout title="Markets">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-zinc-800"
            />
          </div>
          <Button
            onClick={fetchMarkets}
            disabled={loadingMarkets}
            variant="outline"
            size="icon"
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>
        {loadingMarkets && markets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No markets available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets
              .filter(market =>
                market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (market.description && market.description.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((market) => (
                <Card
                  key={market.id}
                  className="bg-card border-zinc-800 p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleMarketClick(market)}
                >
                  <p className="font-semibold text-sm mb-3">{market.name}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liquidity</span>
                      <span className="font-mono text-primary">{market.liquidity || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-mono">${(market.oraclePrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Change</span>
                      <span className={`font-mono ${(market.change24h || 0) >= 0 ? "text-primary" : "text-secondary"}`}>
                        {(market.change24h || 0) >= 0 ? "+" : ""}
                        {(market.change24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

