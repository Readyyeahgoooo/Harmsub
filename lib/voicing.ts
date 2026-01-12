// ============================================================================
// VOICING RULEBOOK
// Implements §13 of Rulebook
// ============================================================================

import { ChordSymbol, Voicing, VoicingPreset } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// 13.1 Universal Voicing Constraints
// ----------------------------------------------------------------------------

export interface VoicingConstraint {
  check: (pitches: number[]) => boolean;
  penalty: number;
  description: string;
}

const UNIVERSAL_CONSTRAINTS: VoicingConstraint[] = [
  {
    check: (pitches) => {
      // Avoid dense 2nds/3rds in low register (mud control)
      const sortedPitches = [...pitches].sort((a, b) => a - b);
      const lowRegister = sortedPitches.filter(p => p < 48); // Below C3
      
      for (let i = 0; i < lowRegister.length - 1; i++) {
        const interval = lowRegister[i + 1] - lowRegister[i];
        if (interval === 1 || interval === 2 || interval === 3) {
          return false;
        }
      }
      return true;
    },
    penalty: 50,
    description: 'Avoid dense intervals (2nds/3rds) in low register',
  },
  {
    check: (pitches) => {
      // Minimum range (not too compressed)
      const min = Math.min(...pitches);
      const max = Math.max(...pitches);
      return max - min >= 8; // At least an octave
    },
    penalty: 20,
    description: 'Ensure minimum octave range',
  },
];

// ----------------------------------------------------------------------------
// 13.2 Voicing Presets
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// A) Clear / Spacious
// ----------------------------------------------------------------------------

export const CLEAR_VOICING: VoicingPreset = {
  name: 'clear',
  description: 'LH: root + 5th or root + 7th (shell), RH: 3rd + 9th/13th (open). Avoid clusters; prioritize clarity.',
  constraints: [
    {
      type: 'range_limit',
      voice_range: [48, 84],
    },
    {
      type: 'interval_limit',
      max_interval: 12,
    },
  ],
  preferences: [
    {
      type: 'spacing',
      value: 'open',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
  ],
};

// ----------------------------------------------------------------------------
// B) Rootless Jazz (A/B shapes)
// ----------------------------------------------------------------------------

export const ROOTLESS_JAZZ_VOICING: VoicingPreset = {
  name: 'rootless_jazz',
  description: 'For dom7: include 3 & 7, add 9/13 or alterations. For maj7: include 3 & 7, add 9/#11/13. For min7: include b3 & b7, add 9/11/13. Smooth guide-tone lines are priority #1.',
  constraints: [
    {
      type: 'preserve_guide_tones',
    },
    {
      type: 'range_limit',
      voice_range: [48, 84],
    },
  ],
  preferences: [
    {
      type: 'guide_tone_priority',
      value: 'high',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
  ],
};

// ----------------------------------------------------------------------------
// C) Quartal / Modern
// ----------------------------------------------------------------------------

export const QUARTAL_VOICING: VoicingPreset = {
  name: 'quartal',
  description: 'Stack 4ths in RH (e.g., 7-3-13-9 type colors). Keep bass simple; allow ambiguous tonality.',
  constraints: [
    {
      type: 'range_limit',
      voice_range: [48, 84],
    },
  ],
  preferences: [
    {
      type: 'spacing',
      value: 'tight',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
  ],
};

// ----------------------------------------------------------------------------
// D) Neo-soul / "Glasper-ish"
// ----------------------------------------------------------------------------

export const NEO_SOUL_VOICING: VoicingPreset = {
  name: 'neo_soul',
  description: 'Clusters in RH (2nds), upper-structure triads. Frequent sus/add9, planing allowed. Pedal tones common; voice-leading outweighs strict function.',
  constraints: [
    {
      type: 'range_limit',
      voice_range: [48, 84],
    },
  ],
  preferences: [
    {
      type: 'cluster_amount',
      value: 'medium',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
    {
      type: 'guide_tone_priority',
      value: 'low',
    },
  ],
};

// ----------------------------------------------------------------------------
// E) Classical SATB
// ----------------------------------------------------------------------------

export const CLASSICAL_SATB_VOICING: VoicingPreset = {
  name: 'classical_satb',
  description: 'Avoid parallel 5ths/8ves (optional strictness). Keep voices in range, resolve tendency tones. Dissonances prepared/resolved.',
  constraints: [
    {
      type: 'range_limit',
      voice_range: [48, 84],
    },
    {
      type: 'interval_limit',
      max_interval: 12,
    },
  ],
  preferences: [
    {
      type: 'spacing',
      value: 'open',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
  ],
};

// ----------------------------------------------------------------------------
// F) Cinematic Pads
// ----------------------------------------------------------------------------

export const CINEMATIC_PADS_VOICING: VoicingPreset = {
  name: 'cinematic_pads',
  description: 'Wide spacing: bass octave + fifth; mid voices sustain. Add2/add9 and quartal colors. Slow movement, pedal bass frequent.',
  constraints: [
    {
      type: 'range_limit',
      voice_range: [36, 96],
    },
  ],
  preferences: [
    {
      type: 'spacing',
      value: 'maximal',
    },
    {
      type: 'movement',
      value: 'minimal',
    },
  ],
};

// ----------------------------------------------------------------------------
// Voicing Preset Registry
// ----------------------------------------------------------------------------

export const VOICING_PRESETS: Record<string, VoicingPreset> = {
  clear: CLEAR_VOICING,
  rootless_jazz: ROOTLESS_JAZZ_VOICING,
  quartal: QUARTAL_VOICING,
  neo_soul: NEO_SOUL_VOICING,
  classical_satb: CLASSICAL_SATB_VOICING,
  cinematic_pads: CINEMATIC_PADS_VOICING,
};

// ----------------------------------------------------------------------------
// Voicing Generation Functions
// ----------------------------------------------------------------------------

export function generateVoicing(
  chord: ChordSymbol,
  preset: VoicingPreset,
  previousVoicing: Voicing | null
): Voicing {
  const bassNote = generateBassNote(chord, preset);
  const upperVoicing = generateUpperVoicing(chord, preset, previousVoicing);
  
  return {
    chord,
    pitches: [bassNote, ...upperVoicing],
    bass_note: bassNote,
    instrument_voicings: {
      piano: [bassNote, ...upperVoicing],
      guitar: generateGuitarVoicing(chord, preset),
      strings: generateStringsVoicing(chord, preset),
    },
  };
}

function generateBassNote(chord: ChordSymbol, preset: VoicingPreset): number {
  // If slash chord, use bass_pc
  if (chord.bass_pc !== undefined) {
    return chord.bass_pc + 36; // C2
  }
  
  // Otherwise, use root
  return chord.root_pc + 36;
}

function generateUpperVoicing(
  chord: ChordSymbol,
  preset: VoicingPreset,
  previousVoicing: Voicing | null
): number[] {
  switch (preset.name) {
    case 'clear':
      return generateClearVoicing(chord);
    case 'rootless_jazz':
      return generateRootlessJazzVoicing(chord);
    case 'quartal':
      return generateQuartalVoicing(chord);
    case 'neo_soul':
      return generateNeoSoulVoicing(chord);
    case 'classical_satb':
      return generateClassicalSATBVoicing(chord);
    case 'cinematic_pads':
      return generateCinematicPadsVoicing(chord);
    default:
      return generateClearVoicing(chord);
  }
}

// ----------------------------------------------------------------------------
// A) Clear Voicing Generator
// ----------------------------------------------------------------------------

function generateClearVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 60; // C4
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  const fifth = root + 7;
  const seventh = chord.quality.includes('dom7') 
    ? root + 10 
    : chord.quality.includes('maj7')
    ? root + 11
    : chord.quality.includes('min7')
    ? root + 10
    : 0;
  
  const voicing: number[] = [third, fifth];
  if (seventh) voicing.push(seventh);
  
  // Add 9th or 13th if available
  if (chord.extensions.includes('9')) {
    voicing.push(root + 2);
  } else if (chord.extensions.includes('13')) {
    voicing.push(root + 9);
  }
  
  return voicing.sort((a, b) => a - b);
}

// ----------------------------------------------------------------------------
// B) Rootless Jazz Voicing Generator
// ----------------------------------------------------------------------------

function generateRootlessJazzVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 60;
  
  // Guide tones (3rd and 7th)
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  const seventh = chord.quality.includes('dom7')
    ? root + 10
    : chord.quality.includes('maj7')
    ? root + 11
    : chord.quality.includes('min7')
    ? root + 10
    : 0;
  
  const voicing: number[] = [third, seventh];
  
  // Add tension based on chord quality
  if (chord.extensions.includes('9')) {
    voicing.push(root + 2);
  } else if (chord.extensions.includes('13')) {
    voicing.push(root + 9);
  } else if (chord.extensions.includes('11')) {
    voicing.push(root + 5);
  }
  
  return voicing.sort((a, b) => a - b);
}

// ----------------------------------------------------------------------------
// C) Quartal Voicing Generator
// ----------------------------------------------------------------------------

function generateQuartalVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 60;
  
  // Stack 4ths from 7th or 3rd
  const seventh = chord.quality.includes('dom7')
    ? root + 10
    : chord.quality.includes('maj7')
    ? root + 11
    : 0;
  
  const voicing: number[] = [];
  
  if (seventh) {
    // 7-3-13-9 pattern
    voicing.push(seventh);
    voicing.push(seventh + 5); // 3rd (quartal)
    voicing.push(seventh + 10); // 13th (quartal)
    voicing.push(seventh + 2); // 9th (quartal from top)
  } else {
    // 3-7 pattern for triads
    const third = chord.quality.includes('min') ? root + 3 : root + 4;
    voicing.push(third);
    voicing.push(third + 5);
    voicing.push(third + 10);
  }
  
  return voicing.filter(p => p < 108); // Keep in reasonable range
}

// ----------------------------------------------------------------------------
// D) Neo-Soul Voicing Generator
// ----------------------------------------------------------------------------

function generateNeoSoulVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 60;
  const voicing: number[] = [];
  
  // Add 2nd cluster
  if (chord.extensions.includes('9') || chord.quality.includes('dom7')) {
    voicing.push(root + 2); // 9th
  }
  
  // Add 3rd
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  voicing.push(third);
  
  // Add 7th
  const seventh = chord.quality.includes('dom7')
    ? root + 10
    : chord.quality.includes('maj7')
    ? root + 11
    : 0;
  
  if (seventh) {
    voicing.push(seventh);
  }
  
  // Add upper-structure triad or 11th
  if (chord.extensions.includes('11')) {
    voicing.push(root + 5);
  }
  
  return voicing.sort((a, b) => a - b);
}

// ----------------------------------------------------------------------------
// E) Classical SATB Voicing Generator
// ----------------------------------------------------------------------------

function generateClassicalSATBVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 48; // C3
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  const fifth = root + 7;
  
  const voicing: number[] = [root, third, fifth];
  
  // Add 7th for 7th chords
  if (chord.quality.includes('dom7') || chord.quality.includes('maj7') || chord.quality.includes('min7')) {
    const seventh = chord.quality.includes('dom7')
      ? root + 10
      : chord.quality.includes('maj7')
      ? root + 11
      : root + 10;
    voicing.push(seventh);
  }
  
  return voicing;
}

// ----------------------------------------------------------------------------
// F) Cinematic Pads Voicing Generator
// ----------------------------------------------------------------------------

function generateCinematicPadsVoicing(chord: ChordSymbol): number[] {
  const root = chord.root_pc + 36; // C2
  const voicing: number[] = [];
  
  // Bass octave + fifth
  voicing.push(root);
  voicing.push(root + 7); // 5th
  voicing.push(root + 12); // Octave
  
  // Mid voices with add2/add9 or quartal colors
  const third = chord.quality.includes('min') ? root + 16 : root + 16;
  const fifth = root + 19;
  const ninth = root + 14; // Add9
  
  voicing.push(third);
  voicing.push(fifth);
  voicing.push(ninth);
  
  return voicing.filter(p => p < 96); // Keep in pad range
}

// ----------------------------------------------------------------------------
// Guitar Voicing Generator
// ----------------------------------------------------------------------------

function generateGuitarVoicing(chord: ChordSymbol, preset: VoicingPreset): number[] {
  const root = chord.root_pc + 40; // E2
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  const fifth = root + 7;
  
  const voicing: number[] = [root, third, fifth];
  
  // Add 7th if applicable
  if (chord.quality.includes('dom7') || chord.quality.includes('maj7') || chord.quality.includes('min7')) {
    const seventh = chord.quality.includes('dom7')
      ? root + 10
      : chord.quality.includes('maj7')
      ? root + 11
      : root + 10;
    voicing.push(seventh);
  }
  
  return voicing;
}

// ----------------------------------------------------------------------------
// Strings Voicing Generator
// ----------------------------------------------------------------------------

function generateStringsVoicing(chord: ChordSymbol, preset: VoicingPreset): number[] {
  // Similar to classical SATB but string-specific ranges
  const root = chord.root_pc + 55; // A2
  const third = chord.quality.includes('min') ? root + 3 : root + 4;
  const fifth = root + 7;
  
  const voicing: number[] = [root, third, fifth];
  
  // Add 7th
  if (chord.quality.includes('dom7') || chord.quality.includes('maj7') || chord.quality.includes('min7')) {
    const seventh = chord.quality.includes('dom7')
      ? root + 10
      : chord.quality.includes('maj7')
      ? root + 11
      : root + 10;
    voicing.push(seventh);
  }
  
  return voicing;
}

// ----------------------------------------------------------------------------
// Get voicing preset by name
// ----------------------------------------------------------------------------

export function getVoicingPreset(name: string): VoicingPreset | undefined {
  return VOICING_PRESETS[name];
}

// ----------------------------------------------------------------------------
// Get all voicing preset names
// ----------------------------------------------------------------------------

export function getVoicingPresetNames(): string[] {
  return Object.keys(VOICING_PRESETS);
}

// ----------------------------------------------------------------------------
// Get voicing preset display name
// ----------------------------------------------------------------------------

export function getVoicingPresetDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    clear: 'Clear / Spacious',
    rootless_jazz: 'Rootless Jazz (A/B Shapes)',
    quartal: 'Quartal / Modern',
    neo_soul: 'Neo-Soul (Glasper-ish)',
    classical_satb: 'Classical SATB',
    cinematic_pads: 'Cinematic Pads',
  };
  
  return displayNames[name] || name;
}