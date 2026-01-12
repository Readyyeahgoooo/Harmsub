// ============================================================================
// MELODY-TO-CHORD CANDIDATE GENERATION ENGINE
// Implements §11 of Rulebook
// ============================================================================

import {
  MelodyNote,
  ChordSymbol,
  ChordFunction,
  HarmonizationControls,
  ChordCandidate,
} from '@/types/rulebook';
import {
  generateChordsByDistance,
  filterChordsByFunction,
  getSubstitutionLadder,
} from '@/lib/distanceLadder';
import { createScale } from '@/lib/scales';
import {
  scoreMelodyFit,
  chordSupportsMelody,
  isChordTone,
  isLegalTension,
  isAvoidNote,
  getTensionType,
} from '@/lib/tensionLegality';
import { assignFunctionToChord } from '@/lib/functionalHarmony';

// ----------------------------------------------------------------------------
// Slot Analysis
// ----------------------------------------------------------------------------

export interface ChordSlot {
  position: number; // slot number (0, 1, 2, ...)
  start_beat: number;
  end_beat: number;
  melody_notes: MelodyNote[];
  pitch_set: number[];
  strong_beats: number[];
  key_root: number;
}

// ----------------------------------------------------------------------------
// Create chord slots from melody
// ----------------------------------------------------------------------------

export function createChordSlots(
  melody: MelodyNote[],
  harmonicRhythm: '1_per_bar' | '2_per_bar' | '4_per_bar',
  barLength: number = 4
): ChordSlot[] {
  const slots: ChordSlot[] = [];
  let slotStart = 0;
  const slotLength = harmonicRhythm === '1_per_bar' 
    ? barLength 
    : harmonicRhythm === '2_per_bar' 
    ? barLength / 2 
    : barLength / 4;

  while (slotStart < barLength * 8) { // Assume 8 bars maximum
    const slotEnd = slotStart + slotLength;
    
    // Find melody notes in this slot
    const slotNotes = melody.filter(
      note => note.start >= slotStart && note.start < slotEnd
    );
    
    // Extract pitch set
    const pitchSet = [...new Set(slotNotes.map(n => n.pitch % 12))];
    
    // Identify strong beats
    const strongBeats = slotNotes
      .filter(n => n.metrical_strength > 0.5)
      .map(n => n.start - slotStart);
    
    // Detect key (simplified - use first note or user-provided)
    const keyRoot = melody.length > 0 ? melody[0].pitch % 12 : 0;
    
    slots.push({
      position: slots.length,
      start_beat: slotStart,
      end_beat: slotEnd,
      melody_notes: slotNotes,
      pitch_set: pitchSet,
      strong_beats: strongBeats,
      key_root: keyRoot,
    });
    
    slotStart = slotEnd;
  }
  
  return slots;
}

// ----------------------------------------------------------------------------
// 11.1 Candidate Inclusion Rules (Ranked)
// ----------------------------------------------------------------------------

export interface CandidateRule {
  priority: number;
  description: string;
  test: (chord: ChordSymbol, slot: ChordSlot) => boolean;
}

const CANDIDATE_RULES: CandidateRule[] = [
  {
    priority: 1,
    description: 'Contains strongest melody pitch as chord tone (3rd/7th get bonus)',
    test: (chord, slot) => {
      if (slot.melody_notes.length === 0) return false;
      
      // Find strongest note
      const strongestNote = slot.melody_notes.reduce((best, note) => 
        note.metrical_strength > best.metrical_strength ? note : best
      );
      
      const isChordToneMatch = isChordTone(
        chord, 
        strongestNote.pitch, 
        chord.root_pc
      );
      
      // Bonus for 3rd and 7th
      const interval = ((strongestNote.pitch - chord.root_pc) % 12 + 12) % 12;
      const isThirdOrSeventh = interval === 4 || interval === 11;
      
      return isChordToneMatch && isThirdOrSeventh;
    },
  },
  {
    priority: 2,
    description: 'Contains strongest melody pitch as legal tension',
    test: (chord, slot) => {
      if (slot.melody_notes.length === 0) return false;
      
      const strongestNote = slot.melody_notes.reduce((best, note) => 
        note.metrical_strength > best.metrical_strength ? note : best
      );
      
      return isLegalTension(chord, strongestNote.pitch, chord.root_pc);
    },
  },
  {
    priority: 3,
    description: 'Supports suspension that resolves within next slot',
    test: (chord, slot) => {
      // This would need access to next slot - simplified version
      return true;
    },
  },
  {
    priority: 4,
    description: 'Creates intentional upper-structure (neo-soul/jazz)',
    test: (chord, slot) => {
      // Check if chord supports upper-structure harmony
      return chord.extensions.includes('9') || chord.extensions.includes('11');
    },
  },
];

// ----------------------------------------------------------------------------
// 11.2 Avoid-Note Handling
// ----------------------------------------------------------------------------

export interface AvoidNoteResolution {
  strategy: 'reject' | 'reinterpret' | 'penalize';
  alternative_chord?: ChordSymbol;
  penalty: number;
}

export function handleAvoidNotes(
  chord: ChordSymbol,
  slot: ChordSlot,
  style: 'jazz_pop' | 'classical' = 'jazz_pop'
): AvoidNoteResolution {
  const avoidNotes = slot.melody_notes.filter(note =>
    isAvoidNote(chord, note.pitch, chord.root_pc)
  );
  
  if (avoidNotes.length === 0) {
    return { strategy: 'reject', penalty: 0 };
  }
  
  // Jazz allows avoid notes with penalty
  if (style === 'jazz_pop') {
    return {
      strategy: 'penalize',
      penalty: avoidNotes.length * 30,
    };
  }
  
  // Classical is stricter
  return {
    strategy: 'reject',
    penalty: 100,
  };
}

// ----------------------------------------------------------------------------
// Generate candidates for a single slot
// ----------------------------------------------------------------------------

export function generateCandidatesForSlot(
  slot: ChordSlot,
  controls: HarmonizationControls
): ChordCandidate[] {
  const candidates: ChordCandidate[] = [];
  
  // Get all possible chords up to max distance
  const allChords = generateChordsByDistance(slot.key_root, controls.distance);
  
  // Get melody pitches
  const melodyPitches = slot.melody_notes.map(n => n.pitch);
  const metricalStrengths = slot.melody_notes.map(n => n.metrical_strength);
  
  // Filter by style pack (simplified - use distance level)
  const styleFilteredChords = allChords.filter(chord =>
    chord.distance_level <= controls.distance
  );
  
  // Generate candidates
  styleFilteredChords.forEach(chord => {
    // Check avoid notes
    const avoidNoteResolution = handleAvoidNotes(chord, slot, controls.style_pack === 'jazz' ? 'jazz_pop' : 'classical');
    
    if (avoidNoteResolution.strategy === 'reject' && avoidNoteResolution.penalty > 50) {
      return; // Skip this chord
    }
    
    // Calculate melody fit score
    const melodyFitScore = scoreMelodyFit(
      chord,
      melodyPitches,
      chord.root_pc,
      metricalStrengths
    );
    
    // Add avoid note penalty
    const totalFitScore = melodyFitScore - avoidNoteResolution.penalty;
    
    const candidate: ChordCandidate = {
      chord,
      melody_fit_score: totalFitScore,
      transition_scores: {},
      voice_leading_score: 0,
      distance_penalty: chord.distance_level * 10,
      total_score: totalFitScore - chord.distance_level * 10,
    };
    
    // Check candidate rules
    candidateRulesLoop: for (const rule of CANDIDATE_RULES) {
      if (!rule.test(chord, slot)) {
        // If rule fails, apply penalty
        candidate.total_score -= rule.priority * 5;
      }
    }
    
    candidates.push(candidate);
  });
  
  // Sort by total score
  candidates.sort((a, b) => b.total_score - a.total_score);
  
  // Return top candidates (beam width)
  return candidates.slice(0, 20);
}

// ----------------------------------------------------------------------------
// Generate candidates for all slots
// ----------------------------------------------------------------------------

export function generateAllCandidates(
  slots: ChordSlot[],
  controls: HarmonizationControls
): ChordCandidate[][] {
  return slots.map(slot => generateCandidatesForSlot(slot, controls));
}

// ----------------------------------------------------------------------------
// Get best candidate for function at slot
// ----------------------------------------------------------------------------

export function getBestCandidateForFunction(
  slot: ChordSlot,
  func: ChordFunction,
  controls: HarmonizationControls
): ChordCandidate | null {
  const candidates = generateCandidatesForSlot(slot, controls);
  const functionCandidates = candidates.filter(
    c => c.chord.function === func
  );
  
  return functionCandidates.length > 0 ? functionCandidates[0] : null;
}

// ----------------------------------------------------------------------------
// Get functional substitution candidates
// ----------------------------------------------------------------------------

export function getFunctionalSubstitutions(
  slot: ChordSlot,
  targetFunction: ChordFunction,
  controls: HarmonizationControls
): ChordCandidate[] {
  const candidates = generateCandidatesForSlot(slot, controls);
  const substitutions = candidates.filter(
    c => c.chord.function === targetFunction
  );
  
  // Sort by distance level (closest to furthest)
  substitutions.sort((a, b) => 
    a.chord.distance_level - b.chord.distance_level
  );
  
  return substitutions;
}

// ----------------------------------------------------------------------------
// Filter candidates by distance level
// ----------------------------------------------------------------------------

export function filterCandidatesByDistance(
  candidates: ChordCandidate[],
  maxDistance: number
): ChordCandidate[] {
  return candidates.filter(
    c => c.chord.distance_level <= maxDistance
  );
}

// ----------------------------------------------------------------------------
// Get candidate statistics
// ----------------------------------------------------------------------------

export interface CandidateStatistics {
  total_candidates: number;
  by_function: Record<ChordFunction, number>;
  by_distance: Record<number, number>;
  average_melody_fit: number;
  average_total_score: number;
}

export function getCandidateStatistics(
  candidates: ChordCandidate[]
): CandidateStatistics {
  const byFunction: Record<ChordFunction, number> = {
    T: 0,
    PD: 0,
    D: 0,
    CT: 0,
    SEQ: 0,
    N: 0,
  };
  
  const byDistance: Record<number, number> = {};
  
  candidates.forEach(c => {
    byFunction[c.chord.function]++;
    byDistance[c.chord.distance_level] = 
      (byDistance[c.chord.distance_level] || 0) + 1;
  });
  
  const averageMelodyFit = candidates.reduce(
    (sum, c) => sum + c.melody_fit_score,
    0
  ) / candidates.length;
  
  const averageTotalScore = candidates.reduce(
    (sum, c) => sum + c.total_score,
    0
  ) / candidates.length;
  
  return {
    total_candidates: candidates.length,
    by_function: byFunction,
    by_distance: byDistance,
    average_melody_fit: averageMelodyFit,
    average_total_score: averageTotalScore,
  };
}