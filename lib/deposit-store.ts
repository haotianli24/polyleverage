interface UserDeposit {
  userAddress: string
  signature: string
  amount: number // Amount in SOL
  timestamp: string
  verified: boolean
}

class DepositStore {
  private deposits: Map<string, UserDeposit> = new Map() // Key: signature
  private userDeposits: Map<string, Set<string>> = new Map() // Key: userAddress, Value: Set of signatures

  addDeposit(deposit: UserDeposit): void {
    this.deposits.set(deposit.signature, deposit)
    
    if (!this.userDeposits.has(deposit.userAddress)) {
      this.userDeposits.set(deposit.userAddress, new Set())
    }
    this.userDeposits.get(deposit.userAddress)!.add(deposit.signature)
  }

  getDeposit(signature: string): UserDeposit | undefined {
    return this.deposits.get(signature)
  }

  getUserDeposits(userAddress: string): UserDeposit[] {
    const signatures = this.userDeposits.get(userAddress)
    if (!signatures) return []
    
    return Array.from(signatures)
      .map(sig => this.deposits.get(sig))
      .filter((d): d is UserDeposit => d !== undefined && d.verified)
  }

  getUserTotalDeposits(userAddress: string): number {
    const deposits = this.getUserDeposits(userAddress)
    return deposits.reduce((sum, deposit) => sum + deposit.amount, 0)
  }

  hasDeposit(signature: string): boolean {
    return this.deposits.has(signature)
  }
}

export const depositStore = new DepositStore()

