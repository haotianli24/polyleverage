#!/usr/bin/env node

/**
 * Utility script to check the balance of the central deposit address
 * Usage: node scripts/check-deposit-balance.js
 */

const { Connection, PublicKey } = require('@solana/web3.js')

const DEPOSIT_ADDRESS = 'CXi538rhqgJx56Edrqg1HMmZK4xfKgTDz7r2df4CnJQL'
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

async function checkBalance() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const publicKey = new PublicKey(DEPOSIT_ADDRESS)
    
    console.log('Checking balance for deposit address:', DEPOSIT_ADDRESS)
    console.log('Network:', RPC_URL.includes('devnet') ? 'Devnet' : RPC_URL.includes('testnet') ? 'Testnet' : RPC_URL.includes('mainnet') ? 'Mainnet' : 'Custom')
    console.log('')
    
    const balance = await connection.getBalance(publicKey)
    const balanceSOL = balance / 1e9
    
    console.log(`Balance: ${balanceSOL.toFixed(9)} SOL`)
    console.log(`Balance (lamports): ${balance.toLocaleString()}`)
    
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 5 })
    console.log('')
    console.log(`Recent transactions: ${signatures.length}`)
    signatures.forEach((sig, index) => {
      console.log(`${index + 1}. ${sig.signature} - ${sig.confirmationStatus} - Block: ${sig.slot}`)
    })
    
  } catch (error) {
    console.error('Error checking balance:', error.message)
    process.exit(1)
  }
}

checkBalance()

