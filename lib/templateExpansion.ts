// ============================================================================
// TEMPLATE EXPANSION SYSTEM
// Implements §9 and §14 of Rulebook
// ============================================================================

import { Template, ChordFunction, ChordSymbol } from '@/types/rulebook';
import {
  generateChordsByDistance,
  getSubstitutionLadder,
  filterChordsByFunction,
} from '@/lib/distanceLadder';

// ----------------------------------------------------------------------------
// 9.1 4-Chord Templates
// ----------------------------------------------------------------------------

export const FOUR_CHORD_TEMPLATES: Template[] = [
  {
    name: 'T-PD-D-T',
    type: '4_chord',
    functions: ['T', 'PD', 'D', 'T'],
    description: 'Functional basics: T-PD-D-T',
  },
  {
    name: 'T-Tsub-PD-D',
    type: '4_chord',
    functions: ['T', 'T', 'PD', 'D'],
    description: 'T-Tsub-PD-D',
  },
  {
    name: 'T-PD-T-D',
    type: '4_chord',
    functions: ['T', 'PD', 'T', 'D'],
    description: 'T-PD-T-D (plagal-ish, then tension)',
  },
  {
    name: 'T-D-T-D',
    type: '4_chord',
    functions: ['T', 'D', 'T', 'D'],
    description: 'T-D-T-D (anthemic / pop tension)',
  },
  {
    name: 'I-vi-ii-V',
    type: '4_chord',
    functions: ['T', 'T', 'PD', 'D'],
    description: 'COF/jazz-pop: I-vi-ii-V',
    style_bias: ['jazz', 'pop'],
  },
  {
    name: 'I-iii-vi-ii',
    type: '4_chord',
    functions: ['T', 'T', 'T', 'PD'],
    description: 'I-iii-vi-ii (then add V to cadence if 5th chord allowed)',
    style_bias: ['jazz', 'bossa'],
  },
  {
    name: 'I-iv-bVII-I',
    type: '4_chord',
    functions: ['T', 'PD', 'D', 'T'],
    description: 'Borrowed/modal: I-iv-bVII-I',
    style_bias: ['radiohead', 'pop'],
  },
  {
    name: 'I-bVII-IV-I',
    type: '4_chord',
    functions: ['T', 'D', 'PD', 'T'],
    description: 'I-bVII-IV-I',
    style_bias: ['radiohead', 'pop'],
  },
  {
    name: 'I-bVI-IV-V',
    type: '4_chord',
    functions: ['T', 'PD', 'PD', 'D'],
    description: 'I-bVI-IV-V (cinematic lift)',
    style_bias: ['classical', 'radiohead'],
  },
];

// ----------------------------------------------------------------------------
// 9.2 8-Chord Templates
// ----------------------------------------------------------------------------

export const EIGHT_CHORD_TEMPLATES: Template[] = [
  {
    name: 'jazz_turnaround',
    type: '8_chord',
    functions: ['T', 'T', 'PD', 'D', 'T', 'D', 'PD', 'D'],
    description: 'Jazz turnarounds: I-vi-ii-V-I-VI7-ii-V',
    style_bias: ['jazz', 'bossa'],
  },
  {
    name: 'extended_cof',
    type: '8_chord',
    functions: ['T', 'T', 'T', 'PD', 'D', 'T', 'D', 'D'],
    description: 'I-iii-vi-II7-ii-V-I-V/V',
    style_bias: ['jazz'],
  },
  {
    name: 'mixture_cadence',
    type: '8_chord',
    functions: ['T', 'D', 'PD', 'PD', 'PD', 'D', 'T', 'D'],
    description: 'I-bVII-IV-iv-ii-V-I-V (last V as turnaround)',
    style_bias: ['radiohead', 'classical'],
  },
  {
    name: 'backdoor_color',
    type: '8_chord',
    functions: ['T', 'T', 'PD', 'D', 'T', 'PD', 'D', 'T'],
    description: 'I-vi-ii-bII7-I-iv7-bVII7-I',
    style_bias: ['jazz', 'bossa'],
  },
  {
    name: 'cinematic_pedal',
    type: '8_chord',
    functions: ['T', 'PD', 'PD', 'T', 'PD', 'PD', 'PD', 'T'],
    description: 'I(pedal)-bVI-IV-I-bIII-bVII-IV-I',
    style_bias: ['classical'],
  },
];

// ----------------------------------------------------------------------------
// 9.3 16-Bar "Form Skeletons"
// ----------------------------------------------------------------------------

export const SIXTEEN_BAR_TEMPLATES: Template[] = [
  {
    name: 'jazz_standard',
    type: '16_bar',
    functions: [
      'T', 'T', 'PD', 'D', // 1-4: I establishment + light T-sub
      'PD', 'PD', 'D', 'D', // 5-8: move to ii-V (maybe tonicize IV or ii)
      'T', 'PD', 'PD', 'D', // 9-12: intensify with backcycling / secondary dominants
      'D', 'PD', 'D', 'T', // 13-16: strong cadence + turnaround
    ],
    description: 'Jazz standard-ish (functional clarity high)',
    style_bias: ['jazz'],
  },
  {
    name: 'pop_rnb_form',
    type: '16_bar',
    functions: [
      'T', 'T', 'PD', 'T', // 1-8: repeatable loop (axis or variation)
      'PD', 'D', 'D', 'T', // 9-12: lift via borrowed bVI/bVII or prechorus dominant setup
      'T', 'T', 'PD', 'T', // 13-16: return to loop; one clear cadence at end
    ],
    description: 'Pop/R&B (functional clarity medium)',
    style_bias: ['pop'],
  },
  {
    name: 'cinematic_form',
    type: '16_bar',
    functions: [
      'T', 'T', 'T', 'PD', // 1-4: tonic pedal + shifting color chords
      'PD', 'PD', 'PD', 'T', // 5-8: mediant/mixture blocks
      'D', 'D', 'PD', 'PD', // 9-12: dominant wave (optional)
      'T', 'D', 'PD', 'T', // 13-16: climax chord + resolution or open ending
    ],
    description: 'Cinematic (functional clarity low, pedal high)',
    style_bias: ['classical'],
  },
];

// ----------------------------------------------------------------------------
// 14.1 Slot Expansion (Example)
// ----------------------------------------------------------------------------

export interface ExpandedSlot {
  slot: number;
  function: ChordFunction;
  chords: ChordSymbol[];
  selected_chord: ChordSymbol | null;
}

export function expandTemplateSlot(
  slotFunction: ChordFunction,
  slotIndex: number,
  keyRoot: number,
  maxDistance: number,
  dominantDensity: string,
  styleBias: string[] = []
): ChordSymbol[] {
  // Get substitution ladder for this function
  const substitutionLadder = getSubstitutionLadder(keyRoot, slotFunction, maxDistance);
  
  // Filter by max distance
  const availableChords = substitutionLadder.filter(
    c => c.distance_level <= maxDistance
  );
  
  // Style bias filtering
  let styleFilteredChords = availableChords;
  
  if (styleBias.includes('jazz') || styleBias.includes('bossa')) {
    // Prefer 7th chords and extensions
    styleFilteredChords = availableChords.filter(c =>
      c.quality.includes('7') || c.quality.includes('9') || c.quality.includes('13')
    );
  } else if (styleBias.includes('pop')) {
    // Prefer simpler chords, slash chords, sus/add9
    styleFilteredChords = availableChords.filter(c =>
      c.quality.includes('sus') ||
      c.quality.includes('add') ||
      !c.quality.includes('alt')
    );
  } else if (styleBias.includes('radiohead')) {
    // Prefer mixture, chromatic mediants
    styleFilteredChords = availableChords.filter(c =>
      c.tags.includes('borrowed') ||
      c.tags.includes('chromatic_mediant') ||
      c.tags.includes('planing')
    );
  } else if (styleBias.includes('classical')) {
    // Prefer non-functional, pedal, add2/add9
    styleFilteredChords = availableChords.filter(c =>
      c.tags.includes('nonfunctional') ||
      c.tags.includes('pedal') ||
      c.quality.includes('add')
    );
  }
  
  // If no style-filtered chords, use available chords
  if (styleFilteredChords.length === 0) {
    styleFilteredChords = availableChords;
  }
  
  return styleFilteredChords;
}

// ----------------------------------------------------------------------------
// 14.2 Common Expansions
// ----------------------------------------------------------------------------

export function applyCommonExpansions(
  chords: ChordSymbol[],
  dominantDensity: string,
  maxDistance: number
): ChordSymbol[] {
  const expanded: ChordSymbol[] = [...chords];
  
  chords.forEach((chord, index) => {
    // Replace D with V7alt or bII7 (if allowed)
    if (chord.function === 'D') {
      if (dominantDensity === 'medium' || dominantDensity === 'heavy') {
        if (maxDistance >= 4) {
          // Try tritone sub
          const tritoneSub = expanded.find(c =>
            c.tags.includes('tritone_sub') &&
            c.distance_level <= maxDistance
          );
          if (tritoneSub) {
            expanded[index] = tritoneSub;
          }
        }
      }
    }
    
    // Replace PD with ii-V split across two slots
    if (chord.function === 'PD' && dominantDensity === 'heavy') {
      // This would expand the progression length
      // Simplified: just tag for later processing
    }
    
    // Replace T with vi or iii for motion
    if (chord.function === 'T') {
      const tonicSub = expanded.find(c =>
        c.function === 'T' &&
        c.distance_level >= 1 &&
        c.distance_level <= maxDistance
      );
      if (tonicSub) {
        expanded[index] = tonicSub;
      }
    }
  });
  
  return expanded;
}

// ----------------------------------------------------------------------------
// Get template by type
// ----------------------------------------------------------------------------

export function getTemplate(
  type: '4_chord' | '8_chord' | '16_bar',
  index?: number
): Template | Template[] {
  switch (type) {
    case '4_chord':
      return index !== undefined ? FOUR_CHORD_TEMPLATES[index] : FOUR_CHORD_TEMPLATES;
    case '8_chord':
      return index !== undefined ? EIGHT_CHORD_TEMPLATES[index] : EIGHT_CHORD_TEMPLATES;
    case '16_bar':
      return index !== undefined ? SIXTEEN_BAR_TEMPLATES[index] : SIXTEEN_BAR_TEMPLATES;
    default:
      return FOUR_CHORD_TEMPLATES;
  }
}

// ----------------------------------------------------------------------------
// Get all template names
// ----------------------------------------------------------------------------

export function getTemplateNames(type?: '4_chord' | '8_chord' | '16_bar'): string[] {
  let templates: Template[] = [];
  
  if (type === '4_chord') {
    templates = FOUR_CHORD_TEMPLATES;
  } else if (type === '8_chord') {
    templates = EIGHT_CHORD_TEMPLATES;
  } else if (type === '16_bar') {
    templates = SIXTEEN_BAR_TEMPLATES;
  } else {
    templates = [...FOUR_CHORD_TEMPLATES, ...EIGHT_CHORD_TEMPLATES, ...SIXTEEN_BAR_TEMPLATES];
  }
  
  return templates.map(t => t.name);
}

// ----------------------------------------------------------------------------
// Expand complete template
// ----------------------------------------------------------------------------

export function expandTemplate(
  template: Template,
  keyRoot: number,
  maxDistance: number,
  dominantDensity: string,
  styleBias: string[] = []
): ChordSymbol[] {
  const expandedSlots: ChordSymbol[] = [];
  
  template.functions.forEach((func, index) => {
    const slotChords = expandTemplateSlot(
      func,
      index,
      keyRoot,
      maxDistance,
      dominantDensity,
      styleBias
    );
    
    // Select best chord for this slot (simplified - take first)
    expandedSlots.push(slotChords[0] || {
      root_pc: keyRoot,
      quality: 'maj7',
      extensions: [],
      alterations: [],
      omit: [],
      roman: 'I',
      function: func,
      distance_level: 0,
      tags: ['diatonic'],
    });
  });
  
  // Apply common expansions
  return applyCommonExpansions(expandedSlots, dominantDensity, maxDistance);
}

// ----------------------------------------------------------------------------
// Get random template for style
// ----------------------------------------------------------------------------

export function getTemplateForStyle(style: string): Template | Template[] {
  const styleToTemplates: Record<string, Template[]> = {
    jazz: [...FOUR_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('jazz')),
           ...EIGHT_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('jazz'))],
    bossa: FOUR_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('bossa')),
    pop: FOUR_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('pop')),
    radiohead: FOUR_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('radiohead')),
    classical: [...FOUR_CHORD_TEMPLATES.filter(t => t.style_bias?.includes('classical')),
              ...SIXTEEN_BAR_TEMPLATES.filter(t => t.style_bias?.includes('classical'))],
  };
  
  const templates = styleToTemplates[style] || FOUR_CHORD_TEMPLATES;
  
  // Return random template
  return templates[Math.floor(Math.random() * templates.length)];
}