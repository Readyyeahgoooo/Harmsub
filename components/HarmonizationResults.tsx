'use client';

import { HarmonizationResult } from '@/types';
import { Download, Play } from 'lucide-react';

interface HarmonizationResultsProps {
  results: HarmonizationResult[];
  onExportMIDI?: (index: number) => void;
  onPlay?: (index: number) => void;
}

export default function HarmonizationResults({
  results,
  onExportMIDI,
  onPlay
}: HarmonizationResultsProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Harmonization Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generated harmonic progressions for your melody
        </p>
      </div>

      <div className="w-full space-y-6">
        {results.map((result, index) => (
          <div
            key={index}
            className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                Variation {index + 1}
              </h4>
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
                    Export MIDI
                  </button>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Melody:
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.originalMelody.notes.slice(0, 16).map((note, noteIndex) => (
                  <span
                    key={noteIndex}
                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm"
                  >
                    {note.name}
                  </span>
                ))}
                {result.originalMelody.notes.length > 16 && (
                  <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-sm">
                    +{result.originalMelody.notes.length - 16} more notes
                  </span>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested Chords:
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.suggestedChords.chords.slice(0, 8).map((chord, chordIndex) => (
                  <span
                    key={chordIndex}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {chord.name}
                  </span>
                ))}
                {result.suggestedChords.chords.length > 8 && (
                  <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-sm">
                    +{result.suggestedChords.chords.length - 8} more chords
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Key:</span>
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                  {result.suggestedChords.key}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time Signature:</span>
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                  {result.suggestedChords.timeSignature}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Melody Duration:</span>
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                  {result.originalMelody.duration.toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Notes:</span>
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                  {result.originalMelody.notes.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}