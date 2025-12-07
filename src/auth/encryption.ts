/**
 * AES-256-GCM encryption for API keys
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from './password';

/**
 * Derive an encryption key from the master key and user ID
 * This ensures each user has a unique encryption key
 */
export async function deriveEncryptionKey(
  masterKey: string,
  userId: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Use userId as salt to derive a unique key per user
  const salt = encoder.encode(userId);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an API key
 */
export async function encryptApiKey(
  apiKey: string,
  encryptionKey: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoder.encode(apiKey)
  );

  return {
    encrypted: arrayBufferToBase64(new Uint8Array(encrypted)),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt an API key
 */
export async function decryptApiKey(
  encrypted: string,
  iv: string,
  encryptionKey: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
    encryptionKey,
    base64ToArrayBuffer(encrypted)
  );

  return decoder.decode(decrypted);
}
