// Fal.ai Flux Image Provider

import { BaseImageProvider, ImageRequest, ImageResponse } from './base';
import { ImageProviderConfig } from '../../types/providers';

const FAL_API_BASE = 'https://queue.fal.run';
const FAL_FLUX_MODEL = 'fal-ai/flux/dev';

interface FluxImageRequest {
  prompt: string;
  image_size: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  seed?: number;
}

interface FluxImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export class FalFluxProvider extends BaseImageProvider {
  constructor(config: ImageProviderConfig) {
    super(config);
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Key ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate an image using Flux model
   */
  async generate(request: ImageRequest): Promise<ImageResponse> {
    const fluxRequest: FluxImageRequest = {
      prompt: request.prompt,
      image_size: {
        width: request.width,
        height: request.height,
      },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false,
      seed: request.seed,
    };

    const response = await fetch(`${FAL_API_BASE}/${FAL_FLUX_MODEL}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(fluxRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${response.status} - ${error}`);
    }

    const data: FluxImageResponse = await response.json();

    // Calculate cost based on megapixels
    const megapixels = (request.width * request.height) / 1_000_000;
    const cost = this.estimateCost(request.width, request.height);

    return {
      url: data.images[0].url,
      width: data.images[0].width,
      height: data.images[0].height,
      seed: data.seed,
      cost,
    };
  }

  /**
   * Estimate cost: approximately $0.025 per megapixel
   */
  estimateCost(width: number, height: number): number {
    const megapixels = (width * height) / 1_000_000;
    return megapixels * 0.025;
  }
}
