'use client';

import { useState, useCallback } from 'react';
import { Loader2, AlertCircle, Music, Check, RefreshCw, Sparkles } from 'lucide-react';
import { ReferenceAnalysis, ReferenceChord, ReferenceSection } from '@/types/referenceTypes';

interface YouTubeChordAnalyzerProps {
  onAnalyzed: (videoId: string, title: string, analysis?: ReferenceAnalysis) => void;
  onChordsSelected?: (chords: ReferenceChord[], applyMode: 'modulate' | 'substitute' | 'inspire') => void;
}

// Function color mapping
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

export default function YouTubeChordAnalyzer({ onAnalyzed, onChordsSelected }: YouTubeChordAnalyzerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoId, setVideoId] = useState('');
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [selectedChords, setSelectedChords] = useState<Set<number>>(new Set());
  const [applyMode, setApplyMode] = useState<'modulate' | 'substitute' | 'inspire'>('inspire');

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const fetchVideoInfo = async (videoId: string): Promise<string> => {
    // Try to get video title from oEmbed API (no API key needed)
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return data.title || 'Unknown Song';
      }
    } catch (e) {
      console.warn('Could not fetch video title:', e);
    }
    return 'Unknown Song';
  };

  const analyzeVideo = async () => {
    const extractedId = extractVideoId(youtubeUrl);
    
    if (!extractedId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    setIsLoading(true);
    setError('');
    setVideoId(extractedId);
    setSelectedChords(new Set());

    try {
      // Get video title first
      const title = await fetchVideoInfo(extractedId);

      // Call our AI analysis API
      const response = await fetch('/api/analyze-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: extractedId,
          title,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const analysisResult: ReferenceAnalysis = {
          videoId: extractedId,
          title,
          key: data.analysis.key || 'C',
          mode: data.analysis.mode || 'major',
          tempo: data.analysis.tempo || 120,
          timeSignature: data.analysis.timeSignature || '4/4',
          sections: data.analysis.sections || [],
          uniqueProgression: extractUniqueProgression(data.analysis.sections || []),
          confidence: data.analysis.confidence || 0.7,
          analysisMethod: data.analysis.analysisMethod || 'ai',
        };

        setAnalysis(analysisResult);
        onAnalyzed(extractedId, title, analysisResult);
      } else {
        const errorMsg = data.error || 'Analysis failed. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractUniqueProgression = (sections: ReferenceSection[]): ReferenceChord[] => {
    if (sections.length === 0) return [];
    
    // Get chords from the first section (usually the main loop)
    const mainSection = sections[0];
    return mainSection.chords.map((c) => ({
      ...c,
      selected: false,
    }));
  };

  const toggleChordSelection = useCallback((index: number) => {
    setSelectedChords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const selectAllChords = () => {
    if (analysis?.uniqueProgression) {
      setSelectedChords(new Set(analysis.uniqueProgression.map((_, i) => i)));
    }
  };

  const clearSelection = () => {
    setSelectedChords(new Set());
  };

  const applySelectedChords = () => {
    if (!analysis || !onChordsSelected) return;
    
    const selected = analysis.uniqueProgression
      .filter((_, i) => selectedChords.has(i))
      .map(c => ({ ...c, selected: true }));
    
    if (selected.length > 0) {
      onChordsSelected(selected, applyMode);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            YouTube Chord Analysis
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Analyze a song's chord progression and apply it to your harmonization
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          onKeyDown={(e) => e.key === 'Enter' && analyzeVideo()}
        />
        <button
          onClick={analyzeVideo}
          disabled={isLoading || !youtubeUrl}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Video Preview */}
      {videoId && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Song Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {analysis.title}
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  Key: {analysis.key} {analysis.mode}
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {analysis.tempo} BPM
                </span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  {Math.round(analysis.confidence * 100)}% confidence
                </span>
              </div>
            </div>

            {/* Chord Progression */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Detected Progression (click to select):
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllChords}
                    className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {analysis.uniqueProgression.map((chord, index) => (
                  <button
                    key={index}
                    onClick={() => toggleChordSelection(index)}
                    className={`relative px-4 py-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      FUNCTION_COLORS[chord.function || 'AMB']
                    } ${
                      selectedChords.has(index) 
                        ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' 
                        : ''
                    }`}
                  >
                    {selectedChords.has(index) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="font-bold text-lg block">{chord.name}</span>
                    <span className="text-xs opacity-80">{chord.roman}</span>
                    <span className="text-xs block opacity-60 mt-0.5">
                      {FUNCTION_LABELS[chord.function || 'AMB']}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Options */}
            {selectedChords.size > 0 && onChordsSelected && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apply Mode:
                  </span>
                  <div className="flex gap-2">
                    {(['inspire', 'modulate', 'substitute'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setApplyMode(mode)}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          applyMode === mode
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {applyMode === 'inspire' && '• Use selected chords as inspiration for similar progressions'}
                  {applyMode === 'modulate' && '• Modulate your melody to fit these chord changes'}
                  {applyMode === 'substitute' && '• Replace generated chords with selected reference chords'}
                </div>

                <button
                  onClick={applySelectedChords}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply {selectedChords.size} Chord{selectedChords.size > 1 ? 's' : ''} to Harmonization
                </button>
              </div>
            )}
          </div>

          {/* Function Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-400 border border-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Tonic</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Predominant</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-400 border border-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Dominant</span>
            </div>
          </div>

          {/* Re-analyze button */}
          <button
            onClick={analyzeVideo}
            disabled={isLoading}
            className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}
