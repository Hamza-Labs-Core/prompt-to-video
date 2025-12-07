/**
 * API Keys repository for D1 database
 */

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  provider: string;
  encrypted_key: string;
  iv: string;
  provider_name: string | null;
  model: string | null;
  extra_config: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveApiKeyInput {
  userId: string;
  provider: 'llm' | 'image' | 'video' | 'compile';
  encryptedKey: string;
  iv: string;
  providerName?: string;
  model?: string;
  extraConfig?: Record<string, unknown>;
}

/**
 * Save or update an API key
 */
export async function saveApiKey(
  db: D1Database,
  input: SaveApiKeyInput
): Promise<ApiKeyRecord> {
  const existing = await getApiKey(db, input.userId, input.provider);
  const extraConfigJson = input.extraConfig
    ? JSON.stringify(input.extraConfig)
    : null;

  if (existing) {
    // Update existing
    await db
      .prepare(
        `UPDATE api_keys
         SET encrypted_key = ?, iv = ?, provider_name = ?, model = ?, extra_config = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        input.encryptedKey,
        input.iv,
        input.providerName || null,
        input.model || null,
        extraConfigJson,
        existing.id
      )
      .run();

    return (await getApiKey(db, input.userId, input.provider))!;
  }

  // Create new
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO api_keys (id, user_id, provider, encrypted_key, iv, provider_name, model, extra_config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.userId,
      input.provider,
      input.encryptedKey,
      input.iv,
      input.providerName || null,
      input.model || null,
      extraConfigJson
    )
    .run();

  return (await getApiKey(db, input.userId, input.provider))!;
}

/**
 * Get API key for a provider
 */
export async function getApiKey(
  db: D1Database,
  userId: string,
  provider: string
): Promise<ApiKeyRecord | null> {
  const result = await db
    .prepare(`SELECT * FROM api_keys WHERE user_id = ? AND provider = ?`)
    .bind(userId, provider)
    .first<ApiKeyRecord>();

  return result || null;
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(
  db: D1Database,
  userId: string
): Promise<ApiKeyRecord[]> {
  const result = await db
    .prepare(`SELECT * FROM api_keys WHERE user_id = ?`)
    .bind(userId)
    .all<ApiKeyRecord>();

  return result.results || [];
}

/**
 * Delete an API key
 */
export async function deleteApiKey(
  db: D1Database,
  userId: string,
  provider: string
): Promise<void> {
  await db
    .prepare(`DELETE FROM api_keys WHERE user_id = ? AND provider = ?`)
    .bind(userId, provider)
    .run();
}

/**
 * Delete all API keys for a user
 */
export async function deleteUserApiKeys(
  db: D1Database,
  userId: string
): Promise<void> {
  await db.prepare(`DELETE FROM api_keys WHERE user_id = ?`).bind(userId).run();
}
