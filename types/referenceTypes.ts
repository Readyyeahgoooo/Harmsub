// Types for Reference Track Analysis (YouTube and Audio)

export interface ReferenceChord {
  name: string;
  roman: string;
  function: 'T' | 'PD' | 'D' | 'AMB';
  beat: number;
  duration: number;
  selected: boolean;
  sectionName?: string; // Which section this chord belongs to (e.g., "Verse", "Chorus")
}

export interface ReferenceSection {
  name: string; // e.g., "Verse", "Chorus", "Bridge", "Main Loop"
  startBeat: number;
  endBeat: number;
  chords: ReferenceChord[];
  isLoop: boolean;
}

export interface ReferenceAnalysis {
  videoId: string; // Empty string for audio file uploads
  title: string;
  key: string;
  mode: 'major' | 'minor';
  tempo: number;
  timeSignature: string;
  sections: ReferenceSection[];
  uniqueProgression: ReferenceChord[]; // Condensed unique progressions (no repeated bars)
  confidence: number;
  analysisMethod: 'ai' | 'audio' | 'audio-ai' | 'manual';
}

export interface ReferenceSelectionState {
  selectedChords: ReferenceChord[];
  applyMode: 'modulate' | 'substitute' | 'inspire';
  targetSection: 'all' | 'beginning' | 'middle' | 'end';
}
