"use client"

import dynamic from 'next/dynamic'

// Dynamically import WalletMultiButton to avoid hydration errors
// This ensures it only renders on the client side
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { 
    ssr: false,
    loading: () => (
      <div className="wallet-adapter-button wallet-adapter-button-trigger">
        <span>Loading...</span>
      </div>
    )
  }
)

export default WalletMultiButton

