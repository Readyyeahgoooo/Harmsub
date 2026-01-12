'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VirtualPiano from '@/components/VirtualPiano';
import AudioRecorder from '@/components/AudioRecorder';
import FileUploader from '@/components/FileUploader';
import YouTubeAnalyzer from '@/components/YouTubeAnalyzer';
import ChordProgressionDisplay from '@/components/ChordProgressionDisplay';
import HarmonizationResults from '@/components/HarmonizationResults';
import { Note, ChordProgression, Melody, HarmonizationResult } from '@/types';
import { noteToFrequency, generateChordProgression, romanToChord } from '@/lib/musicTheory';
import Midi from '@tonejs/midi';

export default function Home() {
  const [inputMethod, setInputMethod] = useState<'piano' | 'audio' | 'file' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Note[]>([]);
  const [detectedNotes, setDetectedNotes] = useState<Array<{ note: string; time: number }>>([]);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [referenceChordProgression, setReferenceChordProgression] = useState<ChordProgression | null>(null);
  const [harmonizationResults, setHarmonizationResults] = useState<HarmonizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handlePianoRecordStart = () => {
    setIsRecording(true);
    setRecordedNotes([]);
    setCurrentStep(2);
  };

  const handlePianoRecordStop = () => {
    setIsRecording(false);
    setCurrentStep(3);
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

  const handleAudioRecorded = (audioBlob: Blob) => {
    setCurrentStep(3);
  };

  const handleNotesDetected = (notes: Array<{ note: string; time: number }>) => {
    setDetectedNotes(notes);
    
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
        midi.tracks.forEach(track => {
          track.notes.forEach(note => {
            melodyNotes.push({
              name: `${note.name}${note.octave}`,
              octave: note.octave,
              frequency: note.frequency,
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
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeAnalyzed = (videoId: string, title: string) => {
    setYoutubeVideoId(videoId);
    setCurrentStep(3);
  };

  const generateHarmonizations = () => {
    setIsLoading(true);

    setTimeout(() => {
      const results: HarmonizationResult[] = [];
      const melody: Melody = {
        notes: recordedNotes,
        duration: recordedNotes.length > 0 
          ? recordedNotes[recordedNotes.length - 1].startTime - recordedNotes[0].startTime
          : 0
      };

      for (let i = 0; i < 3; i++) {
        const key = ['C', 'G', 'D', 'A', 'E'][i % 5];
        const progression = generateChordProgression(key, 8);
        
        const chords = progression.map((roman, index) => ({
          name: romanToChord(roman, key),
          notes: [romanToChord(roman, key)],
          duration: 2,
          startTime: index * 2
        }));

        results.push({
          originalMelody: melody,
          suggestedChords: {
            chords,
            key,
            timeSignature: '4/4'
          }
        });
      }

      setHarmonizationResults(results);
      setIsLoading(false);
      setCurrentStep(4);
    }, 2000);
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
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harmonization_${index + 1}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlay = (index: number) => {
    alert(`Playing harmonization ${index + 1}. Audio playback would be implemented here.`);
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 ml-2 ${
                      currentStep > step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
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
              <YouTubeAnalyzer onAnalyzed={handleYouTubeAnalyzed} />
            </TabsContent>
          </Tabs>
        )}

        {currentStep === 2 && inputMethod === 'piano' && (
          <div className="flex flex-col items-center gap-4">
            <VirtualPiano
              onNotePlayed={handlePianoNotePlayed}
              onRecordStart={handlePianoRecordStart}
              onRecordStop={handlePianoRecordStop}
              isRecording={isRecording}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notes recorded: {recordedNotes.length}
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8">
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

            {youtubeVideoId && (
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Reference Track Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Video ID: {youtubeVideoId}
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