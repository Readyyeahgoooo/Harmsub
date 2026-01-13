// Types for YouTube Reference Track Analysis

export interface ReferenceChord {
  name: string;
  roman: string;
  function: 'T' | 'PD' | 'D' | 'AMB';
  beat: number;
  duration: number;
  selected: boolean;
}

export interface ReferenceSection {
  name: string; // e.g., "Verse", "Chorus", "Bridge"
  startBeat: number;
  endBeat: number;
  chords: ReferenceChord[];
  isLoop: boolean;
}

export interface ReferenceAnalysis {
  videoId: string;
  title: string;
  key: string;
  mode: 'major' | 'minor';
  tempo: number;
  timeSignature: string;
  sections: ReferenceSection[];
  uniqueProgression: ReferenceChord[]; // Condensed unique loop
  confidence: number;
  analysisMethod: 'ai' | 'audio' | 'manual';
}

export interface ReferenceSelectionState {
  selectedChords: ReferenceChord[];
  applyMode: 'modulate' | 'substitute' | 'inspire';
  targetSection: 'all' | 'beginning' | 'middle' | 'end';
}
