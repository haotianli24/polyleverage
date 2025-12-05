/**
 * UserDeposit represents a verified deposit transaction.
 * The signature (transaction hash) serves as the contract/record that associates
 * a specific transaction with a user address.
 */
export interface UserDeposit {
  userAddress: string
  signature: string // Transaction hash - this is the contract/record that associates tx with user
  amount: number // Amount in SOL
  timestamp: string
  verified: boolean
}

/**
 * DepositStore maintains a record of all user deposits.
 * Each deposit is stored with its transaction hash (signature) as the key,
 * creating a contract that associates the tx hash with the user.
 */
class DepositStore {
  private deposits: Map<string, UserDeposit> = new Map() // Key: signature (tx hash)
  private userDeposits: Map<string, Set<string>> = new Map() // Key: userAddress, Value: Set of transaction signatures

  /**
   * Adds a verified deposit to the store.
   * This creates the contract/record associating the transaction hash with the user.
   */
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
