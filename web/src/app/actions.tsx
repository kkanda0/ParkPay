'use server';

import { validateToken, getAuthToken } from '@/lib/utils/auth';

interface LoginData {
  username: string;
  timestamp: string;
  sessionId: string;
  permissions: string[];
}

/**
 * Secure server action that requires Echo authentication
 * Returns login data only if user is authenticated
 */
export async function logIn(username: string): Promise<{ 
  error?: string; 
  data?: any; 
  success?: boolean;
  message?: string;
}> {
  // Get token from cookies
  const token = await getAuthToken();
  
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 No authentication token found');
    }
    return { 
      error: 'This action requires authentication. Please sign in with Echo.' 
    };
  }

  // Validate token
  const isValid = await validateToken(token);
  
  if (!isValid) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Invalid authentication token');
    }
    return { 
      error: 'Invalid authentication token. Please sign in again.' 
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ User authenticated, proceeding with login request');
  }

  try {
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    // Generate mock login data
    const loginData: LoginData = {
      username,
      timestamp: new Date().toISOString(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      permissions: ['read:profile', 'write:profile', 'read:parking', 'write:parking']
    };
    
    return {
      success: true,
      message: `Welcome, ${username}! Login successful.`,
      data: loginData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔐 Login error:', error);
    }
    
    return {
      error: 'Failed to process login',
      success: false
    };
  }
}


/**
 * Test function to demonstrate unauthenticated access
 */
export async function testUnauthenticatedAccess(): Promise<{ error: string }> {
  return {
    error: 'This action requires authentication. Please sign in with Echo.'
  };
}

/**
 * Test function to demonstrate authenticated access
 */
export async function testAuthenticatedAccess(): Promise<{ 
  success: boolean; 
  message: string; 
  user?: any;
}> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Testing authenticated access...');
  }
  
  const token = await getAuthToken();
  
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ No authentication token found');
    }
    return {
      success: false,
      message: 'No authentication token found'
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Token found, validating...');
  }

  const isValid = await validateToken(token);
  
  if (!isValid) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Token validation failed');
    }
    return {
      success: false,
      message: 'Invalid authentication token'
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Token validation successful');
  }

  return {
    success: true,
    message: 'Authentication successful! You can access protected resources.',
    user: { authenticated: true, timestamp: new Date().toISOString() }
  };
}

export async function logout(): Promise<{ 
  success: boolean; 
  message: string;
}> {
  try {
    const { cookies } = await import('next/headers');
    
    // Clear the authentication token cookie
    cookies().set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 User logged out successfully');
    }

    return {
      success: true,
      message: 'Successfully logged out'
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Logout error:', error);
    }
    return {
      success: false,
      message: 'Failed to logout'
    };
  }
}

/**
 * Server action to exchange authorization code for access token using PKCE
 * This must be server-side to keep ECHO_SERVER_KEY secure
 */
export async function exchangeCodeForToken(code: string, code_verifier: string): Promise<{ 
  success: boolean; 
  token?: string; 
  error?: string;
  message?: string;
}> {
  const echoAppId = process.env.ECHO_APP_ID;
  const echoControlUrl = process.env.ECHO_CONTROL_URL;
  const echoServerKey = process.env.ECHO_SERVER_KEY;

  if (!echoAppId || !echoControlUrl) {
    console.error('❌ Echo configuration missing: ECHO_APP_ID or ECHO_CONTROL_URL not set');
    return { 
      success: false, 
      error: 'Server configuration error: Missing Echo credentials' 
    };
  }

  try {
        const redirectUri = `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3002'}/auth/callback`;

    console.log('🔄 Exchanging authorization code for access token...');
    console.log('📋 App ID:', echoAppId);
    console.log('🌐 Token endpoint:', `${echoControlUrl}/oauth/token`);
    console.log('🔄 Redirect URI:', redirectUri);

    // Prepare token exchange request
    const tokenRequestBody = new URLSearchParams({
      client_id: echoAppId,
      code: code,
      code_verifier: code_verifier,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add authorization header if server key is available
    if (echoServerKey) {
      headers['Authorization'] = `Bearer ${echoServerKey}`;
    }

        // Try different token endpoints
        const tokenEndpoints = [
          `https://echo.merit.systems/oauth/token`,
          `${echoControlUrl}/oauth/token`,
          `https://api.echo.merit.systems/oauth/token`,
          `https://echo.merit.systems/api/oauth/token`
        ];
    
    let response;
    let lastError;
    
        for (const endpoint of tokenEndpoints) {
          try {
            console.log('🔄 Trying token endpoint:', endpoint);
            console.log('📋 Request body:', tokenRequestBody.toString());
            console.log('📋 Request headers:', headers);
            
            response = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: tokenRequestBody.toString(),
            });

            console.log('📡 Token exchange response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
              console.log('✅ Token endpoint working:', endpoint);
              break; // Success, exit the loop
            } else {
              // Clone the response before consuming the body
              const responseClone = response.clone();
              const errorText = await responseClone.text();
              console.log('❌ Token endpoint failed:', endpoint, response.status);
              console.log('📄 Error response:', errorText);
            }
          } catch (error) {
            console.log('❌ Token endpoint error:', endpoint, error instanceof Error ? error.message : 'Unknown error');
            lastError = error;
            continue; // Try next endpoint
          }
        }
    
    if (!response) {
      console.error('❌ All token endpoints failed');
      return { 
        success: false, 
        error: `All token endpoints failed. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
        message: 'Unable to reach Echo token endpoint'
      };
    }

    if (!response.ok) {
      // Clone the response before consuming the body
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error('❌ Token exchange failed:', response.status, response.statusText);
      console.error('📄 Error response:', errorText);
      
      return { 
        success: false, 
        error: `Token exchange failed: ${response.status} ${response.statusText}`,
        message: errorText
      };
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful');
    console.log('🎫 Token data:', { 
      access_token: tokenData.access_token ? '***present***' : 'missing',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    const accessToken = tokenData.access_token;

    if (accessToken) {
      // Set the token in an httpOnly cookie (server-side)
      const { cookies } = await import('next/headers');
      cookies().set('token', accessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: tokenData.expires_in || 3600, // Use expires_in from response or default to 1 hour
        path: '/'
      });

      return { 
        success: true, 
        token: accessToken,
        message: 'Authentication successful! Token stored securely.'
      };
    } else {
      return { 
        success: false, 
        error: 'No access token received from Echo',
        message: 'Token exchange completed but no access token was returned'
      };
    }
  } catch (error) {
    console.error('❌ Error during token exchange:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during token exchange',
      message: 'Failed to complete authentication process'
    };
  }
}
