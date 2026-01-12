// Functional Harmony based on Rulebook §4

import { Chord, HarmonicFunction, ChordQuality } from './chordModel';

// Function classification for scale degrees
export const DEGREE_FUNCTIONS: Record<number, HarmonicFunction> = {
  1: 'T',   // Tonic
  2: 'PD',  // Predominant
  3: 'T',   // Tonic (weak)
  4: 'PD',  // Predominant
  5: 'D',   // Dominant
  6: 'T',   // Tonic (relative minor)
  7: 'D',   // Dominant (leading tone)
};

// Roman numeral to degree mapping
export const ROMAN_TO_DEGREE: Record<string, number> = {
  'I': 1, 'i': 1, 'bI': 1,
  'II': 2, 'ii': 2, 'bII': 2, '#II': 2,
  'III': 3, 'iii': 3, 'bIII': 3, '#III': 3,
  'IV': 4, 'iv': 4, 'bIV': 4, '#IV': 4,
  'V': 5, 'v': 5, 'bV': 5,
  'VI': 6, 'vi': 6, 'bVI': 6, '#VI': 6,
  'VII': 7, 'vii': 7, 'bVII': 7, '#VII': 7,
};

// Grammar rules: valid function transitions
export const FUNCTION_GRAMMAR: Record<HarmonicFunction, HarmonicFunction[]> = {
  'T': ['T', 'PD', 'D'],      // Tonic can go anywhere
  'PD': ['PD', 'D', 'T'],     // Predominant → Dominant preferred, can return to T
  'D': ['T', 'D'],            // Dominant → Tonic (resolution), can extend
  'AMB': ['T', 'PD', 'D'],    // Ambiguous can go anywhere
};

// Root motion preferences (interval in semitones → preference score)
export const ROOT_MOTION_SCORES: Record<number, number> = {
  7: 100,   // Down 5th (up 4th) - strongest
  5: 95,    // Up 4th (down 5th)
  2: 80,    // Up 2nd (step up)
  10: 75,   // Down 2nd (step down)
  3: 70,    // Down 3rd
  9: 65,    // Up 3rd
  4: 60,    // Down major 3rd
  8: 55,    // Up major 3rd
  6: 40,    // Tritone
  1: 30,    // Half step
  11: 30,   // Half step down
  0: 20,    // Same root (pedal)
};

// Get harmonic function from roman numeral
export function getRomanFunction(roman: string): HarmonicFunction {
  // Extract base numeral
  const match = roman.match(/^([b#]?)([IViv]+)/);
  if (!match) return 'AMB';
  
  const [, accidental, numeral] = match;
  const upperNumeral = numeral.toUpperCase();
  
  // Check for secondary dominants (V/x, viio/x)
  if (roman.includes('/')) {
    return 'D'; // Secondary dominants are dominant function
  }
  
  // Modal interchange chords
  if (accidental === 'b') {
    if (upperNumeral === 'VII') return 'PD'; // bVII is predominant
    if (upperNumeral === 'VI') return 'T';   // bVI is tonic substitute
    if (upperNumeral === 'III') return 'T';  // bIII is tonic substitute
    if (upperNumeral === 'II') return 'D';   // bII (Neapolitan) is dominant prep
  }
  
  const degree = ROMAN_TO_DEGREE[upperNumeral];
  return degree ? DEGREE_FUNCTIONS[degree] : 'AMB';
}

// Get harmonic function from chord in context
export function getChordFunction(chord: Chord, keyRoot: number): HarmonicFunction {
  // If roman numeral is set, use it
  if (chord.roman) {
    return getRomanFunction(chord.roman);
  }
  
  // Calculate degree from root
  const interval = ((chord.root_pc - keyRoot) % 12 + 12) % 12;
  
  // Map interval to degree
  const intervalToDegree: Record<number, number> = {
    0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7,
    1: 2, 3: 3, 6: 4, 8: 5, 10: 6,
  };
  
  const degree = intervalToDegree[interval];
  if (!degree) return 'AMB';
  
  // Dominant 7th chords are always dominant function
  if (chord.quality === 'dom7') {
    return 'D';
  }
  
  // Diminished chords on degree 7 are dominant
  if ((chord.quality === 'dim' || chord.quality === 'dim7' || chord.quality === 'hdim7') && degree === 7) {
    return 'D';
  }
  
  return DEGREE_FUNCTIONS[degree] || 'AMB';
}

// Check if a function transition is valid
export function isValidTransition(from: HarmonicFunction, to: HarmonicFunction): boolean {
  return FUNCTION_GRAMMAR[from].includes(to);
}

// Score a function transition (higher = better)
export function scoreTransition(from: HarmonicFunction, to: HarmonicFunction): number {
  // Best transitions
  if (from === 'D' && to === 'T') return 100;  // Resolution
  if (from === 'PD' && to === 'D') return 95;  // Approach dominant
  if (from === 'T' && to === 'PD') return 90;  // Leave tonic
  
  // Good transitions
  if (from === 'T' && to === 'D') return 80;   // Direct to dominant
  if (from === 'PD' && to === 'T') return 70;  // Plagal-ish
  
  // Acceptable
  if (from === to) return 50;                   // Same function
  
  // Weak
  if (from === 'D' && to === 'PD') return 30;  // Retrogression
  
  return 40;
}

// Score root motion between two chords
export function scoreRootMotion(fromRoot: number, toRoot: number): number {
  const interval = ((toRoot - fromRoot) % 12 + 12) % 12;
  return ROOT_MOTION_SCORES[interval] || 50;
}

// Get suggested next functions
export function getSuggestedNextFunctions(current: HarmonicFunction): HarmonicFunction[] {
  const suggestions: HarmonicFunction[] = [];
  
  switch (current) {
    case 'T':
      suggestions.push('PD', 'D', 'T');
      break;
    case 'PD':
      suggestions.push('D', 'T', 'PD');
      break;
    case 'D':
      suggestions.push('T', 'D');
      break;
    default:
      suggestions.push('T', 'PD', 'D');
  }
  
  return suggestions;
}

// Analyze a chord progression for function flow
export function analyzeProgressionFunctions(
  chords: Chord[], 
  keyRoot: number
): { chord: Chord; function: HarmonicFunction; transitionScore: number }[] {
  return chords.map((chord, i) => {
    const func = getChordFunction(chord, keyRoot);
    let transitionScore = 100;
    
    if (i > 0) {
      const prevFunc = getChordFunction(chords[i - 1], keyRoot);
      transitionScore = scoreTransition(prevFunc, func);
    }
    
    return { chord, function: func, transitionScore };
  });
}

// Generate roman numeral from chord and key
export function generateRoman(chord: Chord, keyRoot: number, keyQuality: 'major' | 'minor' = 'major'): string {
  const interval = ((chord.root_pc - keyRoot) % 12 + 12) % 12;
  
  // Major key degree intervals
  const majorDegrees: Record<number, string> = {
    0: 'I', 2: 'II', 4: 'III', 5: 'IV', 7: 'V', 9: 'VI', 11: 'VII',
    1: 'bII', 3: 'bIII', 6: '#IV', 8: 'bVI', 10: 'bVII',
  };
  
  // Minor key degree intervals
  const minorDegrees: Record<number, string> = {
    0: 'i', 2: 'ii', 3: 'III', 5: 'iv', 7: 'v', 8: 'VI', 10: 'VII',
    1: 'bII', 4: '#iii', 6: '#iv', 9: '#vi', 11: 'vii',
  };
  
  const degrees = keyQuality === 'major' ? majorDegrees : minorDegrees;
  let roman = degrees[interval] || 'I';
  
  // Adjust case based on chord quality
  const isMinor = ['min', 'min7', 'min6', 'hdim7', 'dim', 'dim7', 'minmaj7'].includes(chord.quality);
  
  if (isMinor && roman === roman.toUpperCase()) {
    roman = roman.toLowerCase();
  } else if (!isMinor && roman === roman.toLowerCase()) {
    roman = roman.toUpperCase();
  }
  
  // Add quality suffix
  if (chord.quality === 'dim' || chord.quality === 'dim7') {
    roman += '°';
  } else if (chord.quality === 'hdim7') {
    roman += 'ø';
  } else if (chord.quality === 'aug' || chord.quality === 'aug7') {
    roman += '+';
  } else if (chord.quality === 'dom7') {
    roman += '7';
  } else if (chord.quality === 'maj7') {
    roman += 'Δ7';
  } else if (chord.quality === 'min7') {
    roman += '7';
  }
  
  return roman;
}

// Cadence types
export type CadenceType = 'authentic' | 'half' | 'plagal' | 'deceptive' | 'none';

// Detect cadence type from last two chords
export function detectCadence(
  penultimate: Chord, 
  final: Chord, 
  keyRoot: number
): CadenceType {
  const penFunc = getChordFunction(penultimate, keyRoot);
  const finFunc = getChordFunction(final, keyRoot);
  const finInterval = ((final.root_pc - keyRoot) % 12 + 12) % 12;
  
  // Authentic: V → I
  if (penFunc === 'D' && finFunc === 'T' && finInterval === 0) {
    return 'authentic';
  }
  
  // Half: any → V
  if (finFunc === 'D' && ((final.root_pc - keyRoot + 12) % 12) === 7) {
    return 'half';
  }
  
  // Plagal: IV → I
  if (penFunc === 'PD' && finFunc === 'T' && finInterval === 0) {
    return 'plagal';
  }
  
  // Deceptive: V → vi (or other non-tonic)
  if (penFunc === 'D' && finFunc === 'T' && finInterval !== 0) {
    return 'deceptive';
  }
  
  return 'none';
}
