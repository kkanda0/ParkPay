#!/bin/bash

echo "🚀 Setting up ParkPay..."

# Change to project root
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Set up API
echo "🔧 Setting up API..."
cd api

# Copy environment file
if [ ! -f .env ]; then
  cp env.example .env
  echo "✅ Created .env file"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "🔄 Running database migrations..."
pnpm prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
pnpm prisma db seed

cd ..

# Set up Web
echo "🌐 Setting up Web..."
cd web

# Install dependencies (already done above, but just in case)
pnpm install

cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the development servers:"
echo "  pnpm dev"
echo ""
echo "Then open http://localhost:3000 to see ParkPay in action!"
echo ""
echo "Demo flow:"
echo "1. Open /map - see glowing parking spot pins"
echo "2. Tap a spot → /spot/[id] → press 'Start Session'"
echo "3. Watch timer + RLUSD flow animation"
echo "4. End Session → confetti burst, instant RLUSD settlement"
echo "5. Switch to /provider → live dashboard updates"
echo "6. Open /chat → ask Echo AI: 'Why was I charged 17 minutes?'"
