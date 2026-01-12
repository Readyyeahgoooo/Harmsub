import React from 'react';
import { StylePackName, VoicingStyle, HarmonicDistance } from '../types/harmonyTypes';
import { STYLE_PACKS } from '../lib/stylePacks';

interface HarmonyControlsProps {
    distance: HarmonicDistance;
    setDistance: (d: HarmonicDistance) => void;
    styleName: StylePackName;
    setStyleName: (s: StylePackName) => void;
    voicingStyle: VoicingStyle;
    setVoicingStyle: (v: VoicingStyle) => void;
    className?: string;
}

export default function HarmonyControls({
    distance,
    setDistance,
    styleName,
    setStyleName,
    voicingStyle,
    setVoicingStyle,
    className = ''
}: HarmonyControlsProps) {

    const distanceLabels = [
        "Diatonic Triads (Simplest)",
        "Diatonic 7ths",
        "Secondary Dominants (Pop)",
        "Modal Mixture (Bossa/Soul)",
        "Tritone Subs (Jazz)",
        "Chromatic Mediants (Film)",
        "Non-Functional (Wild)"
    ];

    return (
        <div className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <span className="text-2xl">🎛️</span> Harmonization Settings
            </h3>

            <div className="space-y-6">
                {/* Style Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Musical Style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(Object.keys(STYLE_PACKS) as StylePackName[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStyleName(s)}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${styleName === s
                                        ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900 dark:border-purple-400 dark:text-purple-200 font-medium ring-1 ring-purple-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                {STYLE_PACKS[s].displayName}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {STYLE_PACKS[styleName].description}
                    </p>
                </div>

                {/* Harmonic Distance Slider */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Harmonic Adventurousness
                        </label>
                        <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                            Level {distance}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="6"
                        step="1"
                        value={distance}
                        onChange={(e) => setDistance(parseInt(e.target.value) as HarmonicDistance)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Closest</span>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {distanceLabels[distance]}
                        </span>
                        <span className="text-xs text-gray-500">Furthest</span>
                    </div>
                </div>

                {/* Voicing Style Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Voicing Style
                    </label>
                    <select
                        value={voicingStyle}
                        onChange={(e) => setVoicingStyle(e.target.value as VoicingStyle)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        <option value="clear">Clear / Spacious (Pop)</option>
                        <option value="jazz_standard">Jazz Standard (Rootless)</option>
                        <option value="neo_soul">Neo-Soul (Clusters)</option>
                        <option value="bossa">Bossa Nova (Smooth)</option>
                        <option value="cinematic">Cinematic (Wide)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
