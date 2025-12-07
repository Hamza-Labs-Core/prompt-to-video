/**
 * Main exports for prompt-to-video UI library
 * Central entry point for all types, hooks, and utilities
 */

// Type exports
export type * from './types';

// API client
export { api } from './lib/api';
export type { ApiError, ApiResponse } from './lib/api';
export {
  ApiClientError,
  NetworkError,
  ValidationError,
  ServerError,
} from './lib/api';

// Query client utilities
export {
  queryClient,
  queryKeys,
  invalidateProjects,
  invalidateProject,
  invalidateJobs,
  invalidateJob,
  setProjectData,
  setJobData,
} from './lib/queryClient';

// Hooks
export * from './hooks';

// Providers
export { QueryProvider } from './providers/QueryProvider';
