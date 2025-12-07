/**
 * AI Director Output Parser and Validator
 *
 * Validates and normalizes LLM-generated video directions to ensure they meet
 * all technical requirements before being used for video generation.
 */

import type { VideoDirection, DirectedScene, DirectedShot } from './types';

/**
 * Validation error with specific location
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public sceneId?: number,
    public shotId?: number
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Input parameters used for validation context
 */
export interface ValidationInput {
  targetDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  maxScenes?: number;
  maxShotsPerScene?: number;
}

/**
 * Validate a video direction from LLM output
 *
 * Ensures:
 * - All required fields are present
 * - Shot durations are 5-10 seconds
 * - Total duration is within target ±10%
 * - Scene and shot IDs are sequential
 * - Prompts are sufficiently detailed
 *
 * @throws {ValidationError} if validation fails
 */
export function validateDirection(
  direction: any,
  input: ValidationInput
): VideoDirection {
  // Check basic structure
  if (!direction || typeof direction !== 'object') {
    throw new ValidationError('Direction must be a valid object');
  }

  // Validate required top-level fields
  if (!direction.title || typeof direction.title !== 'string') {
    throw new ValidationError('Missing or invalid title', 'title');
  }

  if (!direction.narrative || typeof direction.narrative !== 'string') {
    throw new ValidationError('Missing or invalid narrative', 'narrative');
  }

  if (
    typeof direction.totalDuration !== 'number' ||
    direction.totalDuration <= 0
  ) {
    throw new ValidationError(
      'Missing or invalid totalDuration',
      'totalDuration'
    );
  }

  if (!Array.isArray(direction.scenes) || direction.scenes.length === 0) {
    throw new ValidationError('Scenes must be a non-empty array', 'scenes');
  }

  // Validate scene count constraint
  if (input.maxScenes && direction.scenes.length > input.maxScenes) {
    throw new ValidationError(
      `Too many scenes: ${direction.scenes.length} (max: ${input.maxScenes})`,
      'scenes'
    );
  }

  // Validate each scene
  let totalCalculatedDuration = 0;
  const validatedScenes: DirectedScene[] = [];

  for (let i = 0; i < direction.scenes.length; i++) {
    const scene = direction.scenes[i];
    const expectedSceneId = i + 1;

    // Validate scene structure
    if (scene.id !== expectedSceneId) {
      throw new ValidationError(
        `Scene ID should be ${expectedSceneId}, got ${scene.id}`,
        'id',
        scene.id
      );
    }

    if (!scene.name || typeof scene.name !== 'string') {
      throw new ValidationError(
        'Missing or invalid scene name',
        'name',
        scene.id
      );
    }

    if (!scene.description || typeof scene.description !== 'string') {
      throw new ValidationError(
        'Missing or invalid scene description',
        'description',
        scene.id
      );
    }

    if (!scene.mood || typeof scene.mood !== 'string') {
      throw new ValidationError('Missing or invalid mood', 'mood', scene.id);
    }

    if (!Array.isArray(scene.shots) || scene.shots.length === 0) {
      throw new ValidationError(
        'Scene must have at least one shot',
        'shots',
        scene.id
      );
    }

    // Validate shots per scene constraint
    if (input.maxShotsPerScene && scene.shots.length > input.maxShotsPerScene) {
      throw new ValidationError(
        `Scene ${scene.id} has too many shots: ${scene.shots.length} (max: ${input.maxShotsPerScene})`,
        'shots',
        scene.id
      );
    }

    // Validate each shot
    const validatedShots: DirectedShot[] = [];

    for (let j = 0; j < scene.shots.length; j++) {
      const shot = scene.shots[j];
      const expectedShotId = j + 1;

      // Validate shot ID
      if (shot.id !== expectedShotId) {
        throw new ValidationError(
          `Shot ID should be ${expectedShotId}, got ${shot.id}`,
          'id',
          scene.id,
          shot.id
        );
      }

      // Validate duration (5-10 seconds)
      if (
        typeof shot.duration !== 'number' ||
        shot.duration < 5 ||
        shot.duration > 10
      ) {
        throw new ValidationError(
          `Shot duration must be 5-10 seconds, got ${shot.duration}`,
          'duration',
          scene.id,
          shot.id
        );
      }

      totalCalculatedDuration += shot.duration;

      // Validate prompts
      if (!shot.startPrompt || typeof shot.startPrompt !== 'string') {
        throw new ValidationError(
          'Missing or invalid startPrompt',
          'startPrompt',
          scene.id,
          shot.id
        );
      }

      if (!shot.endPrompt || typeof shot.endPrompt !== 'string') {
        throw new ValidationError(
          'Missing or invalid endPrompt',
          'endPrompt',
          scene.id,
          shot.id
        );
      }

      if (!shot.motionPrompt || typeof shot.motionPrompt !== 'string') {
        throw new ValidationError(
          'Missing or invalid motionPrompt',
          'motionPrompt',
          scene.id,
          shot.id
        );
      }

      // Validate prompt detail (minimum 20 words)
      if (shot.startPrompt.split(/\s+/).length < 20) {
        throw new ValidationError(
          'startPrompt is too brief (minimum 20 words)',
          'startPrompt',
          scene.id,
          shot.id
        );
      }

      if (shot.endPrompt.split(/\s+/).length < 20) {
        throw new ValidationError(
          'endPrompt is too brief (minimum 20 words)',
          'endPrompt',
          scene.id,
          shot.id
        );
      }

      // Validate camera move
      const validCameraMoves = [
        'static',
        'push_in',
        'pull_out',
        'pan_left',
        'pan_right',
        'tilt_up',
        'tilt_down',
        'crane_up',
        'crane_down',
        'dolly_left',
        'dolly_right',
      ];

      if (!validCameraMoves.includes(shot.cameraMove)) {
        throw new ValidationError(
          `Invalid cameraMove: ${shot.cameraMove}`,
          'cameraMove',
          scene.id,
          shot.id
        );
      }

      // Validate lighting
      if (!shot.lighting || typeof shot.lighting !== 'string') {
        throw new ValidationError(
          'Missing or invalid lighting',
          'lighting',
          scene.id,
          shot.id
        );
      }

      // Validate transition (optional, but if present must be valid)
      if (shot.transitionOut) {
        const validTransitions = [
          'cut',
          'crossfade',
          'fade_black',
          'fade_white',
          'wipe_left',
          'wipe_right',
        ];

        if (!validTransitions.includes(shot.transitionOut)) {
          throw new ValidationError(
            `Invalid transitionOut: ${shot.transitionOut}`,
            'transitionOut',
            scene.id,
            shot.id
          );
        }
      }

      validatedShots.push(shot as DirectedShot);
    }

    validatedScenes.push({
      ...scene,
      shots: validatedShots,
    } as DirectedScene);
  }

  // Validate total duration is within ±10% of target
  const tolerance = input.targetDuration * 0.1;
  const minDuration = input.targetDuration - tolerance;
  const maxDuration = input.targetDuration + tolerance;

  if (
    totalCalculatedDuration < minDuration ||
    totalCalculatedDuration > maxDuration
  ) {
    throw new ValidationError(
      `Total duration ${totalCalculatedDuration}s is outside acceptable range (${minDuration.toFixed(1)}-${maxDuration.toFixed(1)}s for target ${input.targetDuration}s)`,
      'totalDuration'
    );
  }

  return {
    title: direction.title,
    narrative: direction.narrative,
    totalDuration: totalCalculatedDuration,
    scenes: validatedScenes,
  };
}

/**
 * Normalize a direction to fix minor issues
 *
 * This function attempts to automatically fix common issues:
 * - Trim whitespace from all string fields
 * - Round durations to 1 decimal place
 * - Ensure scene/shot IDs are sequential
 * - Set default transitions if missing
 * - Recalculate totalDuration from shot durations
 */
export function normalizeDirection(direction: VideoDirection): VideoDirection {
  let globalShotCount = 0;

  const normalizedScenes = direction.scenes.map((scene, sceneIndex) => {
    const normalizedShots = scene.shots.map((shot, shotIndex) => {
      globalShotCount++;

      return {
        ...shot,
        id: shotIndex + 1,
        duration: Math.round(shot.duration * 10) / 10, // Round to 1 decimal
        startPrompt: shot.startPrompt.trim(),
        endPrompt: shot.endPrompt.trim(),
        motionPrompt: shot.motionPrompt.trim(),
        lighting: shot.lighting.trim(),
        colorPalette: shot.colorPalette?.trim(),
        transitionOut: shot.transitionOut || 'cut', // Default to cut
      };
    });

    return {
      ...scene,
      id: sceneIndex + 1,
      name: scene.name.trim(),
      description: scene.description.trim(),
      mood: scene.mood.trim(),
      shots: normalizedShots,
    };
  });

  // Recalculate total duration
  const totalDuration = normalizedScenes.reduce(
    (total, scene) =>
      total + scene.shots.reduce((sum, shot) => sum + shot.duration, 0),
    0
  );

  return {
    ...direction,
    title: direction.title.trim(),
    narrative: direction.narrative.trim(),
    totalDuration: Math.round(totalDuration * 10) / 10,
    scenes: normalizedScenes,
  };
}

/**
 * Validate and normalize direction in one step
 */
export function parseDirection(
  rawDirection: any,
  input: ValidationInput
): VideoDirection {
  // First validate
  const validated = validateDirection(rawDirection, input);

  // Then normalize
  const normalized = normalizeDirection(validated);

  return normalized;
}
