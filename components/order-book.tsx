"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface OrderBookEntry {
  price: string
  size: string
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

interface OrderBookProps {
  tokenId: string
  outcome: "YES" | "NO"
  currentPrice?: number // Current market price for reference (0-1 range)
}

export function OrderBook({ tokenId, outcome, currentPrice }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderBook = async () => {
    if (!tokenId) {
      setError("No token ID provided")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/polymarket/orderbook?tokenId=${encodeURIComponent(tokenId)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order book: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.orderBook) {
        // Sort bids descending (highest price first) and asks ascending (lowest price first)
        const orderBookData = {
          bids: (data.orderBook.bids || []).sort((a: OrderBookEntry, b: OrderBookEntry) => 
            parseFloat(b.price) - parseFloat(a.price)
          ),
          asks: (data.orderBook.asks || []).sort((a: OrderBookEntry, b: OrderBookEntry) => 
            parseFloat(a.price) - parseFloat(b.price)
          )
        }
        
        console.log('Order Book Data:', {
          outcome,
          tokenId,
          currentPrice,
          bidsCount: orderBookData.bids.length,
          asksCount: orderBookData.asks.length,
          bestBid: orderBookData.bids[0]?.price,
          bestAsk: orderBookData.asks[0]?.price,
          bidPriceRange: `${orderBookData.bids[orderBookData.bids.length-1]?.price} - ${orderBookData.bids[0]?.price}`,
          askPriceRange: `${orderBookData.asks[0]?.price} - ${orderBookData.asks[orderBookData.asks.length-1]?.price}`
        })
        
        setOrderBook(orderBookData)
      } else {
        throw new Error(data.error || 'Invalid order book data')
      }
    } catch (err) {
      console.error('Error fetching order book:', err)
      setError(err instanceof Error ? err.message : 'Failed to load order book')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderBook()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchOrderBook, 5000)
    
    return () => clearInterval(interval)
  }, [tokenId])

  if (loading && !orderBook) {
    return (
      <Card className="bg-card border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Order Book - {outcome}</h3>
        </div>
        <p className="text-center py-8 text-muted-foreground">Loading order book...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Order Book - {outcome}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchOrderBook}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-center py-8 text-muted-foreground text-sm">{error}</p>
      </Card>
    )
  }

  const bids = orderBook?.bids || []
  const asks = orderBook?.asks || []
  
  // Calculate total volumes for percentage bars
  const maxBidVolume = Math.max(...bids.map(b => parseFloat(b.size)), 1)
  const maxAskVolume = Math.max(...asks.map(a => parseFloat(a.size)), 1)
  const maxVolume = Math.max(maxBidVolume, maxAskVolume)

  // Take top 5 of each for compact display
  const topBids = bids.slice(0, 5)
  const topAsks = asks.slice(0, 5).reverse() // Reverse so lowest ask is at bottom (closest to spread)
  
  // Calculate last price and spread
  const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0
  const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0
  const lastPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : (bestBid || bestAsk || 0)
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0

  return (
    <Card className="bg-card border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Order Book</h3>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded">
            Trade {outcome}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchOrderBook}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Debug Info */}
      {currentPrice && Math.abs(lastPrice - currentPrice) > 0.2 && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
          <div className="font-semibold text-yellow-500 mb-1">⚠️ Price Mismatch Detected</div>
          <div className="text-muted-foreground space-y-0.5">
            <div>Expected: {(currentPrice * 100).toFixed(1)}¢</div>
            <div>Order Book: {(lastPrice * 100).toFixed(1)}¢</div>
            <div className="text-[10px]">Token ID: {tokenId.slice(0, 10)}...</div>
          </div>
        </div>
      )}

      {/* Column Headers */}
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground font-mono">
        <span>PRICE</span>
        <span>SHARES</span>
        <span>TOTAL</span>
      </div>

      {/* Asks Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-semibold rounded">
          Asks
        </span>
      </div>

      {/* Asks (Sell Orders) - Top Section */}
      <div className="space-y-0.5 mb-3">
        {topAsks.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground">No asks</p>
        ) : (
          topAsks.map((ask, idx) => {
            const price = parseFloat(ask.price)
            const size = parseFloat(ask.size)
            const total = price * size
            const percentage = (size / maxVolume) * 100
            
            return (
              <div
                key={idx}
                className="relative flex items-center justify-between py-1.5 px-2 text-xs font-mono hover:bg-accent/50"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-red-500/10"
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Content */}
                <span className="relative z-10 text-red-500 font-semibold">
                  {(price * 100).toFixed(0)}¢
                </span>
                <span className="relative z-10 text-foreground">
                  {size.toFixed(2)}
                </span>
                <span className="relative z-10 text-muted-foreground">
                  ${total.toFixed(2)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Spread Separator */}
      <div className="flex items-center justify-between py-2 px-2 bg-accent/30 border-y border-zinc-700 mb-2 text-xs font-mono">
        <span className="text-muted-foreground">
          Last: <span className="text-foreground font-semibold">{(lastPrice * 100).toFixed(0)}¢</span>
        </span>
        <span className="text-muted-foreground">
          Spread: <span className="text-foreground font-semibold">{(spread * 100).toFixed(0)}¢</span>
        </span>
      </div>

      {/* Bids Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-semibold rounded">
          Bids
        </span>
      </div>

      {/* Bids (Buy Orders) - Bottom Section */}
      <div className="space-y-0.5">
        {topBids.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground">No bids</p>
        ) : (
          topBids.map((bid, idx) => {
            const price = parseFloat(bid.price)
            const size = parseFloat(bid.size)
            const total = price * size
            const percentage = (size / maxVolume) * 100
            
            return (
              <div
                key={idx}
                className="relative flex items-center justify-between py-1.5 px-2 text-xs font-mono hover:bg-accent/50"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-green-500/10"
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Content */}
                <span className="relative z-10 text-green-500 font-semibold">
                  {(price * 100).toFixed(0)}¢
                </span>
                <span className="relative z-10 text-foreground">
                  {size.toFixed(2)}
                </span>
                <span className="relative z-10 text-muted-foreground">
                  ${total.toFixed(2)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

