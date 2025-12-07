/**
 * Auth module exports
 */

export { generateSalt, hashPassword, verifyPassword } from './password';
export { createJWT, verifyJWT, generateRefreshToken, hashRefreshToken } from './jwt';
export { deriveEncryptionKey, encryptApiKey, decryptApiKey } from './encryption';

import { verifyJWT } from './jwt';

/**
 * Auth context attached to requests
 */
export interface AuthContext {
  userId: string;
  email: string;
}

/**
 * Extract and verify JWT from Authorization header
 */
export async function getAuthFromRequest(
  request: Request,
  jwtSecret: string
): Promise<AuthContext | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, jwtSecret);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
  };
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 */
export function requireAuth(auth: AuthContext | null): Response | null {
  if (!auth) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  return null;
}
