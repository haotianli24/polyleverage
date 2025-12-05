import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

export interface DepositResult {
  success: boolean
  signature?: string
  amount: number
  timestamp: string
  error?: string
}

export class SolanaDepositService {
  private connection: Connection

  constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address)
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error getting balance:', error)
      throw new Error('Failed to get balance')
    }
  }

  async verifyDeposit(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature)
      return status?.value?.confirmationStatus === 'confirmed' || 
             status?.value?.confirmationStatus === 'finalized'
    } catch (error) {
      console.error('Error verifying deposit:', error)
      return false
    }
  }

  async getDepositDetails(signature: string) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      })
      
      if (!tx || !tx.meta) {
        throw new Error('Transaction not found')
      }

      const preBalance = tx.meta.preBalances[0]
      const postBalance = tx.meta.postBalances[0]
      const amount = Math.abs(preBalance - postBalance) / LAMPORTS_PER_SOL

      return {
        amount,
        timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
        confirmed: true
      }
    } catch (error) {
      console.error('Error getting deposit details:', error)
      throw new Error('Failed to get deposit details')
    }
  }
}

export const solanaDepositService = new SolanaDepositService()
