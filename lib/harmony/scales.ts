// Scale & Mode System based on Rulebook §3

export type ScaleType = 
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
  | 'lydian_dominant' | 'altered' | 'whole_tone' | 'diminished';

export interface Scale {
  root: number;
  type: ScaleType;
  intervals: number[];
}

export interface TensionRule {
  degree: number;
  available: number[];
  avoid: number[];
}

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  lydian_dominant: [0, 2, 4, 6, 7, 9, 10],
  altered: [0, 1, 3, 4, 6, 8, 10],
  whole_tone: [0, 2, 4, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11], // half-whole
};

// Mode names for display
export const MODE_NAMES: Record<ScaleType, string> = {
  major: 'Major (Ionian)',
  natural_minor: 'Natural Minor (Aeolian)',
  harmonic_minor: 'Harmonic Minor',
  melodic_minor: 'Melodic Minor',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  locrian: 'Locrian',
  lydian_dominant: 'Lydian Dominant',
  altered: 'Altered (Super Locrian)',
  whole_tone: 'Whole Tone',
  diminished: 'Diminished (Half-Whole)',
};

// Tension legality tables (jazz-pop context)
export const JAZZ_POP_TENSIONS: Record<number, TensionRule> = {
  // Degree 1 (I chord)
  1: { degree: 1, available: [9, 13], avoid: [11] },
  // Degree 2 (ii chord)
  2: { degree: 2, available: [9, 11], avoid: [] },
  // Degree 3 (iii chord)
  3: { degree: 3, available: [11], avoid: [9, 13] },
  // Degree 4 (IV chord)
  4: { degree: 4, available: [9, 13], avoid: [] }, // #11 available in Lydian
  // Degree 5 (V chord)
  5: { degree: 5, available: [9, 13], avoid: [11] }, // 11 becomes sus4
  // Degree 6 (vi chord)
  6: { degree: 6, available: [9, 11], avoid: [] },
  // Degree 7 (vii° chord)
  7: { degree: 7, available: [11], avoid: [9, 13] },
};

// Classical context tensions (more restrictive)
export const CLASSICAL_TENSIONS: Record<number, TensionRule> = {
  1: { degree: 1, available: [], avoid: [9, 11, 13] },
  2: { degree: 2, available: [], avoid: [9, 11, 13] },
  3: { degree: 3, available: [], avoid: [9, 11, 13] },
  4: { degree: 4, available: [], avoid: [9, 11, 13] },
  5: { degree: 5, available: [9], avoid: [11, 13] }, // 9th on V is common
  6: { degree: 6, available: [], avoid: [9, 11, 13] },
  7: { degree: 7, available: [], avoid: [9, 11, 13] },
};

// Create a scale
export function createScale(root: number | string, type: ScaleType): Scale {
  const rootPC = typeof root === 'string' ? noteNameToPC(root) : root;
  return {
    root: rootPC,
    type,
    intervals: SCALE_INTERVALS[type],
  };
}

// Helper to convert note name to pitch class
function noteNameToPC(note: string): number {
  const match = note.match(/^([A-G])([#b]?)/);
  if (!match) return 0;
  const [, letter, accidental] = match;
  const basePC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = basePC[letter] || 0;
  if (accidental === '#') pc = (pc + 1) % 12;
  if (accidental === 'b') pc = (pc + 11) % 12;
  return pc;
}

// Get all pitch classes in a scale
export function getScalePCs(scale: Scale): number[] {
  return scale.intervals.map(interval => (scale.root + interval) % 12);
}

// Check if a pitch class is in the scale
export function isInScale(pc: number, scale: Scale): boolean {
  const scalePCs = getScalePCs(scale);
  return scalePCs.includes(pc % 12);
}

// Get scale degree of a pitch class (1-7, or 0 if not in scale)
export function getScaleDegree(pc: number, scale: Scale): number {
  const normalizedPC = pc % 12;
  const interval = ((normalizedPC - scale.root) % 12 + 12) % 12;
  const index = scale.intervals.indexOf(interval);
  return index >= 0 ? index + 1 : 0;
}

// Get diatonic chord quality for a scale degree
export function getDiatonicChordQuality(degree: number, scaleType: ScaleType): string {
  const qualities: Record<ScaleType, string[]> = {
    major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    natural_minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    harmonic_minor: ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'],
    melodic_minor: ['min', 'min', 'aug', 'maj', 'maj', 'dim', 'dim'],
    dorian: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    phrygian: ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min'],
    lydian: ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'],
    mixolydian: ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],
    locrian: ['dim', 'maj', 'min', 'min', 'maj', 'min', 'maj'],
    lydian_dominant: ['maj', 'min', 'dim', 'dim', 'min', 'min', 'maj'],
    altered: ['dim', 'min', 'min', 'dim', 'maj', 'maj', 'min'],
    whole_tone: ['aug', 'aug', 'aug', 'aug', 'aug', 'aug'],
    diminished: ['dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim'],
  };
  
  const q = qualities[scaleType];
  return q[(degree - 1) % q.length] || 'maj';
}

// Get 7th chord quality for a scale degree
export function getDiatonic7thQuality(degree: number, scaleType: ScaleType): string {
  const qualities: Record<ScaleType, string[]> = {
    major: ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'hdim7'],
    natural_minor: ['min7', 'hdim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7'],
    harmonic_minor: ['minmaj7', 'hdim7', 'augmaj7', 'min7', 'dom7', 'maj7', 'dim7'],
    melodic_minor: ['minmaj7', 'min7', 'augmaj7', 'dom7', 'dom7', 'hdim7', 'hdim7'],
    dorian: ['min7', 'min7', 'maj7', 'dom7', 'min7', 'hdim7', 'maj7'],
    phrygian: ['min7', 'maj7', 'dom7', 'min7', 'hdim7', 'maj7', 'min7'],
    lydian: ['maj7', 'dom7', 'min7', 'hdim7', 'maj7', 'min7', 'min7'],
    mixolydian: ['dom7', 'min7', 'hdim7', 'maj7', 'min7', 'min7', 'maj7'],
    locrian: ['hdim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7'],
    lydian_dominant: ['dom7', 'min7', 'hdim7', 'hdim7', 'min7', 'min7', 'maj7'],
    altered: ['hdim7', 'min7', 'min7', 'hdim7', 'maj7', 'dom7', 'min7'],
    whole_tone: ['aug7', 'aug7', 'aug7', 'aug7', 'aug7', 'aug7'],
    diminished: ['dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7'],
  };
  
  const q = qualities[scaleType];
  return q[(degree - 1) % q.length] || 'maj7';
}

// Get available tensions for a chord degree
export function getAvailableTensions(
  degree: number, 
  context: 'jazz_pop' | 'classical' = 'jazz_pop'
): number[] {
  const rules = context === 'jazz_pop' ? JAZZ_POP_TENSIONS : CLASSICAL_TENSIONS;
  return rules[degree]?.available || [];
}

// Get avoid notes for a chord degree
export function getAvoidNotes(
  degree: number, 
  context: 'jazz_pop' | 'classical' = 'jazz_pop'
): number[] {
  const rules = context === 'jazz_pop' ? JAZZ_POP_TENSIONS : CLASSICAL_TENSIONS;
  return rules[degree]?.avoid || [];
}

// Get relative mode from major scale
export function getRelativeMode(majorRoot: number, mode: ScaleType): Scale {
  const modeOffsets: Record<ScaleType, number> = {
    major: 0,
    dorian: 2,
    phrygian: 4,
    lydian: 5,
    mixolydian: 7,
    natural_minor: 9,
    locrian: 11,
    harmonic_minor: 9,
    melodic_minor: 9,
    lydian_dominant: 5,
    altered: 11,
    whole_tone: 0,
    diminished: 0,
  };
  
  const offset = modeOffsets[mode] || 0;
  const modeRoot = (majorRoot + offset) % 12;
  
  return createScale(modeRoot, mode);
}

// Detect likely scale from a set of pitch classes
export function detectScale(pcs: number[]): Scale | null {
  const uniquePCs = [...new Set(pcs.map(pc => pc % 12))];
  if (uniquePCs.length < 3) return null;
  
  let bestMatch: { scale: Scale; score: number } | null = null;
  
  for (let root = 0; root < 12; root++) {
    for (const type of Object.keys(SCALE_INTERVALS) as ScaleType[]) {
      const scale = createScale(root, type);
      const scalePCs = getScalePCs(scale);
      
      const matches = uniquePCs.filter(pc => scalePCs.includes(pc)).length;
      const score = matches / uniquePCs.length;
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { scale, score };
      }
    }
  }
  
  return bestMatch && bestMatch.score >= 0.7 ? bestMatch.scale : null;
}
