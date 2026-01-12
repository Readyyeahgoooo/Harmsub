// Chord Object Model based on Rulebook §1-2

export type ChordQuality = 
  | 'maj' | 'min' | 'dim' | 'aug' 
  | 'maj7' | 'min7' | 'dom7' | 'dim7' | 'hdim7' | 'minmaj7' | 'aug7'
  | 'maj6' | 'min6' | 'sus4' | 'sus2' | 'add9' | 'add11';

export type HarmonicFunction = 'T' | 'PD' | 'D' | 'AMB';

export interface Chord {
  root_pc: number;           // 0-11 pitch class (C=0, C#=1, etc.)
  quality: ChordQuality;
  extensions: number[];      // [9, 11, 13]
  alterations: string[];     // ['b9', '#11', 'b13']
  bass_pc: number | null;    // for slash chords
  roman: string;             // 'V7/vi', 'bVII', etc.
  function: HarmonicFunction;
  distance_level: number;    // 0-6
  tags: string[];            // ['secondary_dom', 'tritone_sub']
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Chord intervals from root
export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  hdim7: [0, 3, 6, 10],  // half-diminished
  minmaj7: [0, 3, 7, 11],
  aug7: [0, 4, 8, 10],
  maj6: [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  add9: [0, 4, 7, 14],
  add11: [0, 4, 7, 17],
};

// Extension intervals
export const EXTENSION_INTERVALS: Record<number, number> = {
  9: 14,   // major 9th
  11: 17,  // perfect 11th
  13: 21,  // major 13th
};

// Alteration offsets
export const ALTERATION_OFFSETS: Record<string, number> = {
  'b9': -1,
  '#9': 1,
  'b11': -1,  // rare
  '#11': 1,
  'b13': -1,
  '#13': 1,   // rare
};

// Convert note name to pitch class
export function noteToPC(note: string): number {
  const match = note.match(/^([A-G])([#b]?)/);
  if (!match) return 0;
  
  const [, letter, accidental] = match;
  const basePC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = basePC[letter] || 0;
  
  if (accidental === '#') pc = (pc + 1) % 12;
  if (accidental === 'b') pc = (pc + 11) % 12;
  
  return pc;
}

// Convert pitch class to note name
export function pcToNote(pc: number, preferFlat = false): string {
  const normalized = ((pc % 12) + 12) % 12;
  return preferFlat ? NOTE_NAMES_FLAT[normalized] : NOTE_NAMES[normalized];
}

// Create a chord object
export function createChord(
  root: string | number,
  quality: ChordQuality,
  options: Partial<Omit<Chord, 'root_pc' | 'quality'>> = {}
): Chord {
  const root_pc = typeof root === 'string' ? noteToPC(root) : root;
  
  return {
    root_pc,
    quality,
    extensions: options.extensions || [],
    alterations: options.alterations || [],
    bass_pc: options.bass_pc ?? null,
    roman: options.roman || '',
    function: options.function || 'AMB',
    distance_level: options.distance_level ?? 0,
    tags: options.tags || [],
  };
}

// Get all pitch classes in a chord
export function getChordPCs(chord: Chord): number[] {
  const intervals = [...CHORD_INTERVALS[chord.quality]];
  
  // Add extensions
  for (const ext of chord.extensions) {
    if (EXTENSION_INTERVALS[ext]) {
      intervals.push(EXTENSION_INTERVALS[ext]);
    }
  }
  
  // Apply alterations
  const pcs = intervals.map(interval => {
    let adjusted = interval;
    for (const alt of chord.alterations) {
      const degree = parseInt(alt.replace(/[#b]/, ''));
      if (EXTENSION_INTERVALS[degree] === interval) {
        adjusted += ALTERATION_OFFSETS[alt] || 0;
      }
    }
    return (chord.root_pc + adjusted) % 12;
  });
  
  return [...new Set(pcs)];
}

// Get MIDI notes for a chord in a specific octave
export function chordToMIDI(chord: Chord, octave = 4): number[] {
  const pcs = getChordPCs(chord);
  const baseNote = octave * 12;
  
  return pcs.map((pc, i) => {
    let note = baseNote + pc;
    // Ensure notes are in ascending order
    if (i > 0 && note <= baseNote + pcs[i - 1]) {
      note += 12;
    }
    return note;
  }).sort((a, b) => a - b);
}

// Parse chord symbol to Chord object
export function parseChordSymbol(symbol: string, keyRoot = 0): Chord {
  const match = symbol.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return createChord(0, 'maj');
  }
  
  const [, rootStr, suffix] = match;
  const root_pc = noteToPC(rootStr);
  
  let quality: ChordQuality = 'maj';
  const extensions: number[] = [];
  const alterations: string[] = [];
  let bass_pc: number | null = null;
  
  // Parse quality
  if (suffix.startsWith('m7b5') || suffix.startsWith('ø')) {
    quality = 'hdim7';
  } else if (suffix.startsWith('dim7') || suffix.startsWith('o7')) {
    quality = 'dim7';
  } else if (suffix.startsWith('dim') || suffix.startsWith('o')) {
    quality = 'dim';
  } else if (suffix.startsWith('aug7') || suffix.startsWith('+7')) {
    quality = 'aug7';
  } else if (suffix.startsWith('aug') || suffix.startsWith('+')) {
    quality = 'aug';
  } else if (suffix.startsWith('mM7') || suffix.startsWith('m(maj7)')) {
    quality = 'minmaj7';
  } else if (suffix.startsWith('maj7') || suffix.startsWith('M7') || suffix.startsWith('Δ7')) {
    quality = 'maj7';
  } else if (suffix.startsWith('m7') || suffix.startsWith('min7') || suffix.startsWith('-7')) {
    quality = 'min7';
  } else if (suffix.startsWith('m6') || suffix.startsWith('min6')) {
    quality = 'min6';
  } else if (suffix.startsWith('m') || suffix.startsWith('min') || suffix.startsWith('-')) {
    quality = 'min';
  } else if (suffix.startsWith('6')) {
    quality = 'maj6';
  } else if (suffix.startsWith('7')) {
    quality = 'dom7';
  } else if (suffix.startsWith('sus4')) {
    quality = 'sus4';
  } else if (suffix.startsWith('sus2')) {
    quality = 'sus2';
  }
  
  // Parse extensions
  if (suffix.includes('9')) extensions.push(9);
  if (suffix.includes('11')) extensions.push(11);
  if (suffix.includes('13')) extensions.push(13);
  
  // Parse alterations
  const altMatch = suffix.match(/([b#][9]|[b#]11|[b#]13)/g);
  if (altMatch) {
    alterations.push(...altMatch);
  }
  
  // Parse slash chord
  const slashMatch = suffix.match(/\/([A-G][#b]?)$/);
  if (slashMatch) {
    bass_pc = noteToPC(slashMatch[1]);
  }
  
  return createChord(root_pc, quality, { extensions, alterations, bass_pc });
}

// Convert chord to symbol string
export function chordToSymbol(chord: Chord, preferFlat = false): string {
  const root = pcToNote(chord.root_pc, preferFlat);
  
  const qualitySuffixes: Record<ChordQuality, string> = {
    maj: '', min: 'm', dim: 'dim', aug: 'aug',
    maj7: 'maj7', min7: 'm7', dom7: '7', dim7: 'dim7',
    hdim7: 'm7b5', minmaj7: 'mM7', aug7: 'aug7',
    maj6: '6', min6: 'm6', sus4: 'sus4', sus2: 'sus2',
    add9: 'add9', add11: 'add11',
  };
  
  let symbol = root + qualitySuffixes[chord.quality];
  
  // Add extensions
  if (chord.extensions.length > 0) {
    const maxExt = Math.max(...chord.extensions);
    if (chord.quality === 'dom7' || chord.quality === 'maj7' || chord.quality === 'min7') {
      symbol = root + (chord.quality === 'min7' ? 'm' : chord.quality === 'maj7' ? 'maj' : '') + maxExt;
    }
  }
  
  // Add alterations
  for (const alt of chord.alterations) {
    symbol += `(${alt})`;
  }
  
  // Add bass note
  if (chord.bass_pc !== null && chord.bass_pc !== chord.root_pc) {
    symbol += '/' + pcToNote(chord.bass_pc, preferFlat);
  }
  
  return symbol;
}

// Check if a pitch class is a chord tone
export function isChordTone(pc: number, chord: Chord): boolean {
  const chordPCs = getChordPCs(chord);
  return chordPCs.includes(pc % 12);
}

// Get chord tone type (root, 3rd, 5th, 7th, extension)
export function getChordToneType(pc: number, chord: Chord): string | null {
  const interval = ((pc - chord.root_pc) % 12 + 12) % 12;
  const intervals = CHORD_INTERVALS[chord.quality];
  
  if (interval === 0) return 'root';
  if (interval === intervals[1]) return '3rd';
  if (interval === intervals[2]) return '5th';
  if (intervals[3] && interval === intervals[3] % 12) return '7th';
  if (chord.extensions.includes(9) && interval === 2) return '9th';
  if (chord.extensions.includes(11) && interval === 5) return '11th';
  if (chord.extensions.includes(13) && interval === 9) return '13th';
  
  return null;
}
