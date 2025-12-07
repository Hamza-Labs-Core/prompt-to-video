/**
 * React Query hooks for project management
 * Handles project creation, fetching, directing, and refinement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys, invalidateProject, setProjectData } from '../lib/queryClient';
import type { Project, VideoDirection, VideoStyle, ProjectConfig } from '../types';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID is required');
      return api.getProject(projectId);
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch all projects (for future use)
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => api.listProjects(),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface CreateProjectParams {
  name: string;
  concept: string;
  targetDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  config: ProjectConfig;
  style?: VideoStyle;
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateProjectParams) => {
      return api.createProject(
        params.name,
        params.concept,
        params.targetDuration,
        params.aspectRatio,
        params.config,
        params.style
      );
    },
    onSuccess: (data) => {
      // Add to cache
      setProjectData(data.id, data);

      // Invalidate projects list
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.lists(),
      });
    },
  });
}

interface GenerateDirectionParams {
  projectId: string;
  config: ProjectConfig;
}

/**
 * Generate initial video direction
 */
export function useGenerateDirection() {
  return useMutation({
    mutationFn: async (params: GenerateDirectionParams) => {
      const direction = await api.generateDirection(params.projectId, params.config);

      return {
        projectId: params.projectId,
        direction,
      };
    },
    onSuccess: (data) => {
      // Invalidate the project to refetch with new direction
      invalidateProject(data.projectId);
    },
  });
}

interface RefineDirectionParams {
  projectId: string;
  feedback: string;
  config: ProjectConfig;
}

/**
 * Refine video direction based on feedback
 */
export function useRefineDirection() {
  return useMutation({
    mutationFn: async (params: RefineDirectionParams) => {
      const direction = await api.refineDirection(
        params.projectId,
        params.feedback,
        params.config
      );

      return {
        projectId: params.projectId,
        direction,
      };
    },
    onSuccess: (data) => {
      // Invalidate the project to refetch with refined direction
      invalidateProject(data.projectId);
    },
  });
}

interface ApproveDirectionParams {
  projectId: string;
}

/**
 * Approve the current direction
 */
export function useApproveDirection() {
  return useMutation({
    mutationFn: async (params: ApproveDirectionParams) => {
      await api.approveDirection(params.projectId);
      return { projectId: params.projectId };
    },
    onSuccess: (data) => {
      // Invalidate the project to refetch with approved status
      invalidateProject(data.projectId);
    },
  });
}

interface DeleteProjectParams {
  projectId: string;
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteProjectParams) => {
      await api.deleteProject(params.projectId);
      return { projectId: params.projectId };
    },
    onSuccess: (data) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(data.projectId),
      });

      // Invalidate projects list
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.lists(),
      });
    },
  });
}

// ============================================================================
// Compound Hooks
// ============================================================================

/**
 * Combined hook for managing a single project
 * Provides both query and mutation capabilities
 */
export function useProjectManager(projectId: string | undefined) {
  const project = useProject(projectId);
  const generateDirection = useGenerateDirection();
  const refineDirection = useRefineDirection();
  const approveDirection = useApproveDirection();
  const deleteProject = useDeleteProject();

  return {
    // Query state
    project: project.data,
    isLoading: project.isLoading,
    isError: project.isError,
    error: project.error,
    refetch: project.refetch,

    // Mutations
    generateDirection: {
      mutate: generateDirection.mutate,
      mutateAsync: generateDirection.mutateAsync,
      isLoading: generateDirection.isPending,
      isError: generateDirection.isError,
      error: generateDirection.error,
      isSuccess: generateDirection.isSuccess,
    },

    refineDirection: {
      mutate: refineDirection.mutate,
      mutateAsync: refineDirection.mutateAsync,
      isLoading: refineDirection.isPending,
      isError: refineDirection.isError,
      error: refineDirection.error,
      isSuccess: refineDirection.isSuccess,
    },

    approveDirection: {
      mutate: approveDirection.mutate,
      mutateAsync: approveDirection.mutateAsync,
      isLoading: approveDirection.isPending,
      isError: approveDirection.isError,
      error: approveDirection.error,
      isSuccess: approveDirection.isSuccess,
    },

    deleteProject: {
      mutate: deleteProject.mutate,
      mutateAsync: deleteProject.mutateAsync,
      isLoading: deleteProject.isPending,
      isError: deleteProject.isError,
      error: deleteProject.error,
      isSuccess: deleteProject.isSuccess,
    },

    // Helper states
    isDirecting: generateDirection.isPending || refineDirection.isPending,
    hasDirection: !!project.data?.direction,
  };
}
