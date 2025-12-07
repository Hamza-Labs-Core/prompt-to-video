import type {
  CreatomateRenderRequest,
  CreatomateRenderResponse,
  CreatomateElement,
  CreatomateSource,
} from '../types';

const CREATOMATE_API_BASE = 'https://api.creatomate.com/v1';

export class CreatomateService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Compile multiple video clips into a single video
   */
  async compileVideo(
    videoUrls: string[],
    options: {
      audioUrl?: string;
      aspectRatio?: '16:9' | '9:16' | '1:1';
      transitionDuration?: number;
      transitionType?: string;
      finalHoldDuration?: number;
    } = {}
  ): Promise<CreatomateRenderResponse> {
    const {
      audioUrl,
      aspectRatio = '16:9',
      transitionDuration = 0.5,
      transitionType = 'crossfade',
      finalHoldDuration = 3,
    } = options;

    const dimensions = this.getDimensions(aspectRatio);

    // Build video elements with transitions
    const elements: CreatomateElement[] = [];
    let currentTime = 0;

    for (let i = 0; i < videoUrls.length; i++) {
      const isLast = i === videoUrls.length - 1;
      const videoDuration = 5; // Each video is 5 seconds

      const videoElement: CreatomateElement = {
        type: 'video',
        source: videoUrls[i],
        track: 1,
        time: currentTime,
        duration: isLast ? videoDuration + finalHoldDuration : videoDuration,
      };

      // Add transition to all except the first video
      if (i > 0) {
        videoElement.transition = {
          type: transitionType,
          duration: transitionDuration,
        };
      }

      elements.push(videoElement);

      // Move time forward (overlap for transition)
      currentTime += videoDuration - (i < videoUrls.length - 1 ? transitionDuration : 0);
    }

    // Add audio track if provided
    if (audioUrl) {
      const totalDuration = currentTime + finalHoldDuration;
      elements.push({
        type: 'audio',
        source: audioUrl,
        track: 2,
        time: 0,
        duration: totalDuration,
        volume: 0.8,
        audio_fade_in: 0.5,
        audio_fade_out: 1.5,
      });
    }

    const source: CreatomateSource = {
      output_format: 'mp4',
      width: dimensions.width,
      height: dimensions.height,
      frame_rate: 30,
      elements,
    };

    const request: CreatomateRenderRequest = {
      output_format: 'mp4',
      source,
    };

    const response = await fetch(`${CREATOMATE_API_BASE}/renders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Creatomate API error: ${response.status} - ${error}`);
    }

    const renders: CreatomateRenderResponse[] = await response.json();
    return renders[0]; // Returns array, we want first render
  }

  /**
   * Check the status of a render
   */
  async checkRenderStatus(renderId: string): Promise<CreatomateRenderResponse> {
    const response = await fetch(`${CREATOMATE_API_BASE}/renders/${renderId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Creatomate status check error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get dimensions based on aspect ratio
   */
  private getDimensions(aspectRatio: '16:9' | '9:16' | '1:1'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      default:
        return { width: 1920, height: 1080 };
    }
  }
}
