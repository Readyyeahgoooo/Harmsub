'use client';

import { useState, useRef } from 'react';

interface VirtualPianoProps {
  onNotePlayed: (note: string, duration: number) => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  isRecording: boolean;
}

const OCTAVES = 3;
const START_OCTAVE = 3;
const WHITE_KEY_WIDTH = 40;
const BLACK_KEY_WIDTH = 24;

export default function VirtualPiano({
  onNotePlayed,
  onRecordStart,
  onRecordStop,
  isRecording
}: VirtualPianoProps) {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const noteStartTimes = useRef<Map<string, number>>(new Map());

  const getOscillator = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    return { osc, gain };
  };

  const noteToFrequency = (note: string, octave: number): number => {
    const A4 = 440;
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = NOTE_NAMES.indexOf(note);
    // A4 is the reference (MIDI note 69). Calculate semitones from A4.
    // A4 is at index 9 in octave 4.
    const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
    return A4 * Math.pow(2, semitonesFromA4 / 12);
  };

  const playNote = (note: string, octave: number) => {
    const noteId = `${note}${octave}`;
    const { osc, gain } = getOscillator();
    const frequency = noteToFrequency(note, octave);

    osc.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
    osc.start(audioContextRef.current!.currentTime);
    osc.stop(audioContextRef.current!.currentTime + 2);

    setActiveNotes(prev => new Set(prev).add(noteId));
    noteStartTimes.current.set(noteId, Date.now());

    if (isRecording) {
      onNotePlayed(noteId, 0);
    }
  };

  const stopNote = (note: string, octave: number) => {
    const noteId = `${note}${octave}`;
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });

    if (isRecording) {
      const startTime = noteStartTimes.current.get(noteId) || Date.now();
      const duration = (Date.now() - startTime) / 1000;
      onNotePlayed(noteId, duration);
    }
  };

  const whiteKeys: { note: string; octave: number }[] = [];
  const blackKeys: { note: string; octave: number; position: number }[] = [];

  for (let octave = START_OCTAVE; octave < START_OCTAVE + OCTAVES; octave++) {
    whiteKeys.push(
      { note: 'C', octave },
      { note: 'D', octave },
      { note: 'E', octave },
      { note: 'F', octave },
      { note: 'G', octave },
      { note: 'A', octave },
      { note: 'B', octave }
    );

    const octaveIndex = octave - START_OCTAVE;
    const basePosition = octaveIndex * WHITE_KEY_WIDTH * 7;

    blackKeys.push(
      { note: 'C#', octave, position: basePosition + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 },
      { note: 'D#', octave, position: basePosition + WHITE_KEY_WIDTH * 2 - BLACK_KEY_WIDTH / 2 },
      { note: 'F#', octave, position: basePosition + WHITE_KEY_WIDTH * 4 - BLACK_KEY_WIDTH / 2 },
      { note: 'G#', octave, position: basePosition + WHITE_KEY_WIDTH * 5 - BLACK_KEY_WIDTH / 2 },
      { note: 'A#', octave, position: basePosition + WHITE_KEY_WIDTH * 6 - BLACK_KEY_WIDTH / 2 }
    );
  }

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
            Recording... (max 1 min)
          </span>
        )}
      </div>

      <div className="relative flex">
        <div className="relative" style={{ width: WHITE_KEY_WIDTH * whiteKeys.length }}>
          {whiteKeys.map((key, index) => {
            const noteId = `${key.note}${key.octave}`;
            const isActive = activeNotes.has(noteId);
            return (
              <div
                key={noteId}
                className={`absolute top-0 w-10 h-40 rounded-b-lg cursor-pointer transition-all ${isActive
                    ? 'bg-blue-200 dark:bg-blue-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                style={{ left: index * WHITE_KEY_WIDTH }}
                onMouseDown={() => playNote(key.note, key.octave)}
                onMouseUp={() => stopNote(key.note, key.octave)}
                onMouseLeave={() => stopNote(key.note, key.octave)}
              />
            );
          })}
        </div>

        <div
          className="absolute top-0"
          style={{ width: WHITE_KEY_WIDTH * whiteKeys.length, height: '10rem' }}
        >
          {blackKeys.map((key) => {
            const noteId = `${key.note}${key.octave}`;
            const isActive = activeNotes.has(noteId);
            return (
              <div
                key={noteId}
                className={`absolute w-6 h-24 rounded-b-lg cursor-pointer transition-all z-10 ${isActive
                    ? 'bg-blue-300 dark:bg-blue-800'
                    : 'bg-gray-900 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-900'
                  }`}
                style={{ left: key.position }}
                onMouseDown={() => playNote(key.note, key.octave)}
                onMouseUp={() => stopNote(key.note, key.octave)}
                onMouseLeave={() => stopNote(key.note, key.octave)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}