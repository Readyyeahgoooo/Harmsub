// Harmony Engine - Main Export

// Chord Model
export {
  type Chord,
  type ChordQuality,
  type HarmonicFunction,
  NOTE_NAMES,
  NOTE_NAMES_FLAT,
  CHORD_INTERVALS,
  noteToPC,
  pcToNote,
  createChord,
  getChordPCs,
  chordToMIDI,
  parseChordSymbol,
  chordToSymbol,
  isChordTone,
  getChordToneType,
} from './chordModel';

// Scales
export {
  type Scale,
  type ScaleType,
  SCALE_INTERVALS,
  MODE_NAMES,
  createScale,
  getScalePCs,
  isInScale,
  getScaleDegree,
  getDiatonicChordQuality,
  getDiatonic7thQuality,
  getAvailableTensions,
  getAvoidNotes,
  detectScale,
} from './scales';

// Functions
export {
  DEGREE_FUNCTIONS,
  FUNCTION_GRAMMAR,
  ROOT_MOTION_SCORES,
  getRomanFunction,
  getChordFunction,
  isValidTransition,
  scoreTransition,
  scoreRootMotion,
  getSuggestedNextFunctions,
  analyzeProgressionFunctions,
  generateRoman,
  type CadenceType,
  detectCadence,
} from './functions';

// Distance
export {
  type DistanceLevel,
  type ChordTemplate,
  DISTANCE_LEVELS,
  getVocabularyUpToLevel,
  getChordDistanceLevel,
  calculateHarmonicDistance,
  templateToChord,
  getChordsAtLevel,
  tagChord,
} from './distance';

// Substitutions
export {
  type SubstitutionOption,
  TONIC_SUBSTITUTIONS,
  PREDOMINANT_SUBSTITUTIONS,
  DOMINANT_SUBSTITUTIONS,
  getSubstitutionsForFunction,
  getSubstitutionsForChord,
  substitutionToChord,
  suggestSubstitutions,
  applySubstitution,
  reharmonize,
  type SubstitutionPattern,
  COMMON_PATTERNS,
} from './substitutions';

// Progressions
export {
  type ProgressionTemplate,
  FOUR_CHORD_TEMPLATES,
  EIGHT_CHORD_TEMPLATES,
  SIXTEEN_BAR_TEMPLATES,
  ALL_TEMPLATES,
  FUNCTIONAL_GRAPH,
  generateFunctionalProgression,
  generateCircleOfFifths,
  insertCadence,
  expandTemplate,
  findTemplatesByStyle,
  findTemplatesByLength,
  generateVariation,
} from './progressions';

// Scoring
export {
  SCORING_WEIGHTS,
  type ChordScore,
  scoreChordFit,
  scoreChordTransition,
  scoreVoiceLeading,
  scoreDistancePenalty,
  scoreChord,
  findOptimalPath,
  generateCandidates,
  scoreProgression,
  rankProgressions,
} from './scoring';

// Voicing
export {
  type VoicingPreset,
  type VoicingConfig,
  VOICING_CONFIGS,
  voiceChord,
  optimizeVoiceLeading,
  getVoicingDescription,
  voicingToNoteNames,
} from './voicing';

// Style Packs
export {
  type StylePack,
  STYLE_PACKS,
  getStylePack,
  getStylePackIds,
  findStylePacksByCharacteristic,
  getStylePackForTempo,
  type StyleSettings,
  getStyleSettings,
} from './stylePacks';
