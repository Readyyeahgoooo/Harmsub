// ============================================================================
// SCORING SYSTEM
// Implements §12 of Rulebook
// ============================================================================

import {
  ChordSymbol,
  ChordFunction,
  ChordCandidate,
  ScoreWeights,
} from '@/types/rulebook';
import {
  getTransitionWeight,
  getRootMotionWeight,
  getResolutionStrength,
} from '@/lib/functionalHarmony';
import {
  isChordTone,
  isLegalTension,
  isAvoidNote,
} from '@/lib/tensionLegality';

// ----------------------------------------------------------------------------
// 12.1 Local Chord Fit Score
// ----------------------------------------------------------------------------

export function calculateLocalFitScore(
  candidate: ChordCandidate,
  melodyPitches: number[],
  metricalStrengths: number[],
  weights: ScoreWeights
): number {
  let score = 0;
  
  melodyPitches.forEach((pitch, index) => {
    const strength = metricalStrengths[index] || 0.5;
    const chord = candidate.chord;
    
    if (isChordTone(chord, pitch, chord.root_pc)) {
      // Chord tone match
      score += weights.chord_tone_match * strength;
      
      // Bonus for 3rd and 7th (guide tones)
      const interval = ((pitch - chord.root_pc) % 12 + 12) % 12;
      if (interval === 4 || interval === 11) {
        score += weights.chord_tone_match * 0.5 * strength;
      }
    } else if (isLegalTension(chord, pitch, chord.root_pc)) {
      // Legal tension match
      score += weights.legal_tension_match * strength;
    } else if (isAvoidNote(chord, pitch, chord.root_pc)) {
      // Avoid note penalty
      score -= weights.avoid_note_penalty * strength;
    } else {
      // Non-chord tone (not necessarily bad)
      score -= weights.melody_mismatch_penalty * 0.5 * strength;
    }
  });
  
  // Normalize by number of notes
  return melodyPitches.length > 0 ? score / melodyPitches.length : 0;
}

// ----------------------------------------------------------------------------
// 12.2 Transition (Edge) Score
// ----------------------------------------------------------------------------

export function calculateTransitionScore(
  fromChord: ChordSymbol,
  toChord: ChordSymbol,
  position: number,
  totalSlots: number,
  controls: {
    functional_clarity: number;
    adventurous: number;
  },
  weights: ScoreWeights
): number {
  let score = 0;
  
  // Functional grammar
  const functionalScore = getTransitionWeight(
    fromChord.function,
    toChord.function
  );
  score += functionalScore * weights.functional_grammar;
  
  // Circle-of-fifths motion
  const rootMotionScore = getRootMotionWeight(
    fromChord.root_pc,
    toChord.root_pc
  );
  score += rootMotionScore * weights.cof_motion;
  
  // Cadence quality (at phrase endings)
  const isPhraseEnd = position === totalSlots - 1 || 
    position % 4 === 3; // Every 4th chord is phrase end
  
  if (isPhraseEnd) {
    const resolutionStrength = getResolutionStrength(
      fromChord.function,
      toChord.function
    );
    score += resolutionStrength * weights.cadence_quality * 100;
  }
  
  return score;
}

// ----------------------------------------------------------------------------
// 12.3 Voice-Leading Proxy Score (Symbolic Level)
// ----------------------------------------------------------------------------

export function calculateVoiceLeadingScore(
  fromChord: ChordSymbol,
  toChord: ChordSymbol,
  weights: ScoreWeights
): number {
  let score = 0;
  
  // Calculate common tones between chord pitch-class sets
  const commonTones = calculateCommonTones(fromChord, toChord);
  score += commonTones * weights.voice_leading * 10;
  
  // Penalize large root jumps (unless adventurous)
  let rootMotion = Math.abs(toChord.root_pc - fromChord.root_pc);
  if (rootMotion > 6) {
    rootMotion = 12 - rootMotion; // Use shortest interval
  }
  
  if (rootMotion > 4) {
    score -= weights.voice_leading * 5;
  }
  
  // Reward stepwise bass (descending preferred)
  if (rootMotion === 2 || rootMotion === 5) {
    score += weights.voice_leading * 3;
  }
  
  return score;
}

// ----------------------------------------------------------------------------
// Helper: Calculate common tones between chords
// ----------------------------------------------------------------------------

function calculateCommonTones(
  fromChord: ChordSymbol,
  toChord: ChordSymbol
): number {
  // Simplified - compare root and 3rd/7th
  const fromPitches = [fromChord.root_pc];
  const toPitches = [toChord.root_pc];
  
  // Add chord tones (3rd, 5th, 7th) - simplified
  fromPitches.push((fromChord.root_pc + 4) % 12);
  fromPitches.push((fromChord.root_pc + 7) % 12);
  fromPitches.push((fromChord.root_pc + 11) % 12);
  
  toPitches.push((toChord.root_pc + 4) % 12);
  toPitches.push((toChord.root_pc + 7) % 12);
  toPitches.push((toChord.root_pc + 11) % 12);
  
  // Count common tones
  let commonCount = 0;
  fromPitches.forEach(pitch => {
    if (toPitches.includes(pitch)) {
      commonCount++;
    }
  });
  
  return commonCount;
}

// ----------------------------------------------------------------------------
// 12.4 Distance Penalty
// ----------------------------------------------------------------------------

export function calculateDistancePenalty(
  chord: ChordSymbol,
  targetDistance: number,
  adventurous: number,
  weights: ScoreWeights
): number {
  const distance = chord.distance_level;
  
  // Penalize chords above target comfort distance
  if (distance > targetDistance) {
    const excess = distance - targetDistance;
    // Base penalty
    const penalty = excess * weights.distance_penalty * 20;
    
    // Allow occasional spikes if adventurous
    if (Math.random() < adventurous) {
      return penalty * 0.3; // Reduce penalty for spikes
    }
    
    return penalty;
  }
  
  // Slight preference for closer chords
  return distance * weights.distance_penalty * 5;
}

// ----------------------------------------------------------------------------
// 12.5 Global Constraints
// ----------------------------------------------------------------------------

export interface GlobalConstraintScore {
  total_score: number;
  penalties: Array<{ constraint: string; penalty: number }>;
}

export function calculateGlobalConstraints(
  progression: ChordSymbol[],
  controls: {
    functional_clarity: number;
    cadence_frequency: number;
    require_tonal_return: boolean;
  },
  weights: ScoreWeights
): GlobalConstraintScore {
  let totalPenalty = 0;
  const penalties: Array<{ constraint: string; penalty: number }> = [];
  
  // Enforce at least one cadence every N bars if functional clarity is high
  if (controls.functional_clarity > 0.7) {
    const slotsPerBar = 4; // Assume 4 chords per bar
    const cadencesNeeded = Math.ceil(progression.length / (controls.cadence_frequency * slotsPerBar));
    
    let actualCadences = 0;
    for (let i = 0; i < progression.length - 1; i++) {
      if (progression[i].function === 'D' && progression[i + 1].function === 'T') {
        actualCadences++;
      }
    }
    
    if (actualCadences < cadencesNeeded) {
      const missingCadences = cadencesNeeded - actualCadences;
      const penalty = missingCadences * weights.cadence_quality * 50;
      totalPenalty += penalty;
      penalties.push({
        constraint: 'insufficient_cadences',
        penalty,
      });
    }
  }
  
  // Enforce tonal return to I at end if requested
  if (controls.require_tonal_return) {
    const lastChord = progression[progression.length - 1];
    if (lastChord.function !== 'T') {
      const penalty = weights.functional_grammar * 50;
      totalPenalty += penalty;
      penalties.push({
        constraint: 'no_tonal_return',
        penalty,
      });
    }
  }
  
  // Enforce minimum functional clarity (avoid too many non-functional chords)
  if (controls.functional_clarity > 0.5) {
    const nonFunctionalCount = progression.filter(
      c => c.function === 'N'
    ).length;
    const nonFunctionalRatio = nonFunctionalCount / progression.length;
    
    if (nonFunctionalRatio > (1 - controls.functional_clarity)) {
      const excessRatio = nonFunctionalRatio - (1 - controls.functional_clarity);
      const penalty = excessRatio * weights.functional_grammar * 100;
      totalPenalty += penalty;
      penalties.push({
        constraint: 'too_many_nonfunctional',
        penalty,
      });
    }
  }
  
  return {
    total_score: -totalPenalty,
    penalties,
  };
}

// ----------------------------------------------------------------------------
// Default Score Weights
// ----------------------------------------------------------------------------

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  chord_tone_match: 100,
  legal_tension_match: 50,
  avoid_note_penalty: 50,
  melody_mismatch_penalty: 30,
  functional_grammar: 10,
  cof_motion: 8,
  cadence_quality: 15,
  repetition_penalty: 10,
  voice_leading: 12,
  distance_penalty: 5,
};

// ----------------------------------------------------------------------------
// Score a complete candidate
// ----------------------------------------------------------------------------

export function scoreCandidate(
  candidate: ChordCandidate,
  melodyPitches: number[],
  metricalStrengths: number[],
  previousChord: ChordSymbol | null,
  position: number,
  totalSlots: number,
  controls: {
    distance: number;
    functional_clarity: number;
    adventurous: number;
  },
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): ChordCandidate {
  const scoredCandidate = { ...candidate };
  
  // 12.1 Local chord fit score
  const localFitScore = calculateLocalFitScore(
    candidate,
    melodyPitches,
    metricalStrengths,
    weights
  );
  scoredCandidate.melody_fit_score = localFitScore;
  
  // 12.2 Transition score (if we have previous chord)
  if (previousChord) {
    const transitionScore = calculateTransitionScore(
      previousChord,
      candidate.chord,
      position,
      totalSlots,
      {
        functional_clarity: controls.functional_clarity,
        adventurous: controls.adventurous,
      },
      weights
    );
    scoredCandidate.transition_scores['from_previous'] = transitionScore;
  }
  
  // 12.3 Voice-leading score (if we have previous chord)
  if (previousChord) {
    const voiceLeadingScore = calculateVoiceLeadingScore(
      previousChord,
      candidate.chord,
      weights
    );
    scoredCandidate.voice_leading_score = voiceLeadingScore;
  }
  
  // 12.4 Distance penalty
  const distancePenalty = calculateDistancePenalty(
    candidate.chord,
    controls.distance,
    controls.adventurous,
    weights
  );
  scoredCandidate.distance_penalty = distancePenalty;
  
  // Calculate total score
  const transitionScoreSum = Object.values(scoredCandidate.transition_scores).reduce(
    (sum, score) => sum + score,
    0
  );
  
  scoredCandidate.total_score =
    scoredCandidate.melody_fit_score +
    transitionScoreSum +
    scoredCandidate.voice_leading_score -
    scoredCandidate.distance_penalty;
  
  return scoredCandidate;
}

// ----------------------------------------------------------------------------
// Score a complete progression path
// ----------------------------------------------------------------------------

export interface ProgressionScore {
  path_score: number;
  local_fit_scores: number[];
  transition_scores: number[];
  voice_leading_scores: number[];
  distance_penalties: number[];
  global_score: number;
  global_penalties: Array<{ constraint: string; penalty: number }>;
}

export function scoreProgressionPath(
  progression: ChordCandidate[],
  controls: {
    distance: number;
    functional_clarity: number;
    cadence_frequency: number;
    require_tonal_return: boolean;
    adventurous: number;
  },
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): ProgressionScore {
  const localFitScores: number[] = [];
  const transitionScores: number[] = [];
  const voiceLeadingScores: number[] = [];
  const distancePenalties: number[] = [];
  
  progression.forEach((candidate, index) => {
    localFitScores.push(candidate.melody_fit_score);
    distancePenalties.push(candidate.distance_penalty);
    
    if (index > 0) {
      transitionScores.push(
        candidate.transition_scores['from_previous'] || 0
      );
      voiceLeadingScores.push(candidate.voice_leading_score);
    }
  });
  
  // 12.5 Global constraints
  const globalScore = calculateGlobalConstraints(
    progression.map(c => c.chord),
    {
      functional_clarity: controls.functional_clarity,
      cadence_frequency: controls.cadence_frequency,
      require_tonal_return: controls.require_tonal_return,
    },
    weights
  );
  
  // Calculate path score
  const pathScore =
    localFitScores.reduce((sum, s) => sum + s, 0) +
    transitionScores.reduce((sum, s) => sum + s, 0) +
    voiceLeadingScores.reduce((sum, s) => sum + s, 0) -
    distancePenalties.reduce((sum, p) => sum + p, 0) +
    globalScore.total_score;
  
  return {
    path_score: pathScore,
    local_fit_scores: localFitScores,
    transition_scores: transitionScores,
    voice_leading_scores: voiceLeadingScores,
    distance_penalties: distancePenalties,
    global_score: globalScore.total_score,
    global_penalties: globalScore.penalties,
  };
}