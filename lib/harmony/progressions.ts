// Progression Engines based on Rulebook §8-9

import { Chord, ChordQuality, createChord, HarmonicFunction } from './chordModel';
import { getChordFunction, scoreTransition, scoreRootMotion, CadenceType } from './functions';
import { getVocabularyUpToLevel, templateToChord, ChordTemplate } from './distance';
import { TONIC_SUBSTITUTIONS, PREDOMINANT_SUBSTITUTIONS, DOMINANT_SUBSTITUTIONS, substitutionToChord } from './substitutions';

// Progression template types
export interface ProgressionTemplate {
  name: string;
  bars: number;
  pattern: string[];  // Roman numerals
  style: string[];
  description: string;
}

// 4-chord templates (§9)
export const FOUR_CHORD_TEMPLATES: ProgressionTemplate[] = [
  { name: 'Pop I-V-vi-IV', bars: 4, pattern: ['I', 'V', 'vi', 'IV'], style: ['pop'], description: 'Classic pop progression' },
  { name: 'Pop I-IV-V-I', bars: 4, pattern: ['I', 'IV', 'V', 'I'], style: ['pop', 'rock'], description: 'Basic cadential' },
  { name: '50s I-vi-IV-V', bars: 4, pattern: ['I', 'vi', 'IV', 'V'], style: ['pop', 'doo-wop'], description: '50s progression' },
  { name: 'Jazz ii-V-I-I', bars: 4, pattern: ['ii7', 'V7', 'Imaj7', 'Imaj7'], style: ['jazz'], description: 'Basic jazz turnaround' },
  { name: 'Minor i-bVI-bIII-bVII', bars: 4, pattern: ['i', 'bVI', 'bIII', 'bVII'], style: ['rock', 'alternative'], description: 'Aeolian progression' },
  { name: 'Andalusian i-bVII-bVI-V', bars: 4, pattern: ['i', 'bVII', 'bVI', 'V'], style: ['flamenco', 'classical'], description: 'Andalusian cadence' },
];

// 8-chord templates (§9)
export const EIGHT_CHORD_TEMPLATES: ProgressionTemplate[] = [
  { 
    name: 'Jazz Turnaround', 
    bars: 8, 
    pattern: ['Imaj7', 'vi7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], 
    style: ['jazz'], 
    description: 'Extended jazz turnaround with secondary dominant' 
  },
  { 
    name: 'Rhythm Changes A', 
    bars: 8, 
    pattern: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], 
    style: ['jazz', 'bebop'], 
    description: 'Rhythm changes A section' 
  },
  { 
    name: 'Pop Extended', 
    bars: 8, 
    pattern: ['I', 'V', 'vi', 'IV', 'I', 'V', 'iii', 'IV'], 
    style: ['pop'], 
    description: 'Extended pop with variation' 
  },
  { 
    name: 'Gospel', 
    bars: 8, 
    pattern: ['I', 'I7', 'IV', 'iv', 'I', 'V', 'I', 'I'], 
    style: ['gospel', 'soul'], 
    description: 'Gospel progression with borrowed iv' 
  },
  {
    name: 'Bossa Nova',
    bars: 8,
    pattern: ['Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7'],
    style: ['bossa', 'jazz'],
    description: 'Basic bossa nova pattern'
  },
];

// 16-bar templates (§9)
export const SIXTEEN_BAR_TEMPLATES: ProgressionTemplate[] = [
  {
    name: 'Blues',
    bars: 16,
    pattern: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7', 'I7', 'I7', 'I7', 'I7'],
    style: ['blues', 'jazz'],
    description: '12-bar blues extended to 16'
  },
  {
    name: 'Jazz Standard AABA',
    bars: 16,
    pattern: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'IVmaj7', 'iv7', 'iii7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'],
    style: ['jazz'],
    description: 'Standard 16-bar form'
  },
];

// All templates
export const ALL_TEMPLATES = [...FOUR_CHORD_TEMPLATES, ...EIGHT_CHORD_TEMPLATES, ...SIXTEEN_BAR_TEMPLATES];

// Functional graph for progression generation
export interface FunctionalNode {
  function: HarmonicFunction;
  next: { function: HarmonicFunction; weight: number }[];
}

export const FUNCTIONAL_GRAPH: FunctionalNode[] = [
  { 
    function: 'T', 
    next: [
      { function: 'PD', weight: 40 },
      { function: 'D', weight: 35 },
      { function: 'T', weight: 25 },
    ]
  },
  { 
    function: 'PD', 
    next: [
      { function: 'D', weight: 60 },
      { function: 'T', weight: 25 },
      { function: 'PD', weight: 15 },
    ]
  },
  { 
    function: 'D', 
    next: [
      { function: 'T', weight: 70 },
      { function: 'D', weight: 20 },
      { function: 'PD', weight: 10 },
    ]
  },
];

// Generate progression using functional graph
export function generateFunctionalProgression(
  length: number,
  keyRoot: number,
  maxDistance: number = 1,
  startFunction: HarmonicFunction = 'T'
): Chord[] {
  const chords: Chord[] = [];
  let currentFunc = startFunction;
  
  for (let i = 0; i < length; i++) {
    // Get chord for current function
    const chord = getChordForFunction(currentFunc, keyRoot, maxDistance);
    chords.push(chord);
    
    // Determine next function
    const node = FUNCTIONAL_GRAPH.find(n => n.function === currentFunc);
    if (node) {
      currentFunc = weightedRandomChoice(node.next);
    }
    
    // Force resolution at end
    if (i === length - 2) currentFunc = 'D';
    if (i === length - 1) currentFunc = 'T';
  }
  
  return chords;
}

// Helper: weighted random choice
function weightedRandomChoice(options: { function: HarmonicFunction; weight: number }[]): HarmonicFunction {
  const total = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * total;
  
  for (const opt of options) {
    random -= opt.weight;
    if (random <= 0) return opt.function;
  }
  
  return options[0].function;
}

// Get a chord for a function at a distance level
function getChordForFunction(func: HarmonicFunction, keyRoot: number, maxDistance: number): Chord {
  let substitutions;
  switch (func) {
    case 'T':
      substitutions = TONIC_SUBSTITUTIONS.filter(s => s.distance <= maxDistance);
      break;
    case 'PD':
      substitutions = PREDOMINANT_SUBSTITUTIONS.filter(s => s.distance <= maxDistance);
      break;
    case 'D':
      substitutions = DOMINANT_SUBSTITUTIONS.filter(s => s.distance <= maxDistance);
      break;
    default:
      substitutions = TONIC_SUBSTITUTIONS.filter(s => s.distance <= maxDistance);
  }
  
  if (substitutions.length === 0) {
    return createChord(keyRoot, 'maj', { function: func, roman: 'I' });
  }
  
  const selected = substitutions[Math.floor(Math.random() * substitutions.length)];
  return substitutionToChord(selected, keyRoot);
}

// Circle of fifths progression generator
export function generateCircleOfFifths(
  startRoot: number,
  length: number,
  quality: ChordQuality = 'dom7'
): Chord[] {
  const chords: Chord[] = [];
  let currentRoot = startRoot;
  
  for (let i = 0; i < length; i++) {
    chords.push(createChord(currentRoot, quality, {
      tags: ['circle_of_fifths'],
    }));
    currentRoot = (currentRoot + 7) % 12; // Up a fifth = down a fourth
  }
  
  return chords;
}

// Insert cadence into progression
export function insertCadence(
  chords: Chord[],
  position: number,
  cadenceType: CadenceType,
  keyRoot: number
): Chord[] {
  const result = [...chords];
  
  switch (cadenceType) {
    case 'authentic':
      // V7 → I
      if (position > 0) {
        result[position - 1] = createChord((keyRoot + 7) % 12, 'dom7', { roman: 'V7', function: 'D' });
      }
      result[position] = createChord(keyRoot, 'maj', { roman: 'I', function: 'T' });
      break;
      
    case 'plagal':
      // IV → I
      if (position > 0) {
        result[position - 1] = createChord((keyRoot + 5) % 12, 'maj', { roman: 'IV', function: 'PD' });
      }
      result[position] = createChord(keyRoot, 'maj', { roman: 'I', function: 'T' });
      break;
      
    case 'half':
      // ? → V
      result[position] = createChord((keyRoot + 7) % 12, 'maj', { roman: 'V', function: 'D' });
      break;
      
    case 'deceptive':
      // V7 → vi
      if (position > 0) {
        result[position - 1] = createChord((keyRoot + 7) % 12, 'dom7', { roman: 'V7', function: 'D' });
      }
      result[position] = createChord((keyRoot + 9) % 12, 'min', { roman: 'vi', function: 'T' });
      break;
  }
  
  return result;
}

// Expand a template with variations
export function expandTemplate(
  template: ProgressionTemplate,
  keyRoot: number,
  distanceLevel: number = 0
): Chord[] {
  return template.pattern.map(roman => {
    // Parse roman numeral
    const match = roman.match(/^([b#]?)([IViv]+)([0-9°ø+maj]*)/);
    if (!match) {
      return createChord(keyRoot, 'maj', { roman });
    }
    
    const [, accidental, numeral, suffix] = match;
    const upperNumeral = numeral.toUpperCase();
    
    const romanOffsets: Record<string, number> = {
      'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
    };
    
    let offset = romanOffsets[upperNumeral] || 0;
    if (accidental === 'b') offset -= 1;
    if (accidental === '#') offset += 1;
    
    const root_pc = (keyRoot + offset + 12) % 12;
    
    // Determine quality from suffix and case
    let quality: ChordQuality = 'maj';
    const isLower = numeral === numeral.toLowerCase();
    
    if (suffix.includes('maj7') || suffix.includes('Δ')) quality = 'maj7';
    else if (suffix.includes('7')) quality = isLower ? 'min7' : 'dom7';
    else if (suffix.includes('°') || suffix.includes('dim')) quality = 'dim';
    else if (suffix.includes('ø')) quality = 'hdim7';
    else if (isLower) quality = 'min';
    
    // Determine function
    let func: HarmonicFunction = 'AMB';
    if (['I', 'i', 'III', 'iii', 'VI', 'vi', 'bVI', 'bIII'].some(r => roman.startsWith(r))) func = 'T';
    else if (['IV', 'iv', 'II', 'ii', 'bVII', 'bII'].some(r => roman.startsWith(r))) func = 'PD';
    else if (['V', 'v', 'VII', 'vii'].some(r => roman.startsWith(r))) func = 'D';
    
    return createChord(root_pc, quality, {
      roman,
      function: func,
      distance_level: distanceLevel,
    });
  });
}

// Find templates matching a style
export function findTemplatesByStyle(style: string): ProgressionTemplate[] {
  return ALL_TEMPLATES.filter(t => t.style.includes(style.toLowerCase()));
}

// Find templates by length
export function findTemplatesByLength(bars: number): ProgressionTemplate[] {
  return ALL_TEMPLATES.filter(t => t.bars === bars);
}

// Generate variation of a progression
export function generateVariation(
  original: Chord[],
  keyRoot: number,
  variationLevel: number = 1
): Chord[] {
  return original.map((chord, i) => {
    // Keep first and last chords stable
    if (i === 0 || i === original.length - 1) return chord;
    
    // Random chance to substitute based on variation level
    if (Math.random() > variationLevel * 0.3) return chord;
    
    // Get substitutions for this chord's function
    const func = chord.function;
    let subs;
    switch (func) {
      case 'T':
        subs = TONIC_SUBSTITUTIONS.filter(s => s.distance <= variationLevel);
        break;
      case 'PD':
        subs = PREDOMINANT_SUBSTITUTIONS.filter(s => s.distance <= variationLevel);
        break;
      case 'D':
        subs = DOMINANT_SUBSTITUTIONS.filter(s => s.distance <= variationLevel);
        break;
      default:
        return chord;
    }
    
    if (subs.length === 0) return chord;
    
    const selected = subs[Math.floor(Math.random() * subs.length)];
    return substitutionToChord(selected, keyRoot);
  });
}
