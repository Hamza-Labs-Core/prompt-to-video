/**
 * Frontend type definitions
 * Adapted from backend types to match API contracts
 */

// ============================================================================
// Provider Configuration Types
// ============================================================================

export interface BaseProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
}

export interface LLMProviderConfig extends BaseProviderConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'workers-ai' | 'google';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenRouterConfig extends LLMProviderConfig {
  provider: 'openrouter';
  transforms?: string[];
  route?: 'fallback' | 'priority';
}

export interface ImageProviderConfig extends BaseProviderConfig {
  provider: 'fal-flux' | 'fal-sdxl' | 'replicate' | 'openai-dalle' | 'stability';
  model?: string;
  quality?: 'standard' | 'hd';
  style?: string;
}

export interface VideoProviderConfig extends BaseProviderConfig {
  provider: 'fal-kling' | 'runway' | 'pika' | 'luma' | 'minimax';
  model?: string;
  quality?: 'standard' | 'pro';
}

export interface CompileProviderConfig extends BaseProviderConfig {
  provider: 'creatomate' | 'shotstack' | 'none';
  templateId?: string;
}

export interface ProjectConfig {
  llm: LLMProviderConfig;
  image: ImageProviderConfig;
  video: VideoProviderConfig;
  compile: CompileProviderConfig;
}

// ============================================================================
// Project and Direction Types
// ============================================================================

export type VideoStyle =
  | 'cinematic'
  | 'minimal'
  | 'energetic'
  | 'documentary'
  | 'dramatic'
  | 'playful'
  | 'corporate'
  | 'artistic';

export type CameraMove =
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

export type TransitionType =
  | 'cut'
  | 'crossfade'
  | 'fade_black'
  | 'fade_white'
  | 'wipe_left'
  | 'wipe_right';

export interface CostEstimate {
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

export interface DirectedShot {
  id: number;
  duration: number;
  startPrompt: string;
  endPrompt: string;
  motionPrompt: string;
  cameraMove: CameraMove;
  lighting: string;
  colorPalette?: string;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
}

export interface DirectedScene {
  id: number;
  name: string;
  description: string;
  mood: string;
  shots: DirectedShot[];
}

export interface VideoDirection {
  title: string;
  narrative: string;
  totalDuration: number;
  scenes: DirectedScene[];
  estimatedCost: CostEstimate;
}

export interface Project {
  id: string;
  name: string;
  concept: string;
  style?: VideoStyle;
  targetDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  config: ProjectConfig;
  direction?: VideoDirection;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Job Status Types
// ============================================================================

export type JobStatus =
  | 'pending'
  | 'generating_images'
  | 'images_complete'
  | 'generating_videos'
  | 'videos_complete'
  | 'compiling'
  | 'complete'
  | 'failed';

export interface SceneJobState {
  sceneId: number;
  startImageUrl?: string;
  startImageR2Key?: string;
  endImageUrl?: string;
  endImageR2Key?: string;
  videoRequestId?: string;
  videoUrl?: string;
  videoR2Key?: string;
  status:
    | 'pending'
    | 'generating_start_image'
    | 'generating_end_image'
    | 'generating_video'
    | 'polling_video'
    | 'complete'
    | 'failed';
  error?: string;
}

export interface VideoJobState {
  id: string;
  projectId: string;
  status: JobStatus;
  scenes: SceneJobState[];
  finalVideoUrl?: string;
  finalVideoR2Key?: string;
  progress: number; // 0-100
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  concept: string;
  style?: VideoStyle;
  targetDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  config: ProjectConfig;
}

export interface GenerateDirectionRequest {
  projectId: string;
}

export interface RefineDirectionRequest {
  projectId: string;
  feedback: string;
}

export interface ApproveDirectionRequest {
  projectId: string;
}

export interface StartGenerationRequest {
  projectId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// API Response Types
// ============================================================================

export type CreateProjectResponse = ApiResponse<Project>;
export type GetProjectResponse = ApiResponse<Project>;
export type GenerateDirectionResponse = ApiResponse<VideoDirection>;
export type RefineDirectionResponse = ApiResponse<VideoDirection>;
export type ApproveDirectionResponse = ApiResponse<{ approved: boolean }>;
export type StartGenerationResponse = ApiResponse<{ jobId: string }>;
export type GetJobStatusResponse = ApiResponse<VideoJobState>;
