import { VideoProviderConfig } from '../../types/providers';

export interface VideoRequest {
  prompt: string;
  startImageUrl: string;
  endImageUrl?: string; // For start/end frame models
  duration: number; // seconds
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface VideoResponse {
  url?: string;
  requestId?: string; // For async polling
  status: 'completed' | 'processing' | 'queued' | 'failed';
  cost?: number;
}

export abstract class BaseVideoProvider {
  protected config: VideoProviderConfig;

  constructor(config: VideoProviderConfig) {
    this.config = config;
  }

  /**
   * Generate a video from a prompt and images
   * @param request - Video generation request parameters
   * @returns Video response with URL or request ID for polling
   */
  abstract generate(request: VideoRequest): Promise<VideoResponse>;

  /**
   * Check the status of an async video generation request
   * @param requestId - Request ID from initial generation call
   * @returns Current status and URL if completed
   */
  abstract checkStatus(requestId: string): Promise<VideoResponse>;

  /**
   * Check if this provider supports end frame (tail image)
   * @returns True if provider supports end frame
   */
  abstract supportsEndFrame(): boolean;

  /**
   * Estimate the cost for generating a video
   * @param durationSeconds - Duration of video in seconds
   * @returns Estimated cost in USD
   */
  abstract estimateCost(durationSeconds: number): number;
}
