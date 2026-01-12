// ============================================================================
// MAIN HARMONIZATION ENGINE
// Integrates all rulebook components into complete system
// ============================================================================

import {
  MelodyNote,
  HarmonizationControls,
  HarmonizationResult,
  ProgressionPath,
  ChordSymbol,
  ChordCandidate,
} from '@/types/rulebook';
import { createScale } from '@/lib/scales';
import {
  createChordSlots,
  generateAllCandidates,
  getFunctionalSubstitutions,
} from '@/lib/candidateGeneration';
import { generateCompleteProgression } from '@/lib/progressionEngines';
import {
  scoreCandidate,
  scoreProgressionPath,
  DEFAULT_SCORE_WEIGHTS,
} from '@/lib/scoring';
import { expandTemplate } from '@/lib/templateExpansion';
import { generateVoicing } from '@/lib/voicing';
import { getStylePack } from '@/lib/stylePacks';
import { Midi } from '@tonejs/midi';

// ----------------------------------------------------------------------------
// Main Harmonization Function
// ----------------------------------------------------------------------------

export interface HarmonizationOptions {
  melody: MelodyNote[];
  controls: HarmonizationControls;
  keyRoot?: number; // Optional: auto-detect if not provided
  referenceProgression?: ChordSymbol[]; // Optional: YouTube analysis result
  beamWidth?: number; // Beam search width (default: 10)
  numVariations?: number; // Number of variations to generate (default: 3)
}

export async function harmonizeMelody(options: HarmonizationOptions): Promise<HarmonizationResult[]> {
  const {
    melody,
    controls,
    keyRoot,
    referenceProgression,
    beamWidth = 10,
    numVariations = 3,
  } = options;

  // Step 1: Analyze melody and create slots
  const slots = createChordSlots(melody, controls.harmonic_rhythm);

  // Step 2: Detect or set key
  const detectedKeyRoot = keyRoot || detectKey(melody);
  const scale = createScale('major', detectedKeyRoot);

  // Step 3: Generate candidates for each slot
  const allCandidates = generateAllCandidates(slots, controls);

  // Step 4: Generate functional progression paths
  const variations: HarmonizationResult[] = [];

  for (let i = 0; i < numVariations; i++) {
    // Generate base functional progression
    const baseFunctions = generateBaseProgression(
      controls,
      slots.length,
      i
    );

    // Step 5: Beam search to find best path
    const bestPath = await beamSearchProgression(
      allCandidates,
      baseFunctions,
      beamWidth,
      controls,
      referenceProgression
    );

    // Step 6: Generate voicings
    const voicings = bestPath.chords.map((chord, index) => {
      const previousVoicing = index > 0 ? bestPath.voicings[index - 1] : null;
      const preset = getVoicingPreset(controls.voicing_preset);
      return preset
        ? generateVoicing(chord, preset, previousVoicing)
        : { chord, pitches: [], bass_note: chord.root_pc, instrument_voicings: {} };
    });

    // Step 7: Build progression path
    const progressionPath: ProgressionPath = {
      chords: bestPath.chords,
      voicings,
      total_score: bestPath.total_score,
      function_sequence: bestPath.chords.map(c => c.function),
      cadences: detectCadences(bestPath.chords),
    };

    // Step 8: Create result
    const result: HarmonizationResult = {
      melody,
      controls,
      progression: progressionPath,
      style_pack: getStylePack(controls.style_pack)!,
    };

    variations.push(result);
  }

  return variations;
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function detectKey(melody: MelodyNote[]): number {
  // Simplified key detection - count pitch classes
  const pitchCounts: Record<number, number> = {};

  melody.forEach(note => {
    const pc = note.pitch % 12;
    pitchCounts[pc] = (pitchCounts[pc] || 0) + 1;
  });

  // Return most frequent pitch class as key root
  let maxCount = 0;
  let keyRoot = 0;

  Object.entries(pitchCounts).forEach(([pc, count]) => {
    if (count > maxCount) {
      maxCount = count;
      keyRoot = parseInt(pc);
    }
  });

  return keyRoot;
}

function generateBaseProgression(
  controls: HarmonizationControls,
  length: number,
  variationIndex: number
) {
  // Mix between different progression engines based on variation
  const engines = ['functional', 'cof', 'mixed'] as const;
  const engine = engines[variationIndex % engines.length];

  return generateCompleteProgression('T', length, controls, engine);
}

async function beamSearchProgression(
  allCandidates: ChordCandidate[][],
  baseFunctions: string[],
  beamWidth: number,
  controls: HarmonizationControls,
  referenceProgression?: ChordSymbol[]
): Promise<{
  chords: ChordSymbol[];
  voicings: any[];
  total_score: number;
}> {
  // Initialize beam with best candidates for first slot
  let beam: Array<{ path: ChordCandidate[]; score: number }> = allCandidates[0]
    .slice(0, beamWidth)
    .map(candidate => ({
      path: [candidate],
      score: candidate.total_score,
    }));

  // Beam search
  for (let slot = 1; slot < allCandidates.length; slot++) {
    const newBeam: Array<{ path: ChordCandidate[]; score: number }> = [];

    for (const beamPath of beam) {
      const lastCandidate = beamPath.path[beamPath.path.length - 1];
      const lastChord = lastCandidate.chord;
      const targetFunction = baseFunctions[slot];

      // Get candidates that match target function
      const slotCandidates = allCandidates[slot].filter(
        c => c.chord.function === targetFunction
      );

      for (const candidate of slotCandidates) {
        // Score transition
        const scoredCandidate = scoreCandidate(
          candidate,
          [],
          [],
          lastChord,
          slot,
          allCandidates.length,
          {
            distance: controls.distance,
            functional_clarity: controls.functional_clarity,
            adventurous: controls.adventurous,
          },
          DEFAULT_SCORE_WEIGHTS
        );

        // Add to path
        const newPath = [...beamPath.path, scoredCandidate];
        const newScore = beamPath.score + scoredCandidate.total_score;

        newBeam.push({
          path: newPath,
          score: newScore,
        });
      }
    }

    // Keep top beamWidth paths
    beam = newBeam
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth);
  }

  // Return best path
  const bestPath = beam[0];

  return {
    chords: bestPath.path.map(c => c.chord),
    voicings: [],
    total_score: bestPath.score,
  };
}

function detectCadences(chords: ChordSymbol[]): Array<{
  position: number;
  end_index: number;
  type: string;
  strength: number;
}> {
  const cadences: Array<{
    position: number;
    end_index: number;
    type: string;
    strength: number;
  }> = [];

  for (let i = 0; i < chords.length - 1; i++) {
    const from = chords[i];
    const to = chords[i + 1];

    if (from.function === 'D' && to.function === 'T') {
      cadences.push({
        position: i,
        end_index: i + 1,
        type: 'perfect',
        strength: 1.0,
      });
    } else if (from.function === 'PD' && to.function === 'D') {
      cadences.push({
        position: i,
        end_index: i + 1,
        type: 'half',
        strength: 0.6,
      });
    } else if (from.function === 'D' && to.function === 'PD') {
      cadences.push({
        position: i,
        end_index: i + 1,
        type: 'deceptive',
        strength: 0.7,
      });
    } else if (from.function === 'PD' && to.function === 'T') {
      cadences.push({
        position: i,
        end_index: i + 1,
        type: 'plagal',
        strength: 0.5,
      });
    }
  }

  return cadences;
}

function getVoicingPreset(name: string) {
  // Import preset from voicing module
  const { getVoicingPreset } = require('@/lib/voicing');
  return getVoicingPreset(name);
}

// ----------------------------------------------------------------------------
// MIDI Export
// ----------------------------------------------------------------------------

export function exportToMIDI(result: HarmonizationResult): Uint8Array {
  const midi = new Midi();

  // Create melody track
  const melodyTrack = midi.addTrack();
  result.melody.forEach(note => {
    melodyTrack.addNote({
      name: noteToString(note.pitch),
      octave: Math.floor(note.pitch / 12),
      duration: note.duration,
      time: note.start,
      velocity: note.velocity || 80,
    });
  });

  // Create chord track
  const chordTrack = midi.addTrack();
  result.progression.chords.forEach((chord, index) => {
    const voicing = result.progression.voicings[index];
    if (voicing && voicing.pitches) {
      voicing.pitches.forEach((pitch: number) => {
        chordTrack.addNote({
          name: noteToString(pitch),
          octave: Math.floor(pitch / 12),
          duration: 2, // Default chord duration
          time: index * 2,
          velocity: 70,
        });
      });
    }
  });

  return midi.toArray();
}

function noteToString(pitch: number): string {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return NOTE_NAMES[pitch % 12];
}

// ----------------------------------------------------------------------------
// Analysis Functions
// ----------------------------------------------------------------------------

export interface HarmonizationAnalysis {
  key_root: number;
  scale_name: string;
  phrase_boundaries: number[];
  metrical_analysis: {
    strong_beats: number[];
    weak_beats: number[];
  };
}

export function analyzeMelody(melody: MelodyNote[]): HarmonizationAnalysis {
  const keyRoot = detectKey(melody);
  const scale = createScale('major', keyRoot);

  // Detect phrase boundaries (simplified)
  const phraseBoundaries: number[] = [];
  let lastBeat = 0;

  melody.forEach((note, index) => {
    if (note.start - lastBeat > 4) { // 4 beats = 1 bar
      phraseBoundaries.push(note.start);
    }
    lastBeat = note.start;
  });

  // Metrical analysis
  const strongBeats: number[] = [];
  const weakBeats: number[] = [];

  melody.forEach(note => {
    if (note.metrical_strength > 0.5) {
      strongBeats.push(note.start);
    } else {
      weakBeats.push(note.start);
    }
  });

  return {
    key_root: keyRoot,
    scale_name: scale.name,
    phrase_boundaries: phraseBoundaries,
    metrical_analysis: {
      strong_beats: strongBeats,
      weak_beats: weakBeats,
    },
  };
}