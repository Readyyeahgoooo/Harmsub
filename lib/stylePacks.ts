// ============================================================================
// STYLE PACKS
// Implements §10 of Rulebook
// ============================================================================

import { StylePack, ChordQuality } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// 10.1 Jazz (bebop/post-bop)
// ----------------------------------------------------------------------------

export const JAZZ_STYLE: StylePack = {
  name: 'jazz',
  description: 'Bebop/post-bop jazz with ii-V-I progressions, tritone subs, and rich extensions',
  allowed_distance_levels: [0, 1, 2, 3, 4],
  typical_chords: [
    'maj7', 'min7', 'dom7', 'hdim7', 'dom9', 'dom13',
    'dom7alt', 'dom7#11', 'dom11', 'dim7'
  ],
  typical_dominants: [
    'dom7', 'dom9', 'dom13', 'dom7alt', 'dom7#11', 'dom11'
  ],
  progression_edge_weights: {
    'T→PD': 6,
    'PD→D': 10,
    'D→T': 10,
    'T→T': 4,
    'PD→PD': 3,
    'D→D': 5,
    'T→D': 7,
    'PD→T': 3,
    'D→PD': 4,
  },
  voicing_default: 'rootless_jazz',
  template_bias: [
    'I-vi-ii-V',
    'I-iii-vi-ii-V',
    'jazz_turnaround'
  ],
  functional_clarity_default: 0.7,
  dominant_density_default: 'heavy',
  alteration_default: 'medium-high',
};

// ----------------------------------------------------------------------------
// 10.2 Bossa Nova / Samba
// ----------------------------------------------------------------------------

export const BOSSA_STYLE: StylePack = {
  name: 'bossa',
  description: 'Bossa nova and Samba with functional ii-V motion, smooth cadences, fewer extreme alterations',
  allowed_distance_levels: [0, 1, 2, 3],
  typical_chords: [
    'maj7', 'min7', 'dom7', 'dom9', 'dom13', 'min9'
  ],
  typical_dominants: [
    'dom7', 'dom9', 'dom13'
  ],
  progression_edge_weights: {
    'T→PD': 8,
    'PD→D': 9,
    'D→T': 9,
    'T→T': 6,
    'PD→PD': 4,
    'D→D': 4,
    'T→D': 6,
    'PD→T': 4,
    'D→PD': 3,
  },
  voicing_default: 'clear',
  template_bias: [
    'I-vi-ii-V',
    'I-IV-V-I',
    'bossa_groove'
  ],
  functional_clarity_default: 0.8,
  dominant_density_default: 'medium',
  alteration_default: 'mild',
};

// ----------------------------------------------------------------------------
// 10.3 Jazz Ballad
// ----------------------------------------------------------------------------

export const JAZZ_BALLAD_STYLE: StylePack = {
  name: 'jazz_ballad',
  description: 'Jazz ballad with tonic prolongation, rich extensions, gentle secondary dominants',
  allowed_distance_levels: [0, 1, 2, 3, 4],
  typical_chords: [
    'maj7', 'maj9', 'min7', 'min9', 'dom7', 'dom9',
    'dom13', 'maj7#11'
  ],
  typical_dominants: [
    'dom7', 'dom9', 'dom13', 'maj7#11'
  ],
  progression_edge_weights: {
    'T→PD': 5,
    'PD→D': 7,
    'D→T': 8,
    'T→T': 9,
    'PD→PD': 5,
    'D→D': 4,
    'T→D': 5,
    'PD→T': 4,
    'D→PD': 3,
  },
  voicing_default: 'clear',
  template_bias: [
    'tonic_prolongation',
    'lush_extensions',
    'gentle_motion'
  ],
  functional_clarity_default: 0.6,
  dominant_density_default: 'light',
  alteration_default: 'mild',
};

// ----------------------------------------------------------------------------
// 10.4 Pop / Contemporary R&B
// ----------------------------------------------------------------------------

export const POP_RNB_STYLE: StylePack = {
  name: 'pop_rnb',
  description: 'Pop and Contemporary R&B with axis progressions, slash chords, sus/add9, pedal tones',
  allowed_distance_levels: [0, 1, 2, 3],
  typical_chords: [
    'maj', 'min', 'dom7', 'min7', 'maj7', 'sus2',
    'sus4', 'dom11', 'dom13'
  ],
  typical_dominants: [
    'dom7', 'dom11', 'dom13'
  ],
  progression_edge_weights: {
    'T→PD': 7,
    'PD→D': 6,
    'D→T': 5,
    'T→T': 10,
    'PD→PD': 8,
    'D→D': 6,
    'T→D': 5,
    'PD→T': 7,
    'D→PD': 4,
  },
  voicing_default: 'clear',
  template_bias: [
    'axis_progression',
    'slash_chords',
    'pedal_tones',
    'sus_add9'
  ],
  functional_clarity_default: 0.5,
  dominant_density_default: 'low',
  alteration_default: 'low',
};

// ----------------------------------------------------------------------------
// 10.5 "Radiohead-ish" (Mixture + Mediants + Pedal)
// ----------------------------------------------------------------------------

export const RADIOHEAD_STYLE: StylePack = {
  name: 'radiohead',
  description: 'Radiohead-inspired with modal mixture, chromatic mediants, non-functional voice-led shifts, planing',
  allowed_distance_levels: [2, 3, 4, 5],
  typical_chords: [
    'maj7', 'min7', 'dom7', 'maj7#11', 'dom7alt',
    'dom7#11', 'dim7', 'hdim7'
  ],
  typical_dominants: [
    'dom7', 'dom7alt', 'dom7#11', 'dom11'
  ],
  progression_edge_weights: {
    'T→PD': 4,
    'PD→D': 3,
    'D→T': 5,
    'T→T': 7,
    'PD→PD': 6,
    'D→D': 5,
    'T→D': 4,
    'PD→T': 6,
    'D→PD': 6,
    'T→N': 8,
    'N→N': 9,
    'N→T': 7,
  },
  voicing_default: 'neo_soul',
  template_bias: [
    'modal_mixture',
    'chromatic_mediant',
    'pedal',
    'planing',
    'nonfunctional'
  ],
  functional_clarity_default: 0.4,
  dominant_density_default: 'low',
  alteration_default: 'medium-high',
};

// ----------------------------------------------------------------------------
// 10.6 Romantic Classical / Neo-Romantic
// ----------------------------------------------------------------------------

export const ROMANTIC_CLASSICAL_STYLE: StylePack = {
  name: 'romantic_classical',
  description: 'Romantic classical with clear cadences, applied dominants, sequences, mixture for drama',
  allowed_distance_levels: [0, 1, 2, 3],
  typical_chords: [
    'maj', 'min', 'dom7', 'dim7', 'hdim7', 'aug',
    'maj7', 'min7'
  ],
  typical_dominants: [
    'dom7', 'dom7b9', 'dom7b13', 'dim7'
  ],
  progression_edge_weights: {
    'T→PD': 9,
    'PD→D': 10,
    'D→T': 10,
    'T→T': 5,
    'PD→PD': 4,
    'D→D': 4,
    'T→D': 7,
    'PD→T': 5,
    'D→PD': 3,
  },
  voicing_default: 'classical_satb',
  template_bias: [
    'clear_cadences',
    'applied_dominants',
    'sequences',
    'mixture'
  ],
  functional_clarity_default: 0.9,
  dominant_density_default: 'medium',
  alteration_default: 'mild',
};

// ----------------------------------------------------------------------------
// 10.7 Cinematic / "Hans Zimmer-ish"
// ----------------------------------------------------------------------------

export const CINEMATIC_STYLE: StylePack = {
  name: 'cinematic',
  description: 'Cinematic with pedal tones, fifths, add2/add9, mediant shifts, block harmony',
  allowed_distance_levels: [1, 2, 3, 4, 5, 6],
  typical_chords: [
    'maj7', 'dom7', 'dom11', 'dom13', 'dim7',
    'maj7#11', 'sus2', 'sus4'
  ],
  typical_dominants: [
    'dom7', 'dom11', 'dom13'
  ],
  progression_edge_weights: {
    'T→PD': 4,
    'PD→D': 3,
    'D→T': 4,
    'T→T': 10,
    'PD→PD': 6,
    'D→D': 4,
    'T→D': 3,
    'PD→T': 5,
    'D→PD': 5,
    'T→N': 9,
    'N→N': 10,
    'N→T': 6,
  },
  voicing_default: 'cinematic_pads',
  template_bias: [
    'pedal',
    'fifths',
    'add2_add9',
    'mediant_shifts',
    'block_harmony',
    'nonfunctional'
  ],
  functional_clarity_default: 0.3,
  dominant_density_default: 'light',
  alteration_default: 'low',
};

// ----------------------------------------------------------------------------
// Style Pack Registry
// ----------------------------------------------------------------------------

export const STYLE_PACKS: Record<string, StylePack> = {
  jazz: JAZZ_STYLE,
  bossa: BOSSA_STYLE,
  jazz_ballad: JAZZ_BALLAD_STYLE,
  pop_rnb: POP_RNB_STYLE,
  radiohead: RADIOHEAD_STYLE,
  romantic_classical: ROMANTIC_CLASSICAL_STYLE,
  cinematic: CINEMATIC_STYLE,
};

// ----------------------------------------------------------------------------
// Get style pack by name
// ----------------------------------------------------------------------------

export function getStylePack(name: string): StylePack | undefined {
  return STYLE_PACKS[name];
}

// ----------------------------------------------------------------------------
// Get all style pack names
// ----------------------------------------------------------------------------

export function getStylePackNames(): string[] {
  return Object.keys(STYLE_PACKS);
}

// ----------------------------------------------------------------------------
// Get style pack display name
// ----------------------------------------------------------------------------

export function getStylePackDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    jazz: 'Jazz (Bebop/Post-Bop)',
    bossa: 'Bossa Nova / Samba',
    jazz_ballad: 'Jazz Ballad',
    pop_rnb: 'Pop / Contemporary R&B',
    radiohead: 'Radiohead-ish',
    romantic_classical: 'Romantic Classical',
    cinematic: 'Cinematic (Hans Zimmer-ish)',
  };
  
  return displayNames[name] || name;
}

// ----------------------------------------------------------------------------
// Get default controls for style
// ----------------------------------------------------------------------------

export function getDefaultControlsForStyle(styleName: string): {
  distance: number;
  functional_clarity: number;
  dominant_density: string;
  alteration_amount: string;
} {
  const style = getStylePack(styleName);
  
  if (!style) {
    return {
      distance: 2,
      functional_clarity: 0.7,
      dominant_density: 'medium',
      alteration_amount: 'mild',
    };
  }
  
  return {
    distance: Math.max(...style.allowed_distance_levels),
    functional_clarity: style.functional_clarity_default,
    dominant_density: style.dominant_density_default,
    alteration_amount: style.alteration_default,
  };
}