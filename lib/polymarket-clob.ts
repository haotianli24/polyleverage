import { ethers } from 'ethers'

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

  constructor() {
    this.baseUrl = 'https://clob.polymarket.com'
    this.apiKey = process.env.POLYMARKET_API_KEY || ''
  }

  async getMarketDetails(conditionId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/markets/${conditionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
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
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
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
    userAddress: string
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

      const orderData = {
        market,
        side,
        price: orderPrice.toFixed(4),
        size: size.toString(),
        tokenID: tokenId,
        feeRateBps: '0',
        nonce: Date.now(),
        expiration: Math.floor(Date.now() / 1000) + 3600,
        maker: userAddress,
        taker: ethers.constants.AddressZero,
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
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
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
}

export const polymarketCLOB = new PolymarketCLOB()
