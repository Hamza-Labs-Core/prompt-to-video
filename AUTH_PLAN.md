# Per-User Authentication & Encrypted Key Storage Plan

## Overview

Implement secure per-user authentication with server-side encrypted storage of API keys.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  CF Worker      │────▶│   D1 Database   │
│                 │     │  + JWT Auth     │     │   (SQLite)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Encrypted KV   │
                        │  (API Keys)     │
                        └─────────────────┘
```

## Security Model

1. **Authentication**: JWT tokens with short expiry (1h) + refresh tokens (7d)
2. **Password Storage**: Argon2id hashing (via WebCrypto PBKDF2 fallback)
3. **API Key Encryption**: AES-256-GCM with per-user derived keys
4. **Key Derivation**: User password → PBKDF2 → encryption key (never stored)

## Database Schema (D1)

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for refresh tokens)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Encrypted API keys (stored in KV for speed, reference in D1)
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'llm', 'image', 'video', 'compile'
  encrypted_key TEXT NOT NULL, -- AES-256-GCM encrypted
  iv TEXT NOT NULL, -- Initialization vector
  provider_name TEXT, -- 'openrouter', 'fal-flux', etc.
  model TEXT, -- For LLM provider
  extra_config TEXT, -- JSON for provider-specific settings
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Projects now linked to users
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  concept TEXT,
  style TEXT,
  target_duration INTEGER,
  aspect_ratio TEXT DEFAULT '16:9',
  direction TEXT, -- JSON blob of VideoDirection
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Jobs linked to projects
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Auth Endpoints
```
POST /api/auth/signup     - Create account
POST /api/auth/login      - Login, get JWT + refresh token
POST /api/auth/refresh    - Refresh JWT using refresh token
POST /api/auth/logout     - Invalidate refresh token
GET  /api/auth/me         - Get current user info
```

### Protected Endpoints (require JWT)
```
GET    /api/settings           - Get user's provider settings (decrypted)
PUT    /api/settings           - Save provider settings (encrypts on server)
DELETE /api/settings/:provider - Remove a provider's key

GET    /api/projects           - List user's projects
POST   /api/projects           - Create project
GET    /api/projects/:id       - Get project
DELETE /api/projects/:id       - Delete project

POST   /api/projects/:id/direct  - Generate direction
POST   /api/projects/:id/refine  - Refine direction
POST   /api/projects/:id/generate - Start video generation
GET    /api/jobs/:id           - Get job status
```

## File Structure

```
src/
├── auth/
│   ├── index.ts          # Auth middleware & utilities
│   ├── jwt.ts            # JWT creation/verification
│   ├── password.ts       # Password hashing (PBKDF2)
│   └── encryption.ts     # AES-256-GCM for API keys
├── db/
│   ├── schema.sql        # D1 schema
│   ├── users.ts          # User repository
│   ├── sessions.ts       # Session repository
│   ├── api-keys.ts       # API keys repository
│   └── projects.ts       # Projects repository
├── routes/
│   ├── auth.ts           # Auth route handlers
│   ├── settings.ts       # Settings route handlers
│   └── projects.ts       # Project route handlers
└── index.ts              # Main router with auth middleware

ui/src/
├── pages/
│   ├── LoginPage.tsx     # Login form
│   ├── SignupPage.tsx    # Signup form
│   └── SettingsPage.tsx  # Updated for server-side storage
├── stores/
│   ├── authStore.ts      # Auth state (JWT, user info)
│   └── configStore.ts    # Remove (replaced by server-side)
├── hooks/
│   ├── useAuth.ts        # Auth hook
│   └── useSettings.ts    # Settings hook (server-side)
└── lib/
    └── api.ts            # Updated with auth headers
```

## Implementation Steps

### Phase 1: Database & Auth Foundation
1. Create D1 database and run schema
2. Implement password hashing utilities
3. Implement JWT utilities
4. Create auth endpoints (signup, login, refresh, logout)
5. Add auth middleware

### Phase 2: Encrypted Key Storage
1. Implement AES-256-GCM encryption utilities
2. Create API keys repository with encrypt/decrypt
3. Create settings endpoints
4. Update Worker to use decrypted keys for API calls

### Phase 3: UI Updates
1. Create LoginPage and SignupPage
2. Create authStore with JWT management
3. Update api.ts to include auth headers
4. Update SettingsPage to use server-side storage
5. Add protected routes
6. Update RootLayout with auth state

### Phase 4: Migration & Cleanup
1. Remove localStorage-based configStore
2. Update all API calls to use auth
3. Test full flow
4. Update documentation

## Security Considerations

1. **JWT Secret**: Store in Cloudflare secret, rotate periodically
2. **HTTPS Only**: Cloudflare handles this
3. **CORS**: Restrict to same origin
4. **Rate Limiting**: Add rate limiting on auth endpoints
5. **Password Requirements**: Min 8 chars, complexity check
6. **Session Management**: Single device or multi-device support

## Encryption Details

```typescript
// Key derivation (client never sends raw password after signup)
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt API key
async function encryptApiKey(key: string, encryptionKey: CryptoKey): Promise<{encrypted: string, iv: string}> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoder.encode(key)
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}
```

## Environment Variables

```toml
# wrangler.toml additions
[[d1_databases]]
binding = "DB"
database_name = "prompt-to-video"
database_id = "<your-database-id>"

[vars]
JWT_EXPIRY = "3600"  # 1 hour in seconds
REFRESH_EXPIRY = "604800"  # 7 days in seconds

# Secrets (wrangler secret put)
# JWT_SECRET - Random 256-bit key for signing JWTs
# ENCRYPTION_KEY - Master key for deriving user encryption keys
```
