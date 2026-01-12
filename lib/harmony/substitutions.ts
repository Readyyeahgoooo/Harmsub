// Substitution Ladders based on Rulebook §7

import { Chord, ChordQuality, createChord, HarmonicFunction } from './chordModel';

export interface SubstitutionOption {
  roman: string;
  quality: ChordQuality;
  distance: number;  // 0 = closest, higher = further
  tags: string[];
  description: string;
}

// Tonic Substitution Ladder (§7)
export const TONIC_SUBSTITUTIONS: SubstitutionOption[] = [
  { roman: 'I', quality: 'maj', distance: 0, tags: ['diatonic'], description: 'Primary tonic' },
  { roman: 'Imaj7', quality: 'maj7', distance: 0, tags: ['diatonic', '7th'], description: 'Tonic with 7th' },
  { roman: 'vi', quality: 'min', distance: 1, tags: ['diatonic'], description: 'Relative minor' },
  { roman: 'vi7', quality: 'min7', distance: 1, tags: ['diatonic', '7th'], description: 'Relative minor 7th' },
  { roman: 'iii', quality: 'min', distance: 2, tags: ['diatonic'], description: 'Mediant' },
  { roman: 'iii7', quality: 'min7', distance: 2, tags: ['diatonic', '7th'], description: 'Mediant 7th' },
  { roman: 'bVI', quality: 'maj', distance: 3, tags: ['modal_interchange'], description: 'Flat VI (borrowed)' },
  { roman: 'bVImaj7', quality: 'maj7', distance: 3, tags: ['modal_interchange', '7th'], description: 'Flat VI maj7' },
  { roman: 'bIII', quality: 'maj', distance: 4, tags: ['modal_interchange'], description: 'Flat III (borrowed)' },
  { roman: '#IVm7b5', quality: 'hdim7', distance: 5, tags: ['chromatic'], description: 'Sharp IV half-dim' },
];

// Predominant Substitution Ladder (§7)
export const PREDOMINANT_SUBSTITUTIONS: SubstitutionOption[] = [
  { roman: 'IV', quality: 'maj', distance: 0, tags: ['diatonic'], description: 'Primary subdominant' },
  { roman: 'IVmaj7', quality: 'maj7', distance: 0, tags: ['diatonic', '7th'], description: 'Subdominant maj7' },
  { roman: 'ii', quality: 'min', distance: 1, tags: ['diatonic'], description: 'Supertonic' },
  { roman: 'ii7', quality: 'min7', distance: 1, tags: ['diatonic', '7th'], description: 'Supertonic 7th' },
  { roman: 'bVII', quality: 'maj', distance: 2, tags: ['modal_interchange'], description: 'Flat VII (borrowed)' },
  { roman: 'bVII7', quality: 'dom7', distance: 2, tags: ['modal_interchange', '7th'], description: 'Flat VII dom7' },
  { roman: 'iv', quality: 'min', distance: 2, tags: ['modal_interchange'], description: 'Minor iv (borrowed)' },
  { roman: 'iv7', quality: 'min7', distance: 2, tags: ['modal_interchange', '7th'], description: 'Minor iv 7th' },
  { roman: '#IVdim', quality: 'dim', distance: 3, tags: ['chromatic'], description: 'Sharp IV diminished' },
  { roman: 'bII', quality: 'maj', distance: 4, tags: ['neapolitan'], description: 'Neapolitan' },
  { roman: 'bIImaj7', quality: 'maj7', distance: 4, tags: ['neapolitan', '7th'], description: 'Neapolitan maj7' },
  { roman: 'Ger6', quality: 'dom7', distance: 5, tags: ['aug6'], description: 'German 6th' },
];

// Dominant Substitution Ladder (§7)
export const DOMINANT_SUBSTITUTIONS: SubstitutionOption[] = [
  { roman: 'V', quality: 'maj', distance: 0, tags: ['diatonic'], description: 'Primary dominant' },
  { roman: 'V7', quality: 'dom7', distance: 0, tags: ['diatonic', '7th'], description: 'Dominant 7th' },
  { roman: 'vii°', quality: 'dim', distance: 1, tags: ['diatonic'], description: 'Leading tone dim' },
  { roman: 'viiø7', quality: 'hdim7', distance: 1, tags: ['diatonic', '7th'], description: 'Leading tone half-dim' },
  { roman: 'vii°7', quality: 'dim7', distance: 1, tags: ['diatonic', '7th'], description: 'Leading tone dim7' },
  { roman: 'bII7', quality: 'dom7', distance: 2, tags: ['tritone_sub'], description: 'Tritone substitution' },
  { roman: 'subV', quality: 'dom7', distance: 2, tags: ['tritone_sub'], description: 'SubV (tritone sub)' },
  { roman: 'V7alt', quality: 'dom7', distance: 3, tags: ['altered_dom'], description: 'Altered dominant' },
  { roman: 'V7#9', quality: 'dom7', distance: 3, tags: ['altered_dom'], description: 'Dominant #9' },
  { roman: 'V7b9', quality: 'dom7', distance: 3, tags: ['altered_dom'], description: 'Dominant b9' },
  { roman: 'V7#11', quality: 'dom7', distance: 3, tags: ['lydian_dom'], description: 'Lydian dominant' },
  { roman: 'V7sus4', quality: 'sus4', distance: 2, tags: ['suspended'], description: 'Suspended dominant' },
];

// Get substitutions for a function
export function getSubstitutionsForFunction(
  func: HarmonicFunction, 
  maxDistance: number = 5
): SubstitutionOption[] {
  let ladder: SubstitutionOption[];
  
  switch (func) {
    case 'T':
      ladder = TONIC_SUBSTITUTIONS;
      break;
    case 'PD':
      ladder = PREDOMINANT_SUBSTITUTIONS;
      break;
    case 'D':
      ladder = DOMINANT_SUBSTITUTIONS;
      break;
    default:
      return [];
  }
  
  return ladder.filter(sub => sub.distance <= maxDistance);
}

// Get substitution options for a specific chord
export function getSubstitutionsForChord(
  chord: Chord, 
  keyRoot: number,
  maxDistance: number = 3
): SubstitutionOption[] {
  const func = chord.function;
  const substitutions = getSubstitutionsForFunction(func, maxDistance);
  
  // Filter out the original chord
  return substitutions.filter(sub => {
    const subRoman = sub.roman.replace(/[0-9°ø+]/g, '').toLowerCase();
    const chordRoman = chord.roman.replace(/[0-9°ø+]/g, '').toLowerCase();
    return subRoman !== chordRoman;
  });
}

// Convert substitution to chord in key
export function substitutionToChord(sub: SubstitutionOption, keyRoot: number): Chord {
  // Parse roman numeral
  const romanMatch = sub.roman.match(/^([b#]?)([IViv]+)/);
  if (!romanMatch) {
    return createChord(keyRoot, sub.quality, {
      roman: sub.roman,
      tags: sub.tags,
      distance_level: sub.distance,
    });
  }
  
  const [, accidental, numeral] = romanMatch;
  const upperNumeral = numeral.toUpperCase();
  
  const romanOffsets: Record<string, number> = {
    'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
  };
  
  let offset = romanOffsets[upperNumeral] || 0;
  if (accidental === 'b') offset -= 1;
  if (accidental === '#') offset += 1;
  
  const root_pc = (keyRoot + offset + 12) % 12;
  
  // Determine function from ladder
  let func: HarmonicFunction = 'AMB';
  if (TONIC_SUBSTITUTIONS.includes(sub)) func = 'T';
  else if (PREDOMINANT_SUBSTITUTIONS.includes(sub)) func = 'PD';
  else if (DOMINANT_SUBSTITUTIONS.includes(sub)) func = 'D';
  
  // Parse alterations from roman
  const alterations: string[] = [];
  if (sub.roman.includes('alt')) alterations.push('b9', '#9', 'b13');
  if (sub.roman.includes('#9')) alterations.push('#9');
  if (sub.roman.includes('b9')) alterations.push('b9');
  if (sub.roman.includes('#11')) alterations.push('#11');
  
  return createChord(root_pc, sub.quality, {
    roman: sub.roman,
    function: func,
    tags: sub.tags,
    alterations,
    distance_level: sub.distance,
  });
}

// Suggest substitutions for a chord progression
export function suggestSubstitutions(
  chords: Chord[],
  keyRoot: number,
  targetDistance: number = 2
): { original: Chord; suggestions: SubstitutionOption[] }[] {
  return chords.map(chord => ({
    original: chord,
    suggestions: getSubstitutionsForChord(chord, keyRoot, targetDistance),
  }));
}

// Apply a substitution to a progression
export function applySubstitution(
  chords: Chord[],
  index: number,
  substitution: SubstitutionOption,
  keyRoot: number
): Chord[] {
  const newChords = [...chords];
  newChords[index] = substitutionToChord(substitution, keyRoot);
  return newChords;
}

// Generate reharmonization with target distance
export function reharmonize(
  chords: Chord[],
  keyRoot: number,
  targetDistance: number = 2,
  preserveFunction: boolean = true
): Chord[] {
  return chords.map(chord => {
    const subs = getSubstitutionsForChord(chord, keyRoot, targetDistance + 1);
    
    // Find substitution closest to target distance
    const targetSubs = subs.filter(s => s.distance <= targetDistance && s.distance > 0);
    
    if (targetSubs.length === 0) return chord;
    
    // Pick randomly from valid substitutions
    const selected = targetSubs[Math.floor(Math.random() * targetSubs.length)];
    return substitutionToChord(selected, keyRoot);
  });
}

// Get common substitution patterns
export interface SubstitutionPattern {
  name: string;
  original: string[];
  substituted: string[];
  description: string;
}

export const COMMON_PATTERNS: SubstitutionPattern[] = [
  {
    name: 'Tritone Sub for V',
    original: ['ii7', 'V7', 'I'],
    substituted: ['ii7', 'bII7', 'I'],
    description: 'Replace V7 with bII7 (tritone substitution)',
  },
  {
    name: 'Backdoor ii-V',
    original: ['ii7', 'V7', 'I'],
    substituted: ['iv7', 'bVII7', 'I'],
    description: 'Backdoor progression using iv and bVII',
  },
  {
    name: 'Coltrane Changes',
    original: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'],
    substituted: ['Imaj7', 'bIIImaj7', 'Vmaj7', 'bVIImaj7'],
    description: 'Giant Steps-style major third cycle',
  },
  {
    name: 'Deceptive Resolution',
    original: ['V7', 'I'],
    substituted: ['V7', 'vi'],
    description: 'Resolve to vi instead of I',
  },
  {
    name: 'Chromatic Approach',
    original: ['V7', 'I'],
    substituted: ['bVI7', 'V7', 'I'],
    description: 'Add chromatic approach chord',
  },
  {
    name: 'Modal Interchange IV',
    original: ['I', 'IV', 'V', 'I'],
    substituted: ['I', 'iv', 'V', 'I'],
    description: 'Borrow minor iv from parallel minor',
  },
];
