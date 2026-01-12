// Distance Ladder based on Rulebook §5-6

import { Chord, ChordQuality, createChord, HarmonicFunction } from './chordModel';

export interface DistanceLevel {
  level: number;
  name: string;
  description: string;
  vocabulary: ChordTemplate[];
}

export interface ChordTemplate {
  roman: string;
  quality: ChordQuality;
  extensions?: number[];
  alterations?: string[];
  tags: string[];
  function: HarmonicFunction;
}

// Distance Level 0: Diatonic
const LEVEL_0: ChordTemplate[] = [
  { roman: 'I', quality: 'maj', tags: ['diatonic'], function: 'T' },
  { roman: 'ii', quality: 'min', tags: ['diatonic'], function: 'PD' },
  { roman: 'iii', quality: 'min', tags: ['diatonic'], function: 'T' },
  { roman: 'IV', quality: 'maj', tags: ['diatonic'], function: 'PD' },
  { roman: 'V', quality: 'maj', tags: ['diatonic'], function: 'D' },
  { roman: 'vi', quality: 'min', tags: ['diatonic'], function: 'T' },
  { roman: 'vii°', quality: 'dim', tags: ['diatonic'], function: 'D' },
  // 7th chords
  { roman: 'Imaj7', quality: 'maj7', tags: ['diatonic', '7th'], function: 'T' },
  { roman: 'ii7', quality: 'min7', tags: ['diatonic', '7th'], function: 'PD' },
  { roman: 'iii7', quality: 'min7', tags: ['diatonic', '7th'], function: 'T' },
  { roman: 'IVmaj7', quality: 'maj7', tags: ['diatonic', '7th'], function: 'PD' },
  { roman: 'V7', quality: 'dom7', tags: ['diatonic', '7th'], function: 'D' },
  { roman: 'vi7', quality: 'min7', tags: ['diatonic', '7th'], function: 'T' },
  { roman: 'viiø7', quality: 'hdim7', tags: ['diatonic', '7th'], function: 'D' },
];

// Distance Level 1: Secondary Dominants, Modal Interchange
const LEVEL_1: ChordTemplate[] = [
  // Secondary dominants
  { roman: 'V/V', quality: 'dom7', tags: ['secondary_dom'], function: 'D' },
  { roman: 'V/ii', quality: 'dom7', tags: ['secondary_dom'], function: 'D' },
  { roman: 'V/iii', quality: 'dom7', tags: ['secondary_dom'], function: 'D' },
  { roman: 'V/IV', quality: 'dom7', tags: ['secondary_dom'], function: 'D' },
  { roman: 'V/vi', quality: 'dom7', tags: ['secondary_dom'], function: 'D' },
  // Modal interchange (borrowed from parallel minor)
  { roman: 'bVII', quality: 'maj', tags: ['modal_interchange'], function: 'PD' },
  { roman: 'bVI', quality: 'maj', tags: ['modal_interchange'], function: 'T' },
  { roman: 'bIII', quality: 'maj', tags: ['modal_interchange'], function: 'T' },
  { roman: 'iv', quality: 'min', tags: ['modal_interchange'], function: 'PD' },
  { roman: 'ii°', quality: 'dim', tags: ['modal_interchange'], function: 'PD' },
  // Applied diminished
  { roman: 'vii°/V', quality: 'dim7', tags: ['applied_dim'], function: 'D' },
  { roman: 'vii°/ii', quality: 'dim7', tags: ['applied_dim'], function: 'D' },
];

// Distance Level 2: Tritone Subs, Chromatic Mediants
const LEVEL_2: ChordTemplate[] = [
  // Tritone substitutions
  { roman: 'bII7', quality: 'dom7', tags: ['tritone_sub'], function: 'D' },
  { roman: 'subV/V', quality: 'dom7', tags: ['tritone_sub'], function: 'D' },
  { roman: 'subV/ii', quality: 'dom7', tags: ['tritone_sub'], function: 'D' },
  // Chromatic mediants
  { roman: 'bVI', quality: 'maj7', tags: ['chromatic_mediant'], function: 'T' },
  { roman: '#IV', quality: 'maj', tags: ['chromatic_mediant'], function: 'PD' },
  { roman: 'bII', quality: 'maj', tags: ['neapolitan'], function: 'PD' },
  // Augmented 6th chords (simplified)
  { roman: 'It6', quality: 'maj', tags: ['aug6'], function: 'PD' },
  { roman: 'Ger6', quality: 'dom7', tags: ['aug6'], function: 'PD' },
  { roman: 'Fr6', quality: 'dom7', alterations: ['#11'], tags: ['aug6'], function: 'PD' },
];

// Distance Level 3: Extended Alterations
const LEVEL_3: ChordTemplate[] = [
  { roman: 'V7alt', quality: 'dom7', alterations: ['b9', '#9', 'b13'], tags: ['altered_dom'], function: 'D' },
  { roman: 'V7#9', quality: 'dom7', alterations: ['#9'], tags: ['altered_dom'], function: 'D' },
  { roman: 'V7b9', quality: 'dom7', alterations: ['b9'], tags: ['altered_dom'], function: 'D' },
  { roman: 'V7#11', quality: 'dom7', alterations: ['#11'], tags: ['lydian_dom'], function: 'D' },
  { roman: 'IVmaj7#11', quality: 'maj7', alterations: ['#11'], tags: ['lydian_chord'], function: 'PD' },
  { roman: 'bVImaj7#11', quality: 'maj7', alterations: ['#11'], tags: ['lydian_chord'], function: 'T' },
  // Upper structure triads
  { roman: 'V7/E', quality: 'dom7', tags: ['upper_structure'], function: 'D' },
];

// Distance Level 4: Polychords, Quartal
const LEVEL_4: ChordTemplate[] = [
  { roman: 'E/C', quality: 'maj', tags: ['polychord'], function: 'AMB' },
  { roman: 'D/C', quality: 'maj', tags: ['polychord'], function: 'AMB' },
  { roman: 'Eb/C', quality: 'maj', tags: ['polychord'], function: 'AMB' },
  { roman: 'quartal', quality: 'sus4', tags: ['quartal'], function: 'AMB' },
  { roman: 'quintal', quality: 'sus2', tags: ['quintal'], function: 'AMB' },
];

// Distance Level 5: Non-functional
const LEVEL_5: ChordTemplate[] = [
  { roman: 'chromatic', quality: 'maj', tags: ['non_functional', 'chromatic_planing'], function: 'AMB' },
  { roman: 'parallel', quality: 'maj', tags: ['non_functional', 'parallel_motion'], function: 'AMB' },
  { roman: 'pedal', quality: 'maj', tags: ['non_functional', 'pedal_point'], function: 'AMB' },
];

// Distance Level 6: Atonal
const LEVEL_6: ChordTemplate[] = [
  { roman: 'free', quality: 'maj', tags: ['atonal', 'free_chromatic'], function: 'AMB' },
  { roman: 'cluster', quality: 'maj', tags: ['atonal', 'cluster'], function: 'AMB' },
];

// All distance levels
export const DISTANCE_LEVELS: DistanceLevel[] = [
  { level: 0, name: 'Diatonic', description: 'Basic diatonic triads and 7ths', vocabulary: LEVEL_0 },
  { level: 1, name: 'Secondary/Modal', description: 'Secondary dominants, modal interchange', vocabulary: LEVEL_1 },
  { level: 2, name: 'Chromatic', description: 'Tritone subs, chromatic mediants', vocabulary: LEVEL_2 },
  { level: 3, name: 'Extended', description: 'Altered dominants, upper structures', vocabulary: LEVEL_3 },
  { level: 4, name: 'Polychordal', description: 'Polychords, quartal harmony', vocabulary: LEVEL_4 },
  { level: 5, name: 'Non-functional', description: 'Chromatic planing, parallel motion', vocabulary: LEVEL_5 },
  { level: 6, name: 'Atonal', description: 'Free chromatic, clusters', vocabulary: LEVEL_6 },
];

// Get vocabulary up to a certain distance level
export function getVocabularyUpToLevel(maxLevel: number): ChordTemplate[] {
  const vocabulary: ChordTemplate[] = [];
  for (let i = 0; i <= Math.min(maxLevel, 6); i++) {
    vocabulary.push(...DISTANCE_LEVELS[i].vocabulary);
  }
  return vocabulary;
}

// Get distance level of a chord
export function getChordDistanceLevel(chord: Chord): number {
  // Check tags first
  for (let level = 6; level >= 0; level--) {
    const levelVocab = DISTANCE_LEVELS[level].vocabulary;
    for (const template of levelVocab) {
      if (template.tags.some(tag => chord.tags.includes(tag))) {
        return level;
      }
    }
  }
  
  // Default based on quality and alterations
  if (chord.alterations.length > 0) return 3;
  if (chord.tags.includes('tritone_sub')) return 2;
  if (chord.tags.includes('secondary_dom') || chord.tags.includes('modal_interchange')) return 1;
  
  return 0;
}

// Calculate harmonic distance between two chords
export function calculateHarmonicDistance(chord1: Chord, chord2: Chord): number {
  let distance = 0;
  
  // Root motion distance
  const rootInterval = Math.abs(chord1.root_pc - chord2.root_pc);
  const normalizedInterval = Math.min(rootInterval, 12 - rootInterval);
  
  // Tritone = highest root distance
  if (normalizedInterval === 6) distance += 3;
  else if (normalizedInterval === 1 || normalizedInterval === 11) distance += 2;
  else if (normalizedInterval === 3 || normalizedInterval === 4) distance += 1.5;
  else distance += normalizedInterval * 0.3;
  
  // Quality change distance
  if (chord1.quality !== chord2.quality) {
    const qualityDistance = getQualityDistance(chord1.quality, chord2.quality);
    distance += qualityDistance;
  }
  
  // Distance level difference
  const level1 = getChordDistanceLevel(chord1);
  const level2 = getChordDistanceLevel(chord2);
  distance += Math.abs(level1 - level2) * 0.5;
  
  return distance;
}

// Get distance between chord qualities
function getQualityDistance(q1: ChordQuality, q2: ChordQuality): number {
  const qualityGroups: Record<string, ChordQuality[]> = {
    major: ['maj', 'maj7', 'maj6', 'add9'],
    minor: ['min', 'min7', 'min6', 'minmaj7'],
    dominant: ['dom7', 'aug7'],
    diminished: ['dim', 'dim7', 'hdim7'],
    augmented: ['aug'],
    suspended: ['sus4', 'sus2'],
  };
  
  let group1 = '', group2 = '';
  for (const [group, qualities] of Object.entries(qualityGroups)) {
    if (qualities.includes(q1)) group1 = group;
    if (qualities.includes(q2)) group2 = group;
  }
  
  if (group1 === group2) return 0.5;
  
  // Major ↔ Minor is close
  if ((group1 === 'major' && group2 === 'minor') || (group1 === 'minor' && group2 === 'major')) {
    return 1;
  }
  
  // Dominant is close to major
  if ((group1 === 'dominant' && group2 === 'major') || (group1 === 'major' && group2 === 'dominant')) {
    return 0.75;
  }
  
  return 2;
}

// Generate chord from template in a specific key
export function templateToChord(template: ChordTemplate, keyRoot: number): Chord {
  // Parse roman numeral to get root
  const romanMatch = template.roman.match(/^([b#]?)([IViv]+)/);
  if (!romanMatch) {
    return createChord(keyRoot, template.quality, {
      roman: template.roman,
      function: template.function,
      tags: template.tags,
      distance_level: 0,
    });
  }
  
  const [, accidental, numeral] = romanMatch;
  const upperNumeral = numeral.toUpperCase();
  
  // Roman to semitone offset
  const romanOffsets: Record<string, number> = {
    'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
  };
  
  let offset = romanOffsets[upperNumeral] || 0;
  if (accidental === 'b') offset -= 1;
  if (accidental === '#') offset += 1;
  
  const root_pc = (keyRoot + offset + 12) % 12;
  
  // Determine distance level from template tags
  let distance_level = 0;
  for (let level = 0; level <= 6; level++) {
    if (DISTANCE_LEVELS[level].vocabulary.includes(template)) {
      distance_level = level;
      break;
    }
  }
  
  return createChord(root_pc, template.quality, {
    roman: template.roman,
    function: template.function,
    extensions: template.extensions,
    alterations: template.alterations,
    tags: template.tags,
    distance_level,
  });
}

// Get all chords available at a distance level for a key
export function getChordsAtLevel(level: number, keyRoot: number): Chord[] {
  const templates = DISTANCE_LEVELS[level]?.vocabulary || [];
  return templates.map(t => templateToChord(t, keyRoot));
}

// Tag a chord based on its characteristics
export function tagChord(chord: Chord, keyRoot: number): string[] {
  const tags: string[] = [];
  const interval = ((chord.root_pc - keyRoot) % 12 + 12) % 12;
  
  // Check if diatonic
  const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11];
  if (diatonicIntervals.includes(interval)) {
    tags.push('diatonic');
  }
  
  // Check for dominant 7th (potential secondary dominant)
  if (chord.quality === 'dom7' && interval !== 7) {
    tags.push('secondary_dom');
  }
  
  // Check for tritone sub
  if (chord.quality === 'dom7' && interval === 1) {
    tags.push('tritone_sub');
  }
  
  // Check for modal interchange
  const modalIntervals = [1, 3, 6, 8, 10];
  if (modalIntervals.includes(interval)) {
    tags.push('modal_interchange');
  }
  
  // Check for alterations
  if (chord.alterations.length > 0) {
    tags.push('altered');
  }
  
  return tags;
}
