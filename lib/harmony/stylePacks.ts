// Style Packs based on Rulebook §10

import { VoicingPreset } from './voicing';
import { ChordQuality } from './chordModel';

export interface StylePack {
  id: string;
  name: string;
  description: string;
  maxDistance: number;
  dominantPreference: string[];
  voicingPreset: VoicingPreset;
  commonProgressions: string[][];
  tensionTolerance: 'low' | 'medium' | 'high';
  tempoRange: { min: number; max: number };
  characteristics: string[];
}

export const STYLE_PACKS: Record<string, StylePack> = {
  jazz: {
    id: 'jazz',
    name: 'Jazz',
    description: 'Complex harmonies with extended chords and alterations',
    maxDistance: 4,
    dominantPreference: ['V7alt', 'subV', 'V7#9', 'V7b9'],
    voicingPreset: 'rootless_a',
    commonProgressions: [
      ['ii7', 'V7', 'Imaj7'],
      ['iii7', 'VI7', 'ii7', 'V7'],
      ['Imaj7', 'vi7', 'ii7', 'V7'],
      ['ii7', 'bII7', 'Imaj7'],
    ],
    tensionTolerance: 'high',
    tempoRange: { min: 80, max: 200 },
    characteristics: ['swing', 'extensions', 'alterations', 'ii-V-I'],
  },
  
  bossa: {
    id: 'bossa',
    name: 'Bossa Nova',
    description: 'Brazilian jazz with smooth ii-V movements',
    maxDistance: 3,
    dominantPreference: ['V7b9', 'V7#11', 'V9'],
    voicingPreset: 'rootless_b',
    commonProgressions: [
      ['Imaj9', 'ii9', 'V13', 'Imaj9'],
      ['Imaj7', 'IVmaj7', 'iii7', 'VI7', 'ii7', 'V7'],
      ['Imaj7', 'bVImaj7', 'ii7', 'V7'],
    ],
    tensionTolerance: 'high',
    tempoRange: { min: 100, max: 140 },
    characteristics: ['syncopation', '9ths', 'smooth', 'latin'],
  },
  
  pop: {
    id: 'pop',
    name: 'Pop',
    description: 'Simple, catchy progressions with triads',
    maxDistance: 1,
    dominantPreference: ['V', 'V7'],
    voicingPreset: 'clear_spacious',
    commonProgressions: [
      ['I', 'V', 'vi', 'IV'],
      ['I', 'IV', 'V', 'I'],
      ['vi', 'IV', 'I', 'V'],
      ['I', 'vi', 'IV', 'V'],
    ],
    tensionTolerance: 'low',
    tempoRange: { min: 90, max: 130 },
    characteristics: ['simple', 'catchy', 'triads', 'repetitive'],
  },

  radiohead: {
    id: 'radiohead',
    name: 'Radiohead-ish',
    description: 'Modal, chromatic mediants, unexpected resolutions',
    maxDistance: 4,
    dominantPreference: ['bVII', 'iv', 'bVI'],
    voicingPreset: 'quartal',
    commonProgressions: [
      ['i', 'bVI', 'bIII', 'bVII'],
      ['I', 'bVII', 'IV', 'iv'],
      ['i', 'bII', 'bVII', 'i'],
      ['I', 'bVI', 'bIII', 'IV'],
    ],
    tensionTolerance: 'medium',
    tempoRange: { min: 70, max: 140 },
    characteristics: ['modal', 'chromatic', 'unexpected', 'atmospheric'],
  },
  
  classical: {
    id: 'classical',
    name: 'Classical',
    description: 'Traditional functional harmony with proper voice leading',
    maxDistance: 2,
    dominantPreference: ['V', 'V7', 'viio'],
    voicingPreset: 'satb',
    commonProgressions: [
      ['I', 'IV', 'V', 'I'],
      ['I', 'ii6', 'V', 'I'],
      ['I', 'vi', 'ii', 'V', 'I'],
      ['I', 'IV', 'I6/4', 'V7', 'I'],
    ],
    tensionTolerance: 'low',
    tempoRange: { min: 60, max: 180 },
    characteristics: ['functional', 'voice-leading', 'cadential', 'balanced'],
  },
  
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Epic, emotional progressions with wide voicings',
    maxDistance: 3,
    dominantPreference: ['bVI', 'bVII', 'iv', 'V'],
    voicingPreset: 'cinematic_pads',
    commonProgressions: [
      ['i', 'bVI', 'bIII', 'V'],
      ['I', 'bVI', 'IV', 'I'],
      ['i', 'bVII', 'bVI', 'V'],
      ['I', 'iii', 'vi', 'IV'],
    ],
    tensionTolerance: 'medium',
    tempoRange: { min: 50, max: 100 },
    characteristics: ['epic', 'emotional', 'wide', 'sustained'],
  },
  
  neosoul: {
    id: 'neosoul',
    name: 'Neo-Soul',
    description: 'Rich extended chords with gospel influences',
    maxDistance: 3,
    dominantPreference: ['V9', 'V7#9', 'bVII9'],
    voicingPreset: 'neosoul',
    commonProgressions: [
      ['Imaj9', 'IV9', 'iii7', 'vi9'],
      ['ii9', 'V13', 'Imaj9', 'Imaj9'],
      ['Imaj9', 'bVIImaj9', 'IVmaj9', 'Imaj9'],
    ],
    tensionTolerance: 'high',
    tempoRange: { min: 70, max: 110 },
    characteristics: ['extensions', 'gospel', 'smooth', 'groovy'],
  },
  
  rnb: {
    id: 'rnb',
    name: 'R&B',
    description: 'Smooth progressions with 7ths and 9ths',
    maxDistance: 2,
    dominantPreference: ['V7', 'V9', 'bVII7'],
    voicingPreset: 'neosoul',
    commonProgressions: [
      ['Imaj7', 'vi7', 'ii7', 'V7'],
      ['I', 'iii7', 'vi7', 'V7'],
      ['Imaj7', 'IVmaj7', 'iii7', 'vi7'],
    ],
    tensionTolerance: 'medium',
    tempoRange: { min: 60, max: 100 },
    characteristics: ['smooth', '7ths', 'romantic', 'groove'],
  },
};

// Get style pack by ID
export function getStylePack(id: string): StylePack | undefined {
  return STYLE_PACKS[id];
}

// Get all style pack IDs
export function getStylePackIds(): string[] {
  return Object.keys(STYLE_PACKS);
}

// Get style packs matching characteristics
export function findStylePacksByCharacteristic(characteristic: string): StylePack[] {
  return Object.values(STYLE_PACKS).filter(pack => 
    pack.characteristics.some(c => c.toLowerCase().includes(characteristic.toLowerCase()))
  );
}

// Get recommended style pack for a tempo
export function getStylePackForTempo(bpm: number): StylePack[] {
  return Object.values(STYLE_PACKS).filter(pack => 
    bpm >= pack.tempoRange.min && bpm <= pack.tempoRange.max
  );
}

// Apply style pack settings to harmonization
export interface StyleSettings {
  maxDistance: number;
  voicingPreset: VoicingPreset;
  tensionTolerance: 'low' | 'medium' | 'high';
  preferredProgressions: string[][];
}

export function getStyleSettings(packId: string): StyleSettings {
  const pack = STYLE_PACKS[packId] || STYLE_PACKS.pop;
  return {
    maxDistance: pack.maxDistance,
    voicingPreset: pack.voicingPreset,
    tensionTolerance: pack.tensionTolerance,
    preferredProgressions: pack.commonProgressions,
  };
}
