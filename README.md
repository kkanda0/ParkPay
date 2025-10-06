# PayPark
**Smart Parking with XRPL Integration**

ParkPay is a modern parking management system that combines real-time parking data with blockchain payments using the XRP Ledger (XRPL) and RLUSD tokens.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd ParkPay

# Quick setup (recommended)
./config/setup.sh

# OR manual setup
pnpm install
cp api/.env.example api/.env
pnpm --filter api prisma generate
pnpm --filter api prisma migrate dev

# Start development servers
pnpm dev
```

**Access the app:**
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:4000

## Features

- **Real-time Parking Maps** - TomTom integration for live parking data
- **Blockchain Payments** - RLUSD tokens on XRP Ledger Testnet
- **Session Management** - Track parking sessions with live timers
- **Genesis Bank** - Automated RLUSD issuance system
- **Modern UI** - Responsive design with real-time updates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Express API    │    │   XRPL Testnet  │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Blockchain)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TomTom Maps   │    │   Prisma DB     │    │   Genesis Bank  │
│   (Parking Data)│    │  (Session Data) │    │  (RLUSD Issuer) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Project Structure

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
├── config/             # Configuration files
│   └── setup.sh       # Automated setup script
├── docs/              # All documentation
│   ├── SETUP.md       # Detailed setup guide
│   ├── SYSTEM_ARCHITECTURE.md
│   └── ...           # Other documentation
├── package.json       # Root package.json with workspace config
├── pnpm-lock.yaml     # Dependency lock file
└── pnpm-workspace.yaml # Workspace configuration
```

## Documentation

All documentation is organized in the [`docs/`](docs/) folder:

- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration
- **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)** - Technical overview and data flow
- **[Genesis Bank Info](docs/GENESIS_BANK_INFO.md)** - RLUSD issuance system details
- **[TomTom Integration](docs/TOMTOM_FINAL_SOLUTION.md)** - Maps and parking data
- **[Testing Instructions](docs/TESTING_INSTRUCTIONS.md)** - How to test all features
- **[UI Fixes Summary](docs/UI_FIXES_SUMMARY.md)** - User interface improvements

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Prisma, TypeScript
- **Database**: SQLite (development)
- **Blockchain**: XRP Ledger Testnet, RLUSD tokens
- **Maps**: TomTom Maps API
- **Real-time**: Socket.io

## Key Components

- **Session Timer** - Real-time parking session tracking
- **Wallet System** - RLUSD balance management with XRPL sync
- **Payment Processing** - Automated parking fee collection
- **Map Integration** - Live parking spot availability
- **Genesis Bank** - Centralized RLUSD issuance

## Important Notes

- **Security**: Never commit `.env` files - they contain sensitive credentials
- **Testnet Only**: This uses XRPL Testnet - no real money involved
- **Auto-sync**: Wallet balance automatically syncs with XRPL ledger
- **Trustlines**: Automatically established for RLUSD transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes.

## Note
Main working branch is called "test_recs," and in case the auth api goes down, use "test_recs_no_auth"

---

**Happy Parking!**

*Built with using XRPL, TomTom, and modern web technologies*
