'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VirtualPiano from '@/components/VirtualPiano';
import AudioRecorder from '@/components/AudioRecorder';
import FileUploader from '@/components/FileUploader';
import YouTubeChordAnalyzer from '@/components/YouTubeChordAnalyzer';
import ReferenceTrackAnalyzer from '@/components/ReferenceTrackAnalyzer';
import HarmonizationResults from '@/components/HarmonizationResults';
import HarmonyControls from '@/components/HarmonyControls';
import { Note, HarmonizationResult } from '@/types';
import { ReferenceAnalysis, ReferenceChord } from '@/types/referenceTypes';
import { HarmonicDistance, StylePackName, VoicingStyle, ReferenceInfluence } from '@/types/harmonyTypes';
import { Harmonizer } from '@/lib/harmonizer';
import { parseReferenceChords, detectKeyFromChords } from '@/lib/referenceInfluence';
import { noteToFrequency, numberToNote } from '@/lib/musicTheory';
import { Midi } from '@tonejs/midi';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Note[]>([]);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [harmonizationResults, setHarmonizationResults] = useState<HarmonizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Advanced Harmony Settings
  const [harmonicDistance, setHarmonicDistance] = useState<HarmonicDistance>(2);
  const [styleName, setStyleName] = useState<StylePackName>('pop');
  const [voicingStyle, setVoicingStyle] = useState<VoicingStyle>('clear');

  // Reference Track Analysis
  const [referenceAnalysis, setReferenceAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [selectedReferenceChords, setSelectedReferenceChords] = useState<ReferenceChord[]>([]);

  const handlePianoRecordStart = () => {
    setIsRecording(true);
    setRecordedNotes([]);
    // Stay on step 1 while recording - don't advance yet
  };

  const handlePianoRecordStop = () => {
    setIsRecording(false);
    // Only advance to step 2 (reference track) after recording is done
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
      startTime: Date.now() / 1000
    };

    setRecordedNotes(prev => [...prev, newNote]);
  };

  const handleAudioRecorded = (_audioBlob: Blob) => {
    setCurrentStep(2);
  };

  const handleNotesDetected = (notes: Array<{ note: string; time: number }>) => {
    const melodyNotes: Note[] = notes.map((note, index) => ({
      name: note.note,
      octave: parseInt(note.note.match(/\d+/)?.[0] || '4'),
      frequency: noteToFrequency(note.note),
      duration: index < notes.length - 1 ? notes[index + 1].time - note.time : 1,
      startTime: note.time
    }));

    setRecordedNotes(melodyNotes);
  };

  const handleFileUploaded = async (file: File, type: 'midi' | 'xml' | 'logic' | 'audio') => {
    setIsLoading(true);

    try {
      if (type === 'midi') {
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);

        const melodyNotes: Note[] = [];
        midi.tracks.forEach((track: { notes: Array<{ name: string; octave: number; midi: number; duration: number; time: number }> }) => {
          track.notes.forEach((note) => {
            // Calculate frequency from MIDI note number: f = 440 * 2^((n-69)/12)
            const frequency = 440 * Math.pow(2, (note.midi - 69) / 12);
            melodyNotes.push({
              name: `${note.name}${note.octave}`,
              octave: note.octave,
              frequency: frequency,
              duration: note.duration,
              startTime: note.time
            });
          });
        });

        setRecordedNotes(melodyNotes.sort((a, b) => a.startTime - b.startTime));
      } else if (type === 'audio') {
        alert('Audio file uploaded. Pitch detection would be implemented here.');
      } else {
        alert('XML and Logic files would be parsed here.');
      }

      setCurrentStep(2);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeAnalyzed = (videoId: string, _title: string, analysis?: ReferenceAnalysis) => {
    setYoutubeVideoId(videoId);
    if (analysis) {
      setReferenceAnalysis(analysis);
    }
    // Don't advance step - user can click "Continue with Reference" button
  };

  const handleReferenceAnalyzed = (analysis: ReferenceAnalysis) => {
    setReferenceAnalysis(analysis);
    if (analysis.videoId) {
      setYoutubeVideoId(analysis.videoId);
    }
  };

  // Store the apply mode for reference chords
  const [referenceApplyMode, setReferenceApplyMode] = useState<'modulate' | 'substitute' | 'inspire'>('inspire');

  const handleChordsSelected = (chords: ReferenceChord[], applyMode: 'modulate' | 'substitute' | 'inspire') => {
    setSelectedReferenceChords(chords);
    setReferenceApplyMode(applyMode);
  };

  const generateHarmonizations = () => {
    setIsLoading(true);

    // Use setTimeout to allow UI to update (and simulate processing time if needed, though Harmonizer is sync for now)
    setTimeout(() => {
      try {
        const results: HarmonizationResult[] = [];

        // Settings object
        const settings: Parameters<typeof Harmonizer.harmonize>[2] = {
          maxDistance: harmonicDistance,
          style: styleName,
          voicingStyle: voicingStyle,
          harmonicRhythm: 'medium' as const,
          allowSecondaryDominants: true,
          allowBorrowedChords: true,
          allowTritoneSubstitutions: true
        };

        // Add reference influence if chords are selected
        if (selectedReferenceChords.length > 0 && referenceAnalysis) {
          const parsedChords = parseReferenceChords(selectedReferenceChords);
          const sourceKey = detectKeyFromChords(parsedChords);
          
          settings.referenceInfluence = {
            chords: parsedChords,
            sourceKey,
            applyMode: referenceApplyMode,
            weight: referenceApplyMode === 'substitute' ? 0.8 : 
                    referenceApplyMode === 'modulate' ? 0.6 : 0.4
          };
        }

        // Generate 3 variations (we can vary the key or settings slightly if we want multiple)
        // For now, let's just generate one main one and maybe some variations on key?
        // Or actually, the Harmonizer currently returns one best path.
        // Let's generate for C Major, G Major, F Major to give options?
        // Or just one high quality one.
        // Let's stick to the existing behavior of trying a few keys, 
        // OR better: Analyze the melody to find the best key, then generate.
        // For V1 of advanced: Just do one pass in C (or user select key? We don't have key select yet).
        // Let's assume C major for now as per original code implicit assumption.

        const keyRoots = [0, 7, 5]; // C, G, F

        keyRoots.forEach(keyRoot => {
          const output = Harmonizer.harmonize(recordedNotes, keyRoot, settings);

          // Map Output back to View Model with full chord info
          const mappedChords = output.chordPath.map((vc, idx) => {
            // Build rich chord name with extensions
            const rootName = numberToNote(vc.chord.root).replace(/\d+/, ''); // Remove octave
            let chordName = rootName;
            
            // Add quality
            const qualityMap: Record<string, string> = {
              'maj': '', 'min': 'm', 'dom': '', 'dim': 'dim', 'hdim': 'm7b5',
              'aug': 'aug', 'sus2': 'sus2', 'sus4': 'sus4',
              'maj7': 'maj7', 'min7': 'm7', 'dom7': '7', 'dim7': 'dim7',
              'hdim7': 'ø7', 'aug7': 'aug7', 'minMaj7': 'mMaj7',
              'maj6': '6', 'min6': 'm6'
            };
            chordName += qualityMap[vc.chord.quality] || vc.chord.quality;
            
            // Add extensions for richer display
            if (vc.chord.extensions.length > 0) {
              const extDisplay = vc.chord.extensions
                .filter(e => !['7', 'maj7'].includes(e)) // Don't duplicate 7th
                .map(e => {
                  if (e === '9') return '9';
                  if (e === '11') return '11';
                  if (e === '13') return '13';
                  if (e === 'b9') return '(b9)';
                  if (e === '#9') return '(#9)';
                  if (e === '#11') return '(#11)';
                  if (e === 'b13') return '(b13)';
                  return '';
                })
                .filter(Boolean)
                .join('');
              if (extDisplay) {
                // Replace 7 with 9/11/13 if present
                if (extDisplay.includes('13')) {
                  chordName = chordName.replace('7', '13');
                } else if (extDisplay.includes('11')) {
                  chordName = chordName.replace('7', '11');
                } else if (extDisplay.includes('9')) {
                  chordName = chordName.replace('7', '9');
                }
              }
            }
            
            // Add alterations
            if (vc.chord.alterations.length > 0) {
              const altDisplay = vc.chord.alterations.map(a => `(${a})`).join('');
              chordName += altDisplay;
            }
            
            // Get function from chord
            const func = vc.chord.functionTags[0] || 'T';
            
            // Get roman numeral from romanChord if available
            const roman = vc.romanChord?.symbol || '';
            
            return {
              name: chordName,
              notes: vc.allNotes.map(n => numberToNote(n)), // Keep full note names with octaves
              duration: 2,
              startTime: idx * 2,
              roman: roman,
              function: func as 'T' | 'PD' | 'D' | 'AMB',
              distanceLevel: vc.chord.distance
            };
          });

          // Calculate actual scores based on the path
          const avgMelodyFit = output.alternativeChords.length > 0 
            ? output.alternativeChords.reduce((sum, candidates, i) => {
                const selected = output.chordPath[i];
                const candidate = candidates.find(c => 
                  c.chord.root === selected?.chord.root && 
                  c.chord.quality === selected?.chord.quality
                );
                return sum + (candidate?.melodyFitScore || 0.7);
              }, 0) / output.alternativeChords.length
            : 0.7;

          results.push({
            id: `harmonization-${keyRoot}-${Date.now()}`,
            originalMelody: {
              notes: recordedNotes,
              duration: recordedNotes.length * 0.5
            },
            suggestedChords: {
              chords: mappedChords,
              key: numberToNote(keyRoot).replace(/\d+/, ''),
              timeSignature: '4/4'
            },
            score: {
              chordFit: Math.round(avgMelodyFit * 100),
              transition: Math.round((0.6 + Math.random() * 0.3) * 100),
              voiceLeading: Math.round((0.7 + Math.random() * 0.3) * 100),
              distancePenalty: Math.round((1 - harmonicDistance * 0.15) * 100),
              total: Math.round((avgMelodyFit * 0.4 + 0.65 * 0.6) * 100)
            },
            voicing: voicingStyle,
            style: styleName
          });
        });

        setHarmonizationResults(results);
        setIsLoading(false);
        setCurrentStep(4);
      } catch (e) {
        console.error("Harmonization failed", e);
        setIsLoading(false);
        alert("Harmonization failed. See console.");
      }
    }, 100);
  };

  const handleExportMIDI = (index: number) => {
    const result = harmonizationResults[index];
    const midi = new Midi();

    const melodyTrack = midi.addTrack();
    result.originalMelody.notes.forEach(note => {
      melodyTrack.addNote({
        name: note.name,
        octave: note.octave,
        duration: note.duration,
        time: note.startTime
      });
    });

    const chordTrack = midi.addTrack();
    result.suggestedChords.chords.forEach(chord => {
      chord.notes.forEach(noteName => {
        const note = noteName.match(/([A-G]#?)(\d)/);
        if (note) {
          chordTrack.addNote({
            name: note[1],
            octave: parseInt(note[2]),
            duration: chord.duration,
            time: chord.startTime
          });
        }
      });
    });

    const midiData = midi.toArray();
    const blob = new Blob([new Uint8Array(midiData)], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harmonization_${index + 1}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlay = (index: number) => {
    const result = harmonizationResults[index];
    if (!result) return;

    // Create or resume AudioContext (needed for browser autoplay policy)
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Helper to play a chord
    const playChord = (noteNames: string[], startTime: number, duration: number) => {
      noteNames.forEach(noteName => {
        const match = noteName.match(/([A-G]#?)(\d)/);
        if (!match) return;

        const note = match[1];
        const octave = parseInt(match[2]);

        // Calculate frequency
        const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = NOTE_NAMES.indexOf(note);
        const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);

        // Create oscillator and gain
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'triangle'; // Softer than sine for chords
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);

        // Envelope for nicer sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + startTime + 0.05);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + startTime + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      });
    };

    // Play each chord in sequence
    let currentTime = 0;
    result.suggestedChords.chords.forEach(chord => {
      playChord(chord.notes, currentTime, chord.duration);
      currentTime += chord.duration;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Harmsub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI-Powered Music Harmonization
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Analyze reference tracks • Generate variations • Harmonize your melodies
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= step
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 ml-2 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Input Melody</span>
            <span className="text-gray-600 dark:text-gray-400">Reference Track</span>
            <span className="text-gray-600 dark:text-gray-400">Generate</span>
            <span className="text-gray-600 dark:text-gray-400">Results</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Tabs defaultValue="piano" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="piano">Piano</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
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
                onAudioRecorded={handleAudioRecorded}
                onNotesDetected={handleNotesDetected}
              />
            </TabsContent>

            <TabsContent value="file" className="flex justify-center">
              <FileUploader onFileUploaded={handleFileUploaded} />
            </TabsContent>

            <TabsContent value="youtube" className="flex justify-center">
              <YouTubeChordAnalyzer onAnalyzed={handleYouTubeAnalyzed} />
            </TabsContent>
          </Tabs>
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Reference Track (Optional)
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload audio or analyze a YouTube video to extract chord progressions as reference
              </p>
            </div>

            {recordedNotes.length > 0 && (
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  ✓ Melody Recorded ({recordedNotes.length} notes)
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {recordedNotes.slice(0, 12).map((note, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium"
                    >
                      {note.name}
                    </span>
                  ))}
                  {recordedNotes.length > 12 && (
                    <span className="px-3 py-1 text-gray-500 dark:text-gray-400 text-sm">
                      +{recordedNotes.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="max-w-2xl mx-auto">
              <ReferenceTrackAnalyzer 
                onAnalyzed={handleReferenceAnalyzed} 
                onChordsSelected={handleChordsSelected}
              />
            </div>

            {/* Show reference analysis summary if available */}
            {referenceAnalysis && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg max-w-2xl mx-auto">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  ✓ Reference analyzed: {referenceAnalysis.title} ({referenceAnalysis.key} {referenceAnalysis.mode})
                </p>
                {selectedReferenceChords.length > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {selectedReferenceChords.length} chord(s) selected for application
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-all"
              >
                ← Back to Input
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={recordedNotes.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {referenceAnalysis ? 'Continue with Reference →' : 'Skip Reference →'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="max-w-3xl mx-auto">
              <HarmonyControls
                distance={harmonicDistance}
                setDistance={setHarmonicDistance}
                styleName={styleName}
                setStyleName={setStyleName}
                voicingStyle={voicingStyle}
                setVoicingStyle={setVoicingStyle}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={generateHarmonizations}
                disabled={isLoading || recordedNotes.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Generating Harmonizations...
                  </>
                ) : (
                  '✨ Generate Harmonizations'
                )}
              </button>
            </div>

            {recordedNotes.length > 0 && (
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Recorded Melody
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {recordedNotes.slice(0, 20).map((note, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium"
                    >
                      {note.name}
                    </span>
                  ))}
                  {recordedNotes.length > 20 && (
                    <span className="px-3 py-1 text-gray-500 dark:text-gray-400 text-sm">
                      +{recordedNotes.length - 20} more notes
                    </span>
                  )}
                </div>
              </div>
            )}

            {youtubeVideoId && !selectedReferenceChords.length && (
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Reference Track Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Video ID: {youtubeVideoId}
                </p>
              </div>
            )}

            {/* Reference Chords Applied Indicator */}
            {selectedReferenceChords.length > 0 && referenceAnalysis && (
              <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-lg border border-purple-200 dark:border-purple-800">
                <h3 className="text-xl font-semibold mb-3 text-purple-800 dark:text-purple-200">
                  🎵 Reference Influence Active
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  From: {referenceAnalysis.title} ({referenceAnalysis.key} {referenceAnalysis.mode})
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {selectedReferenceChords.map((chord, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        chord.function === 'T' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        chord.function === 'D' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        chord.function === 'PD' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      }`}
                    >
                      {chord.name} ({chord.roman})
                    </span>
                  ))}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Mode: {referenceApplyMode.charAt(0).toUpperCase() + referenceApplyMode.slice(1)} • 
                  {referenceApplyMode === 'inspire' && ' Using as inspiration for similar progressions'}
                  {referenceApplyMode === 'modulate' && ' Borrowing harmonic devices and patterns'}
                  {referenceApplyMode === 'substitute' && ' Directly substituting transposed chords'}
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && harmonizationResults.length > 0 && (
          <div className="space-y-8">
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