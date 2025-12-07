// Job status types matching backend
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

// Overall job state
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

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
