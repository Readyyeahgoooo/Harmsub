import { HarmonicFunction, RomanChord } from '../types/harmonyTypes';

// ============================================
// SUBSTITUTION LADDERS
// ============================================

// Ranked from closest (index 0) to furthest
const TONIC_SUBSTITUTES: string[] = [
    'Imaj7',  // Primary
    'I6',     // Variant
    'vi7',    // Relative minor
    'iii7',   // Mediant
    'bVImaj7',// Borrowed (L3)
    'bIIImaj7'// Chromatic Mediant (L5)
];

const PREDOMINANT_SUBSTITUTES: string[] = [
    'ii7',    // Primary
    'IVmaj7', // Plagal
    'vi7',    // Dual function
    'iv7',    // Borrowed minor
    'bIImaj7',// Neapolitan
    'iiø7'    // Half-dim
];

const DOMINANT_SUBSTITUTES: string[] = [
    'V7',     // Primary
    'vii°7',  // Leading tone
    'bII7',   // Tritone sub
    'bVII7',  // Backdoor
    'V7alt',  // Altered
];

// ============================================
// LOGIC
// ============================================

/**
 * Get list of suggested substitutes for a given function
 */
export function getSubstitutes(
    func: HarmonicFunction,
    maxDistanceLevel: number = 6
): string[] {
    let list: string[] = [];

    switch (func) {
        case 'T': list = TONIC_SUBSTITUTES; break;
        case 'PD': list = PREDOMINANT_SUBSTITUTES; break;
        case 'D': list = DOMINANT_SUBSTITUTES; break;
    }

    // In a real implementation we would filter these by maxDistance
    // But here we're returning string symbols. 
    // The caller (UI) can match these symbols against the generated candidates.
    return list;
}

/**
 * Calculate substitution penalty based on rank
 */
export function getSubstitutionPenalty(original: string, substitute: string, func: HarmonicFunction): number {
    if (original === substitute) return 0;

    const list = getSubstitutes(func);
    const index = list.indexOf(substitute);

    if (index === -1) return 1.0; // Not a standard sub

    return index * 0.1; // 0.1 penalty per step down the ladder
}
