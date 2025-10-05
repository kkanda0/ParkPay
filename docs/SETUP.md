# 🚀 ParkPay Setup Guide

## Prerequisites

- **Node.js**: v20.11.0 or higher
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **Git**: For version control

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ParkPay
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp api/.env.example api/.env
   ```
   
   **Important**: The `.env` file contains sensitive credentials and is **NOT** tracked in git for security reasons.

4. **Set up the database**
   ```bash
   pnpm --filter api prisma generate
   pnpm --filter api prisma migrate dev
   ```

5. **Start the development servers**
   ```bash
   pnpm dev
   ```

   This will start:
   - **API Server**: http://localhost:4000
   - **Web App**: http://localhost:3000 (or next available port)

## 🔧 Environment Configuration

The `api/.env.example` file contains all the necessary environment variables:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# XRPL Configuration
XRPL_SERVER="wss://s.altnet.rippletest.net:51233"

# Genesis Bank (RLUSD Issuer) Credentials
ISSUER_ADDRESS=rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL
ISSUER_SECRET=sEdTnd9BLgnMUGBrMCuh2BDCjnM75hQ

# Client XRPL Credentials (for parking payments)
CLIENT_XRPL_ADDRESS=rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ
CLIENT_XRPL_SECRET=sEdTCZaZYHZEQz3Ju5oUzG69Ujf5XTz

# TomTom API Configuration
TOMTOM_API_KEY="MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6l"
```

## 🏗️ Project Structure

```
ParkPay/
├── api/                 # Express.js backend
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   └── index.ts    # Main server file
│   ├── prisma/         # Database schema & migrations
│   └── .env           # Environment variables (copy from .env.example)
├── web/                # Next.js frontend
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/ # React components
│   │   └── lib/       # Utilities & services
│   └── package.json
└── package.json        # Root package.json with workspace config
```

## 🔑 Key Features

- **TomTom Maps Integration**: Real-time parking spot data
- **XRPL Integration**: RLUSD payments on XRP Ledger Testnet
- **Session Management**: Track parking sessions with real-time timers
- **Wallet System**: Manage RLUSD balance with blockchain sync
- **Genesis Bank**: Automated RLUSD issuance system

## 🧪 Testing

1. **API Health Check**
   ```bash
   curl http://localhost:4000/api/health
   ```

2. **Test RLUSD Issuance**
   ```bash
   curl -X POST http://localhost:4000/api/issuer/fund \
     -H "Content-Type: application/json" \
     -d '{"userAddress": "rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ", "amount": 100}'
   ```

3. **Test Parking Payment**
   ```bash
   curl -X POST http://localhost:4000/api/issuer/pay-parking \
     -H "Content-Type: application/json" \
     -d '{"amount": 2.50}'
   ```

## 🚨 Troubleshooting

### Port Conflicts
If you get port conflicts, kill existing processes:
```bash
lsof -ti:3000,4000 | xargs kill -9
```

### Database Issues
Reset the database:
```bash
rm api/prisma/dev.db
pnpm --filter api prisma migrate dev
```

### XRPL Connection Issues
- Ensure you're using XRPL Testnet
- Check that credentials are correct in `.env`
- Verify network connectivity

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Genesis Bank Info](docs/GENESIS_BANK_INFO.md)
- [TomTom Integration](docs/TOMTOM_FINAL_SOLUTION.md)
- [Testing Instructions](docs/TESTING_INSTRUCTIONS.md)
- [UI Fixes Summary](docs/UI_FIXES_SUMMARY.md)

## 🔒 Security Notes

- **Never commit `.env` files** - they contain sensitive credentials
- **Use Testnet only** - these are test credentials, not real money
- **Rotate credentials** in production environments

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Happy Parking! 🅿️**
