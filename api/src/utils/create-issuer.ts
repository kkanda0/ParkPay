import { Client, Wallet } from 'xrpl'

async function createIssuerAccount() {
  const client = new Client('wss://s.altnet.rippletest.net:51233')
  
  console.log('🏦 Creating Genesis Bank (RLUSD Issuer) Account...\n')
  
  await client.connect()
  console.log('✅ Connected to XRPL Testnet\n')
  
  // Generate new wallet
  const issuerWallet = Wallet.generate()
  
  console.log('🔑 Genesis Bank Credentials:')
  console.log('═══════════════════════════════════════════════════════')
  console.log('Address:', issuerWallet.address)
  console.log('Secret:', issuerWallet.seed)
  console.log('Public Key:', issuerWallet.publicKey)
  console.log('Private Key:', issuerWallet.privateKey)
  console.log('═══════════════════════════════════════════════════════\n')
  
  // Fund the account using testnet faucet
  console.log('💰 Funding account with testnet XRP...')
  const fundResult = await client.fundWallet(issuerWallet)
  
  console.log('✅ Account funded!')
  console.log('Balance:', fundResult.balance, 'XRP')
  console.log('Wallet:', fundResult.wallet.address, '\n')
  
  // Get account info
  const accountInfo = await client.request({
    command: 'account_info',
    account: issuerWallet.address,
    ledger_index: 'validated'
  })
  
  console.log('📊 Account Details:')
  console.log('═══════════════════════════════════════════════════════')
  console.log('Sequence:', accountInfo.result.account_data.Sequence)
  console.log('Balance:', accountInfo.result.account_data.Balance, 'drops')
  console.log('Owner Count:', accountInfo.result.account_data.OwnerCount)
  console.log('═══════════════════════════════════════════════════════\n')
  
  console.log('🎉 Genesis Bank Created Successfully!\n')
  console.log('⚠️  IMPORTANT: Save these credentials securely!')
  console.log('Add to api/.env:\n')
  console.log(`ISSUER_ADDRESS=${issuerWallet.address}`)
  console.log(`ISSUER_SECRET=${issuerWallet.seed}\n`)
  
  await client.disconnect()
}

createIssuerAccount().catch(console.error)

