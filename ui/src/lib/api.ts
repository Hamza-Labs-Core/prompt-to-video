/**
 * API Client for prompt-to-video backend
 * Handles all HTTP communication with the Cloudflare Worker
 */

import type {
  Project,
  VideoDirection,
  VideoJobState,
  VideoStyle,
  ProjectConfig,
  ApiResponse,
  ApiError,
  CreateProjectResponse,
  GetProjectResponse,
  GenerateDirectionResponse,
  RefineDirectionResponse,
  ApproveDirectionResponse,
  StartGenerationResponse,
  GetJobStatusResponse,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// ============================================================================
// Error Handling
// ============================================================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class NetworkError extends ApiClientError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiClientError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ServerError extends ApiClientError {
  constructor(message: string, public statusCode: number) {
    super(message, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json() as ApiResponse<never>;
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If we can't parse JSON, use the status text
    }

    if (response.status >= 500) {
      throw new ServerError(errorMessage, response.status);
    } else if (response.status >= 400) {
      throw new ValidationError(errorMessage);
    }

    throw new ApiClientError(errorMessage);
  }

  try {
    const data = await response.json() as ApiResponse<T>;

    if (!data.success) {
      throw new ApiClientError(data.error || 'Unknown error occurred');
    }

    if (data.data === undefined) {
      throw new ApiClientError('Response missing data field');
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError('Failed to parse response JSON');
  }
}

async function fetchWithConfig<T>(
  endpoint: string,
  options: RequestInit = {},
  config?: ProjectConfig
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If config is provided, include it in the request body
  let body = options.body;
  if (config && options.method === 'POST') {
    const existingBody = options.body ? JSON.parse(options.body as string) : {};
    body = JSON.stringify({
      ...existingBody,
      config,
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new NetworkError('Network request failed. Please check your connection.');
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

// ============================================================================
// API Client
// ============================================================================

export const api = {
  /**
   * Create a new video project
   */
  async createProject(
    name: string,
    concept: string,
    targetDuration: number,
    aspectRatio: '16:9' | '9:16' | '1:1',
    config: ProjectConfig,
    style?: VideoStyle
  ): Promise<Project> {
    return fetchWithConfig<Project>(
      '/api/projects',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          concept,
          style,
          targetDuration,
          aspectRatio,
        }),
      },
      config
    );
  },

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Project> {
    return fetchWithConfig<Project>(`/api/projects/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Generate video direction for a project
   */
  async generateDirection(projectId: string, config: ProjectConfig): Promise<VideoDirection> {
    return fetchWithConfig<VideoDirection>(
      `/api/projects/${projectId}/direct`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      config
    );
  },

  /**
   * Refine video direction based on feedback
   */
  async refineDirection(
    projectId: string,
    feedback: string,
    config: ProjectConfig
  ): Promise<VideoDirection> {
    return fetchWithConfig<VideoDirection>(
      `/api/projects/${projectId}/refine`,
      {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      },
      config
    );
  },

  /**
   * Approve the current direction and lock it in
   */
  async approveDirection(projectId: string): Promise<void> {
    await fetchWithConfig<{ approved: boolean }>(
      `/api/projects/${projectId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },

  /**
   * Start video generation for an approved project
   */
  async startGeneration(projectId: string, config: ProjectConfig): Promise<{ jobId: string }> {
    return fetchWithConfig<{ jobId: string }>(
      `/api/projects/${projectId}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      config
    );
  },

  /**
   * Get the status of a generation job
   */
  async getJobStatus(jobId: string): Promise<VideoJobState> {
    return fetchWithConfig<VideoJobState>(`/api/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * List all projects (for future use)
   */
  async listProjects(): Promise<Project[]> {
    return fetchWithConfig<Project[]>('/api/projects', {
      method: 'GET',
    });
  },

  /**
   * Delete a project (for future use)
   */
  async deleteProject(id: string): Promise<void> {
    await fetchWithConfig<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Export types for convenience
// ============================================================================

export type { ApiError, ApiResponse };
