export interface Note {
  name: string;
  octave: number;
  frequency: number;
  duration: number;
  startTime: number;
}

export interface Chord {
  name: string;
  notes: string[];
  duration: number;
  startTime: number;
}

export interface Melody {
  notes: Note[];
  duration: number;
}

export interface ChordProgression {
  chords: Chord[];
  key: string;
  timeSignature: string;
}

export interface YouTubeAnalysis {
  videoId: string;
  title: string;
  chordProgression: ChordProgression;
  structure: string;
}

export interface HarmonizationResult {
  originalMelody: Melody;
  suggestedChords: ChordProgression;
  midiData?: Uint8Array;
}