'use client';

import { useState } from 'react';
import { Sliders, Music, Zap, Layers } from 'lucide-react';
import {
  HarmonizationControls,
  VoicingPresetName,
} from '@/types/rulebook';
import { StylePackName } from '@/types/harmonyTypes';
import {
  getStylePack,
  getStylePackDisplayName,
  getStylePackNames,
  getDefaultControlsForStyle,
} from '@/lib/stylePacks';
import {
  getVoicingPreset,
  getVoicingPresetDisplayName,
  getVoicingPresetNames,
} from '@/lib/voicing';

interface HarmonizationControlsUIProps {
  controls: HarmonizationControls;
  onControlsChange: (controls: HarmonizationControls) => void;
}

export default function HarmonizationControlsUI({
  controls,
  onControlsChange,
}: HarmonizationControlsUIProps) {
  const [localControls, setLocalControls] = useState<HarmonizationControls>(controls);

  const updateControl = <K extends keyof HarmonizationControls>(
    key: K,
    value: HarmonizationControls[K]
  ) => {
    const updated = { ...localControls, [key]: value };
    setLocalControls(updated);
    onControlsChange(updated);
  };

  const handleStyleChange = (style: StylePackName) => {
    const defaults = getDefaultControlsForStyle(style);
    const updated = {
      ...localControls,
      style_pack: style,
      distance: defaults.distance,
      functional_clarity: defaults.functional_clarity,
      dominant_density: defaults.dominant_density as any,
      alteration_amount: defaults.alteration_amount as any,
    };
    setLocalControls(updated);
    onControlsChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Music className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Harmonization Controls
        </h2>
      </div>

      {/* Distance Knob */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Harmonic Distance (0-6)
          </label>
          <span className="text-sm font-bold text-purple-600">
            {localControls.distance}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="6"
          value={localControls.distance}
          onChange={(e) => updateControl('distance', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Diatonic</span>
          <span>Extensions</span>
          <span>Secondary</span>
          <span>Mixture</span>
          <span>Tritone</span>
          <span>Chromatic</span>
        </div>
      </div>

      {/* Functional Clarity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Functional Clarity
          </label>
          <span className="text-sm font-bold text-purple-600">
            {Math.round(localControls.functional_clarity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localControls.functional_clarity}
          onChange={(e) => updateControl('functional_clarity', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Free-flowing</span>
          <span>Structured</span>
        </div>
      </div>

      {/* Adventurous */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Adventurous
          </label>
          <span className="text-sm font-bold text-purple-600">
            {Math.round(localControls.adventurous * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localControls.adventurous}
          onChange={(e) => updateControl('adventurous', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Conservative</span>
          <span>Bold</span>
        </div>
      </div>

      {/* Style Pack Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Style Pack
        </label>
        <select
          value={localControls.style_pack}
          onChange={(e) => handleStyleChange(e.target.value as StylePackName)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {getStylePackNames().map((styleName) => (
            <option key={styleName} value={styleName}>
              {getStylePackDisplayName(styleName)}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {getStylePack(localControls.style_pack)?.description}
        </div>
      </div>

      {/* Voicing Preset Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Voicing Preset
        </label>
        <select
          value={localControls.voicing_preset}
          onChange={(e) => updateControl('voicing_preset', e.target.value as VoicingPresetName)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {getVoicingPresetNames().map((voicingName) => (
            <option key={voicingName} value={voicingName}>
              {getVoicingPresetDisplayName(voicingName)}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {getVoicingPreset(localControls.style_pack)?.description}
        </div>
      </div>

      {/* Loop Length */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Loop Length
        </label>
        <div className="grid grid-cols-4 gap-2">
          {([4, 8, 16, 32] as const).map((length) => (
            <button
              key={length}
              onClick={() => updateControl('loop_length', length)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${localControls.loop_length === length
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {length} bars
            </button>
          ))}
        </div>
      </div>

      {/* Harmonic Rhythm */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Harmonic Rhythm
        </label>
        <select
          value={localControls.harmonic_rhythm}
          onChange={(e) => updateControl('harmonic_rhythm', e.target.value as any)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="1_per_bar">1 chord per bar</option>
          <option value="2_per_bar">2 chords per bar</option>
          <option value="4_per_bar">4 chords per bar</option>
        </select>
      </div>

      {/* Advanced Options */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Advanced Options
        </h3>

        {/* Dominant Density */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Dominant Density
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'light', 'medium', 'heavy'] as const).map((density) => (
              <button
                key={density}
                onClick={() => updateControl('dominant_density', density as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${localControls.dominant_density === density
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {density}
              </button>
            ))}
          </div>
        </div>

        {/* Borrowed Chord Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Borrowed Chords
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'light', 'medium', 'frequent'] as const).map((amount) => (
              <button
                key={amount}
                onClick={() => updateControl('borrowed_amount', amount as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${localControls.borrowed_amount === amount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Alteration Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Alteration Spiciness
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['clean', 'mild', 'medium', 'spicy'] as const).map((amount) => (
              <button
                key={amount}
                onClick={() => updateControl('alteration_amount', amount as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${localControls.alteration_amount === amount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Cadence Frequency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cadence Frequency: Every {localControls.cadence_frequency} bars
          </label>
          <input
            type="range"
            min="4"
            max="16"
            step="2"
            value={localControls.cadence_frequency}
            onChange={(e) => updateControl('cadence_frequency', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* Require Tonal Return */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tonal-return"
            checked={localControls.require_tonal_return}
            onChange={(e) => updateControl('require_tonal_return', e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded border-gray-300 dark:border-gray-700 focus:ring-purple-500"
          />
          <label htmlFor="tonal-return" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Require tonal return to I at end
          </label>
        </div>
      </div>
    </div>
  );
}