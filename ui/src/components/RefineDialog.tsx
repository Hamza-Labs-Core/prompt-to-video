import React, { useState } from 'react';

interface RefineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (feedback: string) => void;
  isRefining?: boolean;
}

export function RefineDialog({ isOpen, onClose, onRefine, isRefining = false }: RefineDialogProps) {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onRefine(feedback.trim());
      setFeedback('');
    }
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Refine Direction
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Describe the changes you'd like to make to the video direction. Be specific about
              scenes, shots, timing, or style adjustments.
            </p>

            <div className="mb-4">
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={8}
                placeholder="Example: Make the fire ignition scene longer, add more close-ups of the emblem, reduce the duration of the final reveal..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isRefining}
                required
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {feedback.length} characters
              </div>
            </div>

            {/* Examples */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
                Example Feedback:
              </div>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Extend Scene 1 by 5 seconds and add more dramatic lighting</li>
                <li>Replace the pan_left camera move in Shot 3 with a push_in for more intensity</li>
                <li>Add a transition between Scene 2 and Scene 3</li>
                <li>Make the color palette warmer throughout the video</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRefining}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRefining || !feedback.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRefining ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Refining...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refine Direction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
