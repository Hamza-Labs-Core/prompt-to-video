// Video Provider Factory

import { BaseVideoProvider } from './base';
import { VideoProviderConfig } from '../../types/providers';
import { FalKlingProvider } from './fal-kling';

/**
 * Create a video provider instance based on configuration
 * @param config - Video provider configuration
 * @returns Instance of the appropriate video provider
 * @throws Error if provider is not supported
 */
export function createVideoProvider(config: VideoProviderConfig): BaseVideoProvider {
  switch (config.provider) {
    case 'fal-kling':
      return new FalKlingProvider(config);

    case 'runway':
      // TODO: Implement RunwayProvider
      throw new Error('runway provider not yet implemented');

    case 'pika':
      // TODO: Implement PikaProvider
      throw new Error('pika provider not yet implemented');

    case 'luma':
      // TODO: Implement LumaProvider
      throw new Error('luma provider not yet implemented');

    case 'minimax':
      // TODO: Implement MinimaxProvider
      throw new Error('minimax provider not yet implemented');

    default:
      throw new Error(`Unsupported video provider: ${config.provider}`);
  }
}

// Re-export types and base class for convenience
export { BaseVideoProvider } from './base';
export type { VideoRequest, VideoResponse } from './base';
export { FalKlingProvider } from './fal-kling';
