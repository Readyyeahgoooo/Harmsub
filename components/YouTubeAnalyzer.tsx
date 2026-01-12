'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Youtube } from 'lucide-react';

interface YouTubeAnalyzerProps {
  onAnalyzed: (videoId: string, title: string) => void;
}

export default function YouTubeAnalyzer({ onAnalyzed }: YouTubeAnalyzerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoId, setVideoId] = useState('');
  const [chordProgression, setChordProgression] = useState<string[]>([]);

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

  const analyzeVideo = async () => {
    const extractedId = extractVideoId(youtubeUrl);
    
    if (!extractedId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    setIsLoading(true);
    setError('');
    setVideoId(extractedId);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockChords = generateMockChordProgression();
      setChordProgression(mockChords);

      const title = `Analyzed Video ${extractedId}`;
      onAnalyzed(extractedId, title);
    } catch (err) {
      setError('Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockChordProgression = (): string[] => {
    const progressions = [
      ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
      ['D', 'Bm', 'G', 'A', 'D', 'A', 'Bm', 'G'],
      ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am'],
      ['E', 'C#m', 'A', 'B', 'E', 'B', 'C#m', 'A']
    ];

    return progressions[Math.floor(Math.random() * progressions.length)];
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Youtube className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            YouTube Chord Analysis
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paste a YouTube link to analyze chord structure
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && analyzeVideo()}
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
              'Analyze'
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {videoId && (
        <div className="w-full max-w-md space-y-4">
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

          {chordProgression.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Detected Chord Progression:
              </h4>
              <div className="flex flex-wrap gap-2">
                {chordProgression.map((chord, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {chord}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                * This is a simulated analysis. In production, integrate with Chord AI API.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}