import {
    AdvancedChord,
    ChordCandidate,
    RomanChord,
    ChordQuality,
    Extension,
    HarmonicDistance,
    MelodyNote,
    NOTE_NAMES,
    CHORD_QUALITY_INTERVALS,
    EXTENSION_INTERVALS
} from '../types/harmonyTypes';
import { CHORD_LIBRARY } from './chordVocabulary';
import { noteToNumber } from './musicTheory';

// ============================================
// TENSION LEGALITY TABLES
// ============================================

const TENSION_RULES: Record<ChordQuality, { allowed: Extension[], avoid: number[] }> = {
    'maj': { allowed: ['6', '9', '#11', '13'], avoid: [5] }, // Natural 11 is avoid (4th)
    'maj7': { allowed: ['9', '#11', '13'], avoid: [5] },
    'min': { allowed: ['6', '7', '9', '11', '13'], avoid: [] }, // Dorian default
    'min7': { allowed: ['9', '11', '13'], avoid: [] },
    'dom': { allowed: ['b9', '9', '#9', '#11', 'b13', '13'], avoid: [5] }, // 11 usually suspends
    'dom7': { allowed: ['b9', '9', '#9', '#11', 'b13', '13'], avoid: [5] },
    'dim': { allowed: ['9', '11', 'b13', 'maj7'], avoid: [] }, // Whole-half / symmetrical
    'dim7': { allowed: ['9', '11', 'b13', 'maj7'], avoid: [] },
    'hdim': { allowed: ['9', '11', 'b13'], avoid: [] }, // Locrian #2 natural 9 is nice
    'hdim7': { allowed: ['9', '11', 'b13'], avoid: [] },
    'aug': { allowed: ['9', '#11'], avoid: [] },
    'aug7': { allowed: ['9', '#11'], avoid: [] },
    'sus2': { allowed: ['4', '6', '7'], avoid: [] },
    'sus4': { allowed: ['2', '6', '7', '9', '10'], avoid: [4] }, // Avoid 3rd (4 semitones)
    'minMaj7': { allowed: ['9', '11', '13'], avoid: [] },
    'maj6': { allowed: ['9', '#11'], avoid: [] },
    'min6': { allowed: ['9', '11'], avoid: [] },
};

// ============================================
// CORE LOGIC
// ============================================

/**
 * Generate candidate chords for a specific melody note note
 */
export function generateCandidates(
    melodyNote: MelodyNote,
    keyRoot: number, // 0-11
    maxDistance: HarmonicDistance
): ChordCandidate[] {
    const candidates: ChordCandidate[] = [];

    // Iterate through all harmonic distances up to max
    for (let dist = 0; dist <= maxDistance; dist++) {
        const romanChords = CHORD_LIBRARY[dist as HarmonicDistance];
        if (!romanChords) continue;

        for (const roman of romanChords) {
            // 1. Instantiate Roman numeral to concrete chord
            const chord = instantiateChord(roman, keyRoot);
            chord.distance = dist as HarmonicDistance;

            // 2. Check if melody note fits
            const fitScore = evaluateMelodyFit(melodyNote, chord);

            if (fitScore > 0) {
                // 3. Create candidate
                candidates.push({
                    chord,
                    romanChord: roman,
                    score: fitScore, // Base score, will be refined by progression logic
                    melodyFitScore: fitScore,
                    voiceLeadingCost: 0, // Calculated later in context
                    functionalScore: 0,  // Calculated later
                    distancePenalty: dist * 0.1, // Simple penalty for distance
                    styleLikelihood: 1.0
                });
            }
        }
    }

    // Sort by initial fit (helper for debugging)
    return candidates.sort((a, b) => b.melodyFitScore - a.melodyFitScore);
}

/**
 * Instantiate a Roman Chord into a concrete AdvancedChord
 */
function instantiateChord(roman: RomanChord, keyRoot: number): AdvancedChord {
    // Calculate root interval from degree (1-indexed)
    // Major Scale intervals: 1=0, 2=2, 3=4, 4=5, 5=7, 6=9, 7=11
    const scaleIntervals = [0, 0, 2, 4, 5, 7, 9, 11];
    let interval = scaleIntervals[roman.degree];

    // Apply accidental
    if (roman.accidental === 'b') interval -= 1;
    if (roman.accidental === '#') interval += 1;

    const root = (keyRoot + interval + 12) % 12;

    return {
        root,
        quality: roman.quality,
        extensions: roman.extensions || [],
        alterations: roman.alterations || [],
        omit: [],
        functionTags: [roman.function],
        functionModifiers: [],
        scaleSources: [], // To be populated if needed
        distance: 0 // Placeholder
    };
}

/**
 * Check how well a melody note fits a chord (0.0 - 1.0)
 */
function evaluateMelodyFit(note: MelodyNote, chord: AdvancedChord): number {
    const notePc = note.pitchClass;
    const root = chord.root;
    // Interval from chord root to melody note
    const interval = (notePc - root + 12) % 12;

    const qualityIntervals = CHORD_QUALITY_INTERVALS[chord.quality];

    // 1. Perfect Match: Chord Tone (1, 3, 5, 7)
    if (qualityIntervals.includes(interval)) {
        return 1.0;
    }

    // 2. Check Tensions
    const rules = TENSION_RULES[chord.quality];

    // Check avoid notes (interval in semitones needs to be converted to scale degree roughly for avoid check)
    // Simplified avoid check: map semitones to scale degrees
    // 1=0, b2=1, 2=2, b3=3, 3=4, 4=5, b5=6, 5=7, b6=8, 6=9, b7=10, 7=11
    if (rules.avoid.includes(semitoneToScaleDegree(interval))) {
        return 0.1; // Technically allowed but sounds bad/clashing
    }

    // Check valid extensions
    for (const ext of rules.allowed) {
        if (EXTENSION_INTERVALS[ext] % 12 === interval) {
            return 0.8; // Valid tension
        }
    }

    // Special case: Chromatic approach or passing tone?
    // If not strong beat, we might be more lenient.
    if (!note.isStrongBeat) {
        return 0.4; // Passing tone acceptable
    }

    return 0.0; // Clash
}

// Helper: map semitone interval to generic scale degree (0-11 mapping to 0-11 for verify)
// This is a simplification. Real theory requires knowing the scale mode.
// For now, we use a chromatic map for avoid notes.
function semitoneToScaleDegree(semitone: number): number {
    // 0=1, 1=b2, 2=2, 3=b3, 4=3, 5=4, 6=b5, 7=5, 8=b6, 9=6, 10=b7, 11=7
    return semitone;
}
