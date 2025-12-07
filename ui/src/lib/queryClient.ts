/**
 * React Query client configuration
 * Centralized configuration for data fetching, caching, and state management
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { ApiClientError } from './api';

// ============================================================================
// Query Client Configuration
// ============================================================================

const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: How long inactive data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on validation errors or client errors
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          return false;
        }
      }

      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (useful for job status polling)
    refetchOnWindowFocus: true,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,

    // Refetch on reconnect
    refetchOnReconnect: true,
  },

  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError) {
        // Don't retry validation errors
        if (error.code === 'VALIDATION_ERROR') {
          return false;
        }
        // Retry network errors once
        if (error.code === 'NETWORK_ERROR' && failureCount < 1) {
          return true;
        }
      }
      return false;
    },

    // Retry delay for mutations
    retryDelay: 1000,
  },
};

// ============================================================================
// Create Query Client Instance
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions,
});

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query key factory for type-safe, consistent cache keys
 * Using hierarchical structure for easy invalidation
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (jobId: string) => [...queryKeys.jobs.details(), jobId] as const,
  },
} as const;

// ============================================================================
// Query Client Utilities
// ============================================================================

/**
 * Invalidate all project queries
 */
export function invalidateProjects() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.projects.all,
  });
}

/**
 * Invalidate a specific project
 */
export function invalidateProject(projectId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.projects.detail(projectId),
  });
}

/**
 * Invalidate all job queries
 */
export function invalidateJobs() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.jobs.all,
  });
}

/**
 * Invalidate a specific job
 */
export function invalidateJob(jobId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.jobs.detail(jobId),
  });
}

/**
 * Set project data in cache (useful after mutations)
 */
export function setProjectData(projectId: string, data: unknown) {
  queryClient.setQueryData(queryKeys.projects.detail(projectId), data);
}

/**
 * Set job data in cache
 */
export function setJobData(jobId: string, data: unknown) {
  queryClient.setQueryData(queryKeys.jobs.detail(jobId), data);
}
