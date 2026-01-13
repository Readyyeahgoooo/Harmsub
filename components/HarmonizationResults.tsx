'use client';

import { useState } from 'react';
import { HarmonizationResult } from '@/types';
import { Download, Play, Music, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface HarmonizationResultsProps {
  results: HarmonizationResult[];
  onExportMIDI?: (index: number) => void;
  onPlay?: (index: number) => void;
}

// Function color mapping - matching the original app's color scheme
const FUNCTION_COLORS: Record<string, string> = {
  T: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-400',
  PD: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-400',
  D: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-400',
  AMB: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-400',
};

const FUNCTION_LABELS: Record<string, string> = {
  T: 'Tonic',
  PD: 'Predom',
  D: 'Dom',
  AMB: '',
};

export default function HarmonizationResults({
  results,
  onExportMIDI,
  onPlay
}: HarmonizationResultsProps) {
  const [expandedVoicings, setExpandedVoicings] = useState<Record<number, boolean>>({});

  const toggleVoicing = (index: number) => {
    setExpandedVoicings(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                )}
                {onExportMIDI && (
                  <button
                    onClick={() => onExportMIDI(index)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all flex items-center gap-2"
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
            <div className="flex flex-wrap gap-3">
              {result.suggestedChords.chords.map((chord, chordIndex) => (
                <div
                  key={chordIndex}
                  className={`px-4 py-3 rounded-lg border-2 ${FUNCTION_COLORS[chord.function || 'AMB']} flex flex-col items-center min-w-[90px] transition-all hover:scale-105`}
                >
                  <span className="font-bold text-lg">{chord.name}</span>
                  {chord.roman && (
                    <span className="text-xs opacity-80 mt-0.5">{chord.roman}</span>
                  )}
                  {chord.function && FUNCTION_LABELS[chord.function] && (
                    <span className="text-xs mt-1 opacity-60 font-medium">
                      {FUNCTION_LABELS[chord.function]}
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

          {/* Voicing Details - Collapsible */}
          {result.suggestedChords.chords.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleVoicing(index)}
                className="w-full p-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {expandedVoicings[index] ? (
                    <ChevronUp className="w-4 h-4 text-purple-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-purple-500" />
                  )}
                  View Voicing Details
                </span>
                <span className="text-xs text-gray-500">
                  {result.suggestedChords.chords.length} chords
                </span>
              </button>
              
              {expandedVoicings[index] && (
                <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.suggestedChords.chords.map((chord, i) => (
                    <div 
                      key={i} 
                      className={`text-sm rounded-lg p-3 border ${FUNCTION_COLORS[chord.function || 'AMB']}`}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {chord.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-mono">
                        {chord.notes.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Function Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-400 border border-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Tonic (T) - Home/Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Predominant (PD) - Tension Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400 border border-red-500"></div>
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
