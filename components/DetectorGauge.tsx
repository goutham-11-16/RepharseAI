"use client";

// ---------------------------------------------------------------------------
// DetectorGauge — Commercial AI Detection & Humanizer Score Card
// Simulates GPTZero, CopyLeaks, and Turnitin metrics (Perplexity & Burstiness).
// ---------------------------------------------------------------------------

import type { DetectionResult } from "@/lib/detector";

interface DetectorGaugeProps {
  title: string;
  result?: DetectionResult;
  subtitle?: string;
}

export default function DetectorGauge({
  title,
  result,
  subtitle,
}: DetectorGaugeProps) {
  if (!result) return null;

  const isHuman = result.humanScore >= 75;
  const isMixed = result.humanScore >= 45 && result.humanScore < 75;

  const scoreColor = isHuman
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : isMixed
    ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-rose-600 bg-rose-50 border-rose-200";

  const barColor = isHuman
    ? "bg-emerald-500"
    : isMixed
    ? "bg-amber-500"
    : "bg-rose-500";

  const getBadgeStyle = (status: "PASS" | "WARN" | "FAIL") => {
    switch (status) {
      case "PASS":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "WARN":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "FAIL":
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-all">
      {/* Title & Status */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreColor}`}
        >
          {result.verdict}
        </span>
      </div>

      {/* Main Score Gauge */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {result.humanScore}%
            </span>
            <span className="text-sm font-semibold text-emerald-600">
              Human
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {result.aiScore}% estimated AI probability
          </p>
        </div>

        {/* Detector Badges */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
            <span className="text-gray-400 text-[10px] uppercase">GPTZero:</span>
            <span
              className={`px-1.5 py-0.5 rounded border ${getBadgeStyle(
                result.badges.gptZero,
              )}`}
            >
              {result.badges.gptZero}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
            <span className="text-gray-400 text-[10px] uppercase">CopyLeaks:</span>
            <span
              className={`px-1.5 py-0.5 rounded border ${getBadgeStyle(
                result.badges.copyLeaks,
              )}`}
            >
              {result.badges.copyLeaks}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
            <span className="text-gray-400 text-[10px] uppercase">Turnitin:</span>
            <span
              className={`px-1.5 py-0.5 rounded border ${getBadgeStyle(
                result.badges.turnitin,
              )}`}
            >
              {result.badges.turnitin}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-700 rounded-full ${barColor}`}
          style={{ width: `${result.humanScore}%` }}
        />
      </div>

      {/* Metrics breakdown: Perplexity & Burstiness */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span>Burstiness</span>
            <span className="font-semibold text-gray-800">
              {result.burstiness}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${result.burstiness}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Sentence cadence & length variance</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span>Perplexity</span>
            <span className="font-semibold text-gray-800">
              {result.perplexity}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: `${result.perplexity}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Lexical diversity & novelty</p>
        </div>
      </div>

      {/* Detected Patterns Warning */}
      {result.detectedPatterns.length > 0 && (
        <div className="mt-3 pt-2 text-[11px] text-amber-700 flex flex-wrap gap-1 items-center">
          <span className="font-semibold">AI markers detected:</span>
          {result.detectedPatterns.map((pat, idx) => (
            <span
              key={idx}
              className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono"
            >
              &quot;{pat}&quot;
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
