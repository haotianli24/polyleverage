"use client"

import { useState, useEffect, useMemo } from "react"
import { Home, TrendingUp, Wallet, Coins, Menu, X, Zap, ArrowDownUp, ChevronLeft, Link2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

interface Market {
  id: string
  name: string
  liquidity: number
  oraclePrice: number
  change24h: number
  slug?: string
  volume?: number
  description?: string
  plvScore?: number
}

interface Position {
  id: string
  marketId: string
  marketName: string
  side: "long" | "short"
  entryPrice: number
  currentPrice: number
  collateral: number
  leverage: number
  liquidationPrice: number
  maintenanceMargin: number | null
  userAddress: string
  createdAt: string
  status: "active" | "liquidated" | "closed"
  // Enriched fields from API
  marginRatio?: number
  health?: "healthy" | "warning" | "danger"
  pnl?: number
  pnlPercentage?: number
  positionSize?: number
}


export default function PolyLeverage() {
  const { publicKey, connected } = useWallet()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState<"dashboard" | "markets" | "portfolio" | "stake">("markets")
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [polymarketUrl, setPolymarketUrl] = useState("")
  const [selectedTab, setSelectedTab] = useState<"long" | "short">("long")
  const [collateral, setCollateral] = useState("1000")
  const [leverage, setLeverage] = useState(2)
  const [oraclePrice, setOraclePrice] = useState(0.5)
  const [positions, setPositions] = useState<Position[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [analyzingMarket, setAnalyzingMarket] = useState(false)
  const [userPositions, setUserPositions] = useState<any[]>([])
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [creatingPosition, setCreatingPosition] = useState(false)
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [bridging, setBridging] = useState(false)
  const [bridgeQuote, setBridgeQuote] = useState<any>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [staking, setStaking] = useState(false)
  const [stakedBalance, setStakedBalance] = useState(0)
  const [apy, setApy] = useState(12.5)
  
  // Staking pools data
  const stakingPools = [
    { asset: "SOL", tvl: 3000000, apy: 12.5 },
    { asset: "USDC", tvl: 850000, apy: 8.2 },
  ]

  // Format TVL amount
  const formatTVL = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [pnlTimeframe, setPnlTimeframe] = useState<"24h" | "7d" | "30d">("24h")
  const [selectedMarketView, setSelectedMarketView] = useState<Market | null>(null)
  const [marketLeverage, setMarketLeverage] = useState(2)
  const [marketSide, setMarketSide] = useState<"buy" | "sell">("buy")
  const [marketShares, setMarketShares] = useState("")
  const [marketLimitPrice, setMarketLimitPrice] = useState("")
  const [selectedPriceOption, setSelectedPriceOption] = useState<"yes" | "no" | null>(null)
  const [dateJoined] = useState(() => {
    // Generate a random join date between 30-365 days ago
    const daysAgo = Math.floor(Math.random() * 335) + 30
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date
  })
  
  // Polymarket address for executing trades
  const polymarketAddress = "0x2C7492fb6caDA189bb20f72cFe29520E07508683"
  
  const { toast } = useToast()

  // Deterministic PnL data generation using a seed
  const generatePnLData = (timeframe: "24h" | "7d" | "30d") => {
    const dataPoints = timeframe === "24h" ? 24 : timeframe === "7d" ? 7 : 30
    const data = []
    const now = new Date()
    
    // Use a seed based on timeframe for deterministic generation
    const seed = timeframe === "24h" ? 12345 : timeframe === "7d" ? 67890 : 11111
    
    // Simple seeded random function
    let seedValue = seed
    const seededRandom = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280
      return seedValue / 233280
    }
    
    // Generate deterministic PnL values
    let basePnl = timeframe === "24h" ? 20 : timeframe === "7d" ? 50 : 100
    
    for (let i = 0; i < dataPoints; i++) {
      // Generate realistic PnL data with deterministic volatility
      const variation = (seededRandom() - 0.5) * 200
      basePnl += variation
      const pnl = Math.max(-500, Math.min(1500, basePnl))
      
      let timeLabel = ""
      let date = new Date()
      
      if (timeframe === "24h") {
        // Show hours from 24 hours ago to now
        date.setHours(now.getHours() - (dataPoints - 1 - i))
        const hours = date.getHours()
        const minutes = date.getMinutes()
        timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } else if (timeframe === "7d") {
        // Show dates from 7 days ago to today
        date.setDate(now.getDate() - (dataPoints - 1 - i))
        const month = date.getMonth() + 1
        const day = date.getDate()
        timeLabel = `${month}/${day}`
      } else {
        // Show dates from 30 days ago to today
        date.setDate(now.getDate() - (dataPoints - 1 - i))
        const month = date.getMonth() + 1
        const day = date.getDate()
        timeLabel = `${month}/${day}`
      }
      
      data.push({
        time: timeLabel,
        pnl: Math.round(pnl),
      })
    }
    
    return data
  }

  // Memoize PnL data to prevent regeneration on re-render
  const pnlData = useMemo(() => generatePnLData(pnlTimeframe), [pnlTimeframe])

  // Generate market price history data (deterministic)
  const generateMarketPriceData = useMemo(() => {
    if (!selectedMarketView) return []
    const data = []
    const now = new Date()
    const baseYesPrice = selectedMarketView.oraclePrice
    
    // Use market ID as seed for deterministic generation
    const seed = selectedMarketView.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
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
  }, [selectedMarketView])

  const handleAnalyzeMarket = async () => {
    if (!polymarketUrl.trim()) {
      toast({
        title: "Error",
        description: "Please paste a Polymarket URL",
        variant: "destructive",
      })
      return
    }

    setAnalyzingMarket(true)

    try {
      const parseResponse = await fetch('/api/polymarket/parse-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: polymarketUrl }),
      })

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        throw new Error(errorData.error || 'Failed to parse URL')
      }

      const { slug, type } = await parseResponse.json()

      const marketResponse = await fetch(`/api/polymarket/market?slug=${encodeURIComponent(slug)}&type=${type}`)

      if (!marketResponse.ok) {
        const errorData = await marketResponse.json()
        throw new Error(errorData.error || 'Failed to fetch market data')
      }

      const marketData = await marketResponse.json()

      setSelectedMarket(marketData)
      setOraclePrice(marketData.oraclePrice || 0.5)

      toast({
        title: "Market Analyzed",
        description: `PLV score: ${marketData.plvScore || marketData.liquidity}/100. Ready to trade.`,
      })
    } catch (error) {
      console.error('Error analyzing market:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze market",
        variant: "destructive",
      })
    } finally {
      setAnalyzingMarket(false)
    }
  }

  const handlePlacePosition = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      })
      return
    }

    if (!selectedMarket) {
      toast({
        title: "No Market Selected",
        description: "Please analyze a market first",
        variant: "destructive",
      })
      return
    }

    const collateralAmount = Number.parseFloat(collateral)
    if (isNaN(collateralAmount) || collateralAmount <= 0) {
      toast({
        title: "Invalid Collateral",
        description: "Please enter a valid collateral amount",
        variant: "destructive",
      })
      return
    }

    setCreatingPosition(true)
    try {
      const response = await fetch('/api/positions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          marketName: selectedMarket.name,
          side: selectedTab,
          entryPrice: oraclePrice,
          collateral: collateralAmount,
          leverage,
          maintenanceMargin: null, // Optional, using default
          userAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create position')
      }

      const data = await response.json()
      toast({
        title: "Position Opened",
        description: data.message || `${selectedTab.toUpperCase()} position created at $${data.position.entryPrice.toFixed(2)}`,
      })

      // Refresh positions list
      await fetchLeveragedPositions()
      
      // Reset form
      setCollateral("1000")
      setLeverage(2)
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
  }

  const calculatePnL = (position: Position) => {
    // Use enriched PnL if available, otherwise calculate
    if (position.pnlPercentage !== undefined) {
      return position.pnlPercentage
    }
    if (position.side === "long") {
      return ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage
    }
    return ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100 * position.leverage
  }

  const getHealthColor = (health?: "healthy" | "warning" | "danger") => {
    if (!health) return "text-muted-foreground"
    switch (health) {
      case "healthy":
        return "text-primary"
      case "warning":
        return "text-yellow-500"
      case "danger":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
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

  // Set initial price option based on which is higher
  useEffect(() => {
    if (selectedMarketView) {
      const yesPrice = selectedMarketView.oraclePrice * 100
      const noPrice = (1 - selectedMarketView.oraclePrice) * 100
      setSelectedPriceOption(yesPrice >= noPrice ? "yes" : "no")
    } else {
      setSelectedPriceOption(null)
    }
  }, [selectedMarketView])

  useEffect(() => {
    if (currentPage === "markets") {
      fetchMarkets()
      // Fetch positions when viewing markets if wallet is connected
      if (connected && publicKey) {
        fetchLeveragedPositions()
      }
    } else if (currentPage === "portfolio" && connected && publicKey) {
      fetchUserPositions()
      fetchLeveragedPositions()
    } else if (currentPage === "dashboard" && connected && publicKey) {
      fetchLeveragedPositions()
    }
  }, [currentPage, connected, publicKey])

  // Fetch positions when a market is selected
  useEffect(() => {
    if (selectedMarketView && connected && publicKey) {
      fetchLeveragedPositions()
    }
  }, [selectedMarketView, connected, publicKey])

  // Fetch leveraged positions from backend
  const fetchLeveragedPositions = async () => {
    if (!publicKey) return

    setLoadingPositions(true)
    try {
      const response = await fetch(`/api/positions/list?userAddress=${encodeURIComponent(publicKey.toString())}`)
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch positions:', errorData.error)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoadingPositions(false)
    }
  }

  // Close a position
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to close position')
      }

      const data = await response.json()
      toast({
        title: "Position Closed",
        description: data.message || `Position closed. Final balance: $${data.finalBalance.toFixed(2)}`,
      })

      // Refresh positions list
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

  // Update price for positions when oracle price changes
  const updatePositionPrices = async (marketId: string, newPrice: number) => {
    try {
      const response = await fetch('/api/positions/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          newPrice,
        }),
      })

      if (response.ok) {
        // Refresh positions to get updated prices
        if (publicKey) {
          await fetchLeveragedPositions()
        }
      }
    } catch (error) {
      console.error('Error updating position prices:', error)
    }
  }

  useEffect(() => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      fetchBridgeQuote()
    } else {
      setBridgeQuote(null)
    }
  }, [depositAmount])

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

  const fetchUserPositions = async () => {
    if (!publicKey) return

    setLoadingPositions(true)
    try {
      const response = await fetch(`/api/polymarket/positions?address=${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUserPositions(data.positions || [])
        // Calculate total wallet balance from positions (mock for now)
        const totalBalance = data.positions?.reduce((sum: number, pos: any) => sum + (parseFloat(pos.size) || 0), 0) || 0
        setWalletBalance(totalBalance + 1250.50) // Base balance + positions
      } else {
        console.error('Failed to fetch positions')
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoadingPositions(false)
    }
  }

  const fetchBridgeQuote = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return

    try {
      const response = await fetch(`/api/bridge/quote?amount=${amount}`)
      if (response.ok) {
        const quote = await response.json()
        setBridgeQuote(quote)
      }
    } catch (error) {
      console.error('Error fetching bridge quote:', error)
    }
  }

  const handleBridge = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setBridging(true)
    try {
      const response = await fetch('/api/bridge/sol-to-polygon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solAddress: publicKey.toString(),
          polygonAddress: publicKey.toString(),
          amount,
          signature: 'mock_signature_' + Date.now()
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Bridge Initiated",
          description: `Bridging ${amount} SOL to Polygon. Transaction ID: ${data.transaction.id}`,
        })
        setDepositAmount('')
        setBridgeQuote(null)
      } else {
        throw new Error('Bridge failed')
      }
    } catch (error) {
      toast({
        title: "Bridge Failed",
        description: error instanceof Error ? error.message : "Failed to bridge assets",
        variant: "destructive",
      })
    } finally {
      setBridging(false)
    }
  }

  const navItems = [
    { id: "markets", label: "Markets", icon: TrendingUp },
    { id: "stake", label: "Stake", icon: Coins },
    { id: "portfolio", label: "Portfolio", icon: Wallet },
  ]

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-accent border-r border-zinc-800 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:relative lg:translate-x-0`}
      >
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">LevM</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as any)
                  setSidebarOpen(false)
                  // Reset selected market when going to dashboard
                  if (item.id === "dashboard") {
                    setSelectedMarket(null)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-[81px] border-b border-zinc-800 bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-semibold">
              {currentPage === "dashboard" && "Dashboard"}
              {currentPage === "markets" && "Markets"}
              {currentPage === "portfolio" && "Portfolio"}
              {currentPage === "stake" && "Stake"}
            </h2>
          </div>
          <div className="wallet-button-wrapper">
            <WalletMultiButton />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {currentPage === "dashboard" && (
            <div className="space-y-6">
              {!selectedMarket ? (
                <Card className="bg-card border-zinc-800 p-8">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">Link to Leverage</h3>
                      <p className="text-muted-foreground">
                        Paste a Polymarket URL and we'll analyze the PLV (Price, Liquidity, Volume)
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        placeholder="Paste Polymarket URL"
                        value={polymarketUrl}
                        onChange={(e) => setPolymarketUrl(e.target.value)}
                        className="bg-accent border-zinc-700 h-12 placeholder-muted-foreground"
                      />
                      <Button
                        onClick={handleAnalyzeMarket}
                        disabled={analyzingMarket}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        {analyzingMarket ? "Analyzing..." : "Analyze PLV"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Market Info */}
                  <Card className="bg-card border-zinc-800 p-6 lg:col-span-1">
                    <h3 className="text-lg font-bold mb-6">Market Info</h3>

                    <div className="space-y-6">
                      <div className="pb-6 border-b border-zinc-800">
                        <p className="text-xs text-muted-foreground mb-1">Market Title</p>
                        <p className="font-mono text-sm">{selectedMarket.name}</p>
                      </div>

                      <div className="pb-6 border-b border-zinc-800">
                        <div className="bg-primary/10 border border-primary/30 rounded px-3 py-2">
                          <p className="text-primary font-mono text-sm">PLV: {selectedMarket.plvScore || selectedMarket.liquidity}/100</p>
                          <p className="text-primary/80 font-mono text-xs">
                            {(selectedMarket.plvScore || selectedMarket.liquidity) >= 70 ? 'High' : (selectedMarket.plvScore || selectedMarket.liquidity) >= 40 ? 'Medium' : 'Low'} Liquidity
                          </p>
                        </div>
                      </div>

                      <div className="pb-6 border-b border-zinc-800">
                        <p className="text-xs text-muted-foreground mb-1">Oracle Price</p>
                        <p className="font-mono text-2xl font-bold">${(oraclePrice || 0).toFixed(2)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Source</p>
                        <div className="bg-accent px-3 py-2 rounded text-xs font-mono text-muted-foreground border border-zinc-800">
                          Polymarket Gamma API
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Trading Form */}
                  <Card className="bg-card border-zinc-800 p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6">Execution</h3>

                    <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="mb-6">
                      <TabsList className="bg-accent border-zinc-800">
                        <TabsTrigger
                          value="long"
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          Long
                        </TabsTrigger>
                        <TabsTrigger
                          value="short"
                          className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                        >
                          Short
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="mb-6">
                      <label className="text-xs text-muted-foreground mb-2 block">Collateral (USDC)</label>
                      <Input
                        type="number"
                        value={collateral}
                        onChange={(e) => setCollateral(e.target.value)}
                        className="bg-accent border-zinc-700 font-mono"
                      />
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-muted-foreground">Leverage</label>
                        <span className="font-mono text-primary font-bold">{leverage.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.1"
                        value={leverage}
                        onChange={(e) => setLeverage(Number.parseFloat(e.target.value))}
                        className="w-full h-2 bg-accent rounded accent-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-accent rounded border border-zinc-800">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Position Size</p>
                        <p className="font-mono text-lg font-bold">
                          ${(Number.parseFloat(collateral) * leverage).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Liquidation Price</p>
                        <p className="font-mono text-lg font-bold text-secondary">
                          $
                          {(
                            (Number.parseFloat(collateral) / (Number.parseFloat(collateral) * leverage)) *
                            0.95
                          ).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handlePlacePosition}
                      disabled={creatingPosition || !connected}
                      className={`w-full h-12 font-semibold ${selectedTab === "long"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        }`}
                    >
                      {creatingPosition ? "Creating..." : !connected ? "Connect Wallet" : "Open Position"}
                    </Button>
                  </Card>
                </div>
              )}

              {/* Positions Table */}
              {loadingPositions ? (
                <Card className="bg-card border-zinc-800 p-6">
                  <p className="text-center py-8 text-muted-foreground">Loading positions...</p>
                </Card>
              ) : positions.length > 0 ? (
                <Card className="bg-card border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Active Positions</h3>
                    <Button
                      onClick={fetchLeveragedPositions}
                      disabled={loadingPositions}
                      variant="outline"
                      size="sm"
                    >
                      Refresh
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Market</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Side</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Entry</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Current</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Liquidation</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">P&L</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Margin</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Health</th>
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => {
                          const pnl = calculatePnL(pos)
                          const pnlAmount = pos.pnl ?? 0
                          return (
                            <tr key={pos.id} className="border-b border-zinc-800 hover:bg-accent/50">
                              <td className="py-4 px-4 font-mono text-xs truncate max-w-[200px]" title={pos.marketName}>
                                {pos.marketName}
                              </td>
                              <td className="py-4 px-4 font-mono text-sm">
                                <span
                                  className={`font-bold ${pos.side === "long" ? "text-primary" : "text-secondary"}`}
                                >
                                  {pos.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono text-xs">${pos.entryPrice.toFixed(4)}</td>
                              <td className="py-4 px-4 font-mono text-xs">${pos.currentPrice.toFixed(4)}</td>
                              <td className="py-4 px-4 font-mono text-xs text-red-400">${pos.liquidationPrice.toFixed(4)}</td>
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
                </Card>
              ) : connected ? (
                <Card className="bg-card border-zinc-800 p-6">
                  <p className="text-center py-8 text-muted-foreground">No active positions</p>
                </Card>
              ) : null}

              {/* God Mode */}
              {selectedMarket && (
                <Card className="bg-card border-zinc-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        God Mode - Oracle Simulator
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Simulate oracle price to test liquidation mechanics
                      </p>
                    </div>
                  </div>

                  <div className="max-w-md space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-muted-foreground">Simulate Oracle Price</label>
                      <span className="font-mono text-primary font-bold">${oraclePrice.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={oraclePrice}
                      onChange={async (e) => {
                        const newPrice = Number.parseFloat(e.target.value)
                        setOraclePrice(newPrice)
                        // Update position prices if market is selected
                        if (selectedMarket?.id) {
                          await updatePositionPrices(selectedMarket.id, newPrice)
                        }
                      }}
                      className="w-full h-2 bg-accent rounded accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">Original: ${(selectedMarket.oraclePrice || 0.5).toFixed(2)}</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {currentPage === "markets" && (
            <div className="space-y-6">
              {selectedMarketView ? (
                // Detailed Market View (Polymarket-style)
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMarketView(null)}
                        className="hover:bg-accent"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold">{selectedMarketView.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          ${(selectedMarketView.volume || 0).toLocaleString()} Vol.
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
                              <span className="text-sm">Yes {(selectedMarketView.oraclePrice * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-secondary"></div>
                              <span className="text-sm">No {((1 - selectedMarketView.oraclePrice) * 100).toFixed(1)}%</span>
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
                              setMarketLimitPrice((selectedMarketView.oraclePrice * 100).toFixed(1))
                              setSelectedPriceOption("yes")
                            }}
                          >
                            Yes {(selectedMarketView.oraclePrice * 100).toFixed(1)}¢
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
                              setMarketLimitPrice(((1 - selectedMarketView.oraclePrice) * 100).toFixed(1))
                              setSelectedPriceOption("no")
                            }}
                          >
                            No {((1 - selectedMarketView.oraclePrice) * 100).toFixed(1)}¢
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

                        {/* Action Button */}
                        <Button
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          disabled={!connected || !marketShares || Number.parseInt(marketShares) <= 0 || creatingPosition}
                          onClick={async () => {
                            if (!connected || !publicKey || !selectedMarketView) return

                            const shares = Number.parseInt(marketShares)
                            const limitPrice = Number.parseFloat(marketLimitPrice || "0") / 100 // Convert cents to decimal
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
                                  marketId: selectedMarketView.id,
                                  marketName: selectedMarketView.name,
                                  side,
                                  entryPrice: limitPrice,
                                  collateral: collateralAmount,
                                  leverage: marketLeverage,
                                  maintenanceMargin: null,
                                  userAddress: publicKey.toString(),
                                }),
                              })

                              if (!response.ok) {
                                const errorData = await response.json()
                                throw new Error(errorData.error || 'Failed to create position')
                              }

                              const data = await response.json()
                              toast({
                                title: "Position Opened",
                                description: data.message || `${side.toUpperCase()} position created`,
                              })

                              // Refresh positions list
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
                          {creatingPosition ? "Creating..." : !connected ? "Connect Wallet" : `${marketSide === "buy" ? "Buy" : "Sell"} Yes`}
                        </Button>
                      </Card>
                    </div>
                  </div>

                  {/* My Positions Section */}
                  {connected && publicKey && (() => {
                    const marketPositions = positions.filter(pos => pos.marketId === selectedMarketView?.id)
                    return (
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
                    )
                  })()}
                </div>
              ) : (
                // Market List View
                <>
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
                            onClick={() => {
                              setSelectedMarketView(market)
                              setMarketLimitPrice((market.oraclePrice * 100).toFixed(1))
                            }}
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
                </>
              )}
            </div>
          )}

          {currentPage === "portfolio" && (
            <div className="space-y-6">
              {!connected ? (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Portfolio</h3>
                  <p className="text-muted-foreground mb-4">Connect your wallet to view your positions</p>
                  <div className="wallet-button-wrapper">
                    <WalletMultiButton />
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile and PnL Boxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Info Box */}
                    <Card className="bg-card border-zinc-800 p-6">
                      <h3 className="text-lg font-bold mb-4">Profile</h3>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm break-all mb-2">
                            {publicKey?.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {dateJoined.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                          <p className="text-2xl font-bold font-mono">
                            ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">USDC</p>
                        </div>
                        {polymarketAddress && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Polymarket Address</p>
                            <p className="font-mono text-sm break-all">
                              {polymarketAddress}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* PnL Graph Box */}
                    <Card className="bg-card border-zinc-800 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Profit & Loss</h3>
                        <Tabs value={pnlTimeframe} onValueChange={(v) => setPnlTimeframe(v as "24h" | "7d" | "30d")}>
                          <TabsList className="bg-accent border-zinc-800">
                            <TabsTrigger value="24h" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                              24h
                            </TabsTrigger>
                            <TabsTrigger value="7d" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                              7d
                            </TabsTrigger>
                            <TabsTrigger value="30d" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                              30d
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className="h-[200px] w-full overflow-hidden bg-accent/20 rounded-lg p-2">
                        <ChartContainer
                          config={{
                            pnl: {
                              label: "PnL",
                              color: "#8b5cf6",
                            },
                          }}
                          className="h-full w-full"
                        >
                          <LineChart 
                            data={pnlData}
                            margin={{ top: 10, right: 15, bottom: 10, left: 15 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" opacity={0.3} />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 500 }}
                              tickLine={{ stroke: "#e2e8f0" }}
                              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                            />
                            <YAxis
                              tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 500 }}
                              tickLine={{ stroke: "#e2e8f0" }}
                              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                              tickFormatter={(value) => `$${value}`}
                              width={70}
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
                              dataKey="pnl"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={false}
                              activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                              connectNulls={true}
                            />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    </Card>
                  </div>

                  {/* Leveraged Positions */}
                  <Card className="bg-card border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Leveraged Positions</h3>
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
                    ) : positions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No leveraged positions found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Market</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Side</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Entry</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Current</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Liquidation</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">P&L</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Margin</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Health</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions.map((pos) => {
                              const pnl = calculatePnL(pos)
                              const pnlAmount = pos.pnl ?? 0
                              return (
                                <tr key={pos.id} className="border-b border-zinc-800 hover:bg-accent/50">
                                  <td className="py-4 px-4 font-mono text-xs truncate max-w-[200px]" title={pos.marketName}>
                                    {pos.marketName}
                                  </td>
                                  <td className="py-4 px-4 font-mono text-sm">
                                    <span className={`font-bold ${pos.side === "long" ? "text-primary" : "text-secondary"}`}>
                                      {pos.side.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-mono text-xs">${pos.entryPrice.toFixed(4)}</td>
                                  <td className="py-4 px-4 font-mono text-xs">${pos.currentPrice.toFixed(4)}</td>
                                  <td className="py-4 px-4 font-mono text-xs text-red-400">${pos.liquidationPrice.toFixed(4)}</td>
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

                  {/* Polymarket Positions (from Polymarket API) */}
                  <Card className="bg-card border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-4">Polymarket Positions</h3>
                    {loadingPositions ? (
                      <p className="text-center py-8 text-muted-foreground">Loading positions...</p>
                    ) : userPositions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No positions found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Market</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Side</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Size</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Price</th>
                              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-mono">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userPositions.map((pos: any) => (
                              <tr key={pos.id} className="border-b border-zinc-800 hover:bg-accent/50">
                                <td className="py-4 px-4 font-mono text-xs">{pos.market}</td>
                                <td className="py-4 px-4 font-mono text-sm">
                                  <span className={`font-bold ${pos.side === "long" ? "text-primary" : "text-secondary"}`}>
                                    {pos.side.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-mono text-xs">{pos.size}</td>
                                <td className="py-4 px-4 font-mono text-xs">${pos.price.toFixed(3)}</td>
                                <td className="py-4 px-4 font-mono text-sm">
                                  <span className="text-primary">{pos.status.toUpperCase()}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <Button
                      onClick={fetchUserPositions}
                      disabled={loadingPositions}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      {loadingPositions ? "Loading..." : "Refresh"}
                    </Button>
                  </Card>
                </>
              )}
            </div>
          )}

          {currentPage === "stake" && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">Asset</th>
                      <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">TVL</th>
                      <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">APY</th>
                      <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingPools.map((pool) => (
                      <tr key={pool.asset} className="border-b border-zinc-800 hover:bg-accent/50">
                        <td className="py-4 px-4">
                          <span className="font-mono font-semibold text-base">{pool.asset}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono">
                            {formatTVL(pool.tvl)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-primary font-semibold">
                            {pool.apy}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            onClick={() => {
                              if (!connected) {
                                toast({
                                  title: "Wallet Not Connected",
                                  description: "Please connect your wallet to stake",
                                  variant: "destructive",
                                })
                                return
                              }
                              toast({
                                title: "Stake",
                                description: `Stake ${pool.asset} coming soon!`,
                              })
                            }}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Stake
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
