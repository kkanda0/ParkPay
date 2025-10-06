'use server'

interface LoginData {
  username: string;
  timestamp: string;
  sessionId: string;
  permissions: string[];
}

/**
 * Simple server action for login (no authentication required)
 */
export async function logIn(username: string): Promise<{ 
  error?: string; 
  data?: any; 
  success?: boolean;
  message?: string;
}> {
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
 * Simple test function (no authentication required)
 */
export async function testAuthenticatedAccess(): Promise<{ 
  success: boolean; 
  message: string; 
  user?: any;
}> {
  return {
    success: true,
    message: 'Access granted - no authentication required',
    user: { authenticated: true, timestamp: new Date().toISOString() }
  };
}

/**
 * Simple logout function (no authentication required)
 */
export async function logout(): Promise<{ 
  success: boolean; 
  message: string;
}> {
  return {
    success: true,
    message: 'Successfully logged out'
  };
}