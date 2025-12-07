# AI Director Module

The AI Director uses an LLM to generate detailed, shot-by-shot video plans from high-level concepts. It handles validation, normalization, and cost estimation.

## Overview

```
User Concept → AI Director → Validated Video Direction → Video Generation Pipeline
```

## Architecture

```
director/
├── index.ts      # AIDirector class - main interface
├── prompts.ts    # System prompts for the LLM
├── parser.ts     # Validation and normalization
├── types.ts      # TypeScript type definitions
└── README.md     # This file
```

## Usage

### 1. Basic Usage

```typescript
import { AIDirector } from './director';
import { createLLMProvider } from './providers/llm';

// Create LLM provider
const llmProvider = createLLMProvider({
  provider: 'openrouter',
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  maxTokens: 4096,
});

// Create director
const director = new AIDirector(llmProvider);

// Generate video direction
const direction = await director.direct({
  concept: 'Epic blacksmith forge video revealing the Hamza Labs emblem with fire, molten gold, and dramatic lighting',
  style: 'cinematic',
  targetDuration: 60,
  aspectRatio: '16:9',
});

console.log(`Generated ${direction.scenes.length} scenes`);
console.log(`Total shots: ${direction.scenes.reduce((sum, s) => sum + s.shots.length, 0)}`);
console.log(`Title: ${direction.title}`);
```

### 2. With Constraints

```typescript
const direction = await director.direct({
  concept: 'A journey through four seasons in a magical forest',
  style: 'artistic',
  targetDuration: 45,
  aspectRatio: '16:9',
  constraints: {
    maxScenes: 4,           // Limit to 4 scenes (one per season)
    maxShotsPerScene: 3,    // Max 3 shots per scene
    mustInclude: [
      'cherry blossoms',
      'autumn leaves',
      'snow falling',
      'spring flowers'
    ],
    avoid: [
      'people',
      'buildings'
    ],
  },
});
```

### 3. Refining a Direction

```typescript
// User reviews the direction and wants changes
const refined = await director.refine(
  direction,
  'Make the fire ignition scene longer, add more close-ups of the Arabic engraving, and increase the dramatic tension before the final reveal'
);
```

### 4. Cost Estimation

```typescript
import { ProjectConfig } from './types/providers';

const config: ProjectConfig = {
  llm: {
    provider: 'openrouter',
    apiKey: '...',
    model: 'anthropic/claude-3.5-sonnet',
  },
  image: {
    provider: 'fal-flux',
    apiKey: '...',
  },
  video: {
    provider: 'fal-kling',
    apiKey: '...',
  },
  compile: {
    provider: 'none',
    apiKey: '',
  },
};

const estimate = director.estimateCost(direction, config);

console.log(`Total estimated cost: $${estimate.total.toFixed(2)}`);
console.log(`  LLM: $${estimate.llm.toFixed(2)}`);
console.log(`  Images (${estimate.breakdown.imageCount}): $${estimate.images.toFixed(2)}`);
console.log(`  Videos (${estimate.breakdown.videoCount}): $${estimate.videos.toFixed(2)}`);
console.log(`  Compilation: $${estimate.compile.toFixed(2)}`);
```

## Output Structure

The AI Director returns a `VideoDirection` object:

```typescript
{
  title: "The Forging of Hamza Labs",
  narrative: "A dramatic journey through the creation of the Hamza Labs emblem...",
  totalDuration: 58.5,
  scenes: [
    {
      id: 1,
      name: "The Forge Awakens",
      description: "Introduction to the dark forge, building anticipation",
      mood: "mysterious and tense",
      shots: [
        {
          id: 1,
          duration: 7,
          startPrompt: "Wide establishing shot of a dark industrial forge...",
          endPrompt: "Same shot, but now embers begin to glow in the darkness...",
          motionPrompt: "Slow push in towards the forge...",
          cameraMove: "push_in",
          lighting: "Low key lighting with single ember glow",
          colorPalette: "Deep blacks, warm amber highlights",
          transitionOut: "crossfade"
        },
        // ... more shots
      ]
    },
    // ... more scenes
  ]
}
```

## Validation

The AI Director automatically validates:

- ✅ Shot durations are 5-10 seconds
- ✅ Total duration is within ±10% of target
- ✅ All required fields are present
- ✅ Prompts are sufficiently detailed (minimum 20 words)
- ✅ Camera moves and transitions are valid
- ✅ Scene and shot IDs are sequential

If validation fails, a `ValidationError` is thrown with specific details.

## Error Handling

```typescript
import { ValidationError } from './director';

try {
  const direction = await director.direct(input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Scene:', error.sceneId, 'Shot:', error.shotId);
  } else {
    console.error('Director error:', error.message);
  }
}
```

## Best Practices

1. **Choose the Right Model**: Use capable models for complex videos
   - Recommended: `anthropic/claude-3.5-sonnet` or `openai/gpt-4o`
   - Budget option: `anthropic/claude-3-haiku`

2. **Set Appropriate Temperature**:
   - 0.7-0.8 for creative, varied outputs
   - 0.5-0.6 for more consistent, structured outputs

3. **Use Constraints**: Help guide the LLM
   - Set `maxScenes` to control narrative structure
   - Use `mustInclude` for required elements
   - Use `avoid` to prevent unwanted content

4. **Review Before Generation**:
   - Always review the direction before starting expensive video generation
   - Use `refine()` to make adjustments
   - Check cost estimates

5. **Handle Errors Gracefully**:
   - LLMs can occasionally produce invalid output
   - Implement retry logic with exponential backoff
   - Consider falling back to a different model

## System Prompt

The director uses a comprehensive system prompt (see `prompts.ts`) that includes:

- Detailed responsibilities and constraints
- JSON schema with examples
- Image prompt best practices
- Camera move and transition guides
- Duration guidelines
- Quality checklist

This prompt is carefully crafted to produce high-quality, consistent results across different LLM providers.

## Future Enhancements

- [ ] Template library for common video types
- [ ] Multi-language support
- [ ] Audio direction (music, SFX, voiceover)
- [ ] Real-time streaming for faster iteration
- [ ] Visual preview generation
- [ ] Community-shared directions
