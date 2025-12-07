import { ImageProviderConfig } from '../../types/providers';

export interface ImageRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
}

export interface ImageResponse {
  url: string;
  width: number;
  height: number;
  seed?: number;
  cost?: number;
}

export abstract class BaseImageProvider {
  protected config: ImageProviderConfig;

  constructor(config: ImageProviderConfig) {
    this.config = config;
  }

  /**
   * Generate an image from a prompt
   * @param request - Image generation request parameters
   * @returns Image response with URL and metadata
   */
  abstract generate(request: ImageRequest): Promise<ImageResponse>;

  /**
   * Estimate the cost for generating an image
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @returns Estimated cost in USD
   */
  abstract estimateCost(width: number, height: number): number;

  /**
   * Helper method to get dimensions from aspect ratio
   * @param aspectRatio - Aspect ratio string (e.g., '16:9', '9:16', '1:1')
   * @param maxDimension - Maximum dimension (default: 1024)
   * @returns Object with width and height
   */
  protected getDimensions(
    aspectRatio: '16:9' | '9:16' | '1:1',
    maxDimension = 1024
  ): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: maxDimension, height: Math.round((maxDimension * 9) / 16) };
      case '9:16':
        return { width: Math.round((maxDimension * 9) / 16), height: maxDimension };
      case '1:1':
        return { width: maxDimension, height: maxDimension };
      default:
        throw new Error(`Unsupported aspect ratio: ${aspectRatio}`);
    }
  }
}
