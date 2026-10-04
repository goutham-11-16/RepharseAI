"use client";

// ---------------------------------------------------------------------------
// DiffViewer — Word-level comparison visualizer
// ---------------------------------------------------------------------------

import { computeWordDiff, DiffToken } from "@/lib/text-utils";

interface DiffViewerProps {
  original: string;
  rewritten: string;
}

export default function DiffViewer({ original, rewritten }: DiffViewerProps) {
  const tokens: DiffToken[] = computeWordDiff(original, rewritten);

  return (
    <div className="p-4 text-sm leading-relaxed text-gray-800 bg-white rounded-lg border border-gray-100 overflow-y-auto max-h-[450px]">
      <div className="flex items-center gap-4 mb-3 pb-2 border-b border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          <span>Rewritten / Humanized</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 inline-block" />
          <span>Removed Original</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-x-1.5 gap-y-1">
        {tokens.map((token, index) => {
          if (token.type === "added") {
            return (
              <span
                key={index}
                className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-medium border border-emerald-200"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === "removed") {
            return (
              <span
                key={index}
                className="bg-rose-50 text-rose-500 line-through px-1 py-0.5 rounded opacity-75"
              >
                {token.text}
              </span>
            );
          }
          return (
            <span key={index} className="text-gray-700">
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
