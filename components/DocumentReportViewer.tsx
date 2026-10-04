"use client";

import { useState } from "react";
import type { DetectionResult, ParagraphScore, SentenceScore } from "@/lib/detector";

interface DocumentReportViewerProps {
  text: string;
  mode: "highlight" | "humanized";
  title?: string;
  detection?: DetectionResult;
  humanScore?: number;
}

export default function DocumentReportViewer({
  text,
  mode,
  title = "Document Report",
  detection,
  humanScore,
}: DocumentReportViewerProps) {
  const [activeSentence, setActiveSentence] = useState<SentenceScore | null>(null);

  const rawParagraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const paragraphs: ParagraphScore[] = detection?.paragraphs || [];

  const getVerdictStyle = (score: number) => {
    if (score >= 65) {
      return {
        badge: "bg-rose-100 text-rose-800 border-rose-300",
        sentence: "bg-rose-100/80 text-rose-950 border-b border-rose-400 hover:bg-rose-200",
        dot: "bg-rose-500",
      };
    }
    if (score >= 40) {
      return {
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        sentence: "bg-amber-100/80 text-amber-950 border-b border-amber-400 hover:bg-amber-200",
        dot: "bg-amber-500",
      };
    }
    return {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      sentence: "bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100",
      dot: "bg-emerald-500",
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-[440px] bg-slate-100/80 p-4 overflow-y-auto">
      {/* Paper Sheet Simulator */}
      <div className="bg-white rounded border border-gray-300 shadow-sm mx-auto w-full max-w-3xl p-8 flex flex-col gap-6 font-sans">
        {/* Document Header */}
        <div className="border-b border-gray-200 pb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
              {mode === "highlight" ? "Original Source Document" : "Humanized Final Report"}
            </span>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {mode === "highlight" && detection && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  detection.aiScore >= 65
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : detection.aiScore >= 40
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {detection.aiScore}% Overall AI
              </span>
            )}

            {mode === "humanized" && humanScore !== undefined && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {humanScore}% Human Written
              </span>
            )}

            <span className="text-xs text-gray-400 font-mono">
              {rawParagraphs.length} Paragraph{rawParagraphs.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-5 text-gray-800 leading-relaxed text-sm text-justify">
          {mode === "highlight" ? (
            paragraphs.length > 0 ? (
              paragraphs.map((para) => {
                const paraStyle = getVerdictStyle(para.aiScore);

                return (
                  <div key={para.index} className="relative group">
                    {/* Paragraph Margin Pill Badge */}
                    <div className="flex items-center justify-between mb-1 text-[11px] text-gray-400">
                      <span className="font-semibold uppercase tracking-wider">
                        ¶ Section {para.index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full font-semibold border ${paraStyle.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${paraStyle.dot}`} />
                        {para.aiScore}% AI ({para.verdict})
                      </span>
                    </div>

                    <p className="text-gray-900 leading-relaxed">
                      {para.sentences.map((sent, sIdx) => {
                        const sentStyle = getVerdictStyle(sent.aiScore);
                        const isSelected = activeSentence?.text === sent.text;

                        return (
                          <span
                            key={sIdx}
                            onClick={() => setActiveSentence(sent)}
                            onMouseEnter={() => setActiveSentence(sent)}
                            className={`cursor-pointer rounded px-0.5 transition-all ${
                              sentStyle.sentence
                            } ${isSelected ? "ring-2 ring-indigo-500 shadow-sm" : ""}`}
                            title={`${sent.aiScore}% AI - ${sent.reason}`}
                          >
                            {sent.text}{" "}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })
            ) : (
              rawParagraphs.map((para, idx) => (
                <p key={idx} className="text-gray-900 leading-relaxed">
                  {para}
                </p>
              ))
            )
          ) : (
            rawParagraphs.map((para, idx) => (
              <p key={idx} className="text-gray-900 leading-relaxed indent-4">
                {para}
              </p>
            ))
          )}
        </div>

        {/* Active Sentence Drawer for Highlight Mode */}
        {activeSentence && mode === "highlight" && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-indigo-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-800">Sentence Analysis</span>
              <button
                onClick={() => setActiveSentence(null)}
                className="text-gray-400 hover:text-gray-600 font-bold px-1"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-700 italic border-l-2 border-indigo-400 pl-2 mb-1">
              &ldquo;{activeSentence.text}&rdquo;
            </p>
            <div className="flex items-center justify-between text-gray-500">
              <span>
                <strong>Flag:</strong> {activeSentence.reason}
              </span>
              <span className="font-mono text-gray-400">
                {activeSentence.aiScore}% AI &bull; {activeSentence.wordCount} words
              </span>
            </div>
          </div>
        )}

        {/* Document Footer Simulator */}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>RephrazeAI Document Report Engine</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
