/**
 * React Query hooks for video generation
 * Handles starting generation and polling job status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys, invalidateJob, setJobData } from '../lib/queryClient';
import type { VideoJobState, ProjectConfig } from '../types';

// ============================================================================
// Query Hooks
// ============================================================================

interface UseJobStatusOptions {
  /**
   * Enable automatic polling (default: true)
   */
  enabled?: boolean;
  /**
   * Polling interval in milliseconds (default: 2000)
   */
  pollingInterval?: number;
  /**
   * Callback when job completes
   */
  onComplete?: (job: VideoJobState) => void;
  /**
   * Callback when job fails
   */
  onError?: (job: VideoJobState) => void;
}

/**
 * Fetch job status with automatic polling
 * Automatically stops polling when job is complete or failed
 */
export function useJobStatus(
  jobId: string | undefined,
  options: UseJobStatusOptions = {}
) {
  const {
    enabled = true,
    pollingInterval = 2000,
    onComplete,
    onError,
  } = options;

  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId || ''),
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      return api.getJobStatus(jobId);
    },
    enabled: enabled && !!jobId,
    // Refetch interval - stops when job is complete or failed
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return pollingInterval;

      const isTerminal = data.status === 'complete' || data.status === 'failed';

      // Call callbacks if terminal state reached
      if (isTerminal) {
        if (data.status === 'complete' && onComplete) {
          onComplete(data);
        } else if (data.status === 'failed' && onError) {
          onError(data);
        }
      }

      // Stop polling if terminal state
      return isTerminal ? false : pollingInterval;
    },
    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface StartGenerationParams {
  projectId: string;
  config: ProjectConfig;
}

/**
 * Start video generation for a project
 * Returns a job ID that can be used to poll for status
 */
export function useStartGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: StartGenerationParams) => {
      const result = await api.startGeneration(params.projectId, params.config);

      return {
        projectId: params.projectId,
        jobId: result.jobId,
      };
    },
    onSuccess: (data) => {
      // Start polling job status by prefetching
      queryClient.prefetchQuery({
        queryKey: queryKeys.jobs.detail(data.jobId),
        queryFn: () => api.getJobStatus(data.jobId),
      });
    },
  });
}

// ============================================================================
// Compound Hooks
// ============================================================================

/**
 * Combined hook for managing video generation
 * Handles both starting generation and polling job status
 */
export function useGenerationManager(
  jobId: string | undefined,
  options: UseJobStatusOptions = {}
) {
  const startGeneration = useStartGeneration();
  const jobStatus = useJobStatus(jobId, options);

  return {
    // Job status query
    job: jobStatus.data,
    isPolling: jobStatus.isFetching,
    isLoading: jobStatus.isLoading,
    isError: jobStatus.isError,
    error: jobStatus.error,
    refetch: jobStatus.refetch,

    // Start generation mutation
    startGeneration: {
      mutate: startGeneration.mutate,
      mutateAsync: startGeneration.mutateAsync,
      isLoading: startGeneration.isPending,
      isError: startGeneration.isError,
      error: startGeneration.error,
      isSuccess: startGeneration.isSuccess,
      data: startGeneration.data,
    },

    // Helper computed values
    isGenerating: jobStatus.data
      ? !['complete', 'failed'].includes(jobStatus.data.status)
      : false,
    isComplete: jobStatus.data?.status === 'complete',
    isFailed: jobStatus.data?.status === 'failed',
    progress: jobStatus.data?.progress || 0,
    currentStatus: jobStatus.data?.status,
    finalVideoUrl: jobStatus.data?.finalVideoUrl,
  };
}

/**
 * Hook for tracking multiple jobs (for future use)
 */
export function useMultipleJobs(
  jobIds: string[],
  options: UseJobStatusOptions = {}
) {
  const jobs = jobIds.map((jobId) => useJobStatus(jobId, options));

  const allJobs = jobs.map((q) => q.data).filter(Boolean) as VideoJobState[];
  const isAnyPolling = jobs.some((q) => q.isFetching);
  const isAnyLoading = jobs.some((q) => q.isLoading);
  const areAllComplete = allJobs.every((job) => job.status === 'complete');
  const hasAnyFailed = allJobs.some((job) => job.status === 'failed');

  const totalProgress = allJobs.length > 0
    ? allJobs.reduce((sum, job) => sum + job.progress, 0) / allJobs.length
    : 0;

  return {
    jobs: allJobs,
    isPolling: isAnyPolling,
    isLoading: isAnyLoading,
    areAllComplete,
    hasAnyFailed,
    totalProgress,
  };
}
