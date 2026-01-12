'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VirtualPiano from '@/components/VirtualPiano';
import AudioRecorder from '@/components/AudioRecorder';
import FileUploader from '@/components/FileUploader';
import YouTubeAnalyzer from '@/components/YouTubeAnalyzer';
import HarmonyControls, { HarmonySettings } from '@/components/HarmonyControls';
import HarmonizationResults from '@/components/HarmonizationResults';
import { Note, ChordProgression, Melody, HarmonizationResult, HarmonizationScore } from '@/types';
import { 
  noteToPC, 
  createChord, 
  chordToSymbol,
  generateFunctionalProgression,
  expandTemplate,
  findTemplatesByStyle,
  scoreProgression,
  voiceChord,
  voicingToNoteNames,
  getStylePack,
  Chord,
} from '@/lib/harmony';
import { analyzeYouTubeChords, suggestHarmonization, getRateLimitStatus } from '@/lib/ai';
import { Midi } from '@tonejs/midi';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [recordedNotes, setRecordedNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [youtubeChords, setYoutubeChords] = useState<string[]>([]);
  const [harmonizationResults, setHarmonizationResults] = useState<HarmonizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  
  const [harmonySettings, setHarmonySettings] = useState<HarmonySettings>({
    style: 'pop',
    distanceLevel: 1,
    voicingPreset: 'clear_spacious',
    tensionTolerance: 'medium',
    key: 'C',
    tempo: 120,
  });

  const noteToFrequency = (note: string): number => {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/([A-G]#?)(\d)/);
    if (!match) return A4;
    const [, name, octave] = match;
    const semitone = noteNames.indexOf(name) + (parseInt(octave) - 4) * 12;
    return A4 * Math.pow(2, semitone / 12);
  };

  const handlePianoRecordStart = () => {
    setIsRecording(true);
    setRecordedNotes([]);
    setError('');
  };

  const handlePianoRecordStop = () => {
    setIsRecording(false);
    if (recordedNotes.length > 0) {
      setCurrentStep(2);
    }
  };

  const handlePianoNotePlayed = (note: string, duration: number) => {
    if (!isRecording) return;
    const newNote: Note = {
      name: note,
      octave: parseInt(note.match(/\d+/)?.[0] || '4'),
      frequency: noteToFrequency(note),
      duration: duration || 0.5,
      startTime: Date.now() / 1000,
      pc: noteToPC(note),
    };
    setRecordedNotes(prev => [...prev, newNote]);
  };

  const handleNotesDetected = (notes: Array<{ note: string; time: number }>) => {
    const melodyNotes: Note[] = notes.map((note, index) => ({
      name: note.note,
      octave: parseInt(note.note.match(/\d+/)?.[0] || '4'),
      frequency: noteToFrequency(note.note),
      duration: index < notes.length - 1 ? notes[index + 1].time - note.time : 1,
      startTime: note.time,
      pc: noteToPC(note.note),
    }));
    setRecordedNotes(melodyNotes);
    if (melodyNotes.length > 0) setCurrentStep(2);
  };

  const handleFileUploaded = async (file: File, type: 'midi' | 'xml' | 'logic' | 'audio') => {
    setIsLoading(true);
    setError('');
    try {
      if (type === 'midi') {
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        const melodyNotes: Note[] = [];
        midi.tracks.forEach(track => {
          track.notes.forEach(midiNote => {
            melodyNotes.push({
              name: `${midiNote.name}${midiNote.octave}`,
              octave: midiNote.octave,
              frequency: noteToFrequency(`${midiNote.name}${midiNote.octave}`),
              duration: midiNote.duration,
              startTime: midiNote.time,
              pc: noteToPC(midiNote.name),
            });
          });
        });
        setRecordedNotes(melodyNotes.sort((a, b) => a.startTime - b.startTime));
        if (melodyNotes.length > 0) setCurrentStep(2);
      } else {
        setError('This file type is not fully supported yet. Try MIDI files.');
      }
    } catch (err) {
      setError('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeAnalyzed = async (videoId: string, title: string) => {
    setYoutubeVideoId(videoId);
    setIsLoading(true);
    setError('');
    
    try {
      const result = await analyzeYouTubeChords(title);
      if (result.success && result.chords.length > 0) {
        setYoutubeChords(result.chords);
        if (result.key) {
          setHarmonySettings(prev => ({ ...prev, key: result.key }));
        }
      }
    } catch (err) {
      console.error('YouTube analysis error:', err);
    } finally {
      setIsLoading(false);
      setCurrentStep(2);
    }
  };

  const generateHarmonizations = useCallback(async () => {
    if (recordedNotes.length === 0 && youtubeChords.length === 0) {
      setError('Please record a melody or analyze a YouTube video first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const keyRoot = noteToPC(harmonySettings.key);
      const stylePack = getStylePack(harmonySettings.style);
      const results: HarmonizationResult[] = [];
      const melody: Melody = {
        notes: recordedNotes,
        duration: recordedNotes.length > 0 
          ? recordedNotes[recordedNotes.length - 1].startTime - recordedNotes[0].startTime
          : 0,
        key: harmonySettings.key,
        tempo: harmonySettings.tempo,
      };

      // Generate 3 variations
      for (let i = 0; i < 3; i++) {
        let chords: Chord[];
        
        if (youtubeChords.length > 0 && i === 0) {
          // Use YouTube chords as base for first variation
          chords = youtubeChords.map(symbol => {
            const chord = createChord(noteToPC(symbol.replace(/[^A-G#b]/g, '') || 'C'), 
              symbol.includes('m') && !symbol.includes('maj') ? 'min7' : 'maj7');
            return chord;
          });
        } else {
          // Generate using harmony engine
          const templates = findTemplatesByStyle(harmonySettings.style);
          if (templates.length > 0 && i < templates.length) {
            chords = expandTemplate(templates[i % templates.length], keyRoot, harmonySettings.distanceLevel);
          } else {
            chords = generateFunctionalProgression(8, keyRoot, harmonySettings.distanceLevel);
          }
        }

        // Score the progression
        const melodySegments = recordedNotes.length > 0 
          ? chords.map((_, idx) => {
              const segmentNotes = recordedNotes.filter((_, ni) => 
                Math.floor(ni / (recordedNotes.length / chords.length)) === idx
              );
              return segmentNotes.map(n => n.pc || 0);
            })
          : chords.map(() => []);

        const scoring = scoreProgression(chords, melodySegments, keyRoot, harmonySettings.distanceLevel);
        
        // Convert to UI format
        const uiChords = chords.map((chord, idx) => ({
          name: chordToSymbol(chord),
          notes: voicingToNoteNames(voiceChord(chord, harmonySettings.voicingPreset)),
          duration: 2,
          startTime: idx * 2,
          roman: chord.roman,
          function: chord.function,
          distanceLevel: chord.distance_level,
        }));

        const score: HarmonizationScore = {
          chordFit: scoring.scores.reduce((sum, s) => sum + s.chord_fit, 0) / scoring.scores.length,
          transition: scoring.scores.reduce((sum, s) => sum + s.transition, 0) / scoring.scores.length,
          voiceLeading: scoring.scores.reduce((sum, s) => sum + s.voice_leading, 0) / scoring.scores.length,
          distancePenalty: scoring.scores.reduce((sum, s) => sum + s.distance_penalty, 0) / scoring.scores.length,
          total: scoring.averageScore,
        };

        results.push({
          id: `result-${i}-${Date.now()}`,
          originalMelody: melody,
          suggestedChords: {
            chords: uiChords,
            key: harmonySettings.key,
            timeSignature: '4/4',
            style: harmonySettings.style,
            tempo: harmonySettings.tempo,
          },
          score,
          voicing: harmonySettings.voicingPreset,
          style: harmonySettings.style,
        });
      }

      // Sort by score
      results.sort((a, b) => b.score.total - a.score.total);
      setHarmonizationResults(results);
      setCurrentStep(3);
    } catch (err) {
      console.error('Harmonization error:', err);
      setError('Error generating harmonizations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [recordedNotes, youtubeChords, harmonySettings]);

  const handleExportMIDI = (index: number) => {
    const result = harmonizationResults[index];
    if (!result) return;

    const midi = new Midi();
    midi.header.setTempo(result.suggestedChords.tempo || 120);

    // Melody track
    if (result.originalMelody.notes.length > 0) {
      const melodyTrack = midi.addTrack();
      melodyTrack.name = 'Melody';
      result.originalMelody.notes.forEach(note => {
        melodyTrack.addNote({
          name: note.name.replace(/\d+/, ''),
          octave: note.octave,
          duration: note.duration,
          time: note.startTime,
          velocity: 0.8,
        });
      });
    }

    // Chord track
    const chordTrack = midi.addTrack();
    chordTrack.name = 'Chords';
    result.suggestedChords.chords.forEach(chord => {
      chord.notes.forEach(noteName => {
        const match = noteName.match(/([A-G]#?)(-?\d)/);
        if (match) {
          chordTrack.addNote({
            name: match[1],
            octave: parseInt(match[2]),
            duration: chord.duration,
            time: chord.startTime,
            velocity: 0.6,
          });
        }
      });
    });

    const midiData = midi.toArray();
    const blob = new Blob([new Uint8Array(midiData)], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harmsub_${result.style}_${index + 1}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlay = (index: number) => {
    // TODO: Implement Tone.js playback
    alert(`Playing variation ${index + 1}. Full playback coming soon!`);
  };

  const rateLimitStatus = getRateLimitStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Harmsub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-Powered Harmony Substitution & Analysis
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze • Generate • Harmonize
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: 'Input' },
              { step: 2, label: 'Configure' },
              { step: 3, label: 'Results' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step}
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                  {label}
                </span>
                {step < 3 && (
                  <div className={`w-12 h-1 ml-2 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Rate Limit Status */}
        <div className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          AI requests: {rateLimitStatus.hourlyRemaining}/hr • {rateLimitStatus.dailyRemaining}/day remaining
        </div>

        {/* Step 1: Input */}
        {currentStep === 1 && (
          <Tabs defaultValue="piano" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="piano">🎹 Piano</TabsTrigger>
              <TabsTrigger value="audio">🎤 Audio</TabsTrigger>
              <TabsTrigger value="file">📁 File</TabsTrigger>
              <TabsTrigger value="youtube">📺 YouTube</TabsTrigger>
            </TabsList>

            <TabsContent value="piano" className="flex justify-center">
              <VirtualPiano
                onNotePlayed={handlePianoNotePlayed}
                onRecordStart={handlePianoRecordStart}
                onRecordStop={handlePianoRecordStop}
                isRecording={isRecording}
              />
            </TabsContent>

            <TabsContent value="audio" className="flex justify-center">
              <AudioRecorder
                onAudioRecorded={() => {}}
                onNotesDetected={handleNotesDetected}
              />
            </TabsContent>

            <TabsContent value="file" className="flex justify-center">
              <FileUploader onFileUploaded={handleFileUploaded} />
            </TabsContent>

            <TabsContent value="youtube" className="flex justify-center">
              <YouTubeAnalyzer onAnalyzed={handleYouTubeAnalyzed} />
            </TabsContent>
          </Tabs>
        )}

        {/* Step 2: Configure & Generate */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Recorded Notes Display */}
            {recordedNotes.length > 0 && (
              <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Recorded Melody ({recordedNotes.length} notes)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recordedNotes.slice(0, 24).map((note, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm"
                    >
                      {note.name}
                    </span>
                  ))}
                  {recordedNotes.length > 24 && (
                    <span className="px-2 py-1 text-gray-500 text-sm">
                      +{recordedNotes.length - 24} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* YouTube Chords Display */}
            {youtubeChords.length > 0 && (
              <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Reference Chords from YouTube
                </h3>
                <div className="flex flex-wrap gap-2">
                  {youtubeChords.map((chord, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Harmony Controls */}
            <HarmonyControls
              onSettingsChange={setHarmonySettings}
              initialSettings={harmonySettings}
            />

            {/* Generate Button */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={generateHarmonizations}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Harmonizations
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && harmonizationResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Harmonization Results
              </h2>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                ← Adjust Settings
              </button>
            </div>

            <HarmonizationResults
              results={harmonizationResults}
              onExportMIDI={handleExportMIDI}
              onPlay={handlePlay}
            />
          </div>
        )}
      </div>
    </div>
  );
}
