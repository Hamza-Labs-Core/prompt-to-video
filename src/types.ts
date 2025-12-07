// Environment bindings
export interface Env {
  VIDEO_JOB: DurableObjectNamespace;
  MEDIA_BUCKET: R2Bucket;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  DB: D1Database;

  // Secrets (set via wrangler secret put)
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  FAL_API_KEY?: string; // Now optional, per-user keys preferred
  CREATOMATE_API_KEY?: string; // Now optional, per-user keys preferred

  // Variables
  ENVIRONMENT: string;
  JWT_EXPIRY?: string;
  REFRESH_EXPIRY?: string;
}

// Scene definition
export interface Scene {
  id: number;
  name: string;
  startPrompt: string;
  endPrompt: string;
  motionPrompt: string;
  duration: number; // seconds
}

// Project containing multiple scenes
export interface Project {
  id: string;
  name: string;
  scenes: Scene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  updatedAt: string;
}

// Job status
export type JobStatus =
  | 'pending'
  | 'generating_images'
  | 'images_complete'
  | 'generating_videos'
  | 'videos_complete'
  | 'compiling'
  | 'complete'
  | 'failed';

// Individual scene job state
export interface SceneJobState {
  sceneId: number;
  startImageUrl?: string;
  startImageR2Key?: string;
  endImageUrl?: string;
  endImageR2Key?: string;
  videoRequestId?: string;
  videoUrl?: string;
  videoR2Key?: string;
  status: 'pending' | 'generating_start_image' | 'generating_end_image' | 'generating_video' | 'polling_video' | 'complete' | 'failed';
  error?: string;
}

// Overall job state stored in Durable Object
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

// fal.ai Flux image generation request
export interface FluxImageRequest {
  prompt: string;
  image_size: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  seed?: number;
}

// fal.ai Flux image generation response
export interface FluxImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// fal.ai Kling video request
export interface KlingVideoRequest {
  prompt: string;
  image_url: string;
  tail_image_url?: string; // End frame
  duration: '5' | '10';
  aspect_ratio: '16:9' | '9:16' | '1:1';
}

// fal.ai queue response
export interface FalQueueResponse {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_url?: string;
}

// fal.ai Kling video response
export interface KlingVideoResponse {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

// Creatomate render request
export interface CreatomateRenderRequest {
  template_id?: string;
  output_format: 'mp4' | 'gif' | 'webm';
  width?: number;
  height?: number;
  frame_rate?: number;
  source: CreatomateSource;
}

// Creatomate source element
export interface CreatomateSource {
  output_format: 'mp4';
  width: number;
  height: number;
  frame_rate: number;
  elements: CreatomateElement[];
}

// Creatomate element (video, audio, text)
export interface CreatomateElement {
  type: 'video' | 'audio' | 'text' | 'image';
  source?: string;
  track?: number;
  time?: number;
  duration?: number | 'auto';
  transition?: {
    type: string;
    duration: number;
  };
  // Audio specific
  volume?: number;
  audio_fade_in?: number;
  audio_fade_out?: number;
  // Text specific
  text?: string;
  font_family?: string;
  font_size?: number;
  fill_color?: string;
  x?: string;
  y?: string;
}

// Creatomate render response
export interface CreatomateRenderResponse {
  id: string;
  status: 'planned' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  error_message?: string;
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  scenes: Omit<Scene, 'id'>[];
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GenerateVideoRequest {
  projectId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
