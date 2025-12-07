# Prompt-to-Video: Dynamic AI Director Architecture

## Overview

Transform the static 8-scene pipeline into a dynamic, LLM-directed video generation system with BYOK (Bring Your Own Key) support for all AI providers.

---

## Phase 1: Provider Abstraction Layer

### 1.1 Provider Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROVIDER CATEGORIES                          │
├─────────────────────────────────────────────────────────────────────┤
│  LLM Providers          │  Image Providers    │  Video Providers    │
│  ─────────────────────  │  ────────────────── │  ────────────────── │
│  • OpenRouter (default) │  • fal.ai Flux      │  • fal.ai Kling     │
│  • OpenAI               │  • fal.ai SDXL      │  • Runway Gen-3     │
│  • Anthropic            │  • Replicate        │  • Pika             │
│  • Cloudflare Workers AI│  • OpenAI DALL-E    │  • Luma Dream       │
│  • Google Gemini        │  • Midjourney API   │  • Minimax          │
│                         │  • Stability AI     │  • Kling Direct     │
├─────────────────────────┴─────────────────────┴─────────────────────┤
│  Compilation Providers                                              │
│  ───────────────────────────────────────────────────────────────── │
│  • Creatomate                                                       │
│  • Shotstack                                                        │
│  • None (return individual clips)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 New File Structure

```
src/
├── index.ts
├── types/
│   ├── index.ts              # Re-exports all types
│   ├── project.ts            # Project, Scene, Shot types
│   ├── job.ts                # Job state types
│   ├── providers.ts          # Provider config types
│   └── api.ts                # API request/response types
│
├── providers/
│   ├── index.ts              # Provider factory
│   ├── base.ts               # Abstract base classes
│   │
│   ├── llm/
│   │   ├── index.ts          # LLM provider factory
│   │   ├── base.ts           # BaseLLMProvider abstract class
│   │   ├── openrouter.ts     # OpenRouter implementation
│   │   ├── openai.ts         # OpenAI implementation
│   │   ├── anthropic.ts      # Anthropic implementation
│   │   └── workers-ai.ts     # Cloudflare Workers AI
│   │
│   ├── image/
│   │   ├── index.ts          # Image provider factory
│   │   ├── base.ts           # BaseImageProvider abstract class
│   │   ├── fal-flux.ts       # fal.ai Flux
│   │   ├── fal-sdxl.ts       # fal.ai SDXL
│   │   ├── replicate.ts      # Replicate
│   │   └── openai-dalle.ts   # DALL-E
│   │
│   ├── video/
│   │   ├── index.ts          # Video provider factory
│   │   ├── base.ts           # BaseVideoProvider abstract class
│   │   ├── fal-kling.ts      # fal.ai Kling
│   │   ├── runway.ts         # Runway Gen-3
│   │   ├── pika.ts           # Pika
│   │   └── luma.ts           # Luma Dream Machine
│   │
│   └── compile/
│       ├── index.ts          # Compile provider factory
│       ├── base.ts           # BaseCompileProvider abstract class
│       ├── creatomate.ts     # Creatomate
│       ├── shotstack.ts      # Shotstack
│       └── none.ts           # No compilation (return clips)
│
├── director/
│   ├── index.ts              # AI Director main class
│   ├── prompts.ts            # System prompts for LLM
│   └── parser.ts             # Parse/validate LLM output
│
├── durable-objects/
│   └── VideoJob.ts           # Updated job orchestration
│
└── lib/
    ├── config.ts             # Configuration helpers
    ├── cost.ts               # Cost estimation
    └── utils.ts              # Utility functions
```

---

## Phase 2: Provider Configuration Types

### 2.1 Provider Config Schema

```typescript
// src/types/providers.ts

// Base provider config
interface BaseProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;  // For custom endpoints
}

// LLM Provider Config
interface LLMProviderConfig extends BaseProviderConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'workers-ai' | 'google';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Image Provider Config
interface ImageProviderConfig extends BaseProviderConfig {
  provider: 'fal-flux' | 'fal-sdxl' | 'replicate' | 'openai-dalle' | 'stability';
  model?: string;
  quality?: 'standard' | 'hd';
  style?: string;
}

// Video Provider Config
interface VideoProviderConfig extends BaseProviderConfig {
  provider: 'fal-kling' | 'runway' | 'pika' | 'luma' | 'minimax';
  model?: string;
  quality?: 'standard' | 'pro';
}

// Compile Provider Config
interface CompileProviderConfig extends BaseProviderConfig {
  provider: 'creatomate' | 'shotstack' | 'none';
  templateId?: string;
}

// Full Project Config (BYOK)
interface ProjectConfig {
  llm: LLMProviderConfig;
  image: ImageProviderConfig;
  video: VideoProviderConfig;
  compile: CompileProviderConfig;
}
```

### 2.2 OpenRouter Config (Default LLM)

```typescript
interface OpenRouterConfig extends LLMProviderConfig {
  provider: 'openrouter';
  model: string;  // e.g., 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'
  // OpenRouter-specific
  transforms?: string[];
  route?: 'fallback' | 'priority';
}

// Example usage
const config: OpenRouterConfig = {
  provider: 'openrouter',
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  maxTokens: 4096,
};
```

---

## Phase 3: Abstract Provider Classes

### 3.1 Base LLM Provider

```typescript
// src/providers/llm/base.ts

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;
  abstract estimateCost(inputTokens: number, outputTokens: number): number;

  // Structured output helper
  async json<T>(messages: LLMMessage[], schema?: object): Promise<T> {
    const response = await this.chat(messages);
    return JSON.parse(response.content);
  }
}
```

### 3.2 Base Image Provider

```typescript
// src/providers/image/base.ts

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

  abstract generate(request: ImageRequest): Promise<ImageResponse>;
  abstract estimateCost(width: number, height: number): number;
}
```

### 3.3 Base Video Provider

```typescript
// src/providers/video/base.ts

export interface VideoRequest {
  prompt: string;
  startImageUrl: string;
  endImageUrl?: string;  // For start/end frame models
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface VideoResponse {
  url?: string;
  requestId?: string;  // For async polling
  status: 'completed' | 'processing' | 'queued' | 'failed';
  cost?: number;
}

export abstract class BaseVideoProvider {
  protected config: VideoProviderConfig;

  constructor(config: VideoProviderConfig) {
    this.config = config;
  }

  abstract generate(request: VideoRequest): Promise<VideoResponse>;
  abstract checkStatus(requestId: string): Promise<VideoResponse>;
  abstract supportsEndFrame(): boolean;
  abstract estimateCost(durationSeconds: number): number;
}
```

---

## Phase 4: Dynamic Scene/Shot Model

### 4.1 New Project Types

```typescript
// src/types/project.ts

interface Project {
  id: string;
  name: string;

  // User input
  concept: string;
  style?: VideoStyle;
  targetDuration: number;  // seconds
  aspectRatio: '16:9' | '9:16' | '1:1';

  // Provider config (BYOK)
  config: ProjectConfig;

  // LLM-generated structure (after direction)
  direction?: VideoDirection;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

type VideoStyle =
  | 'cinematic'
  | 'minimal'
  | 'energetic'
  | 'documentary'
  | 'dramatic'
  | 'playful'
  | 'corporate'
  | 'artistic';

interface VideoDirection {
  title: string;
  narrative: string;
  totalDuration: number;
  scenes: DirectedScene[];

  // Estimated costs
  estimatedCost: CostEstimate;
}

interface DirectedScene {
  id: number;
  name: string;
  description: string;
  mood: string;
  shots: DirectedShot[];
}

interface DirectedShot {
  id: number;
  duration: number;  // 5-10 seconds

  // Image prompts
  startPrompt: string;
  endPrompt: string;

  // Video generation
  motionPrompt: string;
  cameraMove: CameraMove;

  // Style
  lighting: string;
  colorPalette?: string;

  // Continuity
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
}

type CameraMove =
  | 'static'
  | 'push_in'
  | 'pull_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'crane_up'
  | 'crane_down'
  | 'dolly_left'
  | 'dolly_right';

type TransitionType =
  | 'cut'
  | 'crossfade'
  | 'fade_black'
  | 'fade_white'
  | 'wipe_left'
  | 'wipe_right';

interface CostEstimate {
  llm: number;
  images: number;
  videos: number;
  compile: number;
  total: number;
  breakdown: {
    imageCount: number;
    videoCount: number;
    totalDuration: number;
  };
}
```

---

## Phase 5: AI Director Implementation

### 5.1 Director Class

```typescript
// src/director/index.ts

export class AIDirector {
  private llm: BaseLLMProvider;

  constructor(llmConfig: LLMProviderConfig) {
    this.llm = LLMProviderFactory.create(llmConfig);
  }

  async direct(input: DirectorInput): Promise<VideoDirection> {
    const systemPrompt = this.buildSystemPrompt(input);
    const userPrompt = this.buildUserPrompt(input);

    const response = await this.llm.json<VideoDirection>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Validate and normalize
    return this.validateDirection(response, input);
  }

  async refine(
    direction: VideoDirection,
    feedback: string
  ): Promise<VideoDirection> {
    // Allow user to refine the direction
  }

  estimateCost(
    direction: VideoDirection,
    config: ProjectConfig
  ): CostEstimate {
    // Calculate costs based on providers
  }
}

interface DirectorInput {
  concept: string;
  style?: VideoStyle;
  targetDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  constraints?: {
    maxScenes?: number;
    maxShotsPerScene?: number;
    mustInclude?: string[];
    avoid?: string[];
  };
}
```

### 5.2 Director System Prompt

```typescript
// src/director/prompts.ts

export const DIRECTOR_SYSTEM_PROMPT = `
You are an expert cinematic AI director. Your job is to take a video concept and create a detailed shot-by-shot plan.

## Your Responsibilities

1. **Narrative Structure**: Create a compelling story arc with beginning, middle, and climax
2. **Visual Planning**: Design each shot with specific start and end frames
3. **Continuity**: Ensure visual flow between shots (end of shot N connects to start of shot N+1)
4. **Pacing**: Vary shot durations (5-10s) to create rhythm
5. **Camera Direction**: Choose appropriate camera movements for each shot

## Technical Constraints

- Each shot MUST be 5-10 seconds
- Start and end prompts must be detailed image generation prompts
- Motion prompts describe the movement/action between frames
- Total duration should match target (±5 seconds)
- Prompts should specify: subject, action, lighting, mood, camera angle, style

## Output Format

Return valid JSON matching this schema:
{
  "title": "Video title",
  "narrative": "Brief story description",
  "totalDuration": <number>,
  "scenes": [
    {
      "id": 1,
      "name": "Scene name",
      "description": "What happens in this scene",
      "mood": "emotional tone",
      "shots": [
        {
          "id": 1,
          "duration": 5-10,
          "startPrompt": "Detailed image prompt for first frame...",
          "endPrompt": "Detailed image prompt for last frame...",
          "motionPrompt": "Description of movement between frames...",
          "cameraMove": "push_in|pull_out|pan_left|...",
          "lighting": "lighting description",
          "transitionOut": "crossfade|cut|..."
        }
      ]
    }
  ]
}

## Image Prompt Best Practices

- Be specific about composition, lighting, colors
- Include style keywords: "cinematic, photorealistic, 4K, dramatic lighting"
- Describe the exact moment in time
- Maintain visual consistency across shots
- End prompts should logically flow into the next shot's start prompt
`;
```

---

## Phase 6: Updated API Endpoints

### 6.1 New Endpoints

```
POST /api/projects
  - Create project with concept + config (BYOK keys)

POST /api/projects/:id/direct
  - Run AI Director to generate shot plan
  - Returns: VideoDirection with cost estimate

POST /api/projects/:id/refine
  - Refine direction with user feedback

POST /api/projects/:id/approve
  - Approve direction and lock it

POST /api/projects/:id/generate
  - Start generation pipeline

GET /api/projects/:id/direction
  - Get current direction

GET /api/projects/:id/cost
  - Get cost estimate for current direction

GET /api/providers
  - List supported providers

GET /api/providers/:type/models
  - List models for a provider type (llm, image, video)
```

### 6.2 Example Flow

```bash
# 1. Create project with BYOK config
curl -X POST /api/projects -d '{
  "name": "Hamza Labs Reveal",
  "concept": "Epic blacksmith forge video revealing the Hamza Labs emblem with fire, molten gold, and dramatic lighting",
  "style": "cinematic",
  "targetDuration": 60,
  "aspectRatio": "16:9",
  "config": {
    "llm": {
      "provider": "openrouter",
      "apiKey": "sk-or-...",
      "model": "anthropic/claude-3.5-sonnet"
    },
    "image": {
      "provider": "fal-flux",
      "apiKey": "...",
      "model": "flux/dev"
    },
    "video": {
      "provider": "fal-kling",
      "apiKey": "...",
      "model": "kling-v2.1-pro"
    },
    "compile": {
      "provider": "none"
    }
  }
}'

# 2. Run AI Director
curl -X POST /api/projects/:id/direct

# Response: VideoDirection with scenes, shots, cost estimate

# 3. (Optional) Refine
curl -X POST /api/projects/:id/refine -d '{
  "feedback": "Make the fire ignition scene longer, add more close-ups of the Arabic engraving"
}'

# 4. Approve and generate
curl -X POST /api/projects/:id/approve
curl -X POST /api/projects/:id/generate

# 5. Poll for status
curl GET /api/jobs/:jobId
```

---

## Phase 7: OpenRouter Implementation

### 7.1 OpenRouter Provider

```typescript
// src/providers/llm/openrouter.ts

import { BaseLLMProvider, LLMMessage, LLMResponse } from './base';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompt-to-video.workers.dev',
        'X-Title': 'Prompt to Video',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      cost: this.calculateCost(data.usage, this.config.model),
    };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // Model-specific pricing from OpenRouter
    const pricing = OPENROUTER_PRICING[this.config.model];
    if (!pricing) return 0;

    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  }
}

// Pricing per million tokens
const OPENROUTER_PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.52, output: 0.75 },
};
```

---

## Phase 8: Implementation Order

### Step 1: Types & Base Classes (Day 1)
- [ ] Create new type definitions
- [ ] Create abstract base provider classes
- [ ] Set up provider factory pattern

### Step 2: OpenRouter + Director (Day 1-2)
- [ ] Implement OpenRouter provider
- [ ] Implement AI Director class
- [ ] Create director system prompts
- [ ] Add JSON parsing/validation

### Step 3: Provider Implementations (Day 2-3)
- [ ] Update fal.ai image provider
- [ ] Update fal.ai video provider
- [ ] Add provider factory

### Step 4: API Updates (Day 3)
- [ ] Update project creation endpoint
- [ ] Add /direct endpoint
- [ ] Add /refine endpoint
- [ ] Add /approve endpoint
- [ ] Update /generate endpoint

### Step 5: Durable Object Updates (Day 3-4)
- [ ] Update VideoJob to handle dynamic shots
- [ ] Update progress tracking
- [ ] Add cost tracking

### Step 6: Testing & Polish (Day 4)
- [ ] Test full flow
- [ ] Add error handling
- [ ] Add cost estimation endpoint
- [ ] Update README

---

## Cost Tracking

### Per-Request Cost Storage

```typescript
interface JobCostTracking {
  estimated: CostEstimate;
  actual: {
    llm: number;
    images: Array<{ shotId: number; cost: number }>;
    videos: Array<{ shotId: number; cost: number }>;
    compile: number;
    total: number;
  };
}
```

---

## Security Considerations

### API Key Handling

1. **Never log API keys**
2. **Keys stored only in Durable Object state** (encrypted at rest)
3. **Keys never returned in API responses**
4. **Per-project key isolation**

```typescript
// Sanitize project for API response
function sanitizeProject(project: Project): Partial<Project> {
  const { config, ...safe } = project;
  return {
    ...safe,
    config: {
      llm: { provider: config.llm.provider, model: config.llm.model },
      image: { provider: config.image.provider },
      video: { provider: config.video.provider },
      compile: { provider: config.compile.provider },
      // No API keys!
    },
  };
}
```

---

## Future Enhancements (Phase 2+)

1. **Pre-configured Plans**
   - Free tier: Workers AI + limited generations
   - Pro tier: Higher limits
   - Enterprise: Custom

2. **Template Library**
   - Pre-made directions users can customize
   - Community templates

3. **Real-time Preview**
   - WebSocket updates during generation
   - Preview frames before full video

4. **Audio Integration**
   - AI-generated music (Suno, Udio)
   - Voiceover support
   - Sound effects

5. **Multi-language**
   - Director prompts in multiple languages
   - Localized UI
