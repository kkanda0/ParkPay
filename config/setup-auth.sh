#!/bin/bash

echo "🔐 Setting up Auth0 + Echo by Merit authentication..."

# Change to project root
cd "$(dirname "$0")/.."

# Check if .env files exist
if [ ! -f "api/.env" ]; then
    echo "📝 Creating api/.env from template..."
    cp api/env.example api/.env
    echo "✅ Created api/.env - Please update with your Auth0 credentials"
else
    echo "✅ api/.env already exists"
fi

if [ ! -f "web/.env.local" ]; then
    echo "📝 Creating web/.env.local from template..."
    cat > web/.env.local << EOF
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-key-here
AUTH0_BASE_URL=http://localhost:3001
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
EOF
    echo "✅ Created web/.env.local - Please update with your Auth0 credentials"
else
    echo "✅ web/.env.local already exists"
fi

# Update Echo by Merit API key in api/.env
echo "🔑 Adding Echo by Merit API key to api/.env..."
if grep -q "ECHO_MERIT_API_KEY" api/.env; then
    echo "✅ Echo by Merit API key already configured"
else
    echo "" >> api/.env
    echo "# Echo by Merit Configuration" >> api/.env
    echo "ECHO_MERIT_API_KEY=8aa15208-2fc9-4565-b397-57e5da728925" >> api/.env
    echo "ECHO_MERIT_BASE_URL=https://api.echo.merit.com" >> api/.env
    echo "✅ Added Echo by Merit API key to api/.env"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Set up your Auth0 application:"
echo "   - Go to https://manage.auth0.com/"
echo "   - Create a Single Page Application"
echo "   - Configure callback URLs: http://localhost:3001/api/auth/callback"
echo "   - Configure logout URLs: http://localhost:3001"
echo ""
echo "2. Update environment variables:"
echo "   - Edit api/.env with your Auth0 credentials"
echo "   - Edit web/.env.local with your Auth0 credentials"
echo ""
echo "3. Start the development servers:"
echo "   pnpm dev"
echo ""
echo "4. Test the authentication flow:"
echo "   - Go to http://localhost:3001"
echo "   - Click 'Find Parking'"
echo "   - Complete Auth0 login/signup"
echo "   - You'll be redirected to the map with Echo by Merit AI enabled"
echo ""
echo "📚 For detailed setup instructions, see docs/AUTH0_ECHO_MERIT_SETUP.md"

