// ============================================================================
// TENSION LEGALITY TABLES
// Implements §3.3 of Rulebook
// ============================================================================

import { ChordSymbol, ChordQuality } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// Tension Classification
// ----------------------------------------------------------------------------

export type TensionType = 'chord_tone' | 'available_tension' | 'avoid_note' | 'prepared_dissonance';

export interface TensionLegality {
  chord_quality: ChordQuality;
  legal_tensions: number[]; // scale degrees (relative to root)
  avoid_notes: number[];
  tension_type: Record<number, TensionType>;
  style_specific_rules?: {
    style: string;
    additional_tensions: number[];
    additional_avoids: number[];
  }[];
}

// ----------------------------------------------------------------------------
// 3.3.1 Jazz-Pop Default Legality
// ----------------------------------------------------------------------------

const JAZZ_POP_LEGALITY: TensionLegality[] = [
  {
    chord_quality: 'maj7',
    legal_tensions: [9, 11, 13],
    avoid_notes: [11],
    tension_type: {
      1: 'chord_tone',   // root
      3: 'chord_tone',   // 3rd
      5: 'chord_tone',   // 5th
      7: 'chord_tone',   // 7th
      9: 'available_tension',
      11: 'avoid_note',
      13: 'available_tension',
    },
    style_specific_rules: [
      {
        style: 'lydian',
        additional_tensions: [11],
        additional_avoids: [],
      },
    ],
  },
  {
    chord_quality: 'maj9',
    legal_tensions: [11, 13],
    avoid_notes: [11],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      7: 'chord_tone',
      9: 'chord_tone',
      11: 'avoid_note',
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'min7',
    legal_tensions: [9, 11, 13],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      b3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'available_tension',
      11: 'available_tension',
      13: 'available_tension',
    },
    style_specific_rules: [
      {
        style: 'aeolian',
        additional_tensions: [13],
        additional_avoids: [],
      },
    ],
  },
  {
    chord_quality: 'min9',
    legal_tensions: [11, 13],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      b3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'chord_tone',
      11: 'available_tension',
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'dom7',
    legal_tensions: [9, 13],
    avoid_notes: [11],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'available_tension',
      11: 'avoid_note',
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'dom9',
    legal_tensions: [13],
    avoid_notes: [11],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'chord_tone',
      11: 'avoid_note',
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'dom11',
    legal_tensions: [9, 13],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'available_tension',
      11: 'chord_tone', // sus4 makes 11 a chord tone
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'dom7alt',
    legal_tensions: [9, 11, 13],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      b9: 'available_tension',
      '#9': 'available_tension',
      '#11': 'available_tension',
      b13: 'available_tension',
    },
  },
  {
    chord_quality: 'dom7#11',
    legal_tensions: [9, 13],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'available_tension',
      '#11': 'chord_tone',
      13: 'available_tension',
    },
  },
  {
    chord_quality: 'hdim7',
    legal_tensions: [11],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      b3: 'chord_tone',
      b5: 'chord_tone',
      b7: 'chord_tone',
      11: 'available_tension',
    },
  },
  {
    chord_quality: 'dim7',
    legal_tensions: [],
    avoid_notes: [],
    tension_type: {
      1: 'chord_tone',
      b3: 'chord_tone',
      b5: 'chord_tone',
      bb7: 'chord_tone',
    },
  },
];

// ----------------------------------------------------------------------------
// 3.3.2 Classical/Romantic Default Legality (Stricter)
// ----------------------------------------------------------------------------

const CLASSICAL_LEGALITY: TensionLegality[] = [
  {
    chord_quality: 'maj7',
    legal_tensions: [9],
    avoid_notes: [11, 13],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      7: 'chord_tone',
      9: 'prepared_dissonance',
      11: 'avoid_note',
      13: 'avoid_note',
    },
  },
  {
    chord_quality: 'min7',
    legal_tensions: [9],
    avoid_notes: [11, 13],
    tension_type: {
      1: 'chord_tone',
      b3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'prepared_dissonance',
      11: 'avoid_note',
      13: 'avoid_note',
    },
  },
  {
    chord_quality: 'dom7',
    legal_tensions: [9],
    avoid_notes: [11, 13],
    tension_type: {
      1: 'chord_tone',
      3: 'chord_tone',
      5: 'chord_tone',
      b7: 'chord_tone',
      9: 'prepared_dissonance',
      11: 'avoid_note',
      13: 'avoid_note',
    },
  },
];

// ----------------------------------------------------------------------------
// Get legality for chord quality
// ----------------------------------------------------------------------------

export function getTensionLegality(
  quality: ChordQuality,
  style: 'jazz_pop' | 'classical' = 'jazz_pop'
): TensionLegality | null {
  const legalityTable = style === 'jazz_pop' ? JAZZ_POP_LEGALITY : CLASSICAL_LEGALITY;
  return legalityTable.find(l => l.chord_quality === quality) || null;
}

// ----------------------------------------------------------------------------
// Check if note is chord tone
// ----------------------------------------------------------------------------

export function isChordTone(
  chord: ChordSymbol,
  melodyPitch: number,
  chordRoot: number
): boolean {
  const interval = ((melodyPitch - chordRoot) % 12 + 12) % 12;
  const legality = getTensionLegality(chord.quality);
  
  if (!legality) return false;
  
  // Check if interval matches chord tone (1, 3, 5, 7)
  return interval === 0 || interval === 4 || interval === 7 || interval === 11;
}

// ----------------------------------------------------------------------------
// Check if note is legal tension
// ----------------------------------------------------------------------------

export function isLegalTension(
  chord: ChordSymbol,
  melodyPitch: number,
  chordRoot: number
): boolean {
  const interval = ((melodyPitch - chordRoot) % 12 + 12) % 12;
  const legality = getTensionLegality(chord.quality);
  
  if (!legality) return false;
  
  return legality.legal_tensions.includes(interval);
}

// ----------------------------------------------------------------------------
// Check if note is avoid note
// ----------------------------------------------------------------------------

export function isAvoidNote(
  chord: ChordSymbol,
  melodyPitch: number,
  chordRoot: number
): boolean {
  const interval = ((melodyPitch - chordRoot) % 12 + 12) % 12;
  const legality = getTensionLegality(chord.quality);
  
  if (!legality) return false;
  
  return legality.avoid_notes.includes(interval);
}

// ----------------------------------------------------------------------------
// Get tension type for note
// ----------------------------------------------------------------------------

export function getTensionType(
  chord: ChordSymbol,
  melodyPitch: number,
  chordRoot: number
): TensionType {
  if (isChordTone(chord, melodyPitch, chordRoot)) return 'chord_tone';
  if (isLegalTension(chord, melodyPitch, chordRoot)) return 'available_tension';
  if (isAvoidNote(chord, melodyPitch, chordRoot)) return 'avoid_note';
  return 'prepared_dissonance';
}

// ----------------------------------------------------------------------------
// Score melody fit for chord
// ----------------------------------------------------------------------------

export function scoreMelodyFit(
  chord: ChordSymbol,
  melodyPitches: number[],
  chordRoot: number,
  metricalStrengths: number[]
): number {
  let score = 0;
  const legality = getTensionLegality(chord.quality);
  
  if (!legality) return 0;
  
  melodyPitches.forEach((pitch, index) => {
    const strength = metricalStrengths[index] || 0.5;
    const interval = ((pitch - chordRoot) % 12 + 12) % 12;
    
    if (interval === 0 || interval === 4 || interval === 7 || interval === 11) {
      // Chord tone
      score += 100 * strength;
    } else if (legality.legal_tensions.includes(interval)) {
      // Legal tension
      score += 50 * strength;
    } else if (legality.avoid_notes.includes(interval)) {
      // Avoid note - penalize
      score -= 50 * strength;
    }
    // Non-chord tones that aren't avoid notes get neutral score
  });
  
  return score / melodyPitches.length;
}

// ----------------------------------------------------------------------------
// Check if chord supports melody
// ----------------------------------------------------------------------------

export function chordSupportsMelody(
  chord: ChordSymbol,
  melodyPitches: number[],
  chordRoot: number,
  minScore: number = 30
): boolean {
  const score = scoreMelodyFit(chord, melodyPitches, chordRoot, []);
  return score >= minScore;
}

// ----------------------------------------------------------------------------
// Get tension suggestions for chord
// ----------------------------------------------------------------------------

export function getTensionSuggestions(
  chord: ChordSymbol,
  melodyPitches: number[],
  chordRoot: number
): {
  chord_tones: number[];
  legal_tensions: number[];
  avoid_notes: number[];
  non_chord_tones: number[];
} {
  const chordTones: number[] = [];
  const legalTensions: number[] = [];
  const avoidNotes: number[] = [];
  const nonChordTones: number[] = [];
  
  melodyPitches.forEach(pitch => {
    const interval = ((pitch - chordRoot) % 12 + 12) % 12;
    
    if (isChordTone(chord, pitch, chordRoot)) {
      chordTones.push(interval);
    } else if (isLegalTension(chord, pitch, chordRoot)) {
      legalTensions.push(interval);
    } else if (isAvoidNote(chord, pitch, chordRoot)) {
      avoidNotes.push(interval);
    } else {
      nonChordTones.push(interval);
    }
  });
  
  return {
    chord_tones: chordTones,
    legal_tensions: legalTensions,
    avoid_notes: avoidNotes,
    non_chord_tones: nonChordTones,
  };
}