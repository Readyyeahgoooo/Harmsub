// Advanced Harmony Types for AI-Powered Chord Harmonization

// ============================================
// CORE ENUMS & CONSTANTS
// ============================================

export type ChordQuality =
    | 'maj' | 'min' | 'dom' | 'dim' | 'hdim' | 'aug'
    | 'sus2' | 'sus4' | 'maj7' | 'min7' | 'dom7' | 'dim7'
    | 'hdim7' | 'aug7' | 'minMaj7' | 'maj6' | 'min6';

export type Extension = '6' | '7' | '9' | '11' | '13' | 'add9' | 'add11' | 'b9' | '#9' | '#11' | 'b13' | 'maj7' | '2' | '4' | '10';

export type Alteration = 'b5' | '#5' | 'b9' | '#9' | '#11' | 'b13';

export type OmitType = 'omit3' | 'omit5';

export type HarmonicFunction = 'T' | 'PD' | 'D';

export type FunctionModifier =
    | 'secondary_dominant' | 'borrowed' | 'tritone_sub'
    | 'chromatic_mediant' | 'passing_dim' | 'backdoor' | 'neapolitan';

// Harmonic distance: 0 = diatonic closest, 6 = non-functional furthest
export type HarmonicDistance = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type VoicingStyle =
    | 'clear' | 'jazz_standard' | 'neo_soul' | 'bossa' | 'cinematic';

export type StylePackName =
    | 'jazz' | 'bossa' | 'pop' | 'radiohead' | 'classical';

// ============================================
// CORE INTERFACES
// ============================================

/**
 * Full chord representation with metadata
 */
export interface AdvancedChord {
    root: number;                     // 0-11 (C=0, C#=1, D=2, etc.)
    quality: ChordQuality;
    extensions: Extension[];
    alterations: Alteration[];
    omit: OmitType[];
    bass?: number;                    // For slash chords (0-11)
    functionTags: HarmonicFunction[];
    functionModifiers: FunctionModifier[];
    scaleSources: string[];           // e.g., "Ab melodic minor"
    distance: HarmonicDistance;
}

/**
 * Roman numeral layer for key-relative operations
 */
export interface RomanChord {
    degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    accidental?: 'b' | '#';
    quality: ChordQuality;
    function: HarmonicFunction;
    extensions: Extension[];
    alterations: Alteration[];
    symbol: string;                   // e.g., "ii7", "V7alt", "bVImaj7"
}

/**
 * Chord candidate with scoring metadata
 */
export interface ChordCandidate {
    chord: AdvancedChord;
    romanChord: RomanChord;
    score: number;                    // Combined score (0-1)
    melodyFitScore: number;           // How well melody fits (0-1)
    voiceLeadingCost: number;         // Lower is better
    functionalScore: number;          // Grammar alignment (0-1)
    distancePenalty: number;          // Based on user's distance setting
    styleLikelihood: number;          // Genre-specific prior (0-1)
}

/**
 * Transition edge in progression graph
 */
export interface ChordTransition {
    from: RomanChord;
    to: RomanChord;
    weight: number;                   // 0-1, higher = more likely
    style: StylePackName[];           // Which styles favor this
}

/**
 * Tension legality rules per chord quality
 */
export interface TensionRules {
    quality: ChordQuality;
    allowedTensions: Extension[];
    avoidNotes: number[];             // Scale degrees to avoid (e.g., 11 on maj7)
    alterations: Alteration[];        // Allowed alterations
}

/**
 * Voicing configuration
 */
export interface VoicingConfig {
    style: VoicingStyle;
    leftHandRange: { low: number; high: number };   // MIDI note numbers
    rightHandRange: { low: number; high: number };
    avoidMuddyBelow: number;          // Avoid dense intervals below this note
    useRootless: boolean;
    allowClusters: boolean;
    preferOpenVoicing: boolean;
}

/**
 * Generated voicing output
 */
export interface VoicedChord {
    chord: AdvancedChord;
    romanChord?: RomanChord;          // Roman numeral representation
    leftHand: number[];               // MIDI note numbers
    rightHand: number[];              // MIDI note numbers
    allNotes: number[];               // Combined
    voiceLeadingCost: number;         // Cost from previous chord
}

/**
 * Style pack configuration
 */
export interface StylePack {
    name: StylePackName;
    displayName: string;
    description: string;
    preferredProgressions: string[][];  // Template progressions
    chordPriors: Map<string, number>;   // Chord symbol → likelihood
    transitionWeights: ChordTransition[];
    tensionPreferences: TensionRules[];
    maxDistance: HarmonicDistance;      // Default max distance for this style
    preferredVoicing: VoicingStyle;
}

/**
 * Harmonization settings from UI
 */
export interface HarmonizationSettings {
    maxDistance: HarmonicDistance;
    style: StylePackName;
    voicingStyle: VoicingStyle;
    harmonicRhythm: 'slow' | 'medium' | 'fast';  // Chords per bar
    allowSecondaryDominants: boolean;
    allowBorrowedChords: boolean;
    allowTritoneSubstitutions: boolean;
}

/**
 * Melody note with timing for harmonization
 */
export interface MelodyNote {
    pitch: number;                    // MIDI note number
    pitchClass: number;               // 0-11
    startTime: number;                // In beats
    duration: number;                 // In beats
    isStrongBeat: boolean;
    velocity: number;
}

/**
 * Complete harmonization output
 */
export interface HarmonizationOutput {
    melody: MelodyNote[];
    chordPath: VoicedChord[];
    key: number;                      // 0-11
    mode: 'major' | 'minor';
    settings: HarmonizationSettings;
    alternativeChords: ChordCandidate[][];  // Per slot
}

// ============================================
// CONSTANTS
// ============================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const CHORD_QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'dom': [0, 4, 7],
    'dim': [0, 3, 6],
    'hdim': [0, 3, 6],
    'aug': [0, 4, 8],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10],
    'dim7': [0, 3, 6, 9],
    'hdim7': [0, 3, 6, 10],
    'aug7': [0, 4, 8, 10],
    'minMaj7': [0, 3, 7, 11],
    'maj6': [0, 4, 7, 9],
    'min6': [0, 3, 7, 9],
};

export const EXTENSION_INTERVALS: Record<Extension, number> = {
    '6': 9,
    '7': 10,  // Default to dominant 7th
    '9': 14,
    '11': 17,
    '13': 21,
    'add9': 14,
    'add11': 17,
    'b9': 13,
    '#9': 15,
    '#11': 18,
    'b13': 20,
    'maj7': 11,
    '2': 2,
    '4': 5,
    '10': 16,
};

export const ALTERATION_INTERVALS: Record<Alteration, number> = {
    'b5': 6,
    '#5': 8,
    'b9': 13,
    '#9': 15,
    '#11': 18,
    'b13': 20,
};

// Scale degree to semitone offset in major scale
export const MAJOR_SCALE_DEGREES = [0, 2, 4, 5, 7, 9, 11] as const;
export const MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10] as const;
