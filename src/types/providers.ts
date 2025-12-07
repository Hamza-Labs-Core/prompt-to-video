/**
 * Provider configuration types for the abstraction layer
 * Supporting BYOK (Bring Your Own Key) for all AI services
 */

/**
 * Base provider configuration
 */
export interface BaseProviderConfig {
  /** Provider identifier */
  provider: string;
  /** API key for the provider */
  apiKey: string;
  /** Custom API endpoint (optional) */
  baseUrl?: string;
}

/**
 * LLM Provider configuration
 * Supports: OpenRouter, OpenAI, Anthropic, Cloudflare Workers AI, Google Gemini
 */
export interface LLMProviderConfig extends BaseProviderConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'workers-ai' | 'google';
  /** Model identifier (e.g., 'anthropic/claude-3.5-sonnet', 'gpt-4o') */
  model: string;
  /** Temperature for response generation (0-1) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
}

/**
 * OpenRouter-specific configuration
 */
export interface OpenRouterConfig extends LLMProviderConfig {
  provider: 'openrouter';
  /** OpenRouter-specific transforms */
  transforms?: string[];
  /** Routing strategy for model fallbacks */
  route?: 'fallback' | 'priority';
}

/**
 * Image Provider configuration
 * Supports: fal.ai Flux, fal.ai SDXL, Replicate, OpenAI DALL-E, Stability AI
 */
export interface ImageProviderConfig extends BaseProviderConfig {
  provider: 'fal-flux' | 'fal-sdxl' | 'replicate' | 'openai-dalle' | 'stability';
  /** Model identifier (provider-specific) */
  model?: string;
  /** Image quality level */
  quality?: 'standard' | 'hd';
  /** Style preset (provider-specific) */
  style?: string;
}

/**
 * Video Provider configuration
 * Supports: fal.ai Kling, Runway Gen-3, Pika, Luma Dream Machine, Minimax
 */
export interface VideoProviderConfig extends BaseProviderConfig {
  provider: 'fal-kling' | 'runway' | 'pika' | 'luma' | 'minimax';
  /** Model identifier (provider-specific) */
  model?: string;
  /** Video quality level */
  quality?: 'standard' | 'pro';
}

/**
 * Compilation Provider configuration
 * Supports: Creatomate, Shotstack, or None (return individual clips)
 */
export interface CompileProviderConfig extends BaseProviderConfig {
  provider: 'creatomate' | 'shotstack' | 'none';
  /** Template ID for compilation (if applicable) */
  templateId?: string;
}

/**
 * Full project configuration combining all provider configs
 * This is the BYOK configuration that users provide
 */
export interface ProjectConfig {
  /** LLM provider for AI direction */
  llm: LLMProviderConfig;
  /** Image generation provider */
  image: ImageProviderConfig;
  /** Video generation provider */
  video: VideoProviderConfig;
  /** Video compilation provider */
  compile: CompileProviderConfig;
}
