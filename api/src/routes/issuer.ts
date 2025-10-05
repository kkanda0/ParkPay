import { Router } from 'express'
import { Client, Wallet } from 'xrpl'

const router: Router = Router()

// Genesis Bank (RLUSD Issuer) Credentials
// In production, these would come from process.env
const ISSUER_ADDRESS = 'rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL'
const ISSUER_SECRET = 'sEdTnd9BLgnMUGBrMCuh2BDCjnM75hQ'
const XRPL_SERVER = 'wss://s.altnet.rippletest.net:51233'

/**
 * POST /api/issuer/fund
 * Issues RLUSD tokens to a user's account
 * 
 * Body:
 *  - userAddress: string (XRPL address to send RLUSD to)
 *  - amount: number (amount of RLUSD to issue)
 */
router.post('/fund', async (req, res) => {
  try {
    const { userAddress, amount } = req.body

    if (!userAddress || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: userAddress and amount'
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      })
    }

    console.log(`🏦 Genesis Bank issuing ${amount} RLUSD to ${userAddress}...`)

    const client = new Client(XRPL_SERVER)
    await client.connect()

    // Import issuer wallet
    const issuerWallet = Wallet.fromSeed(ISSUER_SECRET)

    // Create payment transaction
    const payment = {
      TransactionType: 'Payment' as const,
      Account: issuerWallet.address,
      Destination: userAddress,
      Amount: {
        currency: 'USD',
        value: amount.toString(),
        issuer: ISSUER_ADDRESS
      }
    }

    // Submit transaction
    const prepared = await client.autofill(payment)
    const signed = issuerWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    await client.disconnect()

    // Check if transaction was successful
    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      const success = result.result.meta.TransactionResult === 'tesSUCCESS'

      if (success) {
        console.log(`✅ Issued ${amount} RLUSD to ${userAddress}`)
        console.log(`📝 Transaction hash: ${result.result.hash}`)

        return res.json({
          success: true,
          amount,
          userAddress,
          txHash: result.result.hash,
          message: `Successfully issued ${amount} RLUSD`
        })
      } else {
        console.error(`❌ Transaction failed: ${result.result.meta.TransactionResult}`)
        return res.status(500).json({
          error: 'Transaction failed',
          code: result.result.meta.TransactionResult
        })
      }
    }

    return res.status(500).json({ error: 'Unknown transaction result' })

  } catch (error) {
    console.error('Error issuing RLUSD:', error)
    return res.status(500).json({
      error: 'Failed to issue RLUSD',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/issuer/pay-parking
 * Send RLUSD payment from client to Genesis Bank (parking fee)
 * 
 * Body:
 *  - amount: number (amount of RLUSD to send)
 */
router.post('/pay-parking', async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Missing or invalid amount'
      })
    }

    console.log(`💳 Processing parking payment: ${amount} RLUSD`)

    const client = new Client(XRPL_SERVER)
    await client.connect()

    // Import client wallet
    const clientWallet = Wallet.fromSeed(process.env.CLIENT_XRPL_SECRET || 'sEdTCZaZYHZEQz3Ju5oUzG69Ujf5XTz')

    // Create payment transaction (client -> Genesis Bank)
    const payment = {
      TransactionType: 'Payment' as const,
      Account: clientWallet.address,
      Destination: ISSUER_ADDRESS,
      Amount: {
        currency: 'USD',
        value: amount.toString(),
        issuer: ISSUER_ADDRESS
      }
    }

    // Submit transaction
    const prepared = await client.autofill(payment)
    const signed = clientWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    await client.disconnect()

    // Check if transaction was successful
    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      const success = result.result.meta.TransactionResult === 'tesSUCCESS'

      if (success) {
        console.log(`✅ Parking payment successful: ${amount} RLUSD`)
        console.log(`📝 Transaction hash: ${result.result.hash}`)

        return res.json({
          success: true,
          amount,
          from: clientWallet.address,
          to: ISSUER_ADDRESS,
          txHash: result.result.hash,
          message: `Successfully paid ${amount} RLUSD parking fee`
        })
      } else {
        console.error(`❌ Payment failed: ${result.result.meta.TransactionResult}`)
        return res.status(500).json({
          error: 'Payment failed',
          code: result.result.meta.TransactionResult
        })
      }
    }

    return res.status(500).json({ error: 'Unknown transaction result' })

  } catch (error) {
    console.error('Error processing parking payment:', error)
    return res.status(500).json({
      error: 'Failed to process parking payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/issuer/info
 * Get information about the Genesis Bank issuer
 */
router.get('/info', async (req, res) => {
  try {
    const client = new Client(XRPL_SERVER)
    await client.connect()

    const accountInfo = await client.request({
      command: 'account_info',
      account: ISSUER_ADDRESS,
      ledger_index: 'validated'
    })

    await client.disconnect()

    res.json({
      address: ISSUER_ADDRESS,
      name: 'ParkPay Genesis Bank',
      balance: accountInfo.result.account_data.Balance,
      sequence: accountInfo.result.account_data.Sequence,
      currency: 'USD (RLUSD)',
      network: 'XRPL Testnet'
    })
  } catch (error) {
    console.error('Error getting issuer info:', error)
    res.status(500).json({ error: 'Failed to get issuer info' })
  }
})

export default router

