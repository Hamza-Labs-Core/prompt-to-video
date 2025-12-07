/**
 * Session repository for D1 database
 */

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  created_at: string;
}

/**
 * Create a new session
 */
export async function createSession(
  db: D1Database,
  userId: string,
  refreshTokenHash: string,
  expiresInSeconds: number = 604800 // 7 days
): Promise<Session> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)`
    )
    .bind(id, userId, refreshTokenHash, expiresAt)
    .run();

  return {
    id,
    user_id: userId,
    refresh_token_hash: refreshTokenHash,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get session by refresh token hash
 */
export async function getSessionByTokenHash(
  db: D1Database,
  tokenHash: string
): Promise<Session | null> {
  const result = await db
    .prepare(`SELECT * FROM sessions WHERE refresh_token_hash = ?`)
    .bind(tokenHash)
    .first<Session>();

  return result || null;
}

/**
 * Delete session
 */
export async function deleteSession(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(
  db: D1Database,
  userId: string
): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId).run();
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db
    .prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`)
    .run();
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(session: Session): boolean {
  return new Date(session.expires_at) > new Date();
}
