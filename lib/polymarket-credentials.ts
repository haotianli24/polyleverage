// Polymarket credential storage and management
import { ethers } from 'ethers'

export interface PolymarketCredentials {
  apiKey: string
  secret: string
  passphrase: string
  polygonAddress: string // EOA address (the signer)
  proxyAddress: string // Proxy wallet address (where funds/positions live)
  solanaAddress: string
  createdAt: number
  isProxyDeployed?: boolean // Whether the proxy contract is deployed
}

// In-memory storage (should be replaced with a database in production)
const credentialsStore = new Map<string, PolymarketCredentials>()

export function storeCredentials(solanaAddress: string, credentials: PolymarketCredentials): void {
  credentialsStore.set(solanaAddress.toLowerCase(), credentials)
}

export function getCredentials(solanaAddress: string): PolymarketCredentials | null {
  return credentialsStore.get(solanaAddress.toLowerCase()) || null
}

export function hasCredentials(solanaAddress: string): boolean {
  return credentialsStore.has(solanaAddress.toLowerCase())
}

export function deleteCredentials(solanaAddress: string): void {
  credentialsStore.delete(solanaAddress.toLowerCase())
}

// EIP-712 Domain for Polymarket API Key derivation
const EIP712_DOMAIN = {
  name: 'ClobAuthDomain',
  version: '1',
  chainId: 137, // Polygon Mainnet
}

// EIP-712 Types for API Key derivation
const API_KEY_TYPES = {
  ClobAuth: [
    { name: 'timestamp', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'message', type: 'string' },
  ],
}

/**
 * Creates the message to be signed for deriving API credentials
 */
export function createDeriveApiKeyMessage(nonce: number = Date.now()): {
  domain: typeof EIP712_DOMAIN
  types: typeof API_KEY_TYPES
  primaryType: string
  message: {
    timestamp: string
    nonce: number
    message: string
  }
} {
  return {
    domain: EIP712_DOMAIN,
    types: API_KEY_TYPES,
    primaryType: 'ClobAuth',
    message: {
      timestamp: new Date().toISOString(),
      nonce,
      message: 'This message attests that I control the given wallet',
    },
  }
}

/**
 * Derives API credentials from a private key
 */
export async function deriveApiKeyFromPrivateKey(privateKey: string): Promise<{
  apiKey: string
  secret: string
  passphrase: string
  address: string
}> {
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey)
    const address = await wallet.getAddress()

    // Create the message to sign
    const nonce = Date.now()
    const { domain, types, message } = createDeriveApiKeyMessage(nonce)

    // Sign the typed data
    const signature = await wallet._signTypedData(domain, types, message)

    // Generate credentials from signature
    // Note: In production, you'd send this to Polymarket's API
    // For now, we'll generate deterministic credentials from the signature
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature))
    
    const apiKey = `${address.toLowerCase()}_${hash.slice(2, 18)}`
    const secret = hash.slice(2, 66)
    const passphrase = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret)).slice(2, 34)

    return {
      apiKey,
      secret,
      passphrase,
      address,
    }
  } catch (error) {
    console.error('Error deriving API key from private key:', error)
    throw new Error('Failed to derive API credentials from private key')
  }
}

/**
 * Validates a Polygon address
 */
export function isValidPolygonAddress(address: string): boolean {
  try {
    return ethers.utils.isAddress(address)
  } catch {
    return false
  }
}

/**
 * Validates a private key
 */
export function isValidPrivateKey(key: string): boolean {
  try {
    const wallet = new ethers.Wallet(key)
    return !!wallet.address
  } catch {
    return false
  }
}

