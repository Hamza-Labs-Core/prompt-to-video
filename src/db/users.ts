/**
 * User repository for D1 database
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  salt: string;
}

/**
 * Create a new user
 */
export async function createUser(
  db: D1Database,
  input: CreateUserInput
): Promise<User> {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)`
    )
    .bind(id, input.email.toLowerCase(), input.passwordHash, input.salt)
    .run();

  const user = await getUserById(db, id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first<User>();

  return result || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email.toLowerCase())
    .first<User>();

  return result || null;
}

/**
 * Check if email exists
 */
export async function emailExists(
  db: D1Database,
  email: string
): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM users WHERE email = ?`)
    .bind(email.toLowerCase())
    .first();

  return !!result;
}
