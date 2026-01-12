import { StylePack, StylePackName, TensionRules } from '../types/harmonyTypes';
import { PROGRESSION_TEMPLATES } from './chordVocabulary';

// ============================================
// GENRE DEFINITIONS
// ============================================

export const STYLE_PACKS: Record<StylePackName, StylePack> = {
    'jazz': {
        name: 'jazz',
        displayName: 'Jazz (Bebop/Standard)',
        description: 'Functional harmony with ii-V-I, turnarounds, tritone subs, and altered dominants.',
        preferredProgressions: PROGRESSION_TEMPLATES.jazz,
        chordPriors: new Map([
            ['ii7', 0.9], ['V7', 0.9], ['Imaj7', 0.9], ['bII7', 0.7], ['V7alt', 0.8]
        ]),
        transitionWeights: [], // Using default graph math for now
        tensionPreferences: [], // Using standard tables
        maxDistance: 4, // Allows tritone subs
        preferredVoicing: 'jazz_standard'
    },
    'bossa': {
        name: 'bossa',
        displayName: 'Bossa Nova',
        description: 'Smooth jazz harmony with distinct rhythmic patterns and 9/13 extensions.',
        preferredProgressions: PROGRESSION_TEMPLATES.jazz, // Shares DNA with jazz
        chordPriors: new Map([
            ['ii7', 0.9], ['V7b9', 0.8], ['I6/9', 0.9], ['iv7', 0.7]
        ]),
        transitionWeights: [],
        tensionPreferences: [],
        maxDistance: 3, // Modal mixture (iv) allowed
        preferredVoicing: 'bossa'
    },
    'pop': {
        name: 'pop',
        displayName: 'Modern Pop',
        description: 'Catchy, functional progressions with axis loops and clear voice leading.',
        preferredProgressions: PROGRESSION_TEMPLATES.pop,
        chordPriors: new Map([
            ['I', 0.9], ['IV', 0.9], ['V', 0.9], ['vi', 0.9]
        ]),
        transitionWeights: [],
        tensionPreferences: [],
        maxDistance: 2, // Secondary dominants ok, but mostly diatonic
        preferredVoicing: 'clear'
    },
    'radiohead': {
        name: 'radiohead',
        displayName: 'Alt/Modal (Radiohead-ish)',
        description: 'Modal mixture, chromatic mediants, and unexpected non-functional shifts.',
        preferredProgressions: [
            ['I', 'bVII', 'IV', 'I'],
            ['I', 'iv', 'bVII', 'I'],
            ['I', 'bVI', 'bIII', 'bVII']
        ],
        chordPriors: new Map([
            ['bVImaj7', 0.8], ['bVII7', 0.8], ['iv7', 0.8], ['bIIImaj7', 0.7]
        ]),
        transitionWeights: [],
        tensionPreferences: [],
        maxDistance: 5, // Chromatic mediants!
        preferredVoicing: 'neo_soul' // Clusters work well here
    },
    'classical': {
        name: 'classical',
        displayName: 'Classical / Romantic',
        description: 'Strict functional harmony, clear cadences, and prepared dissonances.',
        preferredProgressions: [
            ['I', 'IV', 'V', 'I'],
            ['I', 'V6', 'vi', 'IV'],
            ['ii6', 'V7', 'I']
        ],
        chordPriors: new Map([
            ['I', 0.9], ['V7', 0.9], ['V7/V', 0.7]
        ]),
        transitionWeights: [],
        tensionPreferences: [],
        maxDistance: 2, // Secondary dominants allowed
        preferredVoicing: 'clear' // Or cinematic logic
    }
};


// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStylePack(name: StylePackName): StylePack {
  return STYLE_PACKS[name];
}

export function getStylePackDisplayName(name: StylePackName): string {
  return STYLE_PACKS[name]?.displayName || name;
}

export function getStylePackNames(): StylePackName[] {
  return Object.keys(STYLE_PACKS) as StylePackName[];
}

export interface DefaultControls {
  distance: number;
  functional_clarity: number;
  dominant_density: 'low' | 'medium' | 'high';
  alteration_amount: 'none' | 'light' | 'moderate' | 'heavy';
}

export function getDefaultControlsForStyle(style: StylePackName): DefaultControls {
  const pack = STYLE_PACKS[style];
  
  switch (style) {
    case 'jazz':
      return {
        distance: 3,
        functional_clarity: 0.8,
        dominant_density: 'high',
        alteration_amount: 'moderate',
      };
    case 'bossa':
      return {
        distance: 2,
        functional_clarity: 0.7,
        dominant_density: 'medium',
        alteration_amount: 'light',
      };
    case 'pop':
      return {
        distance: 1,
        functional_clarity: 0.9,
        dominant_density: 'low',
        alteration_amount: 'none',
      };
    case 'radiohead':
      return {
        distance: 4,
        functional_clarity: 0.5,
        dominant_density: 'low',
        alteration_amount: 'moderate',
      };
    case 'classical':
      return {
        distance: 1,
        functional_clarity: 1.0,
        dominant_density: 'medium',
        alteration_amount: 'none',
      };
    default:
      return {
        distance: 2,
        functional_clarity: 0.7,
        dominant_density: 'medium',
        alteration_amount: 'light',
      };
  }
}
