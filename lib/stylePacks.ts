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
