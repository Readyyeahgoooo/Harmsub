// ============================================================================
// 6-LEVEL DISTANCE LADDER SYSTEM
// Implements §5-6 of Rulebook
// ============================================================================

import { ChordSymbol, ChordQuality, ChordTag, ChordFunction } from '@/types/rulebook';

// ----------------------------------------------------------------------------
// Helper: Create basic chord symbol
// ----------------------------------------------------------------------------
function createChordSymbol(
  root: number,
  quality: ChordQuality,
  roman: string,
  func: ChordFunction,
  distance: number,
  tags: ChordTag[] = []
): ChordSymbol {
  return {
    root_pc: root,
    quality,
    extensions: [],
    alterations: [],
    omit: [],
    roman,
    function: func,
    distance_level: distance,
    tags,
  };
}

// ----------------------------------------------------------------------------
// LEVEL 0: Diatonic triads / basic 7ths
// ----------------------------------------------------------------------------
export function generateLevel0Chords(root: number): ChordSymbol[] {
  const chords: ChordSymbol[] = [];
  
  // Major key diatonic chords (in C major)
  // T: I, vi, iii
  chords.push(createChordSymbol(root, 'maj7', 'I', 'T', 0, ['diatonic']));
  chords.push(createChordSymbol((root + 9) % 12, 'min7', 'vi', 'T', 0, ['diatonic']));
  chords.push(createChordSymbol((root + 4) % 12, 'min7', 'iii', 'T', 0, ['diatonic']));
  
  // PD: ii, IV
  chords.push(createChordSymbol((root + 2) % 12, 'min7', 'ii', 'PD', 0, ['diatonic']));
  chords.push(createChordSymbol((root + 5) % 12, 'maj7', 'IV', 'PD', 0, ['diatonic']));
  
  // D: V, vii°
  chords.push(createChordSymbol((root + 7) % 12, 'dom7', 'V', 'D', 0, ['diatonic']));
  chords.push(createChordSymbol((root + 11) % 12, 'hdim7', 'vii°7', 'D', 0, ['diatonic']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 1: Diatonic extensions, inversions, slash chords, suspensions
// ----------------------------------------------------------------------------
export function generateLevel1Chords(root: number): ChordSymbol[] {
  const chords = generateLevel0Chords(root);
  
  // Extensions
  chords.push(createChordSymbol(root, 'maj9', 'Imaj9', 'T', 1, ['diatonic', 'color_tone']));
  chords.push(createChordSymbol(root, 'maj7', 'I6', 'T', 1, ['diatonic', 'color_tone']));
  chords.push(createChordSymbol((root + 2) % 12, 'min9', 'ii9', 'PD', 1, ['diatonic', 'color_tone']));
  chords.push(createChordSymbol((root + 5) % 12, 'maj9', 'IVmaj9', 'PD', 1, ['diatonic', 'color_tone']));
  chords.push(createChordSymbol((root + 7) % 12, 'dom9', 'V9', 'D', 1, ['diatonic', 'color_tone']));
  chords.push(createChordSymbol((root + 7) % 12, 'dom13', 'V13', 'D', 1, ['diatonic', 'color_tone']));
  
  // Suspensions
  chords.push(createChordSymbol(root, 'dom7', 'Isus4', 'T', 1, ['diatonic', 'sus']));
  chords.push(createChordSymbol((root + 7) % 12, 'dom7', 'Vsus4', 'D', 1, ['diatonic', 'sus']));
  
  // Inversions (represented as slash chords)
  chords.push(createChordSymbol(root, 'maj7', 'I/3', 'T', 1, ['diatonic', 'inversion']));
  chords.push(createChordSymbol((root + 7) % 12, 'dom7', 'V/7', 'D', 1, ['diatonic', 'inversion']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 2: Secondary dominants, applied ii-V, diatonic diminished passing
// ----------------------------------------------------------------------------
export function generateLevel2Chords(root: number): ChordSymbol[] {
  const chords = generateLevel1Chords(root);
  
  // Secondary dominants (V of each diatonic chord)
  // V/ii = A7 (in C major)
  chords.push(createChordSymbol((root + 9) % 12, 'dom7', 'A7 = V/ii', 'D', 2, ['secondary_dominant']));
  chords.push(createChordSymbol((root + 11) % 12, 'dom7', 'B7 = V/iii', 'D', 2, ['secondary_dominant']));
  chords.push(createChordSymbol((root + 0) % 12, 'dom7', 'C7 = V/IV', 'D', 2, ['secondary_dominant']));
  chords.push(createChordSymbol((root + 2) % 12, 'dom7', 'D7 = V/V', 'D', 2, ['secondary_dominant']));
  
  // Applied ii-V pairs
  // ii/V of ii: Em7 A7 → Dm7
  chords.push(createChordSymbol((root + 4) % 12, 'min7', 'Em7 (ii/ii)', 'PD', 2, ['applied_iiV']));
  
  // Passing diminished
  // #i°7 → ii (C#: C#°7 → Dm7)
  chords.push(createChordSymbol((root + 1) % 12, 'dim7', '#i°7', 'SEQ', 2, ['passing_dim']));
  // #iv°7 → V (C: F#°7 → G7)
  chords.push(createChordSymbol((root + 6) % 12, 'dim7', '#iv°7', 'SEQ', 2, ['passing_dim']));
  
  // Common-tone diminished around tonic
  chords.push(createChordSymbol((root + 0) % 12, 'dim7', 'I°7 (CT)', 'CT', 2, ['passing_dim']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 3: Modal mixture (borrowed chords), Neapolitan-ish color
// ----------------------------------------------------------------------------
export function generateLevel3Chords(root: number): ChordSymbol[] {
  const chords = generateLevel2Chords(root);
  
  // Borrowed from parallel minor (C major borrowing from C minor)
  // iv (Fm)
  chords.push(createChordSymbol((root + 5) % 12, 'min7', 'iv7', 'PD', 3, ['borrowed', 'modal_mixture']));
  
  // bVI (Ab)
  chords.push(createChordSymbol((root + 8) % 12, 'maj7', 'bVIImaj7', 'PD', 3, ['borrowed', 'modal_mixture']));
  
  // bVII (Bb)
  chords.push(createChordSymbol((root + 10) % 12, 'dom7', 'bVII7', 'D', 3, ['borrowed', 'modal_mixture']));
  
  // Neapolitan-ish (bII)
  chords.push(createChordSymbol((root + 1) % 12, 'maj7', 'bIImaj7', 'PD', 3, ['borrowed', 'modal_mixture']));
  
  // bIII (Eb)
  chords.push(createChordSymbol((root + 3) % 12, 'maj7', 'bIIImaj7', 'T', 3, ['borrowed', 'modal_mixture']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 4: Tritone subs, backdoor dominants, melodic-minor dominant colors
// ----------------------------------------------------------------------------
export function generateLevel4Chords(root: number): ChordSymbol[] {
  const chords = generateLevel3Chords(root);
  
  // Tritone substitution: bII7 as substitute for V7
  // In C: Db7 substitutes for G7
  chords.push(createChordSymbol((root + 6) % 12, 'dom7', 'bII7 (tritone sub)', 'D', 4, ['tritone_sub']));
  
  // Backdoor: Fm7 → Bb7 → Cmaj7
  chords.push(createChordSymbol((root + 10) % 12, 'dom7', 'bVII7 (backdoor)', 'D', 4, ['backdoor']));
  
  // Dominant palettes
  // V7alt (altered scale)
  chords.push(createChordSymbol((root + 7) % 12, 'dom7alt', 'V7alt', 'D', 4, ['alt_dom']));
  
  // V7#11 (Lydian dominant)
  chords.push(createChordSymbol((root + 7) % 12, 'dom7#11', 'V7#11 (Lydian)', 'D', 4, ['melodic_minor_dominant']));
  
  // V7sus (modal dominant)
  chords.push(createChordSymbol((root + 7) % 12, 'dom11', 'V7sus', 'D', 4, ['melodic_minor_dominant']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 5: Chromatic mediants, planing, symmetrical diminished
// ----------------------------------------------------------------------------
export function generateLevel5Chords(root: number): ChordSymbol[] {
  const chords = generateLevel4Chords(root);
  
  // Chromatic mediants (bVImaj7, bIIImaj7, VImaj7)
  // Cmaj7 → Abmaj7
  chords.push(createChordSymbol((root + 8) % 12, 'maj7', 'bVImaj7', 'N', 5, ['chromatic_mediant']));
  
  // Cmaj7 → Ebmaj7
  chords.push(createChordSymbol((root + 3) % 12, 'maj7', 'bIIImaj7', 'N', 5, ['chromatic_mediant']));
  
  // Cmaj7 → Amaj7
  chords.push(createChordSymbol((root + 9) % 12, 'maj7', 'VImaj7', 'N', 5, ['chromatic_mediant']));
  
  // Planing markers (context-dependent, represented here as non-functional)
  chords.push(createChordSymbol(root, 'maj7', 'planing_up', 'N', 5, ['planing']));
  chords.push(createChordSymbol(root, 'maj7', 'planing_down', 'N', 5, ['planing']));
  
  // Diminished symmetry
  chords.push(createChordSymbol(root, 'dim7', 'dim7_sym', 'SEQ', 5, ['symmetry']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// LEVEL 6: Non-functional/pedal/poly-chords
// ----------------------------------------------------------------------------
export function generateLevel6Chords(root: number): ChordSymbol[] {
  const chords = generateLevel5Chords(root);
  
  // Pedal bass with shifting upper structures
  // C pedal + various triads
  chords.push(createChordSymbol(root, 'maj7', 'I(pedal)', 'CT', 6, ['pedal']));
  
  // Polychords (slash chords with unrelated bass)
  chords.push(createChordSymbol((root + 2) % 12, 'maj7', 'D/C (polychord)', 'N', 6, ['polychord']));
  chords.push(createChordSymbol((root + 3) % 12, 'min7', 'Ebm/C (polychord)', 'N', 6, ['polychord']));
  
  // Cinematic stacks (fifths, add2/add9 pads)
  chords.push(createChordSymbol(root, 'dom7', 'add9 pad', 'N', 6, ['nonfunctional']));
  
  return chords;
}

// ----------------------------------------------------------------------------
// Main function: Generate chords up to specified distance level
// ----------------------------------------------------------------------------
export function generateChordsByDistance(root: number, maxDistance: number): ChordSymbol[] {
  switch (maxDistance) {
    case 0:
      return generateLevel0Chords(root);
    case 1:
      return generateLevel1Chords(root);
    case 2:
      return generateLevel2Chords(root);
    case 3:
      return generateLevel3Chords(root);
    case 4:
      return generateLevel4Chords(root);
    case 5:
      return generateLevel5Chords(root);
    case 6:
      return generateLevel6Chords(root);
    default:
      return generateLevel1Chords(root);
  }
}

// ----------------------------------------------------------------------------
// Get chord function for analysis
// ----------------------------------------------------------------------------
export function getChordFunction(chord: ChordSymbol): ChordFunction {
  return chord.function;
}

// ----------------------------------------------------------------------------
// Filter chords by function
// ----------------------------------------------------------------------------
export function filterChordsByFunction(
  chords: ChordSymbol[],
  func: ChordFunction
): ChordSymbol[] {
  return chords.filter(chord => chord.function === func);
}

// ----------------------------------------------------------------------------
// Get substitution ladders by function
// ----------------------------------------------------------------------------
export function getSubstitutionLadder(
  root: number,
  func: ChordFunction,
  maxDistance: number
): ChordSymbol[] {
  const allChords = generateChordsByDistance(root, maxDistance);
  const filtered = filterChordsByFunction(allChords, func);
  
  // Sort by distance level (closest to furthest)
  return filtered.sort((a, b) => a.distance_level - b.distance_level);
}