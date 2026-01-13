'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Loader2, AlertCircle, Music, Check, RefreshCw, Sparkles, 
  Upload, FileAudio, Youtube 
} from 'lucide-react';
import { ReferenceAnalysis, ReferenceChord, ReferenceSection } from '@/types/referenceTypes';

interface ReferenceTrackAnalyzerProps {
  onAnalyzed: (analysis: ReferenceAnalysis) => void;
  onChordsSelected?: (chords: ReferenceChord[], applyMode: 'modulate' | 'substitute' | 'inspire') => void;
}

// Function color mapping
const FUNCTION_COLORS: Record<string, string> = {
  T: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-400',
  PD: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-400',
  D: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-400',
  AMB: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-400',
};

const FUNCTION_LABELS: Record<string, string> = {
  T: 'Tonic',
  PD: 'Predom',
  D: 'Dom',
  AMB: 'Ambig',
};

type InputMode = 'audio' | 'youtube';

export default function ReferenceTrackAnalyzer({ 
  onAnalyzed, 
  onChordsSelected 
}: ReferenceTrackAnalyzerProps) {
  const [inputMode, setInputMode] = useState<InputMode>('audio');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [selectedChords, setSelectedChords] = useState<Set<number>>(new Set());
  const [applyMode, setApplyMode] = useState<'modulate' | 'substitute' | 'inspire'>('inspire');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [chordsApplied, setChordsApplied] = useState(false);

  // Audio file upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum 25MB.`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadedFileName(file.name);
    setSelectedChords(new Set());

    try {
      // Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Send to server-side API (API key is safe on server)
      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Data,
          format: file.name.split('.').pop()?.toLowerCase() || 'mp3',
          fileName: file.name,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const analysisResult = buildAnalysisResult(data.analysis, file.name, 'audio');
        setAnalysis(analysisResult);
        onAnalyzed(analysisResult);
      } else {
        const errorMsg = data.error || 'Audio analysis failed. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Audio analysis error:', err);
      setError('Failed to analyze audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onAnalyzed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.webm', '.aac']
    },
    multiple: false,
    disabled: isLoading,
  });

  // YouTube URL handling
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

  const analyzeYouTube = async () => {
    const extractedId = extractVideoId(youtubeUrl);
    
    if (!extractedId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSelectedChords(new Set());

    try {
      const title = await fetchVideoInfo(extractedId);

      // Call server-side API (API key safe on server)
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
        const analysisResult = buildAnalysisResult(data.analysis, title, 'ai', extractedId);
        setAnalysis(analysisResult);
        onAnalyzed(analysisResult);
      } else {
        setError(data.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('YouTube analysis error:', err);
      setError('Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build standardized analysis result
  const buildAnalysisResult = (
    rawAnalysis: Record<string, unknown>,
    title: string,
    method: 'audio' | 'ai' | 'manual',
    videoId?: string
  ): ReferenceAnalysis => {
    const sections = (rawAnalysis.sections as ReferenceSection[]) || [];
    return {
      videoId: videoId || '',
      title,
      key: (rawAnalysis.key as string) || 'C',
      mode: (rawAnalysis.mode as 'major' | 'minor') || 'major',
      tempo: (rawAnalysis.tempo as number) || 120,
      timeSignature: (rawAnalysis.timeSignature as string) || '4/4',
      sections,
      uniqueProgression: (rawAnalysis.uniqueProgression as ReferenceChord[]) || extractUniqueProgression(sections),
      confidence: (rawAnalysis.confidence as number) || 0.7,
      analysisMethod: method,
    };
  };

  const extractUniqueProgression = (sections: ReferenceSection[]): ReferenceChord[] => {
    if (sections.length === 0) return [];
    const mainSection = sections[0];
    return mainSection.chords.map((c) => ({
      ...c,
      selected: false,
    }));
  };

  const selectAllChords = () => {
    if (analysis?.uniqueProgression) {
      setSelectedChords(new Set(analysis.uniqueProgression.map((_, i) => i)));
      setChordsApplied(false);
    }
  };

  const clearSelection = () => {
    setSelectedChords(new Set());
    setChordsApplied(false);
  };

  const applySelectedChords = () => {
    if (!analysis || !onChordsSelected) return;
    
    const selected = analysis.uniqueProgression
      .filter((_, i) => selectedChords.has(i))
      .map(c => ({ ...c, selected: true }));
    
    if (selected.length > 0) {
      onChordsSelected(selected, applyMode);
      setChordsApplied(true);
    }
  };

  // Reset applied state when selection changes
  const toggleChordSelectionWithReset = useCallback((index: number) => {
    setChordsApplied(false);
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

  const resetAnalysis = () => {
    setAnalysis(null);
    setSelectedChords(new Set());
    setError('');
    setUploadedFileName('');
    setYoutubeUrl('');
    setChordsApplied(false);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Reference Track Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload audio or paste YouTube URL to extract chord progressions
        </p>
      </div>

      {/* Input Mode Tabs */}
      {!analysis && (
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setInputMode('audio')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              inputMode === 'audio'
                ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            Audio File
          </button>
          <button
            onClick={() => setInputMode('youtube')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              inputMode === 'youtube'
                ? 'bg-white dark:bg-gray-700 shadow text-red-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Youtube className="w-4 h-4" />
            YouTube
          </button>
        </div>
      )}

      {/* Audio Upload */}
      {!analysis && inputMode === 'audio' && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Analyzing audio with Gemini...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {uploadedFileName}
              </p>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-purple-500" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Drop your audio file here...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <FileAudio className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drop audio file or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  MP3, WAV, OGG, M4A, FLAC supported
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* YouTube Input */}
      {!analysis && inputMode === 'youtube' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            onKeyDown={(e) => e.key === 'Enter' && analyzeYouTube()}
            disabled={isLoading}
          />
          <button
            onClick={analyzeYouTube}
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
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Song Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 mr-4">
                {analysis.title}
              </h4>
              <div className="flex items-center gap-2 text-sm flex-shrink-0">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  {analysis.key} {analysis.mode}
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {analysis.tempo} BPM
                </span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  {Math.round(analysis.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Chord Progression - Summarized unique progressions */}
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
                    onClick={() => toggleChordSelectionWithReset(index)}
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
                  {applyMode === 'inspire' && '• Use selected chords as inspiration for similar progressions in your key'}
                  {applyMode === 'modulate' && '• Borrow harmonic devices and modulate your progression to match'}
                  {applyMode === 'substitute' && '• Directly substitute with transposed versions of selected chords'}
                </div>

                {chordsApplied ? (
                  <div className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    ✓ {selectedChords.size} Chord{selectedChords.size > 1 ? 's' : ''} Applied! Click "Continue with Reference" below.
                  </div>
                ) : (
                  <button
                    onClick={applySelectedChords}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply {selectedChords.size} Chord{selectedChords.size > 1 ? 's' : ''} to Harmonization
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Function Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-400 border border-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Tonic (T)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Predominant (PD)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-400 border border-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Dominant (D)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-400 border border-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Ambiguous</span>
            </div>
          </div>

          {/* Reset / Re-analyze */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetAnalysis}
              className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Analyze Different Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
