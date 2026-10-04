"use client";

import {
  REWRITE_MODES,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  RewriteMode,
  HUMANIZE_INTENSITIES,
  INTENSITY_LABELS,
  HumanizeIntensity,
} from "@/lib/text-utils";

interface ModeSelectorProps {
  mode: RewriteMode;
  onModeChange: (mode: RewriteMode) => void;
  intensity: HumanizeIntensity;
  onIntensityChange: (intensity: HumanizeIntensity) => void;
  disabled?: boolean;
}

export default function ModeSelector({
  mode,
  onModeChange,
  intensity,
  onIntensityChange,
  disabled,
}: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Mode Selector */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="mode-select"
          className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap"
        >
          Style:
        </label>
        <select
          id="mode-select"
          value={mode}
          onChange={(e) => onModeChange(e.target.value as RewriteMode)}
          disabled={disabled}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {REWRITE_MODES.map((m) => (
            <option key={m} value={m}>
              {MODE_LABELS[m]} — {MODE_DESCRIPTIONS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Intensity Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
          Bypass Level:
        </span>
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          {HUMANIZE_INTENSITIES.map((lvl) => {
            const isActive = intensity === lvl;
            return (
              <button
                key={lvl}
                type="button"
                disabled={disabled}
                onClick={() => onIntensityChange(lvl)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? lvl === "stealth"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                } disabled:opacity-50`}
              >
                {INTENSITY_LABELS[lvl].replace(/Level \d+: /, "")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
