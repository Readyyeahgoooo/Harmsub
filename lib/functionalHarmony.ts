// ============================================================================
// FUNCTIONAL HARMONY FRAMEWORK
// Implements §4 of Rulebook
// ============================================================================

import { ChordSymbol, ChordFunction } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// 4.2 Functional Families (Major, Key-Relative)
// ----------------------------------------------------------------------------

export interface FunctionalFamily {
  function: ChordFunction;
  description: string;
  chord_examples: string[];
  scale_degrees: number[];
}

export const FUNCTIONAL_FAMILIES: Record<ChordFunction, FunctionalFamily> = {
  T: {
    function: 'T',
    description: 'Tonic: stability / rest',
    chord_examples: ['I', 'vi', 'iii', 'I6', 'Imaj9', 'vi9'],
    scale_degrees: [1, 6, 3],
  },
  PD: {
    function: 'PD',
    description: 'Predominant: motion away, sets up dominant',
    chord_examples: ['ii', 'IV', 'vi (as PD)', 'I6'],
    scale_degrees: [2, 4, 6],
  },
  D: {
    function: 'D',
    description: 'Dominant: tension resolving to tonic',
    chord_examples: ['V', 'vii°', 'viiø', 'applied dominants'],
    scale_degrees: [5, 7],
  },
  CT: {
    function: 'CT',
    description: 'Common-tone / prolongation: color chords that share tones',
    chord_examples: ['CT chords', 'planing blocks'],
    scale_degrees: [],
  },
  SEQ: {
    function: 'SEQ',
    description: 'Sequence: patterns like descending-fifth chains',
    chord_examples: ['circle of fifths', 'chromatic sequences'],
    scale_degrees: [],
  },
  N: {
    function: 'N',
    description: 'Non-functional: planing blocks, cinematic pads',
    chord_examples: ['planing', 'pedal', 'polychords'],
    scale_degrees: [],
  },
};

// ----------------------------------------------------------------------------
// 4.3 Core Grammar Rules (High Weight)
// ----------------------------------------------------------------------------

export interface GrammarRule {
  from: ChordFunction;
  to: ChordFunction;
  weight: number;
  description: string;
  type: 'cadence' | 'preparation' | 'departure' | 'prolongation' | 'deceptive';
}

export const GRAMMAR_RULES: GrammarRule[] = [
  // High-probability edges
  { from: 'D', to: 'T', weight: 10, description: 'Cadential resolution', type: 'cadence' },
  { from: 'PD', to: 'D', weight: 9, description: 'Preparation for dominant', type: 'preparation' },
  { from: 'T', to: 'PD', weight: 8, description: 'Departure from tonic', type: 'departure' },
  
  // Medium probability
  { from: 'T', to: 'D', weight: 6, description: 'Half-cadence feel', type: 'deceptive' },
  { from: 'D', to: 'D', weight: 4, description: 'Dominant prolongation', type: 'prolongation' },
  { from: 'PD', to: 'PD', weight: 4, description: 'Predominant prolongation', type: 'prolongation' },
  { from: 'T', to: 'T', weight: 4, description: 'Tonic prolongation', type: 'prolongation' },
  { from: 'CT', to: 'CT', weight: 5, description: 'Common-tone motion', type: 'prolongation' },
  
  // Low but allowed
  { from: 'PD', to: 'T', weight: 3, description: 'Plagal-ish resolution', type: 'deceptive' },
  { from: 'D', to: 'PD', weight: 2, description: 'Deceptive re-routing', type: 'deceptive' },
  { from: 'D', to: 'CT', weight: 3, description: 'Dominant to CT', type: 'deceptive' },
  { from: 'N', to: 'N', weight: 6, description: 'Non-functional planing', type: 'prolongation' },
];

// ----------------------------------------------------------------------------
// 4.4 Root Motion Preferences (General)
// ----------------------------------------------------------------------------

export interface RootMotion {
  type: string;
  semitones: number;
  weight: number;
  description: string;
  context_preference?: string;
}

export const ROOT_MOTIONS: RootMotion[] = [
  { type: 'descending_fifth', semitones: -7, weight: 10, description: 'Descending fifth / ascending fourth (circle of fifths)' },
  { type: 'ascending_fourth', semitones: 5, weight: 10, description: 'Ascending fourth / descending fifth' },
  { type: 'stepwise_up', semitones: 2, weight: 8, description: 'Stepwise motion up (whole tone)' },
  { type: 'stepwise_down', semitones: -2, weight: 8, description: 'Stepwise motion down (whole tone)' },
  { type: 'third_up', semitones: 4, weight: 6, description: 'Third relations up (colorful, common-tone)' },
  { type: 'third_down', semitones: -4, weight: 6, description: 'Third relations down (colorful, common-tone)' },
  { type: 'tritone', semitones: 6, weight: 2, description: 'Tritone leap (spicy, style-dependent)' },
  { type: 'chromatic_up', semitones: 1, weight: 4, description: 'Chromatic leap up' },
  { type: 'chromatic_down', semitones: -1, weight: 4, description: 'Chromatic leap down' },
];

// ----------------------------------------------------------------------------
// Get transition weight between functions
// ----------------------------------------------------------------------------

export function getTransitionWeight(from: ChordFunction, to: ChordFunction): number {
  const rule = GRAMMAR_RULES.find(r => r.from === from && r.to === to);
  return rule?.weight || 0;
}

// ----------------------------------------------------------------------------
// Get allowed transitions from a function
// ----------------------------------------------------------------------------

export function getAllowedTransitions(from: ChordFunction): ChordFunction[] {
  const rules = GRAMMAR_RULES.filter(r => r.from === from);
  return rules.map(r => r.to);
}

// ----------------------------------------------------------------------------
// Get transition type
// ----------------------------------------------------------------------------

export function getTransitionType(from: ChordFunction, to: ChordFunction): string {
  const rule = GRAMMAR_RULES.find(r => r.from === from && r.to === to);
  return rule?.type || 'unknown';
}

// ----------------------------------------------------------------------------
// Get root motion type
// ----------------------------------------------------------------------------

export function getRootMotion(fromPitch: number, toPitch: number): RootMotion | null {
  const interval = ((toPitch - fromPitch) % 12 + 12) % 12;
  const semitones = interval <= 6 ? interval : interval - 12;
  
  return ROOT_MOTIONS.find(m => m.semitones === semitones) || null;
}

// ----------------------------------------------------------------------------
// Get root motion weight
// ----------------------------------------------------------------------------

export function getRootMotionWeight(fromPitch: number, toPitch: number): number {
  const motion = getRootMotion(fromPitch, toPitch);
  return motion?.weight || 2;
}

// ----------------------------------------------------------------------------
// Function assignment helpers
// ----------------------------------------------------------------------------

export function assignFunctionToChord(chord: ChordSymbol, scaleRoot: number): ChordFunction {
  // This is a simplified version - in practice, you'd analyze the chord's
  // relationship to the key center more thoroughly
  
  const chordRoot = chord.root_pc;
  const interval = ((chordRoot - scaleRoot) % 12 + 12) % 12;
  
  // Map scale degrees to functions (for major key)
  const degreeToFunction: Record<number, ChordFunction> = {
    0: 'T',    // I
    2: 'PD',   // ii
    4: 'T',    // iii
    5: 'PD',   // IV
    7: 'D',    // V
    9: 'T',    // vi
    11: 'D',    // vii°
  };
  
  return degreeToFunction[interval] || 'N';
}

// ----------------------------------------------------------------------------
// Function progression validation
// ----------------------------------------------------------------------------

export function isValidProgression(
  fromFunction: ChordFunction,
  toFunction: ChordFunction,
  weightThreshold: number = 2
): boolean {
  const weight = getTransitionWeight(fromFunction, toFunction);
  return weight >= weightThreshold;
}

// ----------------------------------------------------------------------------
// Get most likely next function
// ----------------------------------------------------------------------------

export function getMostLikelyNextFunction(
  currentFunction: ChordFunction,
  previousFunctions: ChordFunction[] = []
): ChordFunction {
  const rules = GRAMMAR_RULES.filter(r => r.from === currentFunction);
  
  // Sort by weight, descending
  rules.sort((a, b) => b.weight - a.weight);
  
  // Return the highest-weighted option
  return rules[0]?.to || 'T';
}

// ----------------------------------------------------------------------------
// Function sequence analysis
// ----------------------------------------------------------------------------

export interface FunctionSequence {
  functions: ChordFunction[];
  transition_weights: number[];
  transition_types: string[];
  total_weight: number;
}

export function analyzeFunctionSequence(functions: ChordFunction[]): FunctionSequence {
  const transition_weights: number[] = [];
  const transition_types: string[] = [];
  
  for (let i = 0; i < functions.length - 1; i++) {
    transition_weights.push(getTransitionWeight(functions[i], functions[i + 1]));
    transition_types.push(getTransitionType(functions[i], functions[i + 1]));
  }
  
  const total_weight = transition_weights.reduce((sum, w) => sum + w, 0);
  
  return {
    functions,
    transition_weights,
    transition_types,
    total_weight,
  };
}

// ----------------------------------------------------------------------------
// Cadence detection
// ----------------------------------------------------------------------------

export interface Cadence {
  start_index: number;
  end_index: number;
  type: 'perfect' | 'half' | 'deceptive' | 'plagal' | 'tritone_sub' | 'backdoor';
  strength: number; // 0-1
}

export function detectCadences(functions: ChordFunction[]): Cadence[] {
  const cadences: Cadence[] = [];
  
  for (let i = 0; i < functions.length - 1; i++) {
    const from = functions[i];
    const to = functions[i + 1];
    
    if (from === 'D' && to === 'T') {
      cadences.push({
        start_index: i,
        end_index: i + 1,
        type: 'perfect',
        strength: 1.0,
      });
    } else if (from === 'PD' && to === 'D') {
      // Half cadence
      cadences.push({
        start_index: i,
        end_index: i + 1,
        type: 'half',
        strength: 0.6,
      });
    } else if (from === 'D' && to === 'PD') {
      cadences.push({
        start_index: i,
        end_index: i + 1,
        type: 'deceptive',
        strength: 0.7,
      });
    } else if (from === 'PD' && to === 'T') {
      cadences.push({
        start_index: i,
        end_index: i + 1,
        type: 'plagal',
        strength: 0.5,
      });
    }
  }
  
  return cadences;
}

// ----------------------------------------------------------------------------
// Function resolution strength
// ----------------------------------------------------------------------------

export function getResolutionStrength(from: ChordFunction, to: ChordFunction): number {
  if (from === 'D' && to === 'T') return 1.0;
  if (from === 'PD' && to === 'D') return 0.8;
  if (from === 'D' && to === 'PD') return 0.6;
  if (from === 'PD' && to === 'T') return 0.5;
  if (from === 'T' && to === 'PD') return 0.7;
  if (from === 'T' && to === 'D') return 0.6;
  return 0.3;
}