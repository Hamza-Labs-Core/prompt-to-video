/**
 * Settings route handlers for API key management
 */

import { deriveEncryptionKey, encryptApiKey, decryptApiKey } from '../auth/encryption';
import { getUserApiKeys, saveApiKey, deleteApiKey, getApiKey } from '../db/api-keys';

interface SettingsEnv {
  DB: D1Database;
  ENCRYPTION_KEY: string;
}

interface ProviderSettings {
  provider: 'llm' | 'image' | 'video' | 'compile';
  apiKey: string;
  providerName?: string;
  model?: string;
  extraConfig?: Record<string, unknown>;
}

interface SaveSettingsRequest {
  settings: ProviderSettings[];
}

/**
 * Handle GET /api/settings
 * Returns decrypted API keys for the authenticated user
 */
export async function handleGetSettings(
  env: SettingsEnv,
  userId: string
): Promise<Response> {
  try {
    const encryptionKey = await deriveEncryptionKey(env.ENCRYPTION_KEY, userId);
    const apiKeys = await getUserApiKeys(env.DB, userId);

    const settings: Record<string, {
      hasKey: boolean;
      providerName?: string;
      model?: string;
      extraConfig?: Record<string, unknown>;
    }> = {};

    for (const key of apiKeys) {
      try {
        // We don't return the actual API key, just metadata
        settings[key.provider] = {
          hasKey: true,
          providerName: key.provider_name || undefined,
          model: key.model || undefined,
          extraConfig: key.extra_config ? JSON.parse(key.extra_config) : undefined,
        };
      } catch {
        settings[key.provider] = { hasKey: true };
      }
    }

    // Ensure all providers have entries
    for (const provider of ['llm', 'image', 'video', 'compile']) {
      if (!settings[provider]) {
        settings[provider] = { hasKey: false };
      }
    }

    return jsonResponse({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return jsonResponse({ success: false, error: 'Failed to get settings' }, 500);
  }
}

/**
 * Handle PUT /api/settings
 * Saves encrypted API keys for the authenticated user
 */
export async function handleSaveSettings(
  request: Request,
  env: SettingsEnv,
  userId: string
): Promise<Response> {
  try {
    const body: SaveSettingsRequest = await request.json();

    if (!body.settings || !Array.isArray(body.settings)) {
      return jsonResponse({ success: false, error: 'Invalid settings format' }, 400);
    }

    const encryptionKey = await deriveEncryptionKey(env.ENCRYPTION_KEY, userId);

    for (const setting of body.settings) {
      if (!setting.provider || !['llm', 'image', 'video', 'compile'].includes(setting.provider)) {
        continue;
      }

      if (!setting.apiKey) {
        // Delete key if empty
        await deleteApiKey(env.DB, userId, setting.provider);
        continue;
      }

      // Encrypt and save
      const { encrypted, iv } = await encryptApiKey(setting.apiKey, encryptionKey);

      await saveApiKey(env.DB, {
        userId,
        provider: setting.provider,
        encryptedKey: encrypted,
        iv,
        providerName: setting.providerName,
        model: setting.model,
        extraConfig: setting.extraConfig,
      });
    }

    return jsonResponse({ success: true, data: { message: 'Settings saved' } });
  } catch (error) {
    console.error('Save settings error:', error);
    return jsonResponse({ success: false, error: 'Failed to save settings' }, 500);
  }
}

/**
 * Handle DELETE /api/settings/:provider
 * Deletes an API key for a specific provider
 */
export async function handleDeleteSetting(
  env: SettingsEnv,
  userId: string,
  provider: string
): Promise<Response> {
  try {
    if (!['llm', 'image', 'video', 'compile'].includes(provider)) {
      return jsonResponse({ success: false, error: 'Invalid provider' }, 400);
    }

    await deleteApiKey(env.DB, userId, provider);

    return jsonResponse({ success: true, data: { message: 'Setting deleted' } });
  } catch (error) {
    console.error('Delete setting error:', error);
    return jsonResponse({ success: false, error: 'Failed to delete setting' }, 500);
  }
}

/**
 * Get decrypted API key for internal use (not exposed via API)
 */
export async function getDecryptedApiKey(
  env: SettingsEnv,
  userId: string,
  provider: string
): Promise<{ apiKey: string; providerName?: string; model?: string; extraConfig?: Record<string, unknown> } | null> {
  try {
    const record = await getApiKey(env.DB, userId, provider);
    if (!record) {
      return null;
    }

    const encryptionKey = await deriveEncryptionKey(env.ENCRYPTION_KEY, userId);
    const apiKey = await decryptApiKey(record.encrypted_key, record.iv, encryptionKey);

    return {
      apiKey,
      providerName: record.provider_name || undefined,
      model: record.model || undefined,
      extraConfig: record.extra_config ? JSON.parse(record.extra_config) : undefined,
    };
  } catch (error) {
    console.error('Decrypt API key error:', error);
    return null;
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
