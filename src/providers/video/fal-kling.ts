// Fal.ai Kling Video Provider

import { BaseVideoProvider, VideoRequest, VideoResponse } from './base';
import { VideoProviderConfig } from '../../types/providers';

const FAL_API_BASE = 'https://queue.fal.run';
const FAL_KLING_MODEL_PRO = 'fal-ai/kling-video/v1.5/pro/image-to-video';
const FAL_KLING_MODEL_STANDARD = 'fal-ai/kling-video/v1.5/standard/image-to-video';

interface KlingVideoRequest {
  prompt: string;
  image_url: string;
  tail_image_url?: string; // End frame
  duration: '5' | '10';
  aspect_ratio: '16:9' | '9:16' | '1:1';
}

interface FalQueueResponse {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_url?: string;
}

interface KlingVideoResult {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

export class FalKlingProvider extends BaseVideoProvider {
  constructor(config: VideoProviderConfig) {
    super(config);
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Key ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private getModel(): string {
    // Use quality setting to determine model, default to pro
    const quality = this.config.quality || 'pro';
    return quality === 'pro' ? FAL_KLING_MODEL_PRO : FAL_KLING_MODEL_STANDARD;
  }

  /**
   * Submit a video generation request to Kling (async queue)
   * Returns immediately with requestId for polling
   */
  async generate(request: VideoRequest): Promise<VideoResponse> {
    const model = this.getModel();

    const klingRequest: KlingVideoRequest = {
      prompt: request.prompt,
      image_url: request.startImageUrl,
      tail_image_url: request.endImageUrl,
      duration: request.duration <= 5 ? '5' : '10',
      aspect_ratio: request.aspectRatio,
    };

    const response = await fetch(`${FAL_API_BASE}/${model}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(klingRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kling API error: ${response.status} - ${error}`);
    }

    const data: FalQueueResponse = await response.json();

    return {
      requestId: data.request_id,
      status: this.mapStatus(data.status),
      cost: this.estimateCost(request.duration),
    };
  }

  /**
   * Check the status of a queued video generation request
   */
  async checkStatus(requestId: string): Promise<VideoResponse> {
    const model = this.getModel();

    // First check the status endpoint
    const statusResponse = await fetch(
      `${FAL_API_BASE}/${model}/requests/${requestId}/status`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      throw new Error(`Kling status check error: ${statusResponse.status} - ${error}`);
    }

    const statusData: FalQueueResponse = await statusResponse.json();

    // If completed, fetch the result
    if (statusData.status === 'COMPLETED') {
      const resultResponse = await fetch(
        `${FAL_API_BASE}/${model}/requests/${requestId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!resultResponse.ok) {
        const error = await resultResponse.text();
        throw new Error(`Kling result fetch error: ${resultResponse.status} - ${error}`);
      }

      const resultData: KlingVideoResult = await resultResponse.json();

      return {
        url: resultData.video.url,
        requestId,
        status: 'completed',
      };
    }

    return {
      requestId,
      status: this.mapStatus(statusData.status),
    };
  }

  /**
   * Kling supports end frame (tail image)
   */
  supportsEndFrame(): boolean {
    return true;
  }

  /**
   * Estimate cost based on duration and quality
   * Pro: $0.45 for 5s, +$0.09/sec additional
   * Standard: $0.25 for 5s, +$0.05/sec additional
   */
  estimateCost(durationSeconds: number): number {
    const quality = this.config.quality || 'pro';

    if (quality === 'pro') {
      // Pro pricing: $0.45 for 5s, +$0.09/sec for additional
      if (durationSeconds <= 5) {
        return 0.45;
      }
      const additionalSeconds = durationSeconds - 5;
      return 0.45 + (additionalSeconds * 0.09);
    } else {
      // Standard pricing: $0.25 for 5s, +$0.05/sec for additional
      if (durationSeconds <= 5) {
        return 0.25;
      }
      const additionalSeconds = durationSeconds - 5;
      return 0.25 + (additionalSeconds * 0.05);
    }
  }

  /**
   * Map fal.ai status to our standard status
   */
  private mapStatus(status: FalQueueResponse['status']): VideoResponse['status'] {
    switch (status) {
      case 'COMPLETED':
        return 'completed';
      case 'IN_PROGRESS':
        return 'processing';
      case 'IN_QUEUE':
        return 'queued';
      case 'FAILED':
        return 'failed';
      default:
        return 'queued';
    }
  }
}
