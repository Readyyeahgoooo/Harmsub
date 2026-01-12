// ============================================================================
// CHORD GENERATOR RULEBOOK v1.0 - TYPE DEFINITIONS
// ============================================================================

// ----------------------------------------------------------------------------
// 2.3 Core Chord Object (Symbolic)
// ----------------------------------------------------------------------------
export interface ChordSymbol {
  root_pc: number; // 0-11 (C=0, C#=1, ..., B=11)
  quality: ChordQuality;
  extensions: ExtensionType[];
  alterations: AlterationType[];
  omit: OmitType[];
  bass_pc?: number; // optional slash bass
  roman: string; // e.g., "V/vi", "bVII", "#iv°7"
  function: ChordFunction; // T, PD, D, CT, SEQ, N
  distance_level: number; // 0-6
  tags: ChordTag[];
}

export type ChordQuality =
  | 'maj' | 'min' | 'dom' | 'dim' | 'hdim' | 'aug'
  | 'sus2' | 'sus4' | 'maj7' | 'min7' | 'dom7' | 'dim7'
  | 'hdim7' | 'maj9' | 'min9' | 'dom9' | 'dom11' | 'dom13'
  | 'maj7#11' | 'dom7alt';

export type ExtensionType = '6' | '7' | '9' | '11' | '13';
export type AlterationType = 'b9' | '#9' | '#11' | 'b5' | '#5' | 'b13' | 'b7';
export type OmitType = 'omit3' | 'omit5';

export type ChordFunction = 'T' | 'PD' | 'D' | 'CT' | 'SEQ' | 'N';

export type ChordTag =
  | 'diatonic' | 'color_tone' | 'sus' | 'inversion'
  | 'secondary_dominant' | 'applied_iiV' | 'passing_dim'
  | 'borrowed' | 'modal_mixture' | 'tritone_sub'
  | 'backdoor' | 'melodic_minor_dominant' | 'alt_dom'
  | 'chromatic_mediant' | 'planing' | 'symmetry'
  | 'pedal' | 'polychord' | 'nonfunctional';

// ----------------------------------------------------------------------------
// Melody Note Representation
// ----------------------------------------------------------------------------
export interface MelodyNote {
  pitch: number; // MIDI pitch number (60 = C4)
  start: number; // start time in beats
  duration: number; // duration in beats
  velocity?: number; // 0-127
  accent?: boolean; // is this note accented?
  metrical_strength: number; // 0-1, where 1 = downbeat
}

// ----------------------------------------------------------------------------
// 3.1 Scale Sources
// ----------------------------------------------------------------------------
export type ScaleType =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
  | 'whole_tone' | 'diminished_hw' | 'diminished_wh'
  | 'major_pentatonic' | 'minor_pentatonic' | 'blues';

export interface Scale {
  name: ScaleType;
  root: number; // root pitch class 0-11
  pitch_classes: number[]; // ordered pitch classes
}

// ----------------------------------------------------------------------------
// 2.2 User Controls
// ----------------------------------------------------------------------------
export interface HarmonizationControls {
  loop_length: 4 | 8 | 16 | 32;
  harmonic_rhythm: '1_per_bar' | '2_per_bar' | '4_per_bar';
  distance: number; // 0-6
  functional_clarity: number; // 0-1 (low to high)
  dominant_density: 'none' | 'light' | 'medium' | 'heavy';
  borrowed_amount: 'none' | 'light' | 'medium' | 'frequent';
  alteration_amount: 'clean' | 'mild' | 'medium' | 'spicy';
  style_pack: StylePackName;
  voicing_preset: VoicingPresetName;
  adventurous: number; // 0-1 (how much to allow distance spikes)
  cadence_frequency: number; // bars between cadences
  require_tonal_return: boolean;
}

// ----------------------------------------------------------------------------
// 10.1 Genre/Style Packs
// ----------------------------------------------------------------------------
export type StylePackName =
  | 'jazz' | 'bossa' | 'jazz_ballad' | 'pop_rnb'
  | 'radiohead' | 'romantic_classical' | 'cinematic';

export interface StylePack {
  name: StylePackName;
  description: string;
  allowed_distance_levels: number[];
  typical_chords: ChordQuality[];
  typical_dominants: ChordQuality[];
  progression_edge_weights: Record<string, number>;
  voicing_default: VoicingPresetName;
  template_bias: string[];
  functional_clarity_default: number;
  dominant_density_default: DominantDensity;
  alteration_default: AlterationAmount;
}

export type DominantDensity = 'none' | 'light' | 'medium' | 'heavy';
export type AlterationAmount = 'clean' | 'mild' | 'medium' | 'spicy';

// ----------------------------------------------------------------------------
// 13.2 Voicing Presets
// ----------------------------------------------------------------------------
export type VoicingPresetName =
  | 'clear' | 'rootless_jazz' | 'quartal'
  | 'neo_soul' | 'classical_satb' | 'cinematic_pads';

export interface VoicingPreset {
  name: VoicingPresetName;
  description: string;
  constraints: VoicingConstraint[];
  preferences: VoicingPreference[];
}

export interface VoicingConstraint {
  type: 'range_limit' | 'interval_limit' | 'voice_leading' | 'preserve_guide_tones';
  value?: number;
  voice_range?: [number, number]; // [low, high] in MIDI
  max_interval?: number; // in semitones
}

export interface VoicingPreference {
  type: 'spacing' | 'movement' | 'guide_tone_priority' | 'cluster_amount';
  value: 'open' | 'tight' | 'minimal' | 'maximal' | 'high' | 'low' | 'medium';
}

// ----------------------------------------------------------------------------
// Voicing Output
// ----------------------------------------------------------------------------
export interface Voicing {
  chord: ChordSymbol;
  pitches: number[]; // actual MIDI pitches
  bass_note?: number; // separate bass note if different
  instrument_voicings: Record<string, number[]>; // per-instrument voicings
}

// ----------------------------------------------------------------------------
// 9.1 Template Library
// ----------------------------------------------------------------------------
export type TemplateType = '4_chord' | '8_chord' | '16_bar';

export interface Template {
  name: string;
  type: TemplateType;
  functions: ChordFunction[];
  description: string;
  style_bias?: StylePackName[];
}

// ----------------------------------------------------------------------------
// 12. Scoring System
// ----------------------------------------------------------------------------
export interface ScoreWeights {
  chord_tone_match: number;
  legal_tension_match: number;
  avoid_note_penalty: number;
  melody_mismatch_penalty: number;
  functional_grammar: number;
  cof_motion: number;
  cadence_quality: number;
  repetition_penalty: number;
  voice_leading: number;
  distance_penalty: number;
}

export interface ChordCandidate {
  chord: ChordSymbol;
  melody_fit_score: number;
  transition_scores: Record<string, number>;
  voice_leading_score: number;
  distance_penalty: number;
  total_score: number;
}

// ----------------------------------------------------------------------------
// Progression Path
// ----------------------------------------------------------------------------
export interface ProgressionPath {
  chords: ChordSymbol[];
  voicings: Voicing[];
  total_score: number;
  function_sequence: ChordFunction[];
  cadences: Cadence[];
}

export interface Cadence {
  position: number; // bar/beat position
  type: 'perfect' | 'half' | 'deceptive' | 'plagal' | 'tritone_sub' | 'backdoor';
  strength: number; // 0-1
}

// ----------------------------------------------------------------------------
// 7.1 Substitution Ladders
// ----------------------------------------------------------------------------
export interface SubstitutionLadder {
  function: ChordFunction;
  substitutions: SubstitutionOption[];
}

export interface SubstitutionOption {
  chord: ChordSymbol;
  distance_level: number;
  acceptability: number; // 0-1
  description: string;
}

// ----------------------------------------------------------------------------
// 8. Progression Engines
// ----------------------------------------------------------------------------
export interface ProgressionEngine {
  name: string;
  generate: (
    start_function: ChordFunction,
    length: number,
    controls: HarmonizationControls
  ) => ChordFunction[];
}

// ----------------------------------------------------------------------------
// Main Harmonization Result
// ----------------------------------------------------------------------------
export interface HarmonizationResult {
  melody: MelodyNote[];
  controls: HarmonizationControls;
  progression: ProgressionPath;
  style_pack: StylePack;
  midi_data?: Uint8Array;
}

// ----------------------------------------------------------------------------
// Analysis Results
// ----------------------------------------------------------------------------
export interface MelodyAnalysis {
  notes: MelodyNote[];
  key: Scale;
  phrase_boundaries: number[]; // beat positions
  metrical_analysis: {
    strong_beats: number[];
    weak_beats: number[];
  };
}

export interface ChordFitAnalysis {
  chord_tone_notes: MelodyNote[];
  tension_notes: MelodyNote[];
  avoid_notes: MelodyNote[];
  non_chord_tones: MelodyNote[];
  fit_score: number;
}

// ----------------------------------------------------------------------------
// Helper Types
// ----------------------------------------------------------------------------
export type PitchClass = number; // 0-11
export type Interval = number; // semitones

export interface PitchClassSet {
  pcs: PitchClass[];
  root: PitchClass;
}

export interface RomanNumeral {
  numeral: string; // I, ii, iii, IV, V, vi, vii°, etc.
  scale_degree: number; // 1-7
  quality: string; // '', 'm', '°', '+'
  alterations: string; // 'b', '#', etc.
  applied?: RomanNumeral; // for secondary dominants: V/vi
}