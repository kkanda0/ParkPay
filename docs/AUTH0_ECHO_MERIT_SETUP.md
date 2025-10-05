# Auth0 + Echo by Merit Integration Setup

This guide explains how to set up authentication using Auth0 integrated with Echo by Merit for the ParkPay application.

## Overview

The authentication system uses:
- **Auth0** - Identity and access management platform
- **Echo by Merit** - AI services and user management backend
- **Prisma Database** - Local user data storage

## Setup Instructions

### 1. Auth0 Configuration

#### Create Auth0 Application
1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new **Single Page Application**
3. Configure the following settings:

**Application Settings:**
- **Allowed Callback URLs**: `http://localhost:3001/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3001`
- **Allowed Web Origins**: `http://localhost:3001`
- **Allowed Origins (CORS)**: `http://localhost:3001`

#### Get Auth0 Credentials
From your Auth0 application, copy:
- **Domain** (e.g., `your-domain.auth0.com`)
- **Client ID**
- **Client Secret**

### 2. Environment Variables

#### Frontend (web/.env.local)
```bash
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-key-here
AUTH0_BASE_URL=http://localhost:3001
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

#### Backend (api/.env)
```bash
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-key-here
AUTH0_BASE_URL=http://localhost:3001
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Echo by Merit Configuration
ECHO_MERIT_API_KEY=8aa15208-2fc9-4565-b397-57e5da728925
ECHO_MERIT_BASE_URL=https://api.echo.merit.com

# JWT Secret for Echo AI
JWT_SECRET=echo-ai-secret-key-change-in-production
```

### 3. Echo by Merit Integration

The system automatically syncs Auth0 users with Echo by Merit services:

1. **User Authentication Flow**:
   - User clicks "Find Parking"
   - Redirected to Auth0 login
   - After successful Auth0 authentication
   - User data is synced with Echo by Merit backend
   - JWT token is generated for Echo AI services

2. **User Data Storage**:
   - Auth0 user data is stored in local Prisma database
   - Includes preferences and parking history
   - Synced with Echo by Merit AI services

### 4. API Endpoints

#### Authentication Endpoints
- `POST /api/ai/auth/sync-user` - Sync Auth0 user with Echo by Merit
- `GET /api/ai/auth/validate` - Validate Echo AI JWT token
- `PUT /api/ai/auth/preferences` - Update user preferences
- `PUT /api/ai/auth/parking-history` - Update parking history

#### Auth0 Endpoints (Frontend)
- `GET /api/auth/login` - Initiate Auth0 login
- `GET /api/auth/logout` - Auth0 logout
- `GET /api/auth/callback` - Auth0 callback handler

### 5. User Flow

1. **First Time User**:
   ```
   Click "Find Parking" → Auth0 Login → Create Account → 
   Sync with Echo by Merit → Redirect to Map
   ```

2. **Returning User**:
   ```
   Click "Find Parking" → Auth0 Login → 
   Sync with Echo by Merit → Redirect to Map
   ```

3. **Already Authenticated**:
   ```
   Click "Find Parking" → Direct redirect to Map
   ```

### 6. Echo by Merit Features

Once authenticated, users get access to:
- **AI Chat Assistant** - Powered by Echo by Merit
- **Personalized Recommendations** - Based on parking history
- **Smart Insights** - AI-driven parking suggestions
- **User Preferences** - Stored and synced across devices

### 7. Development vs Production

#### Development
- Uses local SQLite database
- Auth0 test application
- Local development URLs

#### Production
- Use production Auth0 application
- Update callback URLs to production domain
- Use production database
- Secure JWT secrets

### 8. Troubleshooting

#### Common Issues
1. **Port conflicts**: Ensure API runs on 4000, web on 3001
2. **CORS errors**: Check Auth0 allowed origins
3. **Database errors**: Run Prisma migrations
4. **Auth0 callback errors**: Verify callback URLs

#### Debug Steps
1. Check browser console for errors
2. Verify environment variables
3. Test Auth0 application settings
4. Check API server logs

### 9. Security Considerations

- Never commit `.env` files
- Use strong JWT secrets
- Enable HTTPS in production
- Regularly rotate Auth0 secrets
- Implement proper CORS policies

## Next Steps

1. Set up your Auth0 application
2. Configure environment variables
3. Test the authentication flow
4. Customize Echo by Merit integration as needed

For more information about Echo by Merit integration, refer to their official documentation.
