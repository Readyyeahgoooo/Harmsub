// Core Types for Harmsub

export interface Note {
  name: string;
  octave: number;
  frequency: number;
  duration: number;
  startTime: number;
  pc?: number; // pitch class 0-11
}

export interface Melody {
  notes: Note[];
  duration: number;
  key?: string;
  tempo?: number;
}

// Enhanced Chord type (simplified version for UI)
export interface ChordUI {
  name: string;
  notes: string[];
  duration: number;
  startTime: number;
  roman?: string;
  function?: 'T' | 'PD' | 'D' | 'AMB';
  distanceLevel?: number;
}

export interface ChordProgression {
  chords: ChordUI[];
  key: string;
  timeSignature: string;
  style?: string;
  tempo?: number;
}

export interface YouTubeAnalysis {
  videoId: string;
  title: string;
  chordProgression: ChordProgression;
  structure: string;
  confidence?: number;
}

export interface HarmonizationResult {
  id: string;
  originalMelody: Melody;
  suggestedChords: ChordProgression;
  score: HarmonizationScore;
  voicing: string;
  style: string;
  midiData?: Uint8Array;
}

export interface HarmonizationScore {
  chordFit: number;
  transition: number;
  voiceLeading: number;
  distancePenalty: number;
  total: number;
}

// Style and settings
export interface HarmonizationSettings {
  style: string;
  distanceLevel: number;
  voicingPreset: string;
  tensionTolerance: 'low' | 'medium' | 'high';
  key: string;
  tempo: number;
}

// Input types
export type InputMethod = 'piano' | 'audio' | 'file' | 'youtube';

export interface FileUploadResult {
  type: 'midi' | 'xml' | 'logic' | 'audio';
  notes: Note[];
  tempo?: number;
  key?: string;
}

// AI Response types
export interface AIChordAnalysis {
  chords: string[];
  key: string;
  tempo?: number;
  confidence?: number;
}

export interface AIHarmonizationSuggestion {
  progressions: string[][];
  explanations: string[];
  style: string;
}

// Rate limit status
export interface RateLimitStatus {
  hourlyRemaining: number;
  dailyRemaining: number;
  resetTime?: number;
}

// Export/Import formats
export type ExportFormat = 'midi' | 'musicxml' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMelody: boolean;
  includeChords: boolean;
  voicing: string;
}
