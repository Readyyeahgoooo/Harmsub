// Voicing Engine based on Rulebook §13

import { Chord, getChordPCs, CHORD_INTERVALS, ChordQuality } from './chordModel';

export type VoicingPreset = 
  | 'clear_spacious' 
  | 'rootless_a' 
  | 'rootless_b' 
  | 'quartal' 
  | 'neosoul' 
  | 'satb' 
  | 'cinematic_pads';

export interface VoicingConfig {
  preset: VoicingPreset;
  range: { low: number; high: number };
  doubling: 'root' | 'fifth' | 'none';
  spread: 'close' | 'open' | 'drop2' | 'drop3';
  bass_separation: number;
}

// Default voicing configurations
export const VOICING_CONFIGS: Record<VoicingPreset, VoicingConfig> = {
  clear_spacious: {
    preset: 'clear_spacious',
    range: { low: 48, high: 84 },
    doubling: 'root',
    spread: 'open',
    bass_separation: 12,
  },
  rootless_a: {
    preset: 'rootless_a',
    range: { low: 52, high: 72 },
    doubling: 'none',
    spread: 'close',
    bass_separation: 0,
  },
  rootless_b: {
    preset: 'rootless_b',
    range: { low: 52, high: 72 },
    doubling: 'none',
    spread: 'close',
    bass_separation: 0,
  },
  quartal: {
    preset: 'quartal',
    range: { low: 48, high: 79 },
    doubling: 'none',
    spread: 'open',
    bass_separation: 10,
  },
  neosoul: {
    preset: 'neosoul',
    range: { low: 48, high: 76 },
    doubling: 'none',
    spread: 'close',
    bass_separation: 12,
  },
  satb: {
    preset: 'satb',
    range: { low: 40, high: 79 },
    doubling: 'root',
    spread: 'close',
    bass_separation: 12,
  },
  cinematic_pads: {
    preset: 'cinematic_pads',
    range: { low: 36, high: 84 },
    doubling: 'fifth',
    spread: 'open',
    bass_separation: 24,
  },
};

// Generate voicing for a chord
export function voiceChord(chord: Chord, preset: VoicingPreset, bassNote?: number): number[] {
  const config = VOICING_CONFIGS[preset];
  const pcs = getChordPCs(chord);
  
  switch (preset) {
    case 'clear_spacious':
      return voiceClearSpacious(chord, pcs, config, bassNote);
    case 'rootless_a':
      return voiceRootlessA(chord, pcs, config);
    case 'rootless_b':
      return voiceRootlessB(chord, pcs, config);
    case 'quartal':
      return voiceQuartal(chord, pcs, config, bassNote);
    case 'neosoul':
      return voiceNeosoul(chord, pcs, config, bassNote);
    case 'satb':
      return voiceSATB(chord, pcs, config, bassNote);
    case 'cinematic_pads':
      return voiceCinematic(chord, pcs, config, bassNote);
    default:
      return voiceClearSpacious(chord, pcs, config, bassNote);
  }
}

// Clear/Spacious voicing (open position)
function voiceClearSpacious(chord: Chord, pcs: number[], config: VoicingConfig, bassNote?: number): number[] {
  const notes: number[] = [];
  const bass = bassNote ?? (chord.bass_pc ?? chord.root_pc) + 36;
  notes.push(bass);
  
  // Add root an octave up if doubling
  if (config.doubling === 'root') {
    notes.push(bass + 12);
  }
  
  // Spread other notes in open position
  let currentOctave = 4;
  for (let i = 1; i < pcs.length; i++) {
    let note = pcs[i] + (currentOctave * 12);
    while (note < config.range.low) note += 12;
    while (note > config.range.high) note -= 12;
    
    // Ensure ascending
    while (notes.length > 0 && note <= notes[notes.length - 1]) {
      note += 12;
    }
    
    if (note <= config.range.high) {
      notes.push(note);
    }
    currentOctave++;
  }
  
  return notes.sort((a, b) => a - b);
}

// Rootless A voicing (3-7-9-5 or 3-5-7-9)
function voiceRootlessA(chord: Chord, pcs: number[], config: VoicingConfig): number[] {
  if (pcs.length < 4) return voiceClearSpacious(chord, pcs, config);
  
  const root = chord.root_pc;
  const third = (root + (chord.quality.includes('min') ? 3 : 4)) % 12;
  const seventh = (root + (chord.quality === 'maj7' ? 11 : 10)) % 12;
  const ninth = (root + 2) % 12;
  const fifth = (root + 7) % 12;
  
  const baseOctave = 5;
  return [
    third + baseOctave * 12,
    seventh + baseOctave * 12,
    ninth + (baseOctave + 1) * 12,
    fifth + (baseOctave + 1) * 12,
  ].filter(n => n >= config.range.low && n <= config.range.high);
}

// Rootless B voicing (7-9-3-5 or 7-3-5-9)
function voiceRootlessB(chord: Chord, pcs: number[], config: VoicingConfig): number[] {
  if (pcs.length < 4) return voiceClearSpacious(chord, pcs, config);
  
  const root = chord.root_pc;
  const third = (root + (chord.quality.includes('min') ? 3 : 4)) % 12;
  const seventh = (root + (chord.quality === 'maj7' ? 11 : 10)) % 12;
  const ninth = (root + 2) % 12;
  const fifth = (root + 7) % 12;
  
  const baseOctave = 4;
  return [
    seventh + baseOctave * 12,
    ninth + (baseOctave + 1) * 12,
    third + (baseOctave + 1) * 12,
    fifth + (baseOctave + 1) * 12,
  ].filter(n => n >= config.range.low && n <= config.range.high);
}

// Quartal voicing (stacked 4ths)
function voiceQuartal(chord: Chord, pcs: number[], config: VoicingConfig, bassNote?: number): number[] {
  const notes: number[] = [];
  const bass = bassNote ?? chord.root_pc + 36;
  notes.push(bass);
  
  // Stack perfect 4ths from a chord tone
  let current = pcs[1] + 48; // Start from 3rd
  for (let i = 0; i < 4; i++) {
    if (current >= config.range.low && current <= config.range.high) {
      notes.push(current);
    }
    current += 5; // Perfect 4th
  }
  
  return notes.sort((a, b) => a - b);
}

// Neo-soul/Glasper voicing
function voiceNeosoul(chord: Chord, pcs: number[], config: VoicingConfig, bassNote?: number): number[] {
  const notes: number[] = [];
  const bass = bassNote ?? chord.root_pc + 36;
  notes.push(bass);
  
  const root = chord.root_pc;
  const baseOctave = 4;
  
  // Add 9th in bass register
  notes.push((root + 2) % 12 + (baseOctave) * 12);
  
  // Add 3rd, 7th, and extensions
  const third = (root + (chord.quality.includes('min') ? 3 : 4)) % 12;
  const seventh = (root + (chord.quality === 'maj7' ? 11 : 10)) % 12;
  
  notes.push(third + (baseOctave + 1) * 12);
  notes.push(seventh + (baseOctave + 1) * 12);
  
  // Add 13th on top
  notes.push((root + 9) % 12 + (baseOctave + 2) * 12);
  
  return notes.filter(n => n >= config.range.low && n <= config.range.high).sort((a, b) => a - b);
}

// SATB voicing (classical 4-part)
function voiceSATB(chord: Chord, pcs: number[], config: VoicingConfig, bassNote?: number): number[] {
  const bass = bassNote ?? chord.root_pc + 40; // Bass range
  const notes: number[] = [bass];
  
  // Tenor: usually 5th or root
  const tenor = (chord.root_pc + 7) % 12 + 48;
  notes.push(tenor);
  
  // Alto: usually 3rd
  const alto = (chord.root_pc + (chord.quality.includes('min') ? 3 : 4)) % 12 + 55;
  notes.push(alto);
  
  // Soprano: root or 3rd, highest
  const soprano = chord.root_pc + 60;
  notes.push(soprano);
  
  return notes.filter(n => n >= config.range.low && n <= config.range.high).sort((a, b) => a - b);
}

// Cinematic pad voicing (wide, sustained)
function voiceCinematic(chord: Chord, pcs: number[], config: VoicingConfig, bassNote?: number): number[] {
  const notes: number[] = [];
  
  // Deep bass
  const bass = bassNote ?? chord.root_pc + 36;
  notes.push(bass);
  
  // Add 5th in low register
  notes.push((chord.root_pc + 7) % 12 + 48);
  
  // Wide spread in middle
  const root = chord.root_pc;
  notes.push(root + 60); // Root
  notes.push((root + (chord.quality.includes('min') ? 3 : 4)) % 12 + 67); // 3rd
  
  // High extension
  if (pcs.length > 3) {
    notes.push((root + 7) % 12 + 72); // 5th high
  }
  
  // Double root very high for shimmer
  if (config.doubling === 'fifth') {
    notes.push((root + 7) % 12 + 84);
  }
  
  return notes.filter(n => n >= config.range.low && n <= config.range.high).sort((a, b) => a - b);
}

// Voice leading optimization between two voicings
export function optimizeVoiceLeading(
  fromVoicing: number[],
  toChord: Chord,
  preset: VoicingPreset
): number[] {
  const config = VOICING_CONFIGS[preset];
  const toPCs = getChordPCs(toChord);
  const result: number[] = [];
  
  // Keep bass note in similar range
  const bassPC = toChord.bass_pc ?? toChord.root_pc;
  const fromBass = fromVoicing[0];
  let toBass = bassPC + Math.floor(fromBass / 12) * 12;
  while (toBass < config.range.low) toBass += 12;
  while (toBass > fromBass + 7) toBass -= 12;
  result.push(toBass);
  
  // Move other voices by smallest interval
  for (let i = 1; i < fromVoicing.length && i < toPCs.length; i++) {
    const fromNote = fromVoicing[i];
    const toPC = toPCs[Math.min(i, toPCs.length - 1)];
    
    // Find closest octave placement
    let toNote = toPC + Math.floor(fromNote / 12) * 12;
    
    // Check if going up or down an octave is closer
    if (Math.abs(toNote - fromNote) > 6) {
      if (toNote > fromNote) toNote -= 12;
      else toNote += 12;
    }
    
    // Ensure within range
    while (toNote < config.range.low) toNote += 12;
    while (toNote > config.range.high) toNote -= 12;
    
    result.push(toNote);
  }
  
  return result.sort((a, b) => a - b);
}

// Get voicing preset description
export function getVoicingDescription(preset: VoicingPreset): string {
  const descriptions: Record<VoicingPreset, string> = {
    clear_spacious: 'Open position with doubled root, clear and resonant',
    rootless_a: 'Jazz voicing without root (3-7-9-5), for comping',
    rootless_b: 'Jazz voicing without root (7-9-3-5), alternative position',
    quartal: 'Stacked perfect 4ths, modern/modal sound',
    neosoul: 'Rich extensions with 9ths and 13ths, R&B/gospel feel',
    satb: 'Classical 4-part harmony, balanced voices',
    cinematic_pads: 'Wide spacing with high extensions, orchestral feel',
  };
  return descriptions[preset];
}

// Convert voicing to MIDI note names for display
export function voicingToNoteNames(voicing: number[]): string[] {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return voicing.map(midi => {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return NOTE_NAMES[pc] + octave;
  });
}
