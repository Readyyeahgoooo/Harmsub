// ============================================================================
// SCALE/MODE LIBRARY WITH DIATONIC CHORD SETS
// Implements §3.1-3.2 of Rulebook
// ============================================================================

import { Scale, ScaleType, ChordQuality } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// Scale Intervals (in semitones from root)
// ----------------------------------------------------------------------------
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  whole_tone: [0, 2, 4, 6, 8, 10],
  diminished_hw: [0, 2, 3, 5, 6, 8, 9, 11],
  diminished_wh: [0, 1, 3, 4, 6, 7, 9, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  minor_pentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

// ----------------------------------------------------------------------------
// Diatonic Chord Qualities by Scale
// Index 0 = root position triad (if applicable), index 1 = 7th chord
// ----------------------------------------------------------------------------
const DIATONIC_CHORDS: Record<ScaleType, ChordQuality[][]> = {
  major: [
    ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'hdim7']
  ],
  natural_minor: [
    ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    ['min7', 'hdim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7']
  ],
  harmonic_minor: [
    ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'],
    ['minmaj7', 'hdim7', 'maj7#5', 'min7', 'dom7', 'maj7', 'dim7']
  ],
  melodic_minor: [
    ['min', 'min', 'aug', 'maj', 'maj', 'dim', 'dim'],
    ['min6', 'min7', 'maj7#5', 'dom7', 'dom7', 'hdim7', 'hdim7']
  ],
  dorian: [
    ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    ['min7', 'min7', 'maj7', 'dom7', 'min7', 'hdim7', 'maj7']
  ],
  phrygian: [
    ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min'],
    ['min7', 'dom7', 'maj7', 'min7', 'hdim7', 'maj7', 'min7']
  ],
  lydian: [
    ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'],
    ['maj7', 'dom7', 'min7', 'hdim7', 'maj7', 'min7', 'min7']
  ],
  mixolydian: [
    ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],
    ['dom7', 'min7', 'hdim7', 'maj7', 'min7', 'min7', 'maj7']
  ],
  locrian: [
    ['dim', 'maj', 'min', 'min', 'maj', 'maj', 'dim'],
    ['hdim7', 'maj7', 'min7', 'min7', 'dom7', 'maj7', 'dim7']
  ],
  whole_tone: [
    ['aug', 'aug', 'aug', 'aug', 'aug', 'aug', 'aug'],
    ['dom7#5', 'dom7#5', 'dom7#5', 'dom7#5', 'dom7#5', 'dom7#5', 'dom7#5']
  ],
  diminished_hw: [
    ['dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim'],
    ['dim7', 'dom7', 'dim7', 'dom7', 'dim7', 'dom7', 'dim7', 'dom7']
  ],
  diminished_wh: [
    ['dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim'],
    ['dom7', 'dim7', 'dom7', 'dim7', 'dom7', 'dim7', 'dom7', 'dim7']
  ],
  major_pentatonic: [
    ['maj', 'min', 'min', 'maj', 'maj', 'min', 'min'],
    ['maj7', 'min7', 'min7', 'maj7', 'maj7', 'min7', 'min7']
  ],
  minor_pentatonic: [
    ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    ['min7', 'min7', 'maj7', 'dom7', 'min7', 'hdim7', 'maj7']
  ],
  blues: [
    ['maj', 'min', 'dim', 'maj', 'maj', 'min', 'dim'],
    ['dom7', 'min7', 'hdim7', 'dom7', 'dom7', 'min7', 'dim7']
  ],
};

// ----------------------------------------------------------------------------
// Scale Construction
// ----------------------------------------------------------------------------

export function createScale(type: ScaleType, root: number): Scale {
  const intervals = SCALE_INTERVALS[type];
  const pitchClasses = intervals.map(interval => (root + interval) % 12);

  return {
    name: type,
    root,
    pitch_classes: pitchClasses,
  };
}

export function getScaleDegrees(scale: Scale): number[] {
  return scale.pitch_classes;
}

export function getPitchClassInScale(scale: Scale, pitchClass: number): boolean {
  return scale.pitch_classes.includes(pitchClass % 12);
}

// ----------------------------------------------------------------------------
// Diatonic Chord Generation
// ----------------------------------------------------------------------------

export function getDiatonicChordQuality(
  scale: Scale,
  scaleDegree: number, // 1-7
  useSevenths: boolean = false
): ChordQuality {
  const scaleIndex = (scaleDegree - 1) % 7;
  const chordSet = DIATONIC_CHORDS[scale.name][useSevenths ? 1 : 0];
  return chordSet[scaleIndex];
}

export function getDiatonicChordRoot(
  scale: Scale,
  scaleDegree: number
): number {
  const scaleIndex = (scaleDegree - 1) % 7;
  return scale.pitch_classes[scaleIndex];
}

export function getDiatonicChords(
  scale: Scale,
  useSevenths: boolean = false
): Array<{ degree: number; root: number; quality: ChordQuality }> {
  const chordSet = DIATONIC_CHORDS[scale.name][useSevenths ? 1 : 0];

  return chordSet.map((quality, index) => ({
    degree: index + 1,
    root: scale.pitch_classes[index],
    quality,
  }));
}

// ----------------------------------------------------------------------------
// Scale Relationships
// ----------------------------------------------------------------------------

export function getParallelScale(scale: Scale, targetMode: ScaleType): Scale {
  return createScale(targetMode, scale.root);
}

export function getRelativeScale(scale: Scale): Scale {
  const relativeRoots = {
    major: 9, // A minor is relative to C major
    natural_minor: 3, // C major is relative to A minor
    harmonic_minor: 3,
    melodic_minor: 3,
    dorian: 10, // F major relative to D dorian
    phrygian: 8, // Eb major relative to C phrygian
    lydian: 7, // G major relative to C lydian
    mixolydian: 5, // F major relative to C mixolydian
    locrian: 6, // Db major relative to C locrian
  };

  const relativeRoot = relativeRoots[scale.name] || 0;
  return createScale('major', (scale.root + relativeRoot) % 12);
}

// ----------------------------------------------------------------------------
// Scale Mode Generation
// ----------------------------------------------------------------------------

export function getModeOfScale(baseScale: Scale, modeNumber: number): Scale {
  // modeNumber: 1 = ionian, 2 = dorian, 3 = phrygian, etc.
  const modeNames: ScaleType[] = [
    'major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'major'
  ];

  const modeName = modeNames[(modeNumber - 1) % 7];
  return createScale(modeName, baseScale.root);
}

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

export function getScaleName(type: ScaleType): string {
  const names: Record<ScaleType, string> = {
    major: 'Major (Ionian)',
    natural_minor: 'Natural Minor (Aeolian)',
    harmonic_minor: 'Harmonic Minor',
    melodic_minor: 'Melodic Minor',
    dorian: 'Dorian',
    phrygian: 'Phrygian',
    lydian: 'Lydian',
    mixolydian: 'Mixolydian',
    locrian: 'Locrian',
    whole_tone: 'Whole Tone',
    diminished_hw: 'Diminished (Half-Whole)',
    diminished_wh: 'Diminished (Whole-Half)',
    major_pentatonic: 'Major Pentatonic',
    minor_pentatonic: 'Minor Pentatonic',
    blues: 'Blues',
  };

  return names[type] || type;
}

export function getAllScaleTypes(): ScaleType[] {
  return Object.keys(SCALE_INTERVALS) as ScaleType[];
}

export function getModeNumber(scaleType: ScaleType): number {
  const modeNumbers: Record<ScaleType, number> = {
    major: 1,
    dorian: 2,
    phrygian: 3,
    lydian: 4,
    mixolydian: 5,
    locrian: 6,
    natural_minor: 6,
    harmonic_minor: 6,
    melodic_minor: 6,
    whole_tone: 0,
    diminished_hw: 0,
    diminished_wh: 0,
    major_pentatonic: 1,
    minor_pentatonic: 6,
    blues: 6,
  };

  return modeNumbers[scaleType] || 0;
}