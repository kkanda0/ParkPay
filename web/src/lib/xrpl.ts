import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl'

// ParkPay Genesis Bank (Our Custom RLUSD Issuer)
const RLUSD_ISSUER = 'rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL' // ParkPay Genesis Bank
// RLUSD uses the standard 3-character USD code
// The issuer address distinguishes it as RLUSD from our bank
const RLUSD_CURRENCY = 'USD'

// Note: When creating a trustline, YOUR account creates a trust line TO the issuer
// This allows you to receive USD tokens from that specific issuer

export class XRPLService {
  private client: Client
  private wallet: Wallet | null = null

  constructor() {
    // Connect to XRPL Testnet
    this.client = new Client('wss://s.altnet.rippletest.net:51233')
  }

  async connect() {
    if (!this.client.isConnected()) {
      await this.client.connect()
      console.log('🔗 Connected to XRPL Testnet')
    }
  }

  async disconnect() {
    if (this.client.isConnected()) {
      await this.client.disconnect()
      console.log('🔌 Disconnected from XRPL Testnet')
    }
  }

  // Import wallet from credentials
  importWallet(address: string, secret: string) {
    this.wallet = Wallet.fromSecret(secret)
    console.log('✅ Wallet imported:', address)
    return this.wallet
  }

  // Get current wallet
  getWallet() {
    return this.wallet
  }

  // Get XRP balance
  async getXRPBalance(address: string): Promise<number> {
    await this.connect()
    const response = await this.client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    })
    const balance = dropsToXrp(response.result.account_data.Balance)
    return parseFloat(balance)
  }

  // Get RLUSD balance
  async getRLUSDBalance(address: string): Promise<number> {
    try {
      await this.connect()
      const response = await this.client.request({
        command: 'account_lines',
        account: address,
        ledger_index: 'validated'
      })

      const rlusdLine = response.result.lines.find(
        (line: any) => line.currency === RLUSD_CURRENCY && line.account === RLUSD_ISSUER
      )

      if (rlusdLine) {
        return parseFloat(rlusdLine.balance)
      }

      return 0
    } catch (error) {
      console.error('Error getting RLUSD balance:', error)
      return 0
    }
  }

  // Check if RLUSD trustline exists
  async checkRLUSDTrustline(address: string): Promise<boolean> {
    try {
      await this.connect()
      const response = await this.client.request({
        command: 'account_lines',
        account: address,
        ledger_index: 'validated'
      })

      const rlusdLine = response.result.lines.find(
        (line: any) => line.currency === RLUSD_CURRENCY && line.account === RLUSD_ISSUER
      )

      return !!rlusdLine
    } catch (error) {
      console.error('Error checking trustline:', error)
      return false
    }
  }

  // Setup RLUSD trustline
  async setupRLUSDTrustline(): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Wallet not imported')
    }

    try {
      await this.connect()

      console.log('🔧 Setting up RLUSD trustline...')

      const trustSetTx = {
        TransactionType: 'TrustSet' as const,
        Account: this.wallet.address,
        LimitAmount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: '100000' // Set a high limit
        }
      }

      const prepared = await this.client.autofill(trustSetTx)
      const signed = this.wallet.sign(prepared)
      const result = await this.client.submitAndWait(signed.tx_blob)

      if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
        const success = result.result.meta.TransactionResult === 'tesSUCCESS'
        if (success) {
          console.log('✅ RLUSD trustline established successfully!')
        }
        return success
      }

      return false
    } catch (error) {
      console.error('❌ Error setting up trustline:', error)
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return false
    }
  }

  // Send RLUSD payment
  async sendRLUSD(destinationAddress: string, amount: number): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Wallet not imported')
    }

    try {
      await this.connect()

      console.log(`💸 Sending ${amount} RLUSD to ${destinationAddress}...`)

      // Special case: When sending to the issuer, we're "returning" the tokens
      // In this case, the issuer field should be the issuer (not omitted)
      // The XRPL will handle this as burning/returning tokens
      const payment = {
        TransactionType: 'Payment' as const,
        Account: this.wallet.address,
        Destination: destinationAddress,
        Amount: {
          currency: RLUSD_CURRENCY,
          value: amount.toString(),
          issuer: RLUSD_ISSUER
        }
      }

      console.log('📝 Payment details:', JSON.stringify(payment, null, 2))

      const prepared = await this.client.autofill(payment)
      const signed = this.wallet.sign(prepared)
      const result = await this.client.submitAndWait(signed.tx_blob)

      console.log('📊 Transaction result:', result.result.meta)

      if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
        const success = result.result.meta.TransactionResult === 'tesSUCCESS'
        if (success) {
          console.log('✅ RLUSD payment successful!')
          console.log('📝 Transaction hash:', result.result.hash)
        } else {
          console.error('❌ Transaction failed:', result.result.meta.TransactionResult)
        }
        return success
      }

      return false
    } catch (error) {
      console.error('❌ Error sending RLUSD:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return false
    }
  }

  // Get account info
  async getAccountInfo(address: string) {
    await this.connect()
    const response = await this.client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    })
    return response.result.account_data
  }
}

// Singleton instance
export const xrplService = new XRPLService()

