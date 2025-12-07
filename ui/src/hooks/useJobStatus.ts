import { useQuery } from '@tanstack/react-query';
import type { VideoJobState, ApiResponse } from '../types/job';

interface UseJobStatusOptions {
  jobId: string;
  enabled?: boolean;
}

const API_BASE = '/api';

async function fetchJobStatus(jobId: string): Promise<VideoJobState> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${response.statusText}`);
  }

  const result: ApiResponse<VideoJobState> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch job status');
  }

  return result.data;
}

export function useJobStatus({ jobId, enabled = true }: UseJobStatusOptions) {
  const query = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJobStatus(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Stop polling if job is complete or failed
      if (!data) return false;
      if (data.status === 'complete' || data.status === 'failed') {
        return false;
      }
      // Poll every 5 seconds while in progress
      return 5000;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isComplete = query.data?.status === 'complete';
  const isFailed = query.data?.status === 'failed';
  const isInProgress =
    query.data &&
    !isComplete &&
    !isFailed &&
    query.data.status !== 'pending';

  return {
    job: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isComplete,
    isFailed,
    isInProgress,
    refetch: query.refetch,
  };
}
