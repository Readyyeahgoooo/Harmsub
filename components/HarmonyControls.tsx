'use client';

import { useState } from 'react';
import { STYLE_PACKS, getStylePackIds } from '@/lib/harmony/stylePacks';
import { VOICING_CONFIGS, getVoicingDescription, VoicingPreset } from '@/lib/harmony/voicing';
import { DISTANCE_LEVELS } from '@/lib/harmony/distance';
import { Settings, Music, Sliders, Palette } from 'lucide-react';

interface HarmonyControlsProps {
  onSettingsChange: (settings: HarmonySettings) => void;
  initialSettings?: Partial<HarmonySettings>;
}

export interface HarmonySettings {
  style: string;
  distanceLevel: number;
  voicingPreset: VoicingPreset;
  tensionTolerance: 'low' | 'medium' | 'high';
  key: string;
  tempo: number;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYS_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function HarmonyControls({ onSettingsChange, initialSettings }: HarmonyControlsProps) {
  const [settings, setSettings] = useState<HarmonySettings>({
    style: initialSettings?.style || 'pop',
    distanceLevel: initialSettings?.distanceLevel ?? 1,
    voicingPreset: initialSettings?.voicingPreset || 'clear_spacious',
    tensionTolerance: initialSettings?.tensionTolerance || 'medium',
    key: initialSettings?.key || 'C',
    tempo: initialSettings?.tempo || 120,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof HarmonySettings>(key: K, value: HarmonySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    
    // Auto-adjust settings based on style
    if (key === 'style') {
      const pack = STYLE_PACKS[value as string];
      if (pack) {
        newSettings.distanceLevel = Math.min(settings.distanceLevel, pack.maxDistance);
        newSettings.voicingPreset = pack.voicingPreset;
        newSettings.tensionTolerance = pack.tensionTolerance;
      }
    }
    
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const selectedStyle = STYLE_PACKS[settings.style];
  const selectedDistance = DISTANCE_LEVELS[settings.distanceLevel];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Harmony Settings
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {selectedStyle?.name} • Level {settings.distanceLevel}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Style Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="w-4 h-4" />
              Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getStylePackIds().map(id => {
                const pack = STYLE_PACKS[id];
                return (
                  <button
                    key={id}
                    onClick={() => updateSetting('style', id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.style === id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pack.name}
                  </button>
                );
              })}
            </div>
            {selectedStyle && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedStyle.description}
              </p>
            )}
          </div>

          {/* Distance Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Sliders className="w-4 h-4" />
              Harmonic Distance: Level {settings.distanceLevel}
            </label>
            <input
              type="range"
              min="0"
              max={selectedStyle?.maxDistance || 6}
              value={settings.distanceLevel}
              onChange={(e) => updateSetting('distanceLevel', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Diatonic</span>
              <span>Chromatic</span>
            </div>
            {selectedDistance && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedDistance.name}: {selectedDistance.description}
              </p>
            )}
          </div>

          {/* Voicing Preset */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Music className="w-4 h-4" />
              Voicing
            </label>
            <select
              value={settings.voicingPreset}
              onChange={(e) => updateSetting('voicingPreset', e.target.value as VoicingPreset)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
            >
              {Object.keys(VOICING_CONFIGS).map(preset => (
                <option key={preset} value={preset}>
                  {preset.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {getVoicingDescription(settings.voicingPreset)}
            </p>
          </div>

          {/* Key and Tempo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Key
              </label>
              <select
                value={settings.key}
                onChange={(e) => updateSetting('key', e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              >
                {KEYS.map((key, i) => (
                  <option key={key} value={key}>
                    {key} / {KEYS_FLAT[i]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tempo (BPM)
              </label>
              <input
                type="number"
                min="40"
                max="240"
                value={settings.tempo}
                onChange={(e) => updateSetting('tempo', parseInt(e.target.value) || 120)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Tension Tolerance */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tension Tolerance
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => updateSetting('tensionTolerance', level)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.tensionTolerance === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
