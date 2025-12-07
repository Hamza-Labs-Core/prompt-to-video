import type {
  FluxImageRequest,
  FluxImageResponse,
  KlingVideoRequest,
  FalQueueResponse,
  KlingVideoResponse,
} from '../types';

const FAL_API_BASE = 'https://queue.fal.run';
const FAL_FLUX_MODEL = 'fal-ai/flux/dev';
const FAL_KLING_MODEL = 'fal-ai/kling-video/v1.5/pro/image-to-video';

export class FalService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Key ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate an image using Flux model
   */
  async generateImage(prompt: string, aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'): Promise<FluxImageResponse> {
    const dimensions = this.getImageDimensions(aspectRatio);

    const request: FluxImageRequest = {
      prompt,
      image_size: dimensions,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false,
    };

    const response = await fetch(`${FAL_API_BASE}/${FAL_FLUX_MODEL}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Submit a video generation request to Kling (async queue)
   */
  async submitVideoGeneration(
    prompt: string,
    startImageUrl: string,
    endImageUrl: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    duration: '5' | '10' = '5'
  ): Promise<FalQueueResponse> {
    const request: KlingVideoRequest = {
      prompt,
      image_url: startImageUrl,
      tail_image_url: endImageUrl,
      duration,
      aspect_ratio: aspectRatio,
    };

    const response = await fetch(`${FAL_API_BASE}/${FAL_KLING_MODEL}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kling API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check the status of a queued video generation request
   */
  async checkVideoStatus(requestId: string): Promise<FalQueueResponse> {
    const response = await fetch(
      `${FAL_API_BASE}/${FAL_KLING_MODEL}/requests/${requestId}/status`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kling status check error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get the result of a completed video generation request
   */
  async getVideoResult(requestId: string): Promise<KlingVideoResponse> {
    const response = await fetch(
      `${FAL_API_BASE}/${FAL_KLING_MODEL}/requests/${requestId}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kling result fetch error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get image dimensions based on aspect ratio
   */
  private getImageDimensions(aspectRatio: '16:9' | '9:16' | '1:1'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1024, height: 1024 };
      default:
        return { width: 1920, height: 1080 };
    }
  }
}
