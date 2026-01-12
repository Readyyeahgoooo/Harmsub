import {
    ChordCandidate,
    AdvancedChord,
    RomanChord,
    HarmonicFunction,
    StylePackName
} from '../types/harmonyTypes';

// ============================================
// TRANSITION WEIGHTS MATRIX
// ============================================

// Base functional transitions (T -> PD -> D -> T)
const FUNCTIONAL_TRANSITIONS: Record<HarmonicFunction, Record<HarmonicFunction, number>> = {
    'T': { 'T': 0.6, 'PD': 0.8, 'D': 0.5 },  // T can go anywhere, likes PD
    'PD': { 'T': 0.4, 'PD': 0.6, 'D': 0.9 },  // PD strongly wants D
    'D': { 'T': 1.0, 'PD': 0.2, 'D': 0.5 },  // D strongly wants T (Resolution)
};

// ============================================
// CORE LOGIC
// ============================================

/**
 * Find the optimal chord path using Viterbi algorithm
 */
export function findBestPath(
    candidatesGrid: ChordCandidate[][],
    styleName: StylePackName = 'pop'
): ChordCandidate[] {
    if (candidatesGrid.length === 0) return [];

    // Viterbi DP Table
    // dp[timeIndex][candidateIndex] = { score: number, parent: number }
    const timeSteps = candidatesGrid.length;
    const dp: { score: number, parentIndex: number }[][] = [];

    // Initialize first step
    dp[0] = candidatesGrid[0].map(cand => ({
        // Initial score is just the melody fit
        score: Math.log(cand.melodyFitScore + 0.01) - cand.distancePenalty,
        parentIndex: -1
    }));

    // Iterate forward in time
    for (let t = 1; t < timeSteps; t++) {
        dp[t] = [];
        const currentCandidates = candidatesGrid[t];
        const prevCandidates = candidatesGrid[t - 1];

        for (let i = 0; i < currentCandidates.length; i++) {
            let maxScore = -Infinity;
            let bestPrevIndex = -1;

            const currCand = currentCandidates[i];

            for (let j = 0; j < prevCandidates.length; j++) {
                const prevCand = prevCandidates[j];

                // Calculate transition score from Prev[j] -> Curr[i]
                const transScore = getTransitionScore(prevCand, currCand);

                // Total path score = PrevPathScore + TransitionScore + EmissionScore (MelodyFit)
                // Using log probability addition
                const currentEmissionScore = Math.log(currCand.melodyFitScore + 0.01) - currCand.distancePenalty;
                const totalScore = dp[t - 1][j].score + Math.log(transScore + 0.01) + currentEmissionScore;

                if (totalScore > maxScore) {
                    maxScore = totalScore;
                    bestPrevIndex = j;
                }
            }

            dp[t][i] = { score: maxScore, parentIndex: bestPrevIndex };
        }
    }

    // Backtrack to find best path
    const path: ChordCandidate[] = [];

    // Find index of best score in last step
    let lastStep = dp[timeSteps - 1];
    let bestIndex = 0;
    let maxFinalScore = -Infinity;

    for (let i = 0; i < lastStep.length; i++) {
        // Prefer resolution to Tonic at end? Maybe.
        // For now just raw score.
        if (lastStep[i].score > maxFinalScore) {
            maxFinalScore = lastStep[i].score;
            bestIndex = i;
        }
    }

    // Reconstruct path backwards
    for (let t = timeSteps - 1; t >= 0; t--) {
        path[t] = candidatesGrid[t][bestIndex];
        bestIndex = dp[t][bestIndex].parentIndex;
    }

    return path;
}

/**
 * Calculate weight of transition between two chords
 */
function getTransitionScore(
    prev: ChordCandidate,
    curr: ChordCandidate
): number {
    const prevRom = prev.romanChord;
    const currRom = curr.romanChord;

    // 1. Functional Harmony Score
    // Gets base weight from T->PD->D matrix
    // Default to T if unspecified (e.g., secondary doms might have generic function)
    const funcWeight = FUNCTIONAL_TRANSITIONS[prevRom.function || 'T'][currRom.function || 'T'] || 0.5;

    // 2. Root Movement Score
    let rootMovement = (curr.chord.root - prev.chord.root + 12) % 12; // in semitones
    let movementScore = 0.5;

    // Circle of Fifths (Down 5th / Up 4th = 5 semitones)
    // E.g. G -> C is 5 semitones.
    // Standard jazz/pop strong motion.
    if (rootMovement === 5) movementScore = 1.0;

    // Stepwise motion (up/down 1 or 2 semitones)
    else if ([1, 2, 10, 11].includes(rootMovement)) movementScore = 0.8;

    // Thirds (3, 4, 8, 9)
    else if ([3, 4, 8, 9].includes(rootMovement)) movementScore = 0.7;

    // Tritone (6)
    else if (rootMovement === 6) movementScore = 0.6; // Tritone sub logic handled elsewhere usually but ok here

    // 3. Repeat Chord Penalty?
    // Sometimes we want to hold the chord, but usually we prefer change if duration allows.
    // If exact same chord symbol, maybe lower score slightly if we want movement.
    // But for now, let's allow it (0.8) as static harmony is valid.
    if (prevRom.symbol === currRom.symbol) movementScore = 0.7;


    // 4. Secondary Dominant resolution check
    // If Previous was V/X (Secondary Dom), does Current match X?
    // E.g. V7/V -> V. 
    // This is hard to check without parsing "V/V". 
    // Advanced logic: check if prev is 'D' and curr root is prev root - 7 semitones (perfect 5th down).
    // This is covered by Circle of Fifths score (rootMovement === 5).
    // So V7 -> I gets 1.0. V7/V -> V gets 1.0. Good.

    // Combine scores
    // 50% functional, 50% root movement
    return (funcWeight * 0.6) + (movementScore * 0.4);
}
