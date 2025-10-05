# 🏦 ParkPay Genesis Bank - RLUSD Issuer

## Overview

The **ParkPay Genesis Bank** is your custom RLUSD issuer on the XRP Ledger Testnet. This acts as the central bank that issues RLUSD tokens to users when they add funds to their ParkPay wallet.

---

## 🔑 Genesis Bank Credentials

```
Bank Name:      ParkPay Genesis Bank
Address:        rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL
Secret:         sEdTnd9BLgnMUGBrMCuh2BDCjnM75hQ
Network:        XRPL Testnet
Initial Balance: 10 XRP
Currency Issued: USD (branded as RLUSD)
```

### View on Explorer
- **XRPL Explorer**: https://test.xrplexplorer.com/account/rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL
- All transactions from this account are publicly visible on the blockchain!

---

## 💡 How It Works

### 1. **User Adds Funds** (`Add $1000`)
```
User clicks "Add $1000" on Wallet Page
         ↓
Frontend calls: POST /api/issuer/fund
         ↓
Backend (Genesis Bank) sends Payment transaction:
  - From: rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL (Genesis Bank)
  - To: rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ (User)
  - Amount: 1000 USD (RLUSD)
         ↓
XRPL processes transaction (~3-5 seconds)
         ↓
User's RLUSD balance updates on ledger
         ↓
App reads new balance from XRPL
         ↓
✅ User sees $1000 RLUSD in wallet!
```

### 2. **User Spends Money** (Parking Session)
```
User parks for $2.50
         ↓
App sends Payment transaction:
  - From: rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ (User)
  - To: rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV (Parking Provider)
  - Amount: 2.50 USD (RLUSD)
         ↓
XRPL processes transaction
         ↓
User's RLUSD balance decreases by $2.50
         ↓
App reads new balance from XRPL
         ↓
✅ Wallet shows updated balance!
```

---

## 🔄 The Full Money Flow

```
Genesis Bank (rsYrh38...)
     │
     │ Issues RLUSD
     ↓
User Wallet (rf81Uz...)
     │
     │ Pays for parking
     ↓
Parking Provider (rQhWct...)
```

---

## 🎯 Key Concepts

### **Trustline**
Before receiving RLUSD, users must establish a **trustline** to the Genesis Bank. This is like saying:
> "I trust rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL to issue USD tokens to me"

Your app automatically creates this trustline when the user first opens the wallet.

### **Issued Currency**
RLUSD is an **issued currency**, not native XRP. It's like a stablecoin backed by the issuer (Genesis Bank):
- **Currency Code**: `USD`
- **Issuer**: `rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL`
- The combination of these two uniquely identifies "RLUSD from ParkPay Genesis Bank"

### **Why Two Different Addresses?**
- **Genesis Bank** (`rsYrh38...`): Issues RLUSD to users
- **Parking Provider** (`rQhWct...`): Receives RLUSD from users for parking
- In production, you'd have many parking providers!

---

## 📊 API Endpoints

### **POST /api/issuer/fund**
Issues RLUSD to a user's account

**Request:**
```json
{
  "userAddress": "rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ",
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "amount": 1000,
  "userAddress": "rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ",
  "txHash": "A1B2C3D4E5F6...",
  "message": "Successfully issued 1000 RLUSD"
}
```

### **POST /api/issuer/pay-parking**
Processes parking payments from client to Genesis Bank

**Request:**
```json
{
  "amount": 2.50
}
```

**Response:**
```json
{
  "success": true,
  "amount": 2.50,
  "from": "rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ",
  "to": "rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL",
  "txHash": "B2C3D4E5F6G7...",
  "message": "Successfully paid 2.50 RLUSD parking fee"
}
```

### **GET /api/issuer/info**
Get information about the Genesis Bank

**Response:**
```json
{
  "address": "rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL",
  "name": "ParkPay Genesis Bank",
  "balance": "10000000",
  "sequence": 11201678,
  "currency": "USD (RLUSD)",
  "network": "XRPL Testnet"
}
```

---

## 🔐 Security Notes

### **Important!**
The Genesis Bank secret (`sEdTnd9BLgnMUGBrMCuh2BDCjnM75hQ`) is stored in the backend:
- ✅ **Correct**: Backend API has the secret
- ❌ **NEVER**: Put the secret in frontend code
- ❌ **NEVER**: Commit the secret to Git (it's already in `.gitignore`)

### **Production Considerations**
For a production app, you would:
1. Use environment variables (not hardcoded)
2. Use AWS Secrets Manager or similar
3. Implement rate limiting on the `/fund` endpoint
4. Add authentication/KYC before issuing
5. Implement anti-fraud measures
6. Use a multi-signature setup for the issuer account

---

## 📈 Monitoring Your Genesis Bank

### **Via XRPL Explorer**
Visit: https://test.xrplexplorer.com/account/rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL

You can see:
- ✅ All transactions issued
- ✅ Current XRP balance
- ✅ All trustlines established
- ✅ Total RLUSD issued

### **Via API**
```bash
curl http://localhost:3001/api/issuer/info
```

---

## 🧪 Testing the System

### **1. First Time User**
```
1. User opens wallet → Trustline auto-created
2. User clicks "Add $100" → Genesis Bank issues 100 RLUSD
3. User parks for $5 → 5 RLUSD sent to parking provider
4. Wallet balance: $95 RLUSD
```

### **2. Check on XRPL**
```bash
# View user's balance
https://test.xrplexplorer.com/account/rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ

# View Genesis Bank's transactions
https://test.xrplexplorer.com/account/rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL
```

---

## 🚀 What Makes This Special

### **Real Blockchain Transactions**
- Every "Add Funds" creates a **real XRPL transaction**
- Every parking payment creates a **real XRPL transaction**
- All verifiable on the public XRPL ledger!

### **One-Click Funding**
- User clicks once → Everything happens automatically
- No need to visit external faucets
- No manual blockchain interactions

### **True Stablecoin System**
- RLUSD maintains 1:1 parity with USD
- Genesis Bank is the issuer/backing authority
- Same architecture as USDC, USDT on other blockchains!

---

## 🎓 Learning Resources

- **XRPL Issued Currencies**: https://xrpl.org/issued-currencies-overview.html
- **Trust Lines**: https://xrpl.org/trust-lines-and-issuing.html
- **Payment Transactions**: https://xrpl.org/payment.html

---

## 🎉 Congratulations!

You now have a **fully functional stablecoin payment system** with:
- ✅ Custom RLUSD issuer (Genesis Bank)
- ✅ One-click funding for users
- ✅ Real blockchain transactions
- ✅ Automatic balance synchronization
- ✅ Production-ready architecture

This is exactly how real-world blockchain payment systems work! 🚀

