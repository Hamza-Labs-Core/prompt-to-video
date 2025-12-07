/**
 * AI Director - Generates dynamic video shot plans using LLM
 *
 * The AI Director takes a video concept and uses an LLM to create detailed
 * shot-by-shot plans with specific image prompts, camera movements, and transitions.
 */

import { BaseLLMProvider, LLMMessage } from '../providers/llm/base';
import type { LLMProviderConfig } from '../types/providers';
import type { ProjectConfig } from '../types/providers';
import {
  DirectorInput,
  VideoDirection,
  DirectorFeedback,
  CostEstimate,
} from './types';
import { DIRECTOR_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from './prompts';
import { parseDirection, ValidationError } from './parser';

/**
 * AI Director for generating video shot plans
 */
export class AIDirector {
  private llm: BaseLLMProvider;

  /**
   * Create a new AI Director
   * @param llmProvider - An instantiated LLM provider (must be already created)
   */
  constructor(llmProvider: BaseLLMProvider) {
    this.llm = llmProvider;
  }

  /**
   * Direct a video - generate a complete shot plan from a concept
   *
   * @param input - Director input with concept, style, duration, etc.
   * @returns Complete video direction with scenes and shots
   * @throws {ValidationError} if LLM output doesn't meet requirements
   */
  async direct(input: DirectorInput): Promise<VideoDirection> {
    const messages = this.buildMessages(input);

    try {
      // Get structured JSON output from LLM
      const rawDirection = await this.llm.json<any>(messages);

      // Validate and normalize the output
      const validatedDirection = parseDirection(rawDirection, {
        targetDuration: input.targetDuration,
        aspectRatio: input.aspectRatio,
        maxScenes: input.constraints?.maxScenes,
        maxShotsPerScene: input.constraints?.maxShotsPerScene,
      });

      return validatedDirection;
    } catch (error) {
      if (error instanceof ValidationError) {
        // Re-throw validation errors with context
        throw new Error(
          `AI Director output validation failed: ${error.message}` +
            (error.sceneId ? ` (Scene ${error.sceneId}` : '') +
            (error.shotId ? `, Shot ${error.shotId})` : error.sceneId ? ')' : '')
        );
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new Error(
          `AI Director returned invalid JSON: ${error.message}`
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Refine an existing direction based on user feedback
   *
   * @param direction - Current video direction
   * @param feedback - User's feedback for refinement
   * @returns Updated video direction
   */
  async refine(
    direction: VideoDirection,
    feedback: string
  ): Promise<VideoDirection> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: DIRECTOR_SYSTEM_PROMPT,
      },
      {
        role: 'assistant',
        content: JSON.stringify(direction, null, 2),
      },
      {
        role: 'user',
        content: `Please refine the video direction based on this feedback:\n\n${feedback}\n\nReturn the complete updated direction as JSON, following the same schema.`,
      },
    ];

    try {
      const rawDirection = await this.llm.json<any>(messages);

      // Use the same target duration and aspect ratio from original
      const validatedDirection = parseDirection(rawDirection, {
        targetDuration: direction.totalDuration,
        aspectRatio: '16:9', // TODO: Store this in direction metadata
        maxScenes: direction.scenes.length + 2, // Allow some flexibility
      });

      return validatedDirection;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(
          `Refined direction validation failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Estimate the cost of generating a video from a direction
   *
   * @param direction - Video direction to estimate
   * @param config - Project configuration with provider details
   * @returns Cost estimate breakdown
   */
  estimateCost(
    direction: VideoDirection,
    config: ProjectConfig
  ): CostEstimate {
    // Count total shots
    const totalShots = direction.scenes.reduce(
      (sum, scene) => sum + scene.shots.length,
      0
    );

    // Each shot needs 2 images (start and end)
    const imageCount = totalShots * 2;

    // Each shot needs 1 video
    const videoCount = totalShots;

    // Calculate total duration
    const totalDuration = direction.totalDuration;

    // LLM cost (rough estimate - already incurred)
    // Assume ~2000 prompt tokens + ~2000 completion tokens
    const llmCost = this.llm.estimateCost(2000, 2000);

    // Image generation costs (provider-specific estimates)
    // Default to $0.05 per image for flux/high-quality models
    const imageCost = imageCount * this.estimateImageCost(config.image.provider);

    // Video generation costs (provider-specific estimates)
    // Costs vary by provider and duration
    const videoCost = this.estimateVideoCost(
      config.video.provider,
      totalShots,
      totalDuration
    );

    // Compilation cost
    const compileCost = this.estimateCompileCost(config.compile.provider);

    const total = llmCost + imageCost + videoCost + compileCost;

    return {
      llm: llmCost,
      images: imageCost,
      videos: videoCost,
      compile: compileCost,
      total,
      breakdown: {
        imageCount,
        videoCount,
        totalDuration,
      },
    };
  }

  /**
   * Build LLM messages for initial direction
   */
  private buildMessages(input: DirectorInput): LLMMessage[] {
    const systemPrompt = DIRECTOR_SYSTEM_PROMPT;
    const userPrompt = this.buildUserPrompt(input);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Build user prompt from director input
   */
  private buildUserPrompt(input: DirectorInput): string {
    let prompt = USER_PROMPT_TEMPLATE.replace('{CONCEPT}', input.concept)
      .replace('{STYLE}', input.style || 'cinematic')
      .replace('{DURATION}', input.targetDuration.toString())
      .replace('{ASPECT_RATIO}', input.aspectRatio);

    // Add constraints if present
    let constraints = '';
    if (input.constraints) {
      const parts: string[] = [];

      if (input.constraints.maxScenes) {
        parts.push(`- Maximum ${input.constraints.maxScenes} scenes`);
      }

      if (input.constraints.maxShotsPerScene) {
        parts.push(
          `- Maximum ${input.constraints.maxShotsPerScene} shots per scene`
        );
      }

      if (input.constraints.mustInclude && input.constraints.mustInclude.length > 0) {
        parts.push(
          `- Must include: ${input.constraints.mustInclude.join(', ')}`
        );
      }

      if (input.constraints.avoid && input.constraints.avoid.length > 0) {
        parts.push(`- Avoid: ${input.constraints.avoid.join(', ')}`);
      }

      if (parts.length > 0) {
        constraints = '**Constraints**:\n' + parts.join('\n');
      }
    }

    prompt = prompt.replace('{CONSTRAINTS}', constraints);

    return prompt;
  }

  /**
   * Estimate image generation cost per image
   */
  private estimateImageCost(provider: string): number {
    const costs: Record<string, number> = {
      'fal-flux': 0.05, // Flux Pro
      'fal-sdxl': 0.03, // SDXL
      'replicate': 0.04,
      'openai-dalle': 0.08, // DALL-E 3
      'stability': 0.05, // Stable Diffusion 3
    };

    return costs[provider] || 0.05;
  }

  /**
   * Estimate video generation cost
   */
  private estimateVideoCost(
    provider: string,
    shotCount: number,
    totalDuration: number
  ): number {
    // Cost per shot (most providers charge per generation, not per second)
    const costsPerShot: Record<string, number> = {
      'fal-kling': 0.35, // Kling Pro
      'runway': 0.50, // Runway Gen-3
      'pika': 0.40,
      'luma': 0.30, // Luma Dream Machine
      'minimax': 0.25,
    };

    const costPerShot = costsPerShot[provider] || 0.35;

    return shotCount * costPerShot;
  }

  /**
   * Estimate compilation cost
   */
  private estimateCompileCost(provider: string): number {
    const costs: Record<string, number> = {
      creatomate: 0.10, // Per render
      shotstack: 0.05,
      none: 0.0,
    };

    return costs[provider] || 0.0;
  }
}

// Re-export types for convenience
export * from './types';
export { ValidationError } from './parser';
