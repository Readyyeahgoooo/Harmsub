import { RomanChord, ChordQuality, HarmonicFunction, HarmonicDistance, Extension, Alteration } from '../types/harmonyTypes';

// ============================================
// CHORD DEFINITIONS BY DISTANCE
// ============================================

export const DIATONIC_TRIADS: RomanChord[] = [
    { degree: 1, quality: 'maj', function: 'T', symbol: 'I', extensions: [], alterations: [] },
    { degree: 2, quality: 'min', function: 'PD', symbol: 'ii', extensions: [], alterations: [] },
    { degree: 3, quality: 'min', function: 'T', symbol: 'iii', extensions: [], alterations: [] },
    { degree: 4, quality: 'maj', function: 'PD', symbol: 'IV', extensions: [], alterations: [] },
    { degree: 5, quality: 'dom', function: 'D', symbol: 'V', extensions: [], alterations: [] },
    { degree: 6, quality: 'min', function: 'T', symbol: 'vi', extensions: [], alterations: [] },
    { degree: 7, quality: 'dim', function: 'D', symbol: 'vii°', extensions: [], alterations: [] },
];

export const DIATONIC_SEVENTHS: RomanChord[] = [
    { degree: 1, quality: 'maj7', function: 'T', symbol: 'Imaj7', extensions: ['9'], alterations: [] },
    { degree: 2, quality: 'min7', function: 'PD', symbol: 'ii7', extensions: ['9', '11'], alterations: [] },
    { degree: 3, quality: 'min7', function: 'T', symbol: 'iii7', extensions: ['11'], alterations: [] },
    { degree: 4, quality: 'maj7', function: 'PD', symbol: 'IVmaj7', extensions: ['9', '#11'], alterations: [] },
    { degree: 5, quality: 'dom7', function: 'D', symbol: 'V7', extensions: ['9', '13'], alterations: [] },
    { degree: 6, quality: 'min7', function: 'T', symbol: 'vi7', extensions: ['9', '11'], alterations: [] },
    { degree: 7, quality: 'hdim7', function: 'D', symbol: 'viiø7', extensions: ['11', 'b13'], alterations: [] },
];

export const SECONDARY_DOMINANTS: RomanChord[] = [
    { degree: 1, quality: 'dom7', function: 'D', symbol: 'V7/IV', extensions: ['9', '13'], alterations: [] }, // V7/IV
    { degree: 2, quality: 'dom7', function: 'D', symbol: 'V7/V', extensions: ['9', '13'], alterations: [] },  // V7/V (II7)
    { degree: 3, quality: 'dom7', function: 'D', symbol: 'V7/vi', extensions: ['b9', 'b13'], alterations: ['b9', 'b13'] }, // V7/vi (III7)
    { degree: 6, quality: 'dom7', function: 'D', symbol: 'V7/ii', extensions: ['b9', 'b13'], alterations: ['b9', 'b13'] }, // V7/ii (VI7)
    { degree: 7, quality: 'dom7', function: 'D', symbol: 'V7/iii', extensions: ['b9', 'b13'], alterations: ['b9', 'b13'] }, // V7/iii (VII7)
];

export const MODAL_MIXTURE: RomanChord[] = [
    { degree: 4, quality: 'min7', function: 'PD', symbol: 'iv7', extensions: ['9', '11'], alterations: [] }, // iv7 (minor iv)
    { degree: 6, accidental: 'b', quality: 'maj7', function: 'T', symbol: 'bVImaj7', extensions: ['9', '#11'], alterations: [] }, // bVImaj7
    { degree: 7, accidental: 'b', quality: 'dom7', function: 'D', symbol: 'bVII7', extensions: ['9', '13'], alterations: [] }, // bVII7 (Backdoor)
    { degree: 2, quality: 'hdim7', function: 'PD', symbol: 'iiø7', extensions: ['11'], alterations: [] }, // iiø7 (from minor)
    { degree: 5, quality: 'min7', function: 'D', symbol: 'v7', extensions: ['9', '11'], alterations: [] }, // v7 (minor v)
];

export const TRITONE_SUBS: RomanChord[] = [
    { degree: 2, accidental: 'b', quality: 'dom7', function: 'D', symbol: 'bII7', extensions: ['9', '#11'], alterations: ['#11'] }, // bII7
];

export const CHROMATIC_MEDIANTS: RomanChord[] = [
    { degree: 3, accidental: 'b', quality: 'maj7', function: 'T', symbol: 'bIIImaj7', extensions: ['9'], alterations: [] }, // bIIImaj7
    { degree: 3, quality: 'maj7', function: 'T', symbol: 'IIImaj7', extensions: ['9'], alterations: [] }, // IIImaj7
    { degree: 6, quality: 'maj7', function: 'T', symbol: 'VImaj7', extensions: ['9'], alterations: [] }, // VImaj7
];

// Combine all into a master dictionary by level
export const CHORD_LIBRARY: Record<HarmonicDistance, RomanChord[]> = {
    0: [...DIATONIC_TRIADS],
    1: [...DIATONIC_SEVENTHS],
    2: [...SECONDARY_DOMINANTS],
    3: [...MODAL_MIXTURE],
    4: [...TRITONE_SUBS],
    5: [...CHROMATIC_MEDIANTS],
    6: [] // Reserved for non-functional/custom
};

// ============================================
// PROGRESSION TEMPLATES
// ============================================

export const PROGRESSION_TEMPLATES = {
    pop: [
        ['I', 'V', 'vi', 'IV'],           // Axis 1
        ['vi', 'IV', 'I', 'V'],           // Axis 2
        ['I', 'vi', 'IV', 'V'],           // 50s progression
        ['I', 'IV', 'V', 'IV'],           // Rock blues
        ['I', 'bVII', 'IV', 'I'],         // Mixolydian rock
    ],
    jazz: [
        ['ii7', 'V7', 'Imaj7', 'vi7'],    // ii-V-I turnaround
        ['Imaj7', 'vi7', 'ii7', 'V7'],    // 1-6-2-5
        ['iii7', 'VI7', 'ii7', 'V7'],     // 3-6-2-5 with sec dom
        ['iiø7', 'V7alt', 'imin7'],       // Minor ii-V-i
    ],
    rnb_neosoul: [
        ['IVmaj7', 'iii7', 'ii7', 'Imaj7'], // Descending
        ['ii9', 'IV/V', 'Imaj9'],         // Gospel cadet
        ['iv7', 'bVII7', 'Imaj7'],        // Backdoor resolution
        ['Imaj7', 'V/vi', 'vi9', 'bVImaj7', 'V7alt'], // Chromatic soul
    ],
    cinematic: [
        ['imin', 'bVI', 'bIII', 'bVII'],  // Epic minor
        ['I', 'bVI', 'IV', 'I'],          // Heroic mixture
        ['I', 'II', 'IV', 'I'],           // Lydian brightness
        ['imin', 'ivmin', 'vimin', 'imin'], // Dark minor
    ]
};
