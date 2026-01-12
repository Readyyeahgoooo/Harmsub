'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface VirtualPianoProps {
  onNotePlayed: (note: string, duration: number) => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  isRecording: boolean;
}

const OCTAVES = [3, 4, 5];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = [
  { note: 'C#', position: 0 },
  { note: 'D#', position: 1 },
  { note: 'F#', position: 3 },
  { note: 'G#', position: 4 },
  { note: 'A#', position: 5 },
];

const WHITE_KEY_WIDTH = 40;
const BLACK_KEY_WIDTH = 28;

export default function VirtualPiano({
  onNotePlayed,
  onRecordStart,
  onRecordStop,
  isRecording
}: VirtualPianoProps) {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const noteStartTimes = useRef<Map<string, number>>(new Map());
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Initialize Tone.js synth
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Tone.start();
        if (!synthRef.current) {
          synthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.8 },
          }).toDestination();
        }
        setIsAudioReady(true);
      } catch (e) {
        console.error('Failed to initialize audio:', e);
      }
    };

    initAudio();

    return () => {
      if (synthRef.current) {
        synthRef.current.releaseAll();
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  const playNote = useCallback(async (note: string, octave: number) => {
    const noteId = `${note}${octave}`;

    // Ensure audio context is started (required for user interaction)
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    // Initialize synth if needed
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.8 },
      }).toDestination();
    }

    // Play the note
    synthRef.current.triggerAttack(noteId);

    setActiveNotes(prev => new Set(prev).add(noteId));
    noteStartTimes.current.set(noteId, Date.now());
  }, []);

  const stopNote = useCallback((note: string, octave: number) => {
    const noteId = `${note}${octave}`;

    // Release the note
    if (synthRef.current) {
      synthRef.current.triggerRelease(noteId);
    }

    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });

    // Record the note if recording
    if (isRecording) {
      const startTime = noteStartTimes.current.get(noteId) || Date.now();
      const duration = (Date.now() - startTime) / 1000;
      onNotePlayed(noteId, duration);
      noteStartTimes.current.delete(noteId);
    }
  }, [isRecording, onNotePlayed]);

  const handleMouseDown = async (note: string, octave: number) => {
    await playNote(note, octave);
  };

  const handleMouseUp = (note: string, octave: number) => {
    stopNote(note, octave);
  };

  const handleMouseLeave = (note: string, octave: number) => {
    const noteId = `${note}${octave}`;
    if (activeNotes.has(noteId)) {
      stopNote(note, octave);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={isRecording ? onRecordStop : onRecordStart}
          className={`px-6 py-2 rounded-full font-medium transition-all ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
        >
          {isRecording ? '● Stop Recording' : '○ Record Melody'}
        </button>
        {isRecording && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Recording... Click keys to add notes
          </span>
        )}
        {!isAudioReady && (
          <span className="text-sm text-orange-500">
            Click anywhere to enable audio
          </span>
        )}
      </div>

      <div
        className="relative flex select-none"
        onClick={async () => {
          if (Tone.context.state !== 'running') {
            await Tone.start();
            setIsAudioReady(true);
          }
        }}
      >
        {OCTAVES.map((octave) => (
          <div
            key={octave}
            className="relative"
            style={{ width: WHITE_KEY_WIDTH * 7 }}
          >
            {/* White Keys */}
            <div className="flex">
              {WHITE_KEYS.map((note) => {
                const noteId = `${note}${octave}`;
                const isActive = activeNotes.has(noteId);
                return (
                  <div
                    key={noteId}
                    onMouseDown={() => handleMouseDown(note, octave)}
                    onMouseUp={() => handleMouseUp(note, octave)}
                    onMouseLeave={() => handleMouseLeave(note, octave)}
                    onTouchStart={(e) => { e.preventDefault(); handleMouseDown(note, octave); }}
                    onTouchEnd={() => handleMouseUp(note, octave)}
                    style={{ width: WHITE_KEY_WIDTH }}
                    className={`h-40 rounded-b-lg cursor-pointer transition-all border relative z-10 ${isActive
                        ? 'bg-blue-200 dark:bg-blue-700 border-blue-400'
                        : 'bg-white dark:bg-gray-200 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-[10px] font-medium text-gray-400 select-none pointer-events-none">
                        {note}{octave}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Black Keys */}
            {BLACK_KEYS.map(({ note, position }) => {
              const noteId = `${note}${octave}`;
              const isActive = activeNotes.has(noteId);
              const leftOffset = (WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2) + (position * WHITE_KEY_WIDTH);

              return (
                <div
                  key={noteId}
                  onMouseDown={() => handleMouseDown(note, octave)}
                  onMouseUp={() => handleMouseUp(note, octave)}
                  onMouseLeave={() => handleMouseLeave(note, octave)}
                  onTouchStart={(e) => { e.preventDefault(); handleMouseDown(note, octave); }}
                  onTouchEnd={() => handleMouseUp(note, octave)}
                  style={{
                    width: BLACK_KEY_WIDTH,
                    left: leftOffset,
                  }}
                  className={`absolute top-0 h-24 rounded-b-lg cursor-pointer transition-all z-20 ${isActive
                      ? 'bg-blue-600 dark:bg-blue-800'
                      : 'bg-gray-900 dark:bg-black hover:bg-gray-800'
                    }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Click on keys to play notes. Notes show labels for reference.
      </p>
    </div>
  );
}