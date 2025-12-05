"use client"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowDown, CheckCircle2, AlertCircle, TrendingUp, Info } from "lucide-react"
import { getCredentials } from "@/lib/polymarket-credentials"

export function PolymarketDepositDialog() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingAddress, setFetchingAddress] = useState(false)
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [depositTxSignature, setDepositTxSignature] = useState<string | null>(null)

  // Fetch deposit address when dialog opens
  useEffect(() => {
    if (open && connected && publicKey) {
      fetchDepositAddress()
      fetchBalance()
    }
  }, [open, connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey) return

    try {
      const balance = await connection.getBalance(publicKey)
      setSolBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchDepositAddress = async () => {
    if (!publicKey) return

    setFetchingAddress(true)
    try {
      // Get user's Polymarket credentials
      const credentials = getCredentials(publicKey.toString())
      if (!credentials) {
        toast({
          title: "Account Not Linked",
          description: "Please link your Polymarket account first",
          variant: "destructive",
        })
        setOpen(false)
        return
      }

      // Fetch Solana deposit address from Polymarket bridge
      const response = await fetch('/api/polymarket/deposit-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygonAddress: credentials.polygonAddress,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch deposit address')
      }

      const data = await response.json()
      
      if (data.solanaAddress) {
        setDepositAddress(data.solanaAddress)
      } else {
        toast({
          title: "Deposit Address Unavailable",
          description: data.message || "Please visit Polymarket.com to initialize your account first",
          variant: "destructive",
        })
        setOpen(false)
      }
    } catch (error) {
      console.error('Error fetching deposit address:', error)
      toast({
        title: "Error",
        description: "Failed to get Polymarket deposit address",
        variant: "destructive",
      })
      setOpen(false)
    } finally {
      setFetchingAddress(false)
    }
  }

  const handleDeposit = async () => {
    if (!connected || !publicKey || !signTransaction || !sendTransaction || !depositAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet",
        variant: "destructive",
      })
      return
    }

    const amountFloat = parseFloat(amount)
    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (solBalance !== null && amountFloat > solBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${solBalance.toFixed(4)} SOL`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const lamports = Math.floor(amountFloat * LAMPORTS_PER_SOL)
      const depositPubkey = new PublicKey(depositAddress)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: depositPubkey,
          lamports,
        })
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signed = await signTransaction(transaction)
      const signature = await sendTransaction(signed, connection)

      setDepositTxSignature(signature)

      toast({
        title: "Deposit Sent!",
        description: `${amountFloat} SOL sent to Polymarket. It will appear in your account in 1-5 minutes.`,
      })

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed')

      toast({
        title: "Deposit Confirmed",
        description: "Your funds are being bridged to Polymarket",
      })

      // Reset form
      setAmount("")
      await fetchBalance()

    } catch (error) {
      console.error('Error depositing:', error)
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Failed to send deposit",
        variant: "destructive",
      })
      setDepositTxSignature(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has linked account
  const isLinked = publicKey && getCredentials(publicKey.toString())

  if (!connected || !isLinked) {
    return (
      <Button disabled variant="outline" size="sm">
        <TrendingUp className="w-4 h-4 mr-2" />
        Deposit to Polymarket
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Deposit to Polymarket
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Deposit SOL to Polymarket
          </DialogTitle>
          <DialogDescription>
            Send SOL from your wallet directly to your Polymarket account
          </DialogDescription>
        </DialogHeader>

        {fetchingAddress ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching your deposit address...</p>
          </div>
        ) : depositAddress ? (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You send SOL from your wallet</li>
                  <li>Polymarket bridge converts it to USDC on Polygon</li>
                  <li>Funds appear in your Polymarket account in 1-5 minutes</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-card border border-zinc-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-xs text-muted-foreground">Solana Mainnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">Your Wallet</span>
                {solBalance !== null && (
                  <span className="text-xs text-muted-foreground">
                    Balance: {solBalance.toFixed(4)} SOL
                  </span>
                )}
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-xs text-muted-foreground">Polygon (via Bridge)</span>
              </div>
              <div>
                <span className="text-sm font-mono block mb-1">Polymarket Account</span>
                <span className="text-xs text-muted-foreground font-mono break-all">
                  {depositAddress.slice(0, 8)}...{depositAddress.slice(-8)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
                disabled={loading}
                step="0.01"
                min="0"
              />
              {solBalance !== null && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((solBalance * 0.25).toFixed(4))}
                    disabled={loading}
                    className="text-xs"
                  >
                    25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((solBalance * 0.5).toFixed(4))}
                    disabled={loading}
                    className="text-xs"
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((solBalance * 0.75).toFixed(4))}
                    disabled={loading}
                    className="text-xs"
                  >
                    75%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(Math.max(0, solBalance - 0.01).toFixed(4))}
                    disabled={loading}
                    className="text-xs"
                  >
                    Max
                  </Button>
                </div>
              )}
            </div>

            {amount && parseFloat(amount) > 0 && (
              <Alert className="bg-primary/10 border-primary/30">
                <AlertDescription className="text-xs">
                  <p className="mb-2">
                    <strong>You will receive:</strong> ~${(parseFloat(amount) * 150 * 0.999).toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estimated bridge fee: ~${(parseFloat(amount) * 150 * 0.001).toFixed(2)} (~0.1%)
                    <br />
                    Expected arrival: 1-5 minutes
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {depositTxSignature && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <p className="text-sm font-semibold mb-1">Transaction Sent!</p>
                  <p className="text-xs font-mono break-all">
                    {depositTxSignature}
                  </p>
                  <a
                    href={`https://solscan.io/tx/${depositTxSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    View on Solscan →
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleDeposit}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full h-12"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Deposit {amount || "0"} SOL
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Funds will be bridged to Polygon and appear in your Polymarket account
            </p>
          </div>
        ) : (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <p className="text-sm font-semibold mb-1">Deposit address not available</p>
              <p className="text-xs">
                Please visit{" "}
                <a
                  href="https://polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  polymarket.com
                </a>{" "}
                to initialize your account first. Once you've made any action on Polymarket,
                you'll be able to deposit directly from Solana.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}

