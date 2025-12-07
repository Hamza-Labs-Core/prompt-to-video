// LLM Provider Factory

import { BaseLLMProvider } from './base';
import { LLMProviderConfig } from '../../types/providers';
import { OpenRouterProvider } from './openrouter';

/**
 * Create an LLM provider instance based on the configuration
 */
export function createLLMProvider(config: LLMProviderConfig): BaseLLMProvider {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterProvider(config);

    case 'openai':
    case 'anthropic':
    case 'workers-ai':
    case 'google':
      throw new Error(`Provider "${config.provider}" is not yet implemented. Currently only "openrouter" is supported.`);

    default:
      throw new Error(`Unknown LLM provider: ${(config as LLMProviderConfig).provider}`);
  }
}

// Re-export types and classes for convenience
export { BaseLLMProvider } from './base';
export type { LLMMessage, LLMResponse } from './base';
export type { LLMProviderConfig } from '../../types/providers';
export { OpenRouterProvider, OPENROUTER_PRICING } from './openrouter';
