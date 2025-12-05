"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { InfoIcon, ShieldCheck, Key, Wallet as WalletIcon, ExternalLink } from "lucide-react"

export function PolymarketLinkGuide() {
  return (
    <div className="space-y-4 text-sm">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Why Link Your Polymarket Account?</p>
          <p className="text-xs">
            Linking allows the platform to execute trades on Polymarket on your behalf using secure API credentials.
            This enables features like automated leveraged positions, real-time order management, and seamless trading.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 bg-card border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <WalletIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Option 1: Wallet Connection</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Best for users who login with MetaMask or Phantom (EVM mode)
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Connect your Polygon wallet</li>
                <li>Sign an authentication message</li>
                <li>Credentials automatically derived</li>
                <li>Most secure method</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Option 2: Private Key</h3>
              <p className="text-xs text-muted-foreground mb-2">
                For users who login via email (Magic Link)
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Export key from Polymarket settings</li>
                <li>Paste into secure form</li>
                <li>Key is never stored</li>
                <li>Only derived credentials saved</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Alert className="bg-green-500/10 border-green-500/30">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <p className="font-semibold mb-1 text-xs">Security & Privacy</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Your private key is never stored, only processed client-side</li>
            <li>✓ Only API credentials (key, secret, passphrase) are saved</li>
            <li>✓ Credentials can only execute trades, not withdraw funds</li>
            <li>✓ You can unlink your account at any time</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="text-xs text-muted-foreground">
        <p className="mb-2">
          <strong>How it works:</strong> When you link your account, we generate secure API credentials
          that allow the platform to interact with Polymarket on your behalf. These credentials are derived
          from your wallet signature (Option 1) or private key (Option 2) using the standard Polymarket
          authentication protocol.
        </p>
        <a 
          href="https://docs.polymarket.com/#authentication"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Learn more about Polymarket authentication
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

