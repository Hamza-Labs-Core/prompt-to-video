/**
 * Central type definitions export
 * Re-exports all types from the types directory
 */

// Legacy types (from ../types.ts - will be migrated)
export type {
  Env,
  Scene,
  JobStatus,
  SceneJobState,
  VideoJobState,
  FluxImageRequest,
  FluxImageResponse,
  KlingVideoRequest,
  FalQueueResponse,
  KlingVideoResponse,
  CreatomateRenderRequest,
  CreatomateSource,
  CreatomateElement,
  CreatomateRenderResponse,
  CreateProjectRequest,
  GenerateVideoRequest,
  ApiResponse,
} from '../types';

// Provider configuration types
export type {
  BaseProviderConfig,
  LLMProviderConfig,
  OpenRouterConfig,
  ImageProviderConfig,
  VideoProviderConfig,
  CompileProviderConfig,
  ProjectConfig,
} from './providers';

// Project and direction types
export type {
  VideoStyle,
  CameraMove,
  TransitionType,
  CostEstimate,
  DirectedShot,
  DirectedScene,
  VideoDirection,
  Project,
  DirectorInput,
} from './project';

// Note: The legacy Project interface from ../types.ts conflicts with the new Project interface
// from ./project.ts. The new one takes precedence. The old Scene[] based project will be
// deprecated in favor of the new DirectedScene[] based project.
