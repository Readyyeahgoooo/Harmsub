// Scoring & Pathfinding based on Rulebook §11-12

import { Chord, getChordPCs, isChordTone, getChordToneType } from './chordModel';
import { getChordFunction, scoreTransition, scoreRootMotion } from './functions';
import { getChordDistanceLevel, calculateHarmonicDistance } from './distance';

// Score weights (§12)
export const SCORING_WEIGHTS = {
  chord_fit: 0.40,      // Melody notes vs chord tones
  transition: 0.25,     // Voice-leading smoothness
  voice_leading: 0.20,  // Parallel motion penalty
  distance_penalty: 0.15, // Harmonic distance from diatonic
};

// Individual score components
export interface ChordScore {
  chord_fit: number;       // 0-100
  transition: number;      // 0-100
  voice_leading: number;   // 0-100
  distance_penalty: number; // 0-100 (higher = less penalty)
  total: number;           // Weighted sum
}

// Score how well a chord fits melody notes
export function scoreChordFit(chord: Chord, melodyPCs: number[]): number {
  if (melodyPCs.length === 0) return 100;
  
  const chordPCs = getChordPCs(chord);
  let score = 0;
  
  for (const melodyPC of melodyPCs) {
    const normalizedPC = melodyPC % 12;
    
    if (isChordTone(normalizedPC, chord)) {
      const toneType = getChordToneType(normalizedPC, chord);
      
      // Root and 3rd are best
      if (toneType === 'root') score += 100;
      else if (toneType === '3rd') score += 95;
      else if (toneType === '5th') score += 85;
      else if (toneType === '7th') score += 80;
      else if (toneType === '9th' || toneType === '13th') score += 75;
      else if (toneType === '11th') score += 70;
      else score += 60; // Other chord tone
    } else {
      // Check if it's a tension or avoid note
      const interval = ((normalizedPC - chord.root_pc) % 12 + 12) % 12;
      
      // Common tensions are okay
      if ([2, 9].includes(interval)) score += 50; // 9th
      if ([5, 17].includes(interval)) score += 40; // 11th (often avoid)
      if ([9, 21].includes(interval)) score += 55; // 13th
      
      // Half-step from chord tone is passing
      const isHalfStepFromChordTone = chordPCs.some(pc => 
        Math.abs(normalizedPC - pc) === 1 || Math.abs(normalizedPC - pc) === 11
      );
      if (isHalfStepFromChordTone) score += 30;
      else score += 10; // Clash
    }
  }
  
  return Math.min(100, score / melodyPCs.length);
}

// Score transition between two chords
export function scoreChordTransition(from: Chord, to: Chord, keyRoot: number): number {
  let score = 0;
  
  // Function transition score
  const funcScore = scoreTransition(from.function, to.function);
  score += funcScore * 0.4;
  
  // Root motion score
  const rootScore = scoreRootMotion(from.root_pc, to.root_pc);
  score += rootScore * 0.4;
  
  // Common tone bonus
  const fromPCs = getChordPCs(from);
  const toPCs = getChordPCs(to);
  const commonTones = fromPCs.filter(pc => toPCs.includes(pc)).length;
  score += commonTones * 5;
  
  return Math.min(100, score);
}

// Score voice-leading (penalize parallel 5ths/octaves)
export function scoreVoiceLeading(from: Chord, to: Chord): number {
  const fromPCs = getChordPCs(from).sort((a, b) => a - b);
  const toPCs = getChordPCs(to).sort((a, b) => a - b);
  
  let penalty = 0;
  
  // Check for parallel motion
  const minLen = Math.min(fromPCs.length, toPCs.length);
  for (let i = 0; i < minLen - 1; i++) {
    for (let j = i + 1; j < minLen; j++) {
      const interval1 = (fromPCs[j] - fromPCs[i] + 12) % 12;
      const interval2 = (toPCs[j] - toPCs[i] + 12) % 12;
      
      // Parallel 5ths
      if (interval1 === 7 && interval2 === 7) {
        const motion1 = toPCs[i] - fromPCs[i];
        const motion2 = toPCs[j] - fromPCs[j];
        if (motion1 === motion2 && motion1 !== 0) penalty += 20;
      }
      
      // Parallel octaves
      if (interval1 === 0 && interval2 === 0) {
        const motion1 = toPCs[i] - fromPCs[i];
        const motion2 = toPCs[j] - fromPCs[j];
        if (motion1 === motion2 && motion1 !== 0) penalty += 25;
      }
    }
  }
  
  // Bonus for stepwise motion
  let stepwiseCount = 0;
  for (let i = 0; i < minLen; i++) {
    const motion = Math.abs(toPCs[i] - fromPCs[i]);
    if (motion <= 2) stepwiseCount++;
  }
  const stepwiseBonus = (stepwiseCount / minLen) * 20;
  
  return Math.max(0, Math.min(100, 100 - penalty + stepwiseBonus));
}

// Score distance penalty (prefer diatonic)
export function scoreDistancePenalty(chord: Chord, targetDistance: number = 0): number {
  const chordDistance = getChordDistanceLevel(chord);
  const diff = Math.abs(chordDistance - targetDistance);
  
  // No penalty if at or below target
  if (chordDistance <= targetDistance) return 100;
  
  // Penalty increases with distance above target
  return Math.max(0, 100 - diff * 20);
}

// Calculate total score for a chord
export function scoreChord(
  chord: Chord,
  melodyPCs: number[],
  prevChord: Chord | null,
  keyRoot: number,
  targetDistance: number = 0
): ChordScore {
  const chord_fit = scoreChordFit(chord, melodyPCs);
  const transition = prevChord ? scoreChordTransition(prevChord, chord, keyRoot) : 100;
  const voice_leading = prevChord ? scoreVoiceLeading(prevChord, chord) : 100;
  const distance_penalty = scoreDistancePenalty(chord, targetDistance);
  
  const total = 
    chord_fit * SCORING_WEIGHTS.chord_fit +
    transition * SCORING_WEIGHTS.transition +
    voice_leading * SCORING_WEIGHTS.voice_leading +
    distance_penalty * SCORING_WEIGHTS.distance_penalty;
  
  return { chord_fit, transition, voice_leading, distance_penalty, total };
}

// Beam search state
interface BeamState {
  chords: Chord[];
  score: number;
}

// Find optimal chord path using beam search
export function findOptimalPath(
  melodySegments: number[][],  // Array of pitch classes per segment
  candidates: Chord[][],       // Candidate chords per segment
  keyRoot: number,
  beamWidth: number = 5,
  targetDistance: number = 0
): Chord[] {
  if (melodySegments.length === 0 || candidates.length === 0) return [];
  
  // Initialize beam with first segment candidates
  let beam: BeamState[] = candidates[0].map(chord => ({
    chords: [chord],
    score: scoreChord(chord, melodySegments[0], null, keyRoot, targetDistance).total,
  }));
  
  // Sort and trim beam
  beam.sort((a, b) => b.score - a.score);
  beam = beam.slice(0, beamWidth);
  
  // Process remaining segments
  for (let i = 1; i < melodySegments.length; i++) {
    const newBeam: BeamState[] = [];
    
    for (const state of beam) {
      const prevChord = state.chords[state.chords.length - 1];
      
      for (const chord of candidates[i]) {
        const chordScore = scoreChord(
          chord, 
          melodySegments[i], 
          prevChord, 
          keyRoot, 
          targetDistance
        );
        
        newBeam.push({
          chords: [...state.chords, chord],
          score: state.score + chordScore.total,
        });
      }
    }
    
    // Sort and trim
    newBeam.sort((a, b) => b.score - a.score);
    beam = newBeam.slice(0, beamWidth);
  }
  
  // Return best path
  return beam[0]?.chords || [];
}

// Generate candidate chords for a melody segment
export function generateCandidates(
  melodyPCs: number[],
  keyRoot: number,
  maxDistance: number = 2
): Chord[] {
  const candidates: Chord[] = [];
  
  // Import vocabulary
  const { getVocabularyUpToLevel, templateToChord } = require('./distance');
  const vocabulary = getVocabularyUpToLevel(maxDistance);
  
  for (const template of vocabulary) {
    const chord = templateToChord(template, keyRoot);
    const score = scoreChordFit(chord, melodyPCs);
    
    // Only include chords with reasonable fit
    if (score >= 40) {
      candidates.push(chord);
    }
  }
  
  // Sort by fit score
  candidates.sort((a, b) => {
    const scoreA = scoreChordFit(a, melodyPCs);
    const scoreB = scoreChordFit(b, melodyPCs);
    return scoreB - scoreA;
  });
  
  // Return top candidates
  return candidates.slice(0, 10);
}

// Score an entire progression
export function scoreProgression(
  chords: Chord[],
  melodySegments: number[][],
  keyRoot: number,
  targetDistance: number = 0
): { scores: ChordScore[]; totalScore: number; averageScore: number } {
  const scores: ChordScore[] = [];
  let totalScore = 0;
  
  for (let i = 0; i < chords.length; i++) {
    const melodyPCs = melodySegments[i] || [];
    const prevChord = i > 0 ? chords[i - 1] : null;
    const score = scoreChord(chords[i], melodyPCs, prevChord, keyRoot, targetDistance);
    scores.push(score);
    totalScore += score.total;
  }
  
  return {
    scores,
    totalScore,
    averageScore: chords.length > 0 ? totalScore / chords.length : 0,
  };
}

// Rank multiple progressions
export function rankProgressions(
  progressions: Chord[][],
  melodySegments: number[][],
  keyRoot: number,
  targetDistance: number = 0
): { progression: Chord[]; score: number }[] {
  return progressions
    .map(progression => ({
      progression,
      score: scoreProgression(progression, melodySegments, keyRoot, targetDistance).averageScore,
    }))
    .sort((a, b) => b.score - a.score);
}
