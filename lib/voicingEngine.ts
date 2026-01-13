import {
    AdvancedChord,
    VoicedChord,
    VoicingStyle,
    VoicingConfig,
    RomanChord,
    EXTENSION_INTERVALS,
    CHORD_QUALITY_INTERVALS,
    NOTE_NAMES
} from '../types/harmonyTypes';

// ============================================
// VOICING PRESETS
// ============================================

const VOICING_PRESETS: Record<VoicingStyle, VoicingConfig> = {
    'clear': {
        style: 'clear',
        leftHandRange: { low: 36, high: 60 }, // C2 - C4
        rightHandRange: { low: 60, high: 84 }, // C4 - C6
        avoidMuddyBelow: 48, // C3
        useRootless: false,
        allowClusters: false,
        preferOpenVoicing: true
    },
    'jazz_standard': {
        style: 'jazz_standard',
        leftHandRange: { low: 40, high: 64 }, // E2 - E4
        rightHandRange: { low: 60, high: 90 },
        avoidMuddyBelow: 45, // A2
        useRootless: true,
        allowClusters: true,
        preferOpenVoicing: false
    },
    'neo_soul': {
        style: 'neo_soul',
        leftHandRange: { low: 36, high: 60 },
        rightHandRange: { low: 55, high: 88 },
        avoidMuddyBelow: 43,
        useRootless: false,
        allowClusters: true,
        preferOpenVoicing: false
    },
    'bossa': {
        style: 'bossa',
        leftHandRange: { low: 36, high: 58 },
        rightHandRange: { low: 58, high: 80 },
        avoidMuddyBelow: 45,
        useRootless: false,
        allowClusters: false,
        preferOpenVoicing: true
    },
    'cinematic': {
        style: 'cinematic',
        leftHandRange: { low: 24, high: 48 }, // Deep bass
        rightHandRange: { low: 55, high: 96 },
        avoidMuddyBelow: 40,
        useRootless: false,
        allowClusters: false,
        preferOpenVoicing: true
    }
};

// ============================================
// CORE LOGIC
// ============================================

export function generateVoicing(
    chord: AdvancedChord,
    style: VoicingStyle = 'clear',
    romanChord?: RomanChord
): VoicedChord {
    const config = VOICING_PRESETS[style];
    let leftHand: number[] = [];
    let rightHand: number[] = [];

    const rootMidi = getBaseMidi(chord.root);

    // 1. LEFT HAND LOGIC
    if (config.style === 'cinematic') {
        // Cinematic: Deep octaves + fifth
        leftHand.push(rootMidi + 24); // Low root
        leftHand.push(rootMidi + 31); // Fifth
        leftHand.push(rootMidi + 36); // Octave
    } else if (config.useRootless && chord.bass === undefined) {
        // Rootless jazz logic (3rd + 7th shell)
        const third = getChordTone(rootMidi, chord.quality, 3);
        const seventh = getChordTone(rootMidi, chord.quality, 7);
        leftHand.push(third + 48); // Place near middle C
        leftHand.push(seventh + 48);
    } else {
        // Standard logic
        // Root + 7th or Root + 3rd shell in LH
        leftHand.push(rootMidi + 36); // Base C2 octave
        const seventh = getChordTone(rootMidi, chord.quality, 7);
        if (seventh) leftHand.push(seventh + 36);
    }

    // 2. RIGHT HAND LOGIC
    // Add 3rd (if not in LH), 5th, and extensions
    const thirds = getChordTone(rootMidi, chord.quality, 3);
    if (thirds) rightHand.push(thirds + 60);

    // Add 5th for richer voicing
    const fifth = getChordTone(rootMidi, chord.quality, 5);
    if (fifth && config.preferOpenVoicing) {
        rightHand.push(fifth + 60);
    }

    // Add extensions for richer chords
    chord.extensions.forEach(ext => {
        const interval = EXTENSION_INTERVALS[ext];
        if (interval) {
            // Place extensions in appropriate octave
            const extNote = rootMidi + 48 + interval;
            // Normalize to right hand range
            const normalizedNote = extNote > 84 ? extNote - 12 : extNote;
            rightHand.push(normalizedNote);
        }
    });

    // Add alterations for color
    chord.alterations.forEach(alt => {
        const interval = EXTENSION_INTERVALS[alt as keyof typeof EXTENSION_INTERVALS];
        if (interval) {
            rightHand.push(rootMidi + 60 + interval);
        }
    });

    // Neo-soul clusters
    if (config.allowClusters && (chord.extensions.includes('9') || chord.quality.includes('9'))) {
        // Add 2nd/9th close to 3rd for cluster effect
        if (!rightHand.includes(rootMidi + 60 + 2)) {
            rightHand.push(rootMidi + 60 + 2);
        }
    }

    // Clean up and sort
    const allNotes = [...new Set([...leftHand, ...rightHand])].sort((a, b) => a - b);

    return {
        chord,
        romanChord,
        leftHand,
        rightHand,
        allNotes,
        voiceLeadingCost: 0 // To be calculated in context if needed
    };
}

// Helpers
function getBaseMidi(root: number): number {
    return root; // 0-11, usually add offset like 36 or 48 later
}

function getChordTone(root: number, quality: string, degree: 3 | 5 | 7): number {
    const intervals = CHORD_QUALITY_INTERVALS[quality as keyof typeof CHORD_QUALITY_INTERVALS];
    if (!intervals) return 0;

    if (degree === 3) return root + intervals[1];
    if (degree === 5) return root + intervals[2];
    if (degree === 7 && intervals.length > 3) return root + intervals[3];

    return 0;
}
