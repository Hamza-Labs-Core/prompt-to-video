// Image Provider Factory

import { BaseImageProvider } from './base';
import { ImageProviderConfig } from '../../types/providers';
import { FalFluxProvider } from './fal-flux';

/**
 * Create an image provider instance based on configuration
 * @param config - Image provider configuration
 * @returns Instance of the appropriate image provider
 * @throws Error if provider is not supported
 */
export function createImageProvider(config: ImageProviderConfig): BaseImageProvider {
  switch (config.provider) {
    case 'fal-flux':
      return new FalFluxProvider(config);

    case 'fal-sdxl':
      // TODO: Implement FalSDXLProvider
      throw new Error('fal-sdxl provider not yet implemented');

    case 'replicate':
      // TODO: Implement ReplicateProvider
      throw new Error('replicate provider not yet implemented');

    case 'openai-dalle':
      // TODO: Implement OpenAIDALLEProvider
      throw new Error('openai-dalle provider not yet implemented');

    case 'stability':
      // TODO: Implement StabilityProvider
      throw new Error('stability provider not yet implemented');

    default:
      throw new Error(`Unsupported image provider: ${config.provider}`);
  }
}

// Re-export types and base class for convenience
export { BaseImageProvider } from './base';
export type { ImageRequest, ImageResponse } from './base';
export { FalFluxProvider } from './fal-flux';
