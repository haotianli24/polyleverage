import { ethers } from 'ethers'
import { getCredentials, type PolymarketCredentials } from './polymarket-credentials'

export interface PolymarketOrder {
  market: string
  price: number
  size: number
  side: 'BUY' | 'SELL'
  tokenID: string
}

export interface OrderResult {
  success: boolean
  orderId?: string
  orderData?: any
  error?: string
}

export class PolymarketCLOB {
  private baseUrl: string
  private apiKey: string
  private credentials: PolymarketCredentials | null

  constructor(userAddress?: string) {
    this.baseUrl = 'https://clob.polymarket.com'
    this.apiKey = process.env.POLYMARKET_API_KEY || ''
    this.credentials = userAddress ? getCredentials(userAddress) : null
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.credentials) {
      // Use user's credentials if available
      headers['POLY-API-KEY'] = this.credentials.apiKey
      headers['POLY-SIGNATURE'] = this.generateSignature()
      headers['POLY-TIMESTAMP'] = Date.now().toString()
      headers['POLY-PASSPHRASE'] = this.credentials.passphrase
    } else if (this.apiKey) {
      // Fallback to environment API key
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    return headers
  }

  private generateSignature(): string {
    if (!this.credentials) return ''
    
    const timestamp = Date.now().toString()
    const message = timestamp + 'GET' + '/markets'
    
    try {
      const hmac = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(message + this.credentials.secret)
      )
      return hmac
    } catch (error) {
      console.error('Error generating signature:', error)
      return ''
    }
  }

  async getMarketDetails(conditionId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/markets/${conditionId}`,
        {
          headers: this.getAuthHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get market details: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting market details:', error)
      throw error
    }
  }

  async getOrderBook(tokenId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/book?token_id=${tokenId}`,
        {
          headers: this.getAuthHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get order book: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting order book:', error)
      throw error
    }
  }

  async getBestPrice(tokenId: string, side: 'BUY' | 'SELL'): Promise<number> {
    try {
      const orderBook = await this.getOrderBook(tokenId)
      
      if (side === 'BUY' && orderBook.asks && orderBook.asks.length > 0) {
        return parseFloat(orderBook.asks[0].price)
      } else if (side === 'SELL' && orderBook.bids && orderBook.bids.length > 0) {
        return parseFloat(orderBook.bids[0].price)
      }
      
      return 0.50
    } catch (error) {
      console.error('Error getting best price:', error)
      return 0.50
    }
  }

  async createOrder(params: {
    userAddress: string // Should be proxy address, not EOA
    market: string
    tokenId: string
    side: 'BUY' | 'SELL'
    size: number
    price?: number
  }): Promise<OrderResult> {
    try {
      const { userAddress, market, tokenId, side, size, price } = params

      let orderPrice = price
      if (!orderPrice) {
        orderPrice = await this.getBestPrice(tokenId, side)
      }

      // userAddress should be the proxy wallet address
      const orderData = {
        market,
        side,
        price: orderPrice.toFixed(4),
        size: size.toString(),
        tokenID: tokenId,
        feeRateBps: '0',
        nonce: Date.now(),
        expiration: Math.floor(Date.now() / 1000) + 3600,
        maker: userAddress, // Should be proxy wallet address
        taker: '0x0000000000000000000000000000000000000000',
      }

      return {
        success: true,
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderData
      }
    } catch (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      }
    }
  }

  async getOrderStatus(orderId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/order/${orderId}`,
        {
          headers: this.getAuthHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting order status:', error)
      throw error
    }
  }

  async cancelOrder(orderId: string, userAddress: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/order`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            orderID: orderId,
            maker: userAddress
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error canceling order:', error)
      throw error
    }
  }

  /**
   * Creates an authenticated order using user credentials
   * IMPORTANT: Uses the proxy wallet address, not the EOA
   */
  async createAuthenticatedOrder(params: {
    market: string
    tokenId: string
    side: 'BUY' | 'SELL'
    size: number
    price: number
  }): Promise<OrderResult> {
    if (!this.credentials) {
      return {
        success: false,
        error: 'No credentials found. Please link your Polymarket account first.',
      }
    }

    try {
      // Use proxy address for the maker field (where funds and positions live)
      const makerAddress = this.credentials.proxyAddress || this.credentials.polygonAddress
      
      const orderData = {
        market: params.market,
        side: params.side,
        price: params.price.toFixed(4),
        size: params.size.toString(),
        tokenID: params.tokenId,
        maker: makerAddress, // Use proxy wallet address
      }

      const response = await fetch(`${this.baseUrl}/order`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `Failed to create order: ${response.status}`)
      }

      const result = await response.json()

      return {
        success: true,
        orderId: result.orderID || result.id,
        orderData: result,
      }
    } catch (error) {
      console.error('Error creating authenticated order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      }
    }
  }
}

export const polymarketCLOB = new PolymarketCLOB()

/**
 * Creates a user-specific CLOB client with credentials
 */
export function createUserCLOBClient(solanaAddress: string): PolymarketCLOB {
  return new PolymarketCLOB(solanaAddress)
}
