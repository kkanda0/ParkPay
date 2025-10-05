import { cookies } from 'next/headers';

// Types for Echo authentication
interface EchoTokenPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

interface EchoIntrospectionResponse {
  active: boolean;
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Validates an Echo token using multiple strategies:
 * 1. Fast JWT validation (first - most reliable)
 * 2. Official Echo Next.js SDK (if available)
 * 3. Echo control API introspection (fallback)
 */
export async function validateToken(token: string): Promise<boolean> {
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 No token provided');
    }
    return false;
  }

  try {
    // Strategy 1: Fast JWT validation first (most reliable and fastest)
    if (token && token.length > 50) { // Basic check that it looks like a JWT
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          // Check if it's a valid Echo token with proper structure
          if (payload.exp && payload.exp > now && 
              (payload.client_id || payload.user_id || payload.scope)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Token validated with fast JWT check');
            }
            return true;
          }
        }
      } catch (error) {
        // If we can't parse it, it's probably not a valid JWT
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Token parsing failed:', error);
        }
      }
    }

    // Strategy 2: Try Echo Next.js SDK (if available)
    if (await validateWithEchoSDK(token)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token validated with Echo SDK');
      }
      return true;
    }

    // Strategy 3: Try Echo control API introspection (fallback)
    if (await validateWithEchoControl(token)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token validated with Echo control API');
      }
      return true;
    }

    // Strategy 4: Try basic JWT validation (fallback)
    if (await validateBasicJWT(token)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token validated with basic JWT check');
      }
      return true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Token validation failed with all strategies');
    }
    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔒 Token validation error:', error);
    }
    return false;
  }
}

/**
 * Strategy 1: Validate using Echo Next.js SDK (if available)
 */
async function validateWithEchoSDK(token: string): Promise<boolean> {
  // Skip SDK validation since package is not installed
  // The Echo SDK requires Next.js 15+ but we're using Next.js 14.0.4
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Echo SDK not available (requires Next.js 15+), skipping SDK validation...');
  }
  return false;
}

/**
 * Strategy 2: Validate using Echo control API introspection
 */
async function validateWithEchoControl(token: string): Promise<boolean> {
  const controlUrl = process.env.ECHO_CONTROL_URL;
  const serverKey = process.env.ECHO_SERVER_KEY;

  if (!controlUrl || !serverKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Echo credentials not configured');
    }
    return false;
  }

  try {
    const response = await fetch(`${controlUrl}/token-introspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverKey}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 Echo API error:', response.status, response.statusText);
      }
      return false;
    }

    const result: EchoIntrospectionResponse = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Echo API validation result:', result);
    }
    return result.active === true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Echo control API error:', error);
    }
    return false;
  }
}

/**
 * Strategy 3: Basic JWT validation (fallback)
 */
async function validateBasicJWT(token: string): Promise<boolean> {
  try {
    // Basic JWT parsing without external dependencies
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as EchoTokenPayload;
    
    if (!payload) {
      return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Token expired');
      }
      return false;
    }

    // Check required fields
    if (!payload.sub || !payload.iss) {
      return false;
    }

    // For development/testing, also accept mock tokens
    if (payload.sub === 'test-user' || payload.sub === 'mock-user') {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Mock token accepted for testing');
      }
      return true;
    }

    // Basic validation passed
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Basic JWT validation failed:', error);
    }
    return false;
  }
}

/**
 * Get the authentication token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Getting auth token from cookies:', token ? '***present***' : 'missing');
    }
    
    return token || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔒 Error getting auth token from cookies:', error);
    }
    return null;
  }
}

/**
 * Check if user is authenticated (convenience function)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }
  
  return await validateToken(token);
}

/**
 * Get user info from token (if valid)
 */
export async function getUserFromToken(): Promise<{ id: string; [key: string]: any } | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const isValid = await validateToken(token);
  if (!isValid) {
    return null;
  }

  try {
    // Basic JWT parsing
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as EchoTokenPayload;
    return payload ? { id: payload.sub, ...payload } : null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔒 Error decoding token:', error);
    }
    return null;
  }
}
