/**
 * Provider abstraction layer
 * Exports all base provider classes and types
 */

// LLM Providers
export { BaseLLMProvider } from './llm/base';
export type { LLMMessage, LLMResponse } from './llm/base';

// Image Providers
export { BaseImageProvider } from './image/base';
export type { ImageRequest, ImageResponse } from './image/base';

// Video Providers
export { BaseVideoProvider } from './video/base';
export type { VideoRequest, VideoResponse } from './video/base';

// Compile Providers
export { BaseCompileProvider } from './compile/base';
export type {
  CompileRequest,
  CompileResponse,
  TransitionConfig,
} from './compile/base';

// Re-export provider config types
export type {
  BaseProviderConfig,
  LLMProviderConfig,
  OpenRouterConfig,
  ImageProviderConfig,
  VideoProviderConfig,
  CompileProviderConfig,
  ProjectConfig,
} from '../types/providers';
