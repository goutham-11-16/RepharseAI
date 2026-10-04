"use client";

import { useState } from "react";
import type { DetectionResult, ParagraphScore, SentenceScore } from "@/lib/detector";

interface AIHighlighterProps {
  detection?: DetectionResult;
  text: string;
}

export default function AIHighlighter({ detection, text }: AIHighlighterProps) {
  const [activeSentence, setActiveSentence] = useState<SentenceScore | null>(null);

  if (!text.trim()) {
    return (
      <div className="flex-1 min-h-[400px] flex items-center justify-center p-8 text-center text-gray-400 text-sm">
        Enter or paste text to generate the AI sentence highlight map.
      </div>
    );
  }

  const paragraphs: ParagraphScore[] = detection?.paragraphs || [];

  const getVerdictStyle = (score: number) => {
    if (score >= 65) {
      return {
        badge: "bg-rose-100 text-rose-800 border-rose-300",
        sentence: "bg-rose-100 text-rose-950 border-b-2 border-rose-400 hover:bg-rose-200",
        dot: "bg-rose-500",
      };
    }
    if (score >= 40) {
      return {
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        sentence: "bg-amber-100 text-amber-950 border-b-2 border-amber-400 hover:bg-amber-200",
        dot: "bg-amber-500",
      };
    }
    return {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      sentence: "bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
      dot: "bg-emerald-500",
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-[400px] bg-slate-50/50">
      {/* Legend & Summary Bar */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">AI Sentence Intensity:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &ge;65% Likely AI
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 40–64% Uncertain
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;40% Likely Human
          </span>
        </div>

        <span className="text-gray-400 italic">
          Click or hover any sentence to view reason
        </span>
      </div>

      {/* Main Highlighting View */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[520px]">
        {paragraphs.map((para) => {
          const paraStyle = getVerdictStyle(para.aiScore);

          return (
            <div
              key={para.index}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:border-gray-300 transition-colors"
            >
              {/* Paragraph Header with AI Percentage */}
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Paragraph {para.index + 1}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    {para.wordCount} words
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${paraStyle.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${paraStyle.dot}`} />
                    {para.aiScore}% AI ({para.verdict})
                  </span>
                </div>
              </div>

              {/* Sentences with Highlights */}
              <p className="text-sm leading-relaxed text-gray-800 space-x-1">
                {para.sentences.map((sent, sIdx) => {
                  const sentStyle = getVerdictStyle(sent.aiScore);
                  const isSelected = activeSentence?.text === sent.text;

                  return (
                    <span
                      key={sIdx}
                      onClick={() => setActiveSentence(sent)}
                      onMouseEnter={() => setActiveSentence(sent)}
                      className={`inline cursor-pointer rounded px-1 py-0.5 transition-all ${
                        sentStyle.sentence
                      } ${
                        isSelected
                          ? "ring-2 ring-indigo-500 shadow-sm"
                          : ""
                      }`}
                      title={`${sent.aiScore}% AI - ${sent.reason}`}
                    >
                      {sent.text}{" "}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Sentence Inspector Drawer / Tooltip */}
      {activeSentence && (
        <div className="mx-4 mb-3 p-3 bg-white rounded-lg border border-indigo-200 shadow-md animate-fadeIn text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">Sentence Analysis</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  getVerdictStyle(activeSentence.aiScore).badge
                }`}
              >
                {activeSentence.aiScore}% AI Probability ({activeSentence.verdict})
              </span>
            </div>
            <button
              onClick={() => setActiveSentence(null)}
              className="text-gray-400 hover:text-gray-600 font-bold px-1"
            >
              &times;
            </button>
          </div>

          <p className="text-gray-700 italic border-l-2 border-indigo-400 pl-2 mb-1.5 line-clamp-2">
            &ldquo;{activeSentence.text}&rdquo;
          </p>

          <div className="flex items-center justify-between text-gray-500">
            <span>
              <strong className="text-gray-700 font-medium">Detection Flags:</strong>{" "}
              {activeSentence.reason}
            </span>
            <span className="font-mono text-gray-400 shrink-0 ml-2">
              Length: {activeSentence.wordCount} words
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
