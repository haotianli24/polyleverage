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

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
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

  async getDepositDetails(signature: string, depositAddress: string, userAddress: string) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      })
      
      if (!tx || !tx.meta) {
        throw new Error('Transaction not found')
      }

      // Verify the transaction is from userAddress to depositAddress
      const depositPubkey = new PublicKey(depositAddress)
      const userPubkey = new PublicKey(userAddress)

      // Check if transaction involves the deposit address
      const accountKeys = tx.transaction.message.accountKeys.map(key => key.toString())
      const hasDepositAddress = accountKeys.includes(depositPubkey.toString())
      const hasUserAddress = accountKeys.includes(userPubkey.toString())

      if (!hasDepositAddress || !hasUserAddress) {
        throw new Error('Transaction does not involve the deposit address or user address')
      }

      // Find the deposit address index in the transaction
      const depositIndex = accountKeys.findIndex(key => key === depositPubkey.toString())
      const userIndex = accountKeys.findIndex(key => key === userPubkey.toString())

      if (depositIndex === -1 || userIndex === -1) {
        throw new Error('Could not find deposit or user address in transaction')
      }

      // Calculate the amount deposited (increase in deposit address balance)
      const depositPreBalance = tx.meta.preBalances[depositIndex]
      const depositPostBalance = tx.meta.postBalances[depositIndex]
      const amount = (depositPostBalance - depositPreBalance) / LAMPORTS_PER_SOL

      if (amount <= 0) {
        throw new Error('Invalid deposit amount - transaction did not increase deposit address balance')
      }

      return {
        amount,
        timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
        confirmed: true,
        fromAddress: userAddress,
        toAddress: depositAddress
      }
    } catch (error) {
      console.error('Error getting deposit details:', error)
      throw new Error('Failed to get deposit details')
    }
  }
}

export const solanaDepositService = new SolanaDepositService()
