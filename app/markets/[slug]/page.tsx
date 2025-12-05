"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Link2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { useWallet } from '@solana/wallet-adapter-react'
import { AppLayout } from "@/components/app-layout"
import { Market, Position } from "@/lib/types"

export default function MarketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string | undefined
  const { publicKey, connected } = useWallet()
  const { toast } = useToast()
  
  // Debug logging
  useEffect(() => {
    console.log('MarketDetailPage mounted/updated:', { 
      slug, 
      params: params ? Object.keys(params) : 'no params',
      hasSlug: !!slug 
    })
  }, [slug, params])
  
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [marketSide, setMarketSide] = useState<"buy" | "sell">("buy")
  const [marketLeverage, setMarketLeverage] = useState(2)
  const [marketShares, setMarketShares] = useState("")
  const [marketLimitPrice, setMarketLimitPrice] = useState("")
  const [selectedPriceOption, setSelectedPriceOption] = useState<"yes" | "no" | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [creatingPosition, setCreatingPosition] = useState(false)
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null)
  const [openingPolymarketPosition, setOpeningPolymarketPosition] = useState(false)

  // Generate market price history data (deterministic)
  const generateMarketPriceData = useMemo(() => {
    if (!market) return []
    const data = []
    const now = new Date()
    const baseYesPrice = market.oraclePrice
    
    // Use market ID as seed for deterministic generation
    const seed = market.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    let seedValue = seed
    
    const seededRandom = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280
      return seedValue / 233280
    }
    
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now)
      date.setHours(date.getHours() - i)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      
      // Generate deterministic price movement
      const variation = (Math.sin(i / 3) * 0.1) + (seededRandom() - 0.5) * 0.05
      const yesPrice = Math.max(0.1, Math.min(0.9, baseYesPrice + variation))
      
      data.push({
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        yes: yesPrice * 100,
        no: (1 - yesPrice) * 100,
      })
    }
    
    return data
  }, [market])

  useEffect(() => {
    const fetchMarket = async () => {
      if (!slug) {
        console.warn('No slug provided, cannot fetch market')
        return
      }
      setLoading(true)
      try {
        // Decode the slug if it's URL-encoded (Next.js params are already decoded, but be safe)
        const decodedSlug = decodeURIComponent(slug)
        console.log('Fetching market with slug/ID:', decodedSlug)
        
        // Try fetching with slug first
        let response = await fetch(`/api/polymarket/market?slug=${encodeURIComponent(decodedSlug)}`)
        let usedSlug = true
        
        // If slug doesn't work (404), try using it as an ID instead
        if (!response.ok && response.status === 404) {
          console.log('Slug not found, trying as ID:', decodedSlug)
          response = await fetch(`/api/polymarket/market?id=${encodeURIComponent(decodedSlug)}`)
          usedSlug = false
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          console.error('Failed to fetch market:', {
            status: response.status,
            slug: decodedSlug,
            usedSlug,
            error: errorData
          })
          
          toast({
            title: "Error",
            description: errorData.error || `Failed to load market (${response.status})`,
            variant: "destructive",
          })
          
          // Only redirect if it's a 404 or other client error, not server errors
          // Don't redirect immediately - let user see the error
          if (response.status >= 400 && response.status < 500) {
            // Don't auto-redirect - let user decide
            console.log('Not auto-redirecting, letting user see error')
          }
          return
        }
        
        const data = await response.json()
        console.log('Market data received:', { id: data.id, name: data.name, slug: data.slug })
        
        if (!data || !data.id) {
          throw new Error('Invalid market data received')
        }
        
        setMarket(data)
        setMarketLimitPrice((data.oraclePrice * 100).toFixed(1))
        const yesPrice = data.oraclePrice * 100
        const noPrice = (1 - data.oraclePrice) * 100
        setSelectedPriceOption(yesPrice >= noPrice ? "yes" : "no")
      } catch (error) {
        console.error('Error fetching market:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load market",
          variant: "destructive",
        })
        // Don't redirect on network errors, let user retry
      } finally {
        setLoading(false)
      }
    }
    fetchMarket()
  }, [slug, router, toast])

  useEffect(() => {
    if (market && connected && publicKey) {
      fetchLeveragedPositions()
    }
  }, [market, connected, publicKey])

  const fetchLeveragedPositions = async () => {
    if (!publicKey) return

    setLoadingPositions(true)
    try {
      const response = await fetch(`/api/positions/list?userAddress=${encodeURIComponent(publicKey.toString())}`)
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoadingPositions(false)
    }
  }

  const handleClosePosition = async (positionId: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setClosingPositionId(positionId)
    try {
      const response = await fetch('/api/positions/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          userAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to close position')
      }

      const data = await response.json()
      toast({
        title: "Position Closed",
        description: data.message || `Position closed. Final balance: $${data.finalBalance.toFixed(2)}`,
      })

      await fetchLeveragedPositions()
    } catch (error) {
      console.error('Error closing position:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close position",
        variant: "destructive",
      })
    } finally {
      setClosingPositionId(null)
    }
  }

  const handleOpenPolymarketPosition = async (marketId: string, tokenId: string, side: "YES" | "NO", amount: number, price?: number) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setOpeningPolymarketPosition(true)
    try {
      const response = await fetch('/api/polymarket/open-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          tokenId,
          side,
          amount,
          price,
          userAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to open position')
      }

      const data = await response.json()
      toast({
        title: "Position Opened",
        description: data.message || "Position opened successfully",
      })

      await fetchLeveragedPositions()
    } catch (error) {
      console.error('Error opening position:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open position",
        variant: "destructive",
      })
    } finally {
      setOpeningPolymarketPosition(false)
    }
  }

  const calculatePnL = (pos: Position) => {
    if (pos.pnlPercentage !== undefined) return pos.pnlPercentage
    const priceDiff = pos.side === "long" 
      ? pos.currentPrice - pos.entryPrice
      : pos.entryPrice - pos.currentPrice
    return (priceDiff / pos.entryPrice) * 100 * pos.leverage
  }

  const getHealthBadge = (health?: "healthy" | "warning" | "danger") => {
    if (!health) return null
    const colors = {
      healthy: "bg-green-500/20 text-green-500 border-green-500/30",
      warning: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      danger: "bg-red-500/20 text-red-500 border-red-500/30",
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-mono border ${colors[health]}`}>
        {health.toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading market...</p>
        </div>
      </AppLayout>
    )
  }

  if (!market) {
    return (
      <AppLayout title="Market Not Found">
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Failed to load market data.</p>
          <Button onClick={() => router.push("/markets")} variant="outline">
            Back to Markets
          </Button>
        </div>
      </AppLayout>
    )
  }

  const marketPositions = positions.filter(pos => pos.marketId === market.id)

  return (
    <AppLayout title={market.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/markets")}
              className="hover:bg-accent"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">{market.name}</h2>
              <p className="text-sm text-muted-foreground">
                ${(market.volume || 0).toLocaleString()} Vol.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Link2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content: Graph + Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Graph */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-zinc-800 p-6">
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm">Yes {(market.oraclePrice * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <span className="text-sm">No {((1 - market.oraclePrice) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {["1H", "6H", "1D", "1W", "1M", "ALL"].map((period) => (
                    <Button
                      key={period}
                      variant={period === "ALL" ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    yes: {
                      label: "Yes",
                      color: "#8b5cf6",
                    },
                    no: {
                      label: "No",
                      color: "#ef4444",
                    },
                  }}
                  className="h-full w-full"
                >
                  <LineChart 
                    data={generateMarketPriceData}
                    margin={{ top: 10, right: 15, bottom: 10, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#e2e8f0", fontSize: 10 }}
                      tickLine={{ stroke: "#e2e8f0" }}
                      axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                    />
                    <YAxis
                      tick={{ fill: "#e2e8f0", fontSize: 10 }}
                      tickLine={{ stroke: "#e2e8f0" }}
                      axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={50}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="yes"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="no"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </Card>
          </div>

          {/* Right: Trading Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-zinc-800 p-6 sticky top-6">
              <div className="mb-4">
                <Tabs value={marketSide} onValueChange={(v) => setMarketSide(v as "buy" | "sell")}>
                  <TabsList className="grid w-full grid-cols-2 bg-accent border-zinc-800">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Leverage Control */}
              <div className="mb-4 p-3 bg-accent border border-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Leverage</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setMarketLeverage(Math.max(1, marketLeverage - 1))}
                    >
                      -
                    </Button>
                    <span className="font-mono font-bold text-sm min-w-[3ch] text-center">{marketLeverage}x</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setMarketLeverage(Math.min(20, marketLeverage + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={marketLeverage}
                  onChange={(e) => setMarketLeverage(Number.parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1x</span>
                  <span>20x</span>
                </div>
              </div>

              {/* Price Buttons */}
              <div className="space-y-2 mb-4">
                <Button
                  className={`w-full h-14 text-lg font-semibold ${
                    selectedPriceOption === "yes"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : marketSide === "buy"
                      ? "bg-secondary hover:bg-secondary/90 text-black"
                      : "bg-accent hover:bg-accent/80 text-foreground"
                  }`}
                  onClick={() => {
                    setMarketLimitPrice((market.oraclePrice * 100).toFixed(1))
                    setSelectedPriceOption("yes")
                  }}
                >
                  Yes {(market.oraclePrice * 100).toFixed(1)}¢
                </Button>
                <Button
                  className={`w-full h-14 text-lg font-semibold ${
                    selectedPriceOption === "no"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : marketSide === "sell"
                      ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      : "bg-accent hover:bg-accent/80 text-foreground"
                  }`}
                  onClick={() => {
                    setMarketLimitPrice(((1 - market.oraclePrice) * 100).toFixed(1))
                    setSelectedPriceOption("no")
                  }}
                >
                  No {((1 - market.oraclePrice) * 100).toFixed(1)}¢
                </Button>
              </div>

              {/* Limit Price */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-2 block">Limit Price</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={marketLimitPrice}
                    onChange={(e) => setMarketLimitPrice(e.target.value)}
                    className="bg-accent border-zinc-700 font-mono"
                  />
                  <span className="text-xs text-muted-foreground">¢</span>
                </div>
              </div>

              {/* Shares */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Shares</label>
                  <Button variant="link" size="sm" className="text-xs h-auto p-0">
                    Max
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMarketShares(Math.max(0, Number.parseInt(marketShares || "0") - 100).toString())}
                  >
                    -100
                  </Button>
                  <Input
                    type="number"
                    placeholder="0"
                    value={marketShares}
                    onChange={(e) => setMarketShares(e.target.value)}
                    className="bg-accent border-zinc-700 font-mono text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMarketShares((Number.parseInt(marketShares || "0") + 100).toString())}
                  >
                    +100
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-4 p-3 bg-accent border border-zinc-800 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono">
                    ${((Number.parseFloat(marketLimitPrice || "0") / 100) * Number.parseInt(marketShares || "0") * marketLeverage).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Win</span>
                  <span className="font-mono text-primary">
                    ${((Number.parseFloat(marketLimitPrice || "0") / 100) * Number.parseInt(marketShares || "0") * marketLeverage).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={!connected || !marketShares || Number.parseInt(marketShares) <= 0 || creatingPosition}
                  onClick={async () => {
                    if (!connected || !publicKey || !market) return

                    const shares = Number.parseInt(marketShares)
                    const limitPrice = Number.parseFloat(marketLimitPrice || "0") / 100
                    const collateralAmount = (limitPrice * shares) / marketLeverage

                    if (shares <= 0 || collateralAmount <= 0) {
                      toast({
                        title: "Invalid Order",
                        description: "Please enter valid shares and price",
                        variant: "destructive",
                      })
                      return
                    }

                    setCreatingPosition(true)
                    try {
                      const side = marketSide === "buy" ? "long" : "short"
                      const response = await fetch('/api/positions/create', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          marketId: market.id,
                          marketName: market.name,
                          side,
                          entryPrice: limitPrice,
                          collateral: collateralAmount,
                          leverage: marketLeverage,
                          maintenanceMargin: null,
                          userAddress: publicKey.toString(),
                        }),
                      })

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}))
                        throw new Error(errorData.error || 'Failed to create position')
                      }

                      const data = await response.json()
                      toast({
                        title: "Position Opened",
                        description: data.message || `${side.toUpperCase()} position created`,
                      })

                      await fetchLeveragedPositions()
                      setMarketShares("")
                      setMarketLimitPrice("")
                    } catch (error) {
                      console.error('Error creating position:', error)
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to create position",
                        variant: "destructive",
                      })
                    } finally {
                      setCreatingPosition(false)
                    }
                  }}
                >
                  {creatingPosition ? "Creating..." : !connected ? "Connect Wallet" : `${marketSide === "buy" ? "Buy" : "Sell"} Yes (Leveraged)`}
                </Button>
                
                {/* Direct Polymarket Position Button */}
                {market?.clobTokenIds && market.clobTokenIds.length >= 2 && (
                  <Button
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    disabled={!connected || !marketShares || Number.parseInt(marketShares) <= 0 || openingPolymarketPosition}
                    onClick={async () => {
                      if (!connected || !publicKey || !market) return

                      const shares = Number.parseInt(marketShares)
                      const limitPrice = Number.parseFloat(marketLimitPrice || "0") / 100

                      if (shares <= 0) {
                        toast({
                          title: "Invalid Order",
                          description: "Please enter valid shares",
                          variant: "destructive",
                        })
                        return
                      }

                      if (!market.clobTokenIds || market.clobTokenIds.length < 2) {
                        toast({
                          title: "Market Not Available",
                          description: "This market does not support direct Polymarket trading",
                          variant: "destructive",
                        })
                        return
                      }

                      const tokenId = selectedPriceOption === "yes" 
                        ? market.clobTokenIds[0] 
                        : market.clobTokenIds[1]
                      
                      const side = selectedPriceOption === "yes" ? "YES" : "NO"

                      await handleOpenPolymarketPosition(
                        market.id,
                        tokenId,
                        side as "YES" | "NO",
                        shares,
                        limitPrice
                      )

                      setMarketShares("")
                      setMarketLimitPrice("")
                    }}
                  >
                    {openingPolymarketPosition ? "Opening..." : !connected ? "Connect Wallet" : `Open ${selectedPriceOption === "yes" ? "YES" : "NO"} on Polymarket`}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* My Positions Section */}
        {connected && publicKey && (
          <Card className="bg-card border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">My Positions</h3>
              <Button
                onClick={fetchLeveragedPositions}
                disabled={loadingPositions}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
            {loadingPositions ? (
              <p className="text-center py-8 text-muted-foreground">Loading positions...</p>
            ) : marketPositions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No positions in this market</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Side</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Entry</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Current</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Liquidation</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Collateral</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Leverage</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">P&L</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Margin</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Health</th>
                      <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketPositions.map((pos) => {
                      const pnl = calculatePnL(pos)
                      const pnlAmount = pos.pnl ?? 0
                      return (
                        <tr key={pos.id} className="border-b border-zinc-800 hover:bg-accent/50">
                          <td className="py-4 px-4 font-mono text-sm">
                            <span className={`font-bold ${pos.side === "long" ? "text-primary" : "text-secondary"}`}>
                              {pos.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs">${pos.entryPrice.toFixed(4)}</td>
                          <td className="py-4 px-4 font-mono text-xs">${pos.currentPrice.toFixed(4)}</td>
                          <td className="py-4 px-4 font-mono text-xs text-red-400">${pos.liquidationPrice.toFixed(4)}</td>
                          <td className="py-4 px-4 font-mono text-xs">${pos.collateral.toFixed(2)}</td>
                          <td className="py-4 px-4 font-mono text-xs">{pos.leverage}x</td>
                          <td className="py-4 px-4 font-mono text-sm">
                            <div className="flex flex-col">
                              <span className={pnl >= 0 ? "text-primary" : "text-secondary"}>
                                {pnl >= 0 ? "+" : ""}
                                {pnl.toFixed(2)}%
                              </span>
                              <span className={`text-xs ${pnlAmount >= 0 ? "text-primary/70" : "text-secondary/70"}`}>
                                ${pnlAmount >= 0 ? "+" : ""}{pnlAmount.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs">
                            {pos.marginRatio !== undefined ? `${pos.marginRatio.toFixed(2)}%` : "N/A"}
                          </td>
                          <td className="py-4 px-4">
                            {getHealthBadge(pos.health)}
                          </td>
                          <td className="py-4 px-4">
                            {pos.status === "active" && (
                              <Button
                                onClick={() => handleClosePosition(pos.id)}
                                disabled={closingPositionId === pos.id}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                {closingPositionId === pos.id ? "Closing..." : "Close"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

