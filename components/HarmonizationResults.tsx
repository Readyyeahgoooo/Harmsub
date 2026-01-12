'use client';

import { HarmonizationResult } from '@/types';
import { Download, Play, Music, TrendingUp } from 'lucide-react';

interface HarmonizationResultsProps {
  results: HarmonizationResult[];
  onExportMIDI?: (index: number) => void;
  onPlay?: (index: number) => void;
}

// Function color mapping
const FUNCTION_COLORS: Record<string, string> = {
  T: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300',
  PD: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300',
  D: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300',
  AMB: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300',
};

export default function HarmonizationResults({
  results,
  onExportMIDI,
  onPlay
}: HarmonizationResultsProps) {
  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div
          key={result.id}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {result.style.charAt(0).toUpperCase() + result.style.slice(1)} Variation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Key: {result.suggestedChords.key} • {result.voicing.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {onPlay && (
                  <button
                    onClick={() => onPlay(index)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                )}
                {onExportMIDI && (
                  <button
                    onClick={() => onExportMIDI(index)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    MIDI
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chord Progression */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Chord Progression
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.suggestedChords.chords.map((chord, chordIndex) => (
                <div
                  key={chordIndex}
                  className={`px-4 py-2 rounded-lg border ${FUNCTION_COLORS[chord.function || 'AMB']} flex flex-col items-center min-w-[80px]`}
                >
                  <span className="font-bold text-lg">{chord.name}</span>
                  {chord.roman && (
                    <span className="text-xs opacity-75">{chord.roman}</span>
                  )}
                  {chord.function && (
                    <span className="text-xs mt-1 opacity-60">
                      {chord.function === 'T' ? 'Tonic' : chord.function === 'PD' ? 'Predom' : chord.function === 'D' ? 'Dom' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Score Breakdown
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ScoreBar label="Total" value={result.score.total} color="purple" />
              <ScoreBar label="Chord Fit" value={result.score.chordFit} color="blue" />
              <ScoreBar label="Transition" value={result.score.transition} color="green" />
              <ScoreBar label="Voice Leading" value={result.score.voiceLeading} color="yellow" />
              <ScoreBar label="Distance" value={result.score.distancePenalty} color="red" />
            </div>
          </div>

          {/* Voicing Details */}
          {result.suggestedChords.chords.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600">
                  View Voicing Details
                </summary>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {result.suggestedChords.chords.slice(0, 8).map((chord, i) => (
                    <div key={i} className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{chord.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                        {chord.notes.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Function Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Tonic (T) - Home/Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Predominant (PD) - Tension Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Dominant (D) - Wants Resolution</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Score bar component
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
