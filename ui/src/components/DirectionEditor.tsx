import React, { useState } from 'react';
import type { VideoDirection, DirectedShot } from '../types';
import { ShotCard } from './ShotCard';

interface DirectionEditorProps {
  direction: VideoDirection;
  onShotEdit?: (sceneId: number, shotId: number, updatedShot: DirectedShot) => void;
}

export function DirectionEditor({ direction, onShotEdit }: DirectionEditorProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set([1]));

  const toggleScene = (sceneId: number) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const handleShotEdit = (sceneId: number, shot: DirectedShot) => {
    if (onShotEdit) {
      onShotEdit(sceneId, shot.id, shot);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {direction.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{direction.narrative}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{direction.totalDuration}s total</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <span>{direction.scenes.length} scenes</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>
              {direction.scenes.reduce((sum, scene) => sum + scene.shots.length, 0)} shots
            </span>
          </div>
        </div>
      </div>

      {/* Scene Tree */}
      <div className="space-y-6">
        {direction.scenes.map((scene) => {
          const isExpanded = expandedScenes.has(scene.id);
          const sceneDuration = scene.shots.reduce((sum, shot) => sum + shot.duration, 0);

          return (
            <div
              key={scene.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Scene Header */}
              <button
                onClick={() => toggleScene(scene.id)}
                className="w-full p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {scene.id}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Scene {scene.id}: {scene.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {scene.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {sceneDuration}s
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {scene.shots.length} shots
                    </span>
                    <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      {scene.mood}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Shots */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-3">
                    {scene.shots.map((shot) => (
                      <ShotCard
                        key={shot.id}
                        shot={shot}
                        sceneId={scene.id}
                        onEdit={(updatedShot) => handleShotEdit(scene.id, updatedShot)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
