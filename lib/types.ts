export interface Market {
  id: string
  name: string
  liquidity: number
  oraclePrice: number
  change24h: number
  slug?: string
  volume?: number
  description?: string
  plvScore?: number
  clobTokenIds?: string[]
  conditionId?: string
}

export interface Position {
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

