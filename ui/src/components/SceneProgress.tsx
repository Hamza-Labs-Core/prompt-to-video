import React from 'react';
import type { SceneJobState } from '../types/job';
import { cn } from '../lib/utils';

interface SceneProgressProps {
  scene: SceneJobState;
  sceneName?: string;
}

const statusLabels: Record<SceneJobState['status'], string> = {
  pending: 'Pending',
  generating_start_image: 'Generating start image',
  generating_end_image: 'Generating end image',
  generating_video: 'Generating video',
  polling_video: 'Processing video',
  complete: 'Complete',
  failed: 'Failed',
};

const statusIcons: Record<SceneJobState['status'], React.ReactNode> = {
  pending: (
    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
  ),
  generating_start_image: (
    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  ),
  generating_end_image: (
    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  ),
  generating_video: (
    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  ),
  polling_video: (
    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  ),
  complete: (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  failed: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export function SceneProgress({ scene, sceneName }: SceneProgressProps) {
  const hasStartImage = !!scene.startImageUrl;
  const hasEndImage = !!scene.endImageUrl;
  const hasVideo = !!scene.videoUrl;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{statusIcons[scene.status]}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {sceneName || `Scene ${scene.sceneId}`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {statusLabels[scene.status]}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-xs">
        <StepIndicator
          label="Start"
          isComplete={hasStartImage}
          isActive={scene.status === 'generating_start_image'}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          label="End"
          isComplete={hasEndImage}
          isActive={scene.status === 'generating_end_image'}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          label="Video"
          isComplete={hasVideo}
          isActive={scene.status === 'generating_video' || scene.status === 'polling_video'}
        />
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        <ImagePreview url={scene.startImageUrl} label="Start" />
        <ImagePreview url={scene.endImageUrl} label="End" />
        <VideoPreview url={scene.videoUrl} label="Video" />
      </div>

      {/* Error Message */}
      {scene.error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{scene.error}</p>
        </div>
      )}
    </div>
  );
}

interface StepIndicatorProps {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

function StepIndicator({ label, isComplete, isActive }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          isComplete
            ? 'bg-green-500'
            : isActive
            ? 'bg-blue-500 animate-pulse'
            : 'bg-gray-300 dark:bg-gray-600'
        )}
      />
      <span
        className={cn(
          'text-xs',
          isComplete
            ? 'text-green-600 dark:text-green-400'
            : isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface ImagePreviewProps {
  url?: string;
  label: string;
}

function ImagePreview({ url, label }: ImagePreviewProps) {
  if (!url) {
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <img
        src={url}
        alt={label}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      </div>
    </div>
  );
}

interface VideoPreviewProps {
  url?: string;
  label: string;
}

function VideoPreview({ url, label }: VideoPreviewProps) {
  if (!url) {
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <video
        src={url}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => {
          e.currentTarget.pause();
          e.currentTarget.currentTime = 0;
        }}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
