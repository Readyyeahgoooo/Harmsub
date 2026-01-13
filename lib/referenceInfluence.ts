// Reference Track Influence Engine
// Applies harmonic devices from reference tracks to generated progressions

import {
  ChordCandidate,
  ReferenceInfluence,
  ReferenceChordInfo,
  ChordQuality,
  HarmonicFunction,
  NOTE_NAMES,
} from '@/types/harmonyTypes';

/**
 * Parse chord name to extract root pitch class and quality
 */
export function parseChordName(chordName: string): { rootPc: number; quality: ChordQuality } {
  // Extract root note (e.g., "C", "F#", "Bb")
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) {
    return { rootPc: 0, quality: 'maj' };
  }

  const rootStr = rootMatch[1];
  let rootPc = NOTE_NAMES.indexOf(rootStr.replace('b', '').replace('#', '') as typeof NOTE_NAMES[number]);
  
  if (rootStr.includes('#')) rootPc = (rootPc + 1) % 12;
  if (rootStr.includes('b')) rootPc = (rootPc + 11) % 12;

  // Determine quality from the rest of the chord name
  const qualityPart = chordName.slice(rootMatch[0].length).toLowerCase();
  let quality: ChordQuality = 'maj';

  if (qualityPart.includes('dim7') || qualityPart.includes('°7')) {
    quality = 'dim7';
  } else if (qualityPart.includes('dim') || qualityPart.includes('°')) {
    quality = 'dim';
  } else if (qualityPart.includes('m7b5') || qualityPart.includes('ø')) {
    quality = 'hdim7';
  } else if (qualityPart.includes('aug7') || qualityPart.includes('+7')) {
    quality = 'aug7';
  } else if (qualityPart.includes('aug') || qualityPart.includes('+')) {
    quality = 'aug';
  } else if (qualityPart.includes('mmaj7') || qualityPart.includes('m(maj7)')) {
    quality = 'minMaj7';
  } else if (qualityPart.includes('maj7') || qualityPart.includes('△7')) {
    quality = 'maj7';
  } else if (qualityPart.includes('maj6') || qualityPart === '6') {
    quality = 'maj6';
  } else if (qualityPart.includes('m6') || qualityPart.includes('min6')) {
    quality = 'min6';
  } else if (qualityPart.includes('m7') || qualityPart.includes('min7') || qualityPart.includes('-7')) {
    quality = 'min7';
  } else if (qualityPart.includes('7')) {
    quality = 'dom7';
  } else if (qualityPart.includes('sus2')) {
    quality = 'sus2';
  } else if (qualityPart.includes('sus4') || qualityPart.includes('sus')) {
    quality = 'sus4';
  } else if (qualityPart.includes('m') || qualityPart.includes('min') || qualityPart.includes('-')) {
    quality = 'min';
  }

  return { rootPc, quality };
}

/**
 * Convert reference chords to ReferenceChordInfo with parsed data
 */
export function parseReferenceChords(
  chords: Array<{ name: string; roman: string; function: 'T' | 'PD' | 'D' | 'AMB' }>
): ReferenceChordInfo[] {
  return chords.map(chord => {
    const { rootPc, quality } = parseChordName(chord.name);
    return {
      name: chord.name,
      roman: chord.roman,
      function: chord.function,
      rootPc,
      quality,
    };
  });
}

/**
 * Transpose a pitch class from source key to target key
 */
export function transposePitchClass(pc: number, sourceKey: number, targetKey: number): number {
  const interval = (targetKey - sourceKey + 12) % 12;
  return (pc + interval) % 12;
}

/**
 * Calculate similarity between two chords
 * Returns 0-1 score (1 = identical, 0 = completely different)
 */
export function chordSimilarity(
  candidateRoot: number,
  candidateQuality: ChordQuality,
  referenceRoot: number,
  referenceQuality: ChordQuality,
  sourceKey: number,
  targetKey: number
): number {
  // Transpose reference root to target key
  const transposedRefRoot = transposePitchClass(referenceRoot, sourceKey, targetKey);
  
  // Root similarity (same root = 1, fifth away = 0.5, etc.)
  const rootDiff = Math.abs((candidateRoot - transposedRefRoot + 6) % 12 - 6);
  const rootSimilarity = 1 - (rootDiff / 6);

  // Quality similarity
  const qualitySimilarity = getQualitySimilarity(candidateQuality, referenceQuality);

  // Combined score (root is more important)
  return rootSimilarity * 0.6 + qualitySimilarity * 0.4;
}

/**
 * Get similarity between chord qualities
 */
function getQualitySimilarity(q1: ChordQuality, q2: ChordQuality): number {
  if (q1 === q2) return 1.0;

  // Group similar qualities
  const majorFamily: ChordQuality[] = ['maj', 'maj7', 'maj6', 'dom', 'dom7'];
  const minorFamily: ChordQuality[] = ['min', 'min7', 'min6', 'minMaj7'];
  const diminishedFamily: ChordQuality[] = ['dim', 'dim7', 'hdim', 'hdim7'];
  const suspendedFamily: ChordQuality[] = ['sus2', 'sus4'];
  const augmentedFamily: ChordQuality[] = ['aug', 'aug7'];

  const families = [majorFamily, minorFamily, diminishedFamily, suspendedFamily, augmentedFamily];

  for (const family of families) {
    if (family.includes(q1) && family.includes(q2)) {
      return 0.8; // Same family
    }
  }

  // Cross-family similarities
  if ((majorFamily.includes(q1) && minorFamily.includes(q2)) ||
      (minorFamily.includes(q1) && majorFamily.includes(q2))) {
    return 0.4; // Major/minor relation
  }

  return 0.2; // Different families
}

/**
 * Calculate function similarity
 */
function functionSimilarity(f1: HarmonicFunction | 'AMB', f2: 'T' | 'PD' | 'D' | 'AMB'): number {
  if (f1 === f2) return 1.0;
  if (f1 === 'AMB' || f2 === 'AMB') return 0.5;
  
  // PD and D are somewhat related (both create tension)
  if ((f1 === 'PD' && f2 === 'D') || (f1 === 'D' && f2 === 'PD')) return 0.6;
  
  return 0.3;
}

/**
 * Apply reference influence to score a chord candidate
 * Returns a bonus score (0-1) based on similarity to reference chords
 */
export function scoreReferenceInfluence(
  candidate: ChordCandidate,
  reference: ReferenceInfluence,
  targetKey: number,
  slotIndex: number,
  totalSlots: number
): number {
  if (!reference.chords || reference.chords.length === 0) {
    return 0;
  }

  const { chords, sourceKey, applyMode, weight } = reference;

  // Map slot position to reference chord position
  const refIndex = Math.floor((slotIndex / totalSlots) * chords.length) % chords.length;
  const primaryRef = chords[refIndex];
  
  // Also consider adjacent reference chords for smoother transitions
  const prevRefIndex = (refIndex - 1 + chords.length) % chords.length;
  const nextRefIndex = (refIndex + 1) % chords.length;

  let score = 0;

  switch (applyMode) {
    case 'substitute':
      // Strong preference for exact transposed matches
      score = chordSimilarity(
        candidate.chord.root,
        candidate.chord.quality,
        primaryRef.rootPc,
        primaryRef.quality,
        sourceKey,
        targetKey
      );
      // Also check function match
      score *= functionSimilarity(candidate.chord.functionTags[0], primaryRef.function);
      break;

    case 'modulate':
      // Prefer chords that follow the same functional pattern
      const funcScore = functionSimilarity(candidate.chord.functionTags[0], primaryRef.function);
      const chordScore = chordSimilarity(
        candidate.chord.root,
        candidate.chord.quality,
        primaryRef.rootPc,
        primaryRef.quality,
        sourceKey,
        targetKey
      );
      score = funcScore * 0.6 + chordScore * 0.4;
      break;

    case 'inspire':
    default:
      // Looser matching - prefer similar functions and general harmonic color
      // Check against all reference chords, not just the mapped one
      let maxSimilarity = 0;
      for (const refChord of chords) {
        const similarity = chordSimilarity(
          candidate.chord.root,
          candidate.chord.quality,
          refChord.rootPc,
          refChord.quality,
          sourceKey,
          targetKey
        ) * 0.5 + functionSimilarity(candidate.chord.functionTags[0], refChord.function) * 0.5;
        
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      score = maxSimilarity;
      break;
  }

  return score * weight;
}

/**
 * Detect key from reference chords (simplified)
 */
export function detectKeyFromChords(chords: ReferenceChordInfo[]): number {
  // Find the most likely tonic chord
  const tonicChords = chords.filter(c => c.function === 'T');
  
  if (tonicChords.length > 0) {
    // Return the root of the first tonic chord
    return tonicChords[0].rootPc;
  }

  // Fallback: return root of first chord
  return chords[0]?.rootPc ?? 0;
}

/**
 * Extract harmonic devices from reference progression
 * (e.g., secondary dominants, borrowed chords, etc.)
 */
export function extractHarmonicDevices(
  chords: ReferenceChordInfo[],
  key: number
): string[] {
  const devices: string[] = [];

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    const nextChord = chords[(i + 1) % chords.length];

    // Check for secondary dominant (V/x pattern)
    if (chord.quality === 'dom7' || chord.quality === 'dom') {
      const expectedResolution = (chord.rootPc + 5) % 12; // Down a fifth
      if (nextChord && nextChord.rootPc === expectedResolution && nextChord.rootPc !== key) {
        devices.push(`secondary_dominant_to_${NOTE_NAMES[nextChord.rootPc]}`);
      }
    }

    // Check for tritone substitution
    if (chord.quality === 'dom7' || chord.quality === 'dom') {
      const tritoneRoot = (chord.rootPc + 6) % 12;
      if (nextChord && nextChord.rootPc === (tritoneRoot + 5) % 12) {
        devices.push('tritone_substitution');
      }
    }

    // Check for modal interchange / borrowed chords
    const diatonicRoots = [0, 2, 4, 5, 7, 9, 11].map(d => (d + key) % 12);
    if (!diatonicRoots.includes(chord.rootPc)) {
      devices.push(`borrowed_chord_${chord.name}`);
    }
  }

  return [...new Set(devices)]; // Remove duplicates
}
