// web/src/lib/utils/pkce.ts

/**
 * PKCE (Proof Key for Code Exchange) utility functions
 * Required for secure OAuth 2.0 flows with Echo
 */

// Function to generate a random string for code_verifier
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let randomString = '';
  
  // Use crypto.getRandomValues for secure random generation
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < length; i++) {
    randomString += possible[randomBytes[i] % possible.length];
  }
  return randomString;
}

// Function to base64url encode an ArrayBuffer
function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a PKCE code_verifier and code_challenge pair
 * 
 * @returns Promise<{ code_verifier: string; code_challenge: string }>
 */
export async function generatePkcePair(): Promise<{ code_verifier: string; code_challenge: string }> {
  // Generate code_verifier (43-128 characters recommended)
  const code_verifier = generateRandomString(128);

  // Create code_challenge using SHA256 hash and base64url encoding
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const code_challenge = base64urlencode(hashBuffer);

  return { code_verifier, code_challenge };
}

/**
 * Validates that a code_verifier matches a code_challenge
 * Used for verification during token exchange
 */
export async function verifyCodeChallenge(code_verifier: string, code_challenge: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedChallenge = base64urlencode(hashBuffer);
  
  return computedChallenge === code_challenge;
}
