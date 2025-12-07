import React from 'react';
import type { VideoJobState, JobStatus } from '../types/job';
import { cn } from '../lib/utils';

interface GenerationProgressProps {
  job: VideoJobState;
}

const statusLabels: Record<JobStatus, string> = {
  pending: 'Waiting to start...',
  generating_images: 'Generating images...',
  images_complete: 'Images complete',
  generating_videos: 'Generating videos...',
  videos_complete: 'Videos complete',
  compiling: 'Compiling final video...',
  complete: 'Complete!',
  failed: 'Failed',
};

const statusColors: Record<JobStatus, string> = {
  pending: 'text-gray-500',
  generating_images: 'text-blue-500',
  images_complete: 'text-green-500',
  generating_videos: 'text-purple-500',
  videos_complete: 'text-green-500',
  compiling: 'text-orange-500',
  complete: 'text-green-600',
  failed: 'text-red-600',
};

function estimateTimeRemaining(status: JobStatus, progress: number): string {
  if (status === 'complete') return 'Complete';
  if (status === 'failed') return 'Failed';
  if (progress === 0) return 'Calculating...';

  // Rough estimation based on typical generation times
  // Images: ~30s per image (16 images) = ~8min
  // Videos: ~2min per video (8 videos) = ~16min
  // Compiling: ~1min
  // Total: ~25min
  const totalMinutes = 25;
  const remainingMinutes = Math.ceil(totalMinutes * (1 - progress / 100));

  if (remainingMinutes < 1) return 'Less than a minute';
  if (remainingMinutes === 1) return '1 minute';
  return `~${remainingMinutes} minutes`;
}

export function GenerationProgress({ job }: GenerationProgressProps) {
  const timeRemaining = estimateTimeRemaining(job.status, job.progress);

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn('text-lg font-semibold', statusColors[job.status])}>
              {statusLabels[job.status]}
            </span>
            {job.status !== 'complete' && job.status !== 'failed' && (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {job.progress}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
              job.status === 'complete'
                ? 'bg-green-500'
                : job.status === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            )}
            style={{ width: `${job.progress}%` }}
          />
        </div>

        {/* Time Estimate */}
        {job.status !== 'complete' && job.status !== 'failed' && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Estimated time remaining: {timeRemaining}
          </div>
        )}
      </div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PhaseIndicator
          title="Images"
          isActive={job.status === 'generating_images'}
          isComplete={
            job.status === 'images_complete' ||
            job.status === 'generating_videos' ||
            job.status === 'videos_complete' ||
            job.status === 'compiling' ||
            job.status === 'complete'
          }
        />
        <PhaseIndicator
          title="Videos"
          isActive={job.status === 'generating_videos'}
          isComplete={
            job.status === 'videos_complete' ||
            job.status === 'compiling' ||
            job.status === 'complete'
          }
        />
        <PhaseIndicator
          title="Compiling"
          isActive={job.status === 'compiling'}
          isComplete={job.status === 'complete'}
        />
        <PhaseIndicator
          title="Done"
          isActive={false}
          isComplete={job.status === 'complete'}
        />
      </div>
    </div>
  );
}

interface PhaseIndicatorProps {
  title: string;
  isActive: boolean;
  isComplete: boolean;
}

function PhaseIndicator({ title, isActive, isComplete }: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
          isComplete
            ? 'bg-green-500 text-white'
            : isActive
            ? 'bg-blue-500 text-white animate-pulse'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
        )}
      >
        {isComplete ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : isActive ? (
          <div className="w-3 h-3 bg-white rounded-full animate-ping" />
        ) : (
          <span>{title.charAt(0)}</span>
        )}
      </div>
      <span
        className={cn(
          'text-sm font-medium',
          isComplete
            ? 'text-green-600 dark:text-green-400'
            : isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {title}
      </span>
    </div>
  );
}
