# Provider Refactoring - Usage Guide

## Overview

The fal.ai service has been successfully refactored into proper provider classes that extend the base provider architecture. This enables a clean, extensible pattern for adding new image and video providers in the future.

## Files Created

### Base Classes

1. `/src/providers/image/base.ts`
   - `BaseImageProvider` abstract class
   - `ImageRequest` and `ImageResponse` interfaces
   - Helper method `getDimensions()` for aspect ratio conversion

2. `/src/providers/video/base.ts`
   - `BaseVideoProvider` abstract class
   - `VideoRequest` and `VideoResponse` interfaces
   - Supports async polling pattern for video generation

### Provider Implementations

3. `/src/providers/image/fal-flux.ts`
   - `FalFluxProvider` - implements Flux image generation
   - Uses `fal-ai/flux/dev` model
   - Cost estimation: ~$0.025/megapixel
   - Supports custom seeds, dimensions, and prompts

4. `/src/providers/video/fal-kling.ts`
   - `FalKlingProvider` - implements Kling video generation
   - Supports both Pro and Standard quality models
   - Supports end frame (tail image) generation
   - Cost estimation:
     - Pro: $0.45 for 5s, +$0.09/sec additional
     - Standard: $0.25 for 5s, +$0.05/sec additional
   - Async queue pattern with polling

### Factory Functions

5. `/src/providers/image/index.ts`
   - `createImageProvider()` factory function
   - Handles 'fal-flux' provider type
   - Re-exports types and classes

6. `/src/providers/video/index.ts`
   - `createVideoProvider()` factory function
   - Handles 'fal-kling' provider type
   - Re-exports types and classes

## Usage Examples

### Image Generation

```typescript
import { createImageProvider } from './providers/image';
import { ImageProviderConfig } from './types/providers';

// Create provider config
const imageConfig: ImageProviderConfig = {
  provider: 'fal-flux',
  apiKey: env.FAL_API_KEY,
  quality: 'hd',
};

// Create provider instance
const imageProvider = createImageProvider(imageConfig);

// Generate an image
const imageResponse = await imageProvider.generate({
  prompt: 'A cinematic shot of a blacksmith forge with glowing embers',
  width: 1920,
  height: 1080,
  seed: 42, // optional
});

console.log('Image URL:', imageResponse.url);
console.log('Cost:', imageResponse.cost);

// Estimate cost before generating
const estimatedCost = imageProvider.estimateCost(1920, 1080);
console.log('Estimated cost:', estimatedCost);
```

### Video Generation

```typescript
import { createVideoProvider } from './providers/video';
import { VideoProviderConfig } from './types/providers';

// Create provider config
const videoConfig: VideoProviderConfig = {
  provider: 'fal-kling',
  apiKey: env.FAL_API_KEY,
  quality: 'pro', // or 'standard'
};

// Create provider instance
const videoProvider = createVideoProvider(videoConfig);

// Check if provider supports end frames
console.log('Supports end frame:', videoProvider.supportsEndFrame()); // true

// Submit video generation request
const videoResponse = await videoProvider.generate({
  prompt: 'Fire slowly spreading across the forge',
  startImageUrl: 'https://example.com/start-frame.jpg',
  endImageUrl: 'https://example.com/end-frame.jpg', // optional but supported
  duration: 5,
  aspectRatio: '16:9',
});

console.log('Request ID:', videoResponse.requestId);
console.log('Status:', videoResponse.status);
console.log('Estimated cost:', videoResponse.cost);

// Poll for completion
let status = videoResponse.status;
let pollResponse;

while (status === 'queued' || status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds

  pollResponse = await videoProvider.checkStatus(videoResponse.requestId!);
  status = pollResponse.status;

  console.log('Current status:', status);
}

if (status === 'completed') {
  console.log('Video URL:', pollResponse!.url);
} else {
  console.error('Video generation failed');
}

// Estimate cost before generating
const estimatedCost = videoProvider.estimateCost(5);
console.log('Estimated cost for 5s:', estimatedCost);
```

### Using in VideoJob Durable Object

```typescript
import { createImageProvider, createVideoProvider } from './providers';

export class VideoJob {
  private imageProvider: BaseImageProvider;
  private videoProvider: BaseVideoProvider;

  async initialize(env: Env) {
    // Create providers
    this.imageProvider = createImageProvider({
      provider: 'fal-flux',
      apiKey: env.FAL_API_KEY,
    });

    this.videoProvider = createVideoProvider({
      provider: 'fal-kling',
      apiKey: env.FAL_API_KEY,
      quality: 'pro',
    });
  }

  async generateScene(scene: Scene) {
    // Generate start image
    const startImage = await this.imageProvider.generate({
      prompt: scene.startPrompt,
      width: 1920,
      height: 1080,
    });

    // Generate end image
    const endImage = await this.imageProvider.generate({
      prompt: scene.endPrompt,
      width: 1920,
      height: 1080,
    });

    // Generate video
    const video = await this.videoProvider.generate({
      prompt: scene.motionPrompt,
      startImageUrl: startImage.url,
      endImageUrl: endImage.url,
      duration: scene.duration,
      aspectRatio: '16:9',
    });

    return video;
  }
}
```

## Key Features

### BaseImageProvider

- `generate(request)` - Generate an image from a prompt
- `estimateCost(width, height)` - Estimate cost before generation
- `getDimensions(aspectRatio)` - Helper to convert aspect ratio to dimensions

### BaseVideoProvider

- `generate(request)` - Submit video generation (async, returns requestId)
- `checkStatus(requestId)` - Poll for video completion status
- `supportsEndFrame()` - Check if provider supports end frame
- `estimateCost(duration)` - Estimate cost before generation

### FalFluxProvider Specifics

- Synchronous generation (returns URL immediately)
- Configurable inference steps and guidance scale
- Safety checker can be disabled
- Supports custom seeds for reproducibility

### FalKlingProvider Specifics

- Asynchronous generation (queue-based)
- Supports both Pro and Standard quality models
- End frame (tail image) support
- Status polling with automatic result fetching
- Tiered pricing based on duration

## Migration from Old FalService

Old code:
```typescript
const falService = new FalService(env.FAL_API_KEY);
const image = await falService.generateImage(prompt, '16:9');
const videoRequest = await falService.submitVideoGeneration(prompt, startUrl, endUrl, '16:9', '5');
```

New code:
```typescript
const imageProvider = createImageProvider({ provider: 'fal-flux', apiKey: env.FAL_API_KEY });
const videoProvider = createVideoProvider({ provider: 'fal-kling', apiKey: env.FAL_API_KEY });

const image = await imageProvider.generate({
  prompt,
  width: 1920,
  height: 1080
});

const videoRequest = await videoProvider.generate({
  prompt,
  startImageUrl: startUrl,
  endImageUrl: endUrl,
  aspectRatio: '16:9',
  duration: 5,
});
```

## Future Extensions

The provider pattern makes it easy to add new providers:

1. Create new provider class extending base class
2. Implement required abstract methods
3. Add to factory function switch statement
4. Update provider config type union

Example providers to add:
- `FalSDXLProvider` for SDXL image generation
- `RunwayProvider` for Runway Gen-3 video
- `PikaProvider` for Pika video
- `LumaProvider` for Luma Dream Machine
