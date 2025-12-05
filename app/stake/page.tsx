"use client"

import { useState } from "react"
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/app-layout"

const stakingPools = [
  { asset: "SOL", tvl: 3000000, apy: 12.5 },
  { asset: "USDC", tvl: 850000, apy: 8.2 },
]

const formatTVL = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

export default function StakePage() {
  const { connected } = useWallet()
  const { toast } = useToast()

  return (
    <AppLayout title="Stake">
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">Asset</th>
                <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">TVL</th>
                <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase">APY</th>
                <th className="text-left py-4 px-4 text-xs text-muted-foreground font-mono uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {stakingPools.map((pool) => (
                <tr key={pool.asset} className="border-b border-zinc-800 hover:bg-accent/50">
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold text-base">{pool.asset}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono">
                      {formatTVL(pool.tvl)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-primary font-semibold">
                      {pool.apy}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Button
                      onClick={() => {
                        if (!connected) {
                          toast({
                            title: "Wallet Not Connected",
                            description: "Please connect your wallet to stake",
                            variant: "destructive",
                          })
                          return
                        }
                        toast({
                          title: "Stake",
                          description: `Stake ${pool.asset} coming soon!`,
                        })
                      }}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Stake
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

