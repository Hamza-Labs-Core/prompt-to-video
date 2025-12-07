/**
 * Authentication route handlers
 */

import {
  generateSalt,
  hashPassword,
  verifyPassword,
  createJWT,
  generateRefreshToken,
  hashRefreshToken,
} from '../auth';
import {
  createUser,
  getUserByEmail,
  emailExists,
  createSession,
  getSessionByTokenHash,
  deleteSession,
  isSessionValid,
  getUserById,
} from '../db';

interface AuthEnv {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRY?: string;
  REFRESH_EXPIRY?: string;
}

interface SignupRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshRequest {
  refreshToken: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

/**
 * Handle POST /api/auth/signup
 */
export async function handleSignup(
  request: Request,
  env: AuthEnv
): Promise<Response> {
  try {
    const body: SignupRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
    }

    if (!isValidEmail(body.email)) {
      return jsonResponse({ success: false, error: 'Invalid email format' }, 400);
    }

    const passwordValidation = isValidPassword(body.password);
    if (!passwordValidation.valid) {
      return jsonResponse({ success: false, error: passwordValidation.error }, 400);
    }

    // Check if email exists
    if (await emailExists(env.DB, body.email)) {
      return jsonResponse({ success: false, error: 'Email already registered' }, 409);
    }

    // Hash password
    const salt = generateSalt();
    const passwordHash = await hashPassword(body.password, salt);

    // Create user
    const user = await createUser(env.DB, {
      email: body.email,
      passwordHash,
      salt,
    });

    // Generate tokens
    const jwtExpiry = parseInt(env.JWT_EXPIRY || '3600');
    const refreshExpiry = parseInt(env.REFRESH_EXPIRY || '604800');

    const accessToken = await createJWT(user.id, user.email, env.JWT_SECRET, jwtExpiry);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Create session
    await createSession(env.DB, user.id, refreshTokenHash, refreshExpiry);

    return jsonResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        accessToken,
        refreshToken,
        expiresIn: jwtExpiry,
      },
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return jsonResponse({ success: false, error: 'Failed to create account' }, 500);
  }
}

/**
 * Handle POST /api/auth/login
 */
export async function handleLogin(
  request: Request,
  env: AuthEnv
): Promise<Response> {
  try {
    const body: LoginRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
    }

    // Get user
    const user = await getUserByEmail(env.DB, body.email);
    if (!user) {
      return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.salt, user.password_hash);
    if (!isValid) {
      return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Generate tokens
    const jwtExpiry = parseInt(env.JWT_EXPIRY || '3600');
    const refreshExpiry = parseInt(env.REFRESH_EXPIRY || '604800');

    const accessToken = await createJWT(user.id, user.email, env.JWT_SECRET, jwtExpiry);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Create session
    await createSession(env.DB, user.id, refreshTokenHash, refreshExpiry);

    return jsonResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        accessToken,
        refreshToken,
        expiresIn: jwtExpiry,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ success: false, error: 'Login failed' }, 500);
  }
}

/**
 * Handle POST /api/auth/refresh
 */
export async function handleRefresh(
  request: Request,
  env: AuthEnv
): Promise<Response> {
  try {
    const body: RefreshRequest = await request.json();

    if (!body.refreshToken) {
      return jsonResponse({ success: false, error: 'Refresh token is required' }, 400);
    }

    // Hash and find session
    const tokenHash = await hashRefreshToken(body.refreshToken);
    const session = await getSessionByTokenHash(env.DB, tokenHash);

    if (!session || !isSessionValid(session)) {
      return jsonResponse({ success: false, error: 'Invalid or expired refresh token' }, 401);
    }

    // Get user
    const user = await getUserById(env.DB, session.user_id);
    if (!user) {
      return jsonResponse({ success: false, error: 'User not found' }, 401);
    }

    // Delete old session
    await deleteSession(env.DB, session.id);

    // Generate new tokens
    const jwtExpiry = parseInt(env.JWT_EXPIRY || '3600');
    const refreshExpiry = parseInt(env.REFRESH_EXPIRY || '604800');

    const accessToken = await createJWT(user.id, user.email, env.JWT_SECRET, jwtExpiry);
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    // Create new session
    await createSession(env.DB, user.id, newRefreshTokenHash, refreshExpiry);

    return jsonResponse({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: jwtExpiry,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return jsonResponse({ success: false, error: 'Token refresh failed' }, 500);
  }
}

/**
 * Handle POST /api/auth/logout
 */
export async function handleLogout(
  request: Request,
  env: AuthEnv
): Promise<Response> {
  try {
    const body: RefreshRequest = await request.json();

    if (body.refreshToken) {
      const tokenHash = await hashRefreshToken(body.refreshToken);
      const session = await getSessionByTokenHash(env.DB, tokenHash);
      if (session) {
        await deleteSession(env.DB, session.id);
      }
    }

    return jsonResponse({ success: true, data: { message: 'Logged out' } });
  } catch (error) {
    console.error('Logout error:', error);
    return jsonResponse({ success: true, data: { message: 'Logged out' } });
  }
}

/**
 * Handle GET /api/auth/me
 */
export async function handleGetMe(
  env: AuthEnv,
  userId: string
): Promise<Response> {
  try {
    const user = await getUserById(env.DB, userId);
    if (!user) {
      return jsonResponse({ success: false, error: 'User not found' }, 404);
    }

    return jsonResponse({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return jsonResponse({ success: false, error: 'Failed to get user' }, 500);
  }
}

/**
 * JSON response helper
 */
function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
