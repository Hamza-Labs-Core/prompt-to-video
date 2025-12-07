import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobStatus } from '../hooks/useJobStatus';
import { GenerationProgress } from '../components/GenerationProgress';
import { SceneProgress } from '../components/SceneProgress';
import { VideoPlayer } from '../components/VideoPlayer';
import { DownloadOptions } from '../components/DownloadOptions';

const GeneratePage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, isLoading, isError, error, isComplete, isFailed } = useJobStatus({
    jobId: jobId || '',
    enabled: !!jobId,
  });

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Job ID Provided
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please provide a valid job ID to track generation progress.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading job status...</p>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Job
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'Unable to fetch job status. Please try again.'}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Video Generation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Job ID: <span className="font-mono text-sm">{job.id}</span>
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          <GenerationProgress job={job} />
        </div>

        {/* Final Video (when complete) */}
        {isComplete && job.finalVideoUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Final Video
            </h2>
            <VideoPlayer videoUrl={job.finalVideoUrl} className="mb-6" />
          </div>
        )}

        {/* Download Options (when complete) */}
        {isComplete && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Download Options
            </h2>
            <DownloadOptions job={job} />
          </div>
        )}

        {/* Error Message (when failed) */}
        {isFailed && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">
                  Generation Failed
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  {job.error || 'An unknown error occurred during video generation.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scene-by-Scene Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Scene Progress
          </h2>
          <div className="space-y-4">
            {job.scenes.map((scene) => (
              <SceneProgress
                key={scene.sceneId}
                scene={scene}
                sceneName={`Scene ${scene.sceneId}`}
              />
            ))}
          </div>
        </div>

        {/* Job Metadata */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <div className="font-semibold text-gray-900 dark:text-white">
                {job.status.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Progress:</span>
              <div className="font-semibold text-gray-900 dark:text-white">
                {job.progress}%
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <div className="font-semibold text-gray-900 dark:text-white">
                {new Date(job.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Updated:</span>
              <div className="font-semibold text-gray-900 dark:text-white">
                {new Date(job.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
