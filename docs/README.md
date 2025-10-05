# 🚗 ParkPay

A visually stunning parking micropayments dApp using **XRPL + RLUSD** for payments and **Echo AI** for smart insights.

## ✨ Features

- **🎨 Stunning Design**: Dark mode first with glassmorphism, gradients, and smooth animations
- **⚡ Instant Payments**: XRPL-powered micropayments with RLUSD
- **🤖 Echo AI**: Smart insights, anomaly detection, and chatbot assistance
- **📍 Real-time Map**: Live spot availability with glowing markers
- **⏱️ Live Billing**: Real-time session timers and RLUSD counters
- **📊 Provider Dashboard**: Earnings analytics, occupancy heatmaps, and AI recommendations
- **💬 AI Chat**: Intelligent assistant for parking questions and support

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** + Custom design system
- **Framer Motion** for smooth animations
- **Lucide Icons** for beautiful icons
- **Socket.io** for real-time updates
- **Canvas Confetti** for celebration effects

### Backend
- **Node.js** + Express + TypeScript
- **Prisma** + SQLite database
- **Socket.io** for real-time communication
- **XRPL integration** (stubbed for demo)
- **Echo AI SDK** (stubbed for demo)

## 🚀 Quick Start

### Option 1: Automated Setup
```bash
# Run the setup script
./setup.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
pnpm install

# Set up API
cd api
cp env.example .env
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed

# Start development servers
cd ..
pnpm dev
```

Open **http://localhost:3000** to explore ParkPay!

## 🎯 Demo Flow

1. **🏠 Home** → See the beautiful landing page with live stats
2. **🗺️ Map** → View glowing parking spot pins with real-time availability
3. **🚗 Spot Selection** → Tap a spot → `/spot/[id]` → press "Start Session"
4. **⏱️ Live Session** → Watch timer circle + RLUSD counter animate in real-time
5. **🎉 Session End** → Confetti burst + instant RLUSD settlement animation
6. **💰 Wallet** → View balance with animated inflow/outflow
7. **📊 Provider Dashboard** → Live earnings, occupancy heatmap, AI insights
8. **💬 Echo AI Chat** → Ask: "Why was I charged 17 minutes?" → Get intelligent response

## 🎨 Design System

### Color Palette
- **Background**: `#0E0E10` (Dark mode first)
- **Accent Gradients**: `from-cyan-400 via-purple-500 to-fuchsia-600`
- **Glassmorphism**: `backdrop-blur-lg bg-white/5 border border-white/10`

### Typography
- **Primary**: Inter (clean, modern)
- **Display**: Space Grotesk (headings, emphasis)

### Animations
- **Page Transitions**: Slide from bottom (Framer Motion)
- **RLUSD Flow**: Animated dots moving between user & provider
- **Confetti Burst**: Celebration when sessions end successfully
- **Neon Glow**: Pulsing effects for active elements

## 📱 Pages Overview

### `/` - Landing Page
- Hero section with animated logo
- Feature grid with hover effects
- Live demo stats
- Call-to-action buttons

### `/map` - Parking Map
- Full-screen dark map with custom styling
- Glowing markers for available spots
- Top overlay card with lot statistics
- Floating "Start Session" button

### `/spot/[id]` - Session Management
- Large timer circle with progress animation
- Live RLUSD counter that ticks smoothly
- Start/End session buttons with state changes
- Post-settlement confetti animation
- XRPL transaction details

### `/wallet` - Balance Management
- Glassmorphism balance card
- Animated balance bar with RLUSD flow effect
- Recent transactions list
- Add funds modal with quick amounts

### `/chat` - Echo AI Assistant
- ChatGPT-style interface
- Gradient message bubbles (cyan for AI, white for user)
- Typing indicator animation
- Suggestion buttons for quick actions
- Voice input support (UI ready)

### `/provider` - Dashboard
- Tabbed interface (Overview, Heatmap, Anomalies)
- Revenue metrics with animated charts
- Occupancy heatmap grid
- AI insights panel with recommendations
- Anomaly detection with severity indicators

## 🔧 API Endpoints

### Sessions
- `POST /api/session/start` - Start parking session
- `POST /api/session/end` - End parking session
- `GET /api/session/:id` - Get session details
- `POST /api/session/heartbeat` - Update active session

### Wallet
- `GET /api/wallet/:address` - Get wallet info
- `POST /api/wallet/add-funds` - Add RLUSD funds
- `GET /api/wallet/:address/transactions` - Transaction history

### AI
- `POST /api/ai/chat` - Chat with Echo AI
- `POST /api/ai/analyze` - Analyze anomalies
- `GET /api/ai/insights/:lotId` - Get AI insights

### Provider
- `GET /api/provider/dashboard/:lotId` - Dashboard data
- `GET /api/provider/occupancy/:lotId` - Occupancy heatmap
- `PUT /api/provider/settings/:lotId` - Update settings

## 🎭 Animation Details

### RLUSD Flow Visualization
- Animated dots moving between user and provider icons
- Gradient trails with particle effects
- Smooth transitions between states

### Timer Circle
- SVG-based circular progress indicator
- Smooth stroke-dashoffset animations
- Gradient stroke colors (cyan → purple → pink)

### Confetti Effects
- Canvas-based particle system
- Custom colors matching brand palette
- Triggered on successful session completion

### Glassmorphism Cards
- Backdrop blur effects
- Subtle borders with transparency
- Hover states with depth and glow

## 🔮 Future Enhancements

- **Real XRPL Integration**: Connect to actual XRPL testnet
- **Echo AI API**: Integrate with real Echo AI service
- **Mobile App**: React Native version
- **Push Notifications**: Session reminders and alerts
- **Analytics Dashboard**: Advanced reporting and insights
- **Multi-location Support**: Multiple parking lots
- **Dynamic Pricing**: AI-driven rate optimization

## 📄 License

MIT License - feel free to use this as a starting point for your own projects!

---

**Built with ❤️ using modern web technologies and beautiful design principles.**
