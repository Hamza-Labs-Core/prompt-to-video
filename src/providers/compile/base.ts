import { CompileProviderConfig } from '../../types/providers';

export interface CompileRequest {
  videoUrls: string[];
  audioUrl?: string;
  transitions?: TransitionConfig[];
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface TransitionConfig {
  type: 'cut' | 'crossfade' | 'fade_black' | 'fade_white' | 'wipe_left' | 'wipe_right';
  duration: number; // seconds
}

export interface CompileResponse {
  url?: string;
  renderId?: string; // For async polling
  status: 'completed' | 'rendering' | 'queued' | 'failed';
  cost?: number;
}

export abstract class BaseCompileProvider {
  protected config: CompileProviderConfig;

  constructor(config: CompileProviderConfig) {
    this.config = config;
  }

  /**
   * Compile multiple video clips into a single video
   * @param request - Compilation request with video URLs and settings
   * @returns Compilation response with URL or render ID for polling
   */
  abstract compile(request: CompileRequest): Promise<CompileResponse>;

  /**
   * Check the status of an async compilation request
   * @param renderId - Render ID from initial compilation call
   * @returns Current status and URL if completed
   */
  abstract checkStatus(renderId: string): Promise<CompileResponse>;

  /**
   * Estimate the cost for compiling a video
   * @param totalDuration - Total duration of all clips in seconds
   * @param clipCount - Number of video clips
   * @returns Estimated cost in USD
   */
  abstract estimateCost(totalDuration: number, clipCount: number): number;

  /**
   * Get supported transition types for this provider
   * @returns Array of supported transition types
   */
  getSupportedTransitions(): TransitionConfig['type'][] {
    return ['cut', 'crossfade', 'fade_black', 'fade_white', 'wipe_left', 'wipe_right'];
  }
}
