import { NextRequest, NextResponse } from 'next/server'
import { 
  storeCredentials, 
  deriveApiKeyFromPrivateKey,
  isValidPrivateKey,
  type PolymarketCredentials 
} from '@/lib/polymarket-credentials'
import { deriveProxyAddress, isProxyDeployed, verifyPolymarketAccount } from '@/lib/polymarket-bridge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { solanaAddress, privateKey, apiKey, secret, passphrase, polygonAddress } = body

    if (!solanaAddress) {
      return NextResponse.json(
        { error: 'Solana address is required' },
        { status: 400 }
      )
    }

    let credentials: PolymarketCredentials
    let eoaAddress: string

    // Option 1: User provides credentials directly (from existing API key)
    if (apiKey && secret && passphrase && polygonAddress) {
      eoaAddress = polygonAddress
      
      // Derive the proxy address from the EOA
      const proxyAddress = await deriveProxyAddress(eoaAddress)
      console.log(`Linking account - EOA: ${eoaAddress}, Proxy: ${proxyAddress}`)
      
      // Check if proxy is deployed
      const deployed = await isProxyDeployed(proxyAddress)
      
      credentials = {
        apiKey,
        secret,
        passphrase,
        polygonAddress: eoaAddress, // Store EOA (signer)
        proxyAddress, // Store proxy (where funds live)
        solanaAddress,
        createdAt: Date.now(),
        isProxyDeployed: deployed,
      }
    }
    // Option 2: User provides private key (derive credentials)
    else if (privateKey) {
      if (!isValidPrivateKey(privateKey)) {
        return NextResponse.json(
          { error: 'Invalid private key format' },
          { status: 400 }
        )
      }

      const derived = await deriveApiKeyFromPrivateKey(privateKey)
      eoaAddress = derived.address
      
      // Derive the proxy address from the EOA
      const proxyAddress = await deriveProxyAddress(eoaAddress)
      console.log(`Linking account via private key - EOA: ${eoaAddress}, Proxy: ${proxyAddress}`)
      
      // Check if proxy is deployed
      const deployed = await isProxyDeployed(proxyAddress)
      
      credentials = {
        apiKey: derived.apiKey,
        secret: derived.secret,
        passphrase: derived.passphrase,
        polygonAddress: eoaAddress, // Store EOA (signer)
        proxyAddress, // Store proxy (where funds live)
        solanaAddress,
        createdAt: Date.now(),
        isProxyDeployed: deployed,
      }
    } else {
      return NextResponse.json(
        { error: 'Either provide credentials (apiKey, secret, passphrase, polygonAddress) or privateKey' },
        { status: 400 }
      )
    }

    // Store credentials (in production, this should be encrypted in a database)
    storeCredentials(solanaAddress, credentials)

    // Verify the account status
    const verification = await verifyPolymarketAccount(
      credentials.polygonAddress,
      credentials.apiKey,
      credentials.secret
    )

    return NextResponse.json({
      success: true,
      message: 'Polymarket account linked successfully',
      polygonAddress: credentials.polygonAddress,
      proxyAddress: credentials.proxyAddress,
      isProxyDeployed: credentials.isProxyDeployed,
      verification: {
        exists: verification.exists,
        isActive: verification.isActive,
        isDeployed: verification.isDeployed,
        message: verification.error,
      },
      linkedAt: credentials.createdAt,
    })
  } catch (error) {
    console.error('Error linking Polymarket account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to link account' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const solanaAddress = searchParams.get('solanaAddress')

    if (!solanaAddress) {
      return NextResponse.json(
        { error: 'Solana address is required' },
        { status: 400 }
      )
    }

    const { getCredentials } = await import('@/lib/polymarket-credentials')
    const credentials = getCredentials(solanaAddress)

    if (!credentials) {
      return NextResponse.json({
        linked: false,
        message: 'No Polymarket account linked',
      })
    }

    return NextResponse.json({
      linked: true,
      polygonAddress: credentials.polygonAddress, // EOA
      proxyAddress: credentials.proxyAddress, // Proxy wallet
      isProxyDeployed: credentials.isProxyDeployed,
      linkedAt: credentials.createdAt,
    })
  } catch (error) {
    console.error('Error checking link status:', error)
    return NextResponse.json(
      { error: 'Failed to check link status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const solanaAddress = searchParams.get('solanaAddress')

    if (!solanaAddress) {
      return NextResponse.json(
        { error: 'Solana address is required' },
        { status: 400 }
      )
    }

    const { deleteCredentials } = await import('@/lib/polymarket-credentials')
    deleteCredentials(solanaAddress)

    return NextResponse.json({
      success: true,
      message: 'Polymarket account unlinked',
    })
  } catch (error) {
    console.error('Error unlinking account:', error)
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    )
  }
}

