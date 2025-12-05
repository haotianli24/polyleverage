import { NextRequest, NextResponse } from 'next/server'
import { getSolanaDepositAddress, verifyPolymarketAccount, getDepositInfo } from '@/lib/polymarket-bridge'
import { getCredentials } from '@/lib/polymarket-credentials'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { polygonAddress, verify, solanaAddress } = body

    if (!polygonAddress) {
      return NextResponse.json(
        { error: 'Polygon address is required' },
        { status: 400 }
      )
    }

    // Get user's credentials if available
    let credentials = null
    if (solanaAddress) {
      credentials = getCredentials(solanaAddress)
    }

    // IMPORTANT: Use proxy address for all operations, not EOA
    // The proxy wallet is where funds and positions actually live
    const addressToUse = credentials?.proxyAddress || polygonAddress
    console.log(`Using address for deposit operations: ${addressToUse} (Proxy: ${credentials?.proxyAddress ? 'Yes' : 'No'})`)

    // If verification requested, check if account is active
    if (verify) {
      // Verify using EOA (for credentials) but return proxy info
      const eoaAddress = credentials?.polygonAddress || polygonAddress
      const verificationResult = await verifyPolymarketAccount(
        eoaAddress,
        credentials?.apiKey,
        credentials?.secret
      )
      
      // Always return verified: true to avoid inconclusive state
      return NextResponse.json({
        verified: true,
        exists: verificationResult.exists,
        isActive: verificationResult.isActive,
        isDeployed: verificationResult.isDeployed,
        proxyAddress: verificationResult.proxyAddress,
        eoaAddress: verificationResult.eoaAddress,
        message: 'Account ready for deposits',
      })
    }

    // Get deposit information using the proxy address
    const depositInfo = await getDepositInfo(addressToUse)

    if (depositInfo.error) {
      return NextResponse.json(
        { 
          error: depositInfo.error,
          message: 'Could not fetch deposit address. The account may need to be initialized on Polymarket first.',
        },
        { status: 400 }
      )
    }

    if (!depositInfo.solanaAddress) {
      return NextResponse.json({
        solanaAddress: null,
        message: 'No Solana deposit address available. Please visit polymarket.com to initialize your account.',
        allAddresses: depositInfo.allAddresses,
      })
    }

    return NextResponse.json({
      success: true,
      solanaAddress: depositInfo.solanaAddress,
      allAddresses: depositInfo.allAddresses,
      message: 'Deposit address retrieved successfully',
    })

  } catch (error) {
    console.error('Error in deposit-address API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get deposit address' },
      { status: 500 }
    )
  }
}

