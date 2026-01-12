'use client';

import { ChordProgression } from '@/types';

interface ChordProgressionDisplayProps {
  progression: ChordProgression;
  onRegenerate?: () => void;
}

export default function ChordProgressionDisplay({
  progression,
  onRegenerate
}: ChordProgressionDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Chord Progression
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Key: {progression.key} | {progression.timeSignature}
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-max">
          {progression.chords.map((chord, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 px-6 py-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.floor(chord.startTime / 4) + 1}
              </span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {chord.name}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-300">
                {chord.notes.join(', ')}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-300">
                {chord.duration.toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      </div>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
        >
          Generate New Variation
        </button>
      )}
    </div>
  );
}