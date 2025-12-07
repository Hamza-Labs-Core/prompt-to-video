import React, { useState } from 'react';
import type { DirectedShot } from '../types';
import { cn } from '../lib/utils';

interface ShotCardProps {
  shot: DirectedShot;
  sceneId: number;
  onEdit?: (shot: DirectedShot) => void;
  status?: 'pending' | 'generating' | 'complete' | 'failed';
}

export function ShotCard({ shot, sceneId, onEdit, status = 'pending' }: ShotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedShot, setEditedShot] = useState<DirectedShot>(shot);

  const statusColors = {
    pending: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    generating: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    complete: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedShot);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedShot(shot);
    setIsEditing(false);
  };

  const truncate = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Compact Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex-shrink-0 pt-1">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {shot.id}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Shot {shot.id}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{shot.duration}s</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {shot.cameraMove.replace('_', ' ')}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded ml-auto', statusColors[status])}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {truncate(shot.motionPrompt, 80)}
          </p>
        </div>

        <div className="flex-shrink-0">
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {!isEditing ? (
            <>
              {/* View Mode */}
              <div className="space-y-4 pt-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Duration
                    </div>
                    <div className="text-gray-900 dark:text-white">{shot.duration} seconds</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Camera Move
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {shot.cameraMove.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Lighting
                    </div>
                    <div className="text-gray-900 dark:text-white">{shot.lighting}</div>
                  </div>
                  {shot.colorPalette && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Color Palette
                      </div>
                      <div className="text-gray-900 dark:text-white">{shot.colorPalette}</div>
                    </div>
                  )}
                  {shot.transitionIn && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Transition In
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        {shot.transitionIn.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {shot.transitionOut && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Transition Out
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        {shot.transitionOut.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompts */}
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Start Frame Prompt
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded p-3">
                    {shot.startPrompt}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    End Frame Prompt
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded p-3">
                    {shot.endPrompt}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Motion Prompt
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded p-3">
                    {shot.motionPrompt}
                  </div>
                </div>

                {/* Edit Button */}
                {onEdit && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      Edit Shot
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Start Frame Prompt
                  </label>
                  <textarea
                    value={editedShot.startPrompt}
                    onChange={(e) =>
                      setEditedShot({ ...editedShot, startPrompt: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    End Frame Prompt
                  </label>
                  <textarea
                    value={editedShot.endPrompt}
                    onChange={(e) => setEditedShot({ ...editedShot, endPrompt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Motion Prompt
                  </label>
                  <textarea
                    value={editedShot.motionPrompt}
                    onChange={(e) =>
                      setEditedShot({ ...editedShot, motionPrompt: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
