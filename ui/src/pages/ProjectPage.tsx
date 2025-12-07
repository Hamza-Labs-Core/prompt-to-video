import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProject,
  useGenerateDirection,
  useRefineDirection,
  useApproveDirection,
} from '../hooks/useProject';
import { DirectionEditor } from '../components/DirectionEditor';
import { CostEstimate } from '../components/CostEstimate';
import { RefineDialog } from '../components/RefineDialog';

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isRefineDialogOpen, setIsRefineDialogOpen] = useState(false);
  const [pollForDirection, setPollForDirection] = useState(false);

  const { data: project, isLoading, error, refetch } = useProject(id);
  const generateDirection = useGenerateDirection();
  const refineDirection = useRefineDirection();
  const approveDirection = useApproveDirection();

  // Auto-generate direction if project exists but has no direction
  useEffect(() => {
    if (project && !project.direction && !generateDirection.isPending && !pollForDirection) {
      setPollForDirection(true);
      generateDirection.mutate(project.id);
    }
  }, [project, generateDirection.isPending, pollForDirection]);

  // Poll for direction updates when generating
  useEffect(() => {
    if (pollForDirection && !project?.direction) {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [pollForDirection, project?.direction, refetch]);

  // Stop polling once direction is available
  useEffect(() => {
    if (project?.direction && pollForDirection) {
      setPollForDirection(false);
    }
  }, [project?.direction, pollForDirection]);

  const handleRegenerate = () => {
    if (id) {
      setPollForDirection(true);
      generateDirection.mutate(id);
    }
  };

  const handleRefine = (feedback: string) => {
    if (id) {
      refineDirection.mutate(
        { projectId: id, feedback },
        {
          onSuccess: () => {
            setIsRefineDialogOpen(false);
          },
        }
      );
    }
  };

  const handleApprove = () => {
    if (id) {
      approveDirection.mutate(id, {
        onSuccess: (data) => {
          // Navigate to job status page
          navigate(`/job/${data.jobId}`);
        },
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Project
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Project not found'}
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Generating direction state
  const isGenerating = generateDirection.isPending || (pollForDirection && !project.direction);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Projects</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{project.concept}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{project.aspectRatio}</span>
                <span>{project.targetDuration}s target</span>
                {project.style && (
                  <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    {project.style}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* No Direction Yet - Generating */}
        {!project.direction && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Generating Direction...
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The AI Director is analyzing your concept and creating a detailed shot list. This
                usually takes 10-30 seconds.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Creating scenes, shots, and camera directions...</p>
              </div>
            </div>
          </div>
        )}

        {/* Direction Ready */}
        {project.direction && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Direction Ready</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsRefineDialogOpen(true)}
                    disabled={refineDirection.isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Refine
                  </button>

                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Regenerate
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={approveDirection.isPending}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {approveDirection.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Approve & Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Direction Editor */}
              <div className="lg:col-span-2">
                <DirectionEditor direction={project.direction} />
              </div>

              {/* Sidebar - Cost Estimate */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <CostEstimate estimate={project.direction.estimatedCost} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Refine Dialog */}
      <RefineDialog
        isOpen={isRefineDialogOpen}
        onClose={() => setIsRefineDialogOpen(false)}
        onRefine={handleRefine}
        isRefining={refineDirection.isPending}
      />
    </div>
  );
}

export default ProjectPage;
