import React from 'react';
import type { VideoJobState } from '../types/job';

interface DownloadOptionsProps {
  job: VideoJobState;
}

async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download file. Please try again.');
  }
}

export function DownloadOptions({ job }: DownloadOptionsProps) {
  const handleDownloadFinal = () => {
    if (!job.finalVideoUrl) return;
    downloadFile(job.finalVideoUrl, `video-${job.id}.mp4`);
  };

  const handleDownloadClip = (sceneId: number, url: string) => {
    downloadFile(url, `scene-${sceneId}-${job.id}.mp4`);
  };

  const handleDownloadImage = (sceneId: number, url: string, type: 'start' | 'end') => {
    downloadFile(url, `scene-${sceneId}-${type}-${job.id}.jpg`);
  };

  const hasIndividualClips = job.scenes.some(scene => scene.videoUrl);

  return (
    <div className="space-y-4">
      {/* Final Video Download */}
      {job.finalVideoUrl && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-1">
          <div className="bg-white dark:bg-gray-900 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Final Video
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete compiled video with all scenes
                </p>
              </div>
              <button
                onClick={handleDownloadFinal}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP4
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Clips */}
      {hasIndividualClips && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Individual Clips
          </h3>
          <div className="space-y-2">
            {job.scenes.map((scene) => (
              scene.videoUrl && (
                <div
                  key={scene.sceneId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Scene {scene.sceneId}
                  </span>
                  <button
                    onClick={() => handleDownloadClip(scene.sceneId, scene.videoUrl!)}
                    className="px-4 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Individual Images */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Generated Images
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {job.scenes.filter(s => s.startImageUrl || s.endImageUrl).length * 2} images
          </span>
        </div>
        <div className="space-y-3">
          {job.scenes.map((scene) => (
            <div key={scene.sceneId} className="space-y-2">
              {(scene.startImageUrl || scene.endImageUrl) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Scene {scene.sceneId}
                  </div>
                  <div className="flex gap-2">
                    {scene.startImageUrl && (
                      <button
                        onClick={() => handleDownloadImage(scene.sceneId, scene.startImageUrl!, 'start')}
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Start Image
                      </button>
                    )}
                    {scene.endImageUrl && (
                      <button
                        onClick={() => handleDownloadImage(scene.sceneId, scene.endImageUrl!, 'end')}
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        End Image
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Future: Download All as ZIP */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-400">
              Download All Assets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Coming soon: Download all images and videos as a ZIP file
            </p>
          </div>
          <button
            disabled
            className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
}
