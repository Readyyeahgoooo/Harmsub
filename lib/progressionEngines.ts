// ============================================================================
// PROGRESSION ENGINES
// Implements §8 of Rulebook
// ============================================================================

import { ChordFunction, ChordSymbol, HarmonizationControls } from '@/types/rulebook';
import { generateChordsByDistance, filterChordsByFunction } from '@/lib/distanceLadder';
import {
  getTransitionWeight,
  getAllowedTransitions,
  getMostLikelyNextFunction,
} from '@/lib/functionalHarmony';

// ----------------------------------------------------------------------------
// 8.1 Functional Progression Graph
// ----------------------------------------------------------------------------

export interface FunctionalPath {
  functions: ChordFunction[];
  weights: number[];
  total_weight: number;
}

export function generateFunctionalProgression(
  startFunction: ChordFunction,
  length: number,
  controls: HarmonizationControls
): ChordFunction[] {
  const progression: ChordFunction[] = [startFunction];
  
  for (let i = 1; i < length; i++) {
    const currentFunction = progression[i - 1];
    const nextFunction = selectNextFunction(
      currentFunction,
      progression,
      controls
    );
    progression.push(nextFunction);
  }
  
  return progression;
}

function selectNextFunction(
  currentFunction: ChordFunction,
  previousFunctions: ChordFunction[],
  controls: HarmonizationControls
): ChordFunction {
  const allowedTransitions = getAllowedTransitions(currentFunction);
  
  // Weight transitions by functional grammar and style
  const weightedOptions = allowedTransitions.map(func => {
    let weight = getTransitionWeight(currentFunction, func);
    
    // Adjust for functional clarity
    if (controls.functional_clarity > 0.7) {
      // Prefer T → PD → D → T cycle
      if (
        (currentFunction === 'T' && func === 'PD') ||
        (currentFunction === 'PD' && func === 'D') ||
        (currentFunction === 'D' && func === 'T')
      ) {
        weight *= 1.5;
      }
      
      // Penalize too many non-functional chords
      const recentNonFunctional = previousFunctions.slice(-4).filter(
        f => f === 'N'
      ).length;
      if (recentNonFunctional > 2 && func === 'N') {
        weight *= 0.3;
      }
    }
    
    return { function: func, weight };
  });
  
  // Weighted random selection
  const totalWeight = weightedOptions.reduce((sum, opt) => sum + opt.weight, 0);
  let randomWeight = Math.random() * totalWeight;
  
  for (const option of weightedOptions) {
    randomWeight -= option.weight;
    if (randomWeight <= 0) {
      return option.function;
    }
  }
  
  return weightedOptions[0].function;
}

// ----------------------------------------------------------------------------
// 8.2 Circle-of-Fifths (COF) Engine
// ----------------------------------------------------------------------------

export function generateCOFProgression(
  startFunction: ChordFunction,
  root: number,
  length: number,
  controls: HarmonizationControls
): ChordFunction[] {
  const progression: ChordFunction[] = [startFunction];
  
  for (let i = 1; i < length; i++) {
    const currentFunction = progression[i - 1];
    
    // COF prefers descending fifth motion (function-independent)
    // But we'll combine with functional logic
    
    if (controls.style_pack === 'jazz' || controls.style_pack === 'bossa') {
      // Jazz/Bossa: Strong COF preference
      const cofNext = getCOFNextFunction(currentFunction);
      progression.push(cofNext);
    } else {
      // Other styles: Mix COF with functional logic
      const nextFunction = selectNextFunction(
        currentFunction,
        progression,
        controls
      );
      progression.push(nextFunction);
    }
  }
  
  return progression;
}

function getCOFNextFunction(current: ChordFunction): ChordFunction {
  // Simplified COF pattern
  const cofSequence: ChordFunction[] = ['T', 'PD', 'D', 'T'];
  const currentIndex = cofSequence.indexOf(current);
  const nextIndex = (currentIndex + 1) % cofSequence.length;
  return cofSequence[nextIndex];
}

// ----------------------------------------------------------------------------
// 8.3 Cadence Insertion Engine
// ----------------------------------------------------------------------------

export interface CadenceInsertion {
  position: number;
  target_function: ChordFunction;
  insertion_functions: ChordFunction[];
}

export function insertCadences(
  baseProgression: ChordFunction[],
  controls: HarmonizationControls
): ChordFunction[] {
  let enhancedProgression = [...baseProgression];
  const insertions: CadenceInsertion[] = [];
  
  // Identify potential cadence points
  for (let i = 0; i < enhancedProgression.length - 1; i++) {
    const current = enhancedProgression[i];
    const next = enhancedProgression[i + 1];
    
    // Look for D → T opportunities
    if (current === 'D' && next === 'T') {
      // Check if we should add backcycling
      if (shouldInsertBackcycling(i, controls)) {
        const backcycleLength = Math.min(
          3,
          controls.dominant_density === 'heavy' ? 3 : 1
        );
        
        const insertedFunctions = generateBackcycling(
          next,
          backcycleLength
        );
        
        insertions.push({
          position: i + 1,
          target_function: next,
          insertion_functions: insertedFunctions,
        });
      }
    }
  }
  
  // Apply insertions
  insertions.sort((a, b) => b.position - a.position); // Process from end
  insertions.forEach(insertion => {
    enhancedProgression.splice(
      insertion.position,
      0,
      ...insertion.insertion_functions
    );
  });
  
  return enhancedProgression;
}

function shouldInsertBackcycling(
  position: number,
  controls: HarmonizationControls
): boolean {
  // Insert based on dominant density
  const densityLevel = {
    none: 0,
    light: 0.2,
    medium: 0.5,
    heavy: 0.8,
  }[controls.dominant_density];
  
  return Math.random() < densityLevel;
}

function generateBackcycling(
  targetFunction: ChordFunction,
  length: number
): ChordFunction[] {
  // Standard backcycle: iii → vi → ii → V → target
  const backcycle: ChordFunction[] = [];
  
  for (let i = length; i > 0; i--) {
    // Simplified backcycle
    if (i === 4) backcycle.push('T');
    else if (i === 3) backcycle.push('PD');
    else if (i === 2) backcycle.push('PD');
    else if (i === 1) backcycle.push('D');
  }
  
  return backcycle.slice(0, length);
}

// ----------------------------------------------------------------------------
// 8.4 Deceptive and Evaded Cadences
// ----------------------------------------------------------------------------

export function applyDeceptiveCadences(
  progression: ChordFunction[],
  controls: HarmonizationControls
): ChordFunction[] {
  const modifiedProgression = [...progression];
  
  for (let i = 0; i < modifiedProgression.length - 1; i++) {
    const current = modifiedProgression[i];
    const next = modifiedProgression[i + 1];
    
    // Find V → T opportunities
    if (current === 'D' && next === 'T') {
      // Check for deceptive cadence
      if (shouldUseDeceptiveCadence(controls)) {
        modifiedProgression[i + 1] = 'PD'; // V → PD (deceptive)
      }
    }
  }
  
  return modifiedProgression;
}

function shouldUseDeceptiveCadence(controls: HarmonizationControls): boolean {
  // Deceptive cadences more common in:
  // - Radiohead-ish style
  // - Low functional clarity
  // - High adventurous settings
  
  let probability = 0.1;
  
  if (controls.style_pack === 'radiohead') probability = 0.3;
  if (controls.functional_clarity < 0.5) probability = 0.2;
  if (controls.adventurous > 0.7) probability = 0.25;
  
  return Math.random() < probability;
}

// ----------------------------------------------------------------------------
// Generate complete functional progression
// ----------------------------------------------------------------------------

export function generateCompleteProgression(
  startFunction: ChordFunction = 'T',
  length: number,
  controls: HarmonizationControls,
  engine: 'functional' | 'cof' | 'mixed' = 'mixed'
): ChordFunction[] {
  let progression: ChordFunction[] = [];
  
  // Step 1: Generate base progression
  switch (engine) {
    case 'functional':
      progression = generateFunctionalProgression(startFunction, length, controls);
      break;
    case 'cof':
      progression = generateCOFProgression(startFunction, 0, length, controls);
      break;
    case 'mixed':
      // Mix functional and COF based on style
      if (controls.style_pack === 'jazz' || controls.style_pack === 'bossa') {
        progression = generateCOFProgression(startFunction, 0, length, controls);
      } else {
        progression = generateFunctionalProgression(startFunction, length, controls);
      }
      break;
  }
  
  // Step 2: Insert cadences
  if (controls.dominant_density !== 'none') {
    progression = insertCadences(progression, controls);
  }
  
  // Step 3: Apply deceptive cadences
  if (controls.adventurous > 0.3) {
    progression = applyDeceptiveCadences(progression, controls);
  }
  
  return progression;
}

// ----------------------------------------------------------------------------
// Get functional path statistics
// ----------------------------------------------------------------------------

export interface PathStatistics {
  function_counts: Record<ChordFunction, number>;
  transition_counts: Record<string, number>;
  cadence_count: number;
  deceptive_count: number;
  functional_clarity_score: number;
}

export function analyzePathStatistics(
  progression: ChordFunction[]
): PathStatistics {
  const functionCounts: Record<ChordFunction, number> = {
    T: 0,
    PD: 0,
    D: 0,
    CT: 0,
    SEQ: 0,
    N: 0,
  };
  
  const transitionCounts: Record<string, number> = {};
  let cadenceCount = 0;
  let deceptiveCount = 0;
  
  // Count functions
  progression.forEach(func => {
    functionCounts[func]++;
  });
  
  // Count transitions
  for (let i = 0; i < progression.length - 1; i++) {
    const transition = `${progression[i]}→${progression[i + 1]}`;
    transitionCounts[transition] = (transitionCounts[transition] || 0) + 1;
    
    // Count cadences
    if (progression[i] === 'D' && progression[i + 1] === 'T') {
      cadenceCount++;
    }
    
    // Count deceptive
    if (progression[i] === 'D' && progression[i + 1] === 'PD') {
      deceptiveCount++;
    }
  }
  
  // Calculate functional clarity score
  const totalChords = progression.length;
  const functionalChords = totalChords - functionCounts.N - functionCounts.CT;
  const functionalClarity = functionalChords / totalChords;
  
  return {
    function_counts: functionCounts,
    transition_counts: transitionCounts,
    cadence_count: cadenceCount,
    deceptive_count: deceptiveCount,
    functional_clarity_score: functionalClarity,
  };
}