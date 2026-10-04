"use client";

// ---------------------------------------------------------------------------
// RewritePanel — output panel with streaming support, diff view toggle,
// copy, download, and retry actions.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { countWords, countCharacters } from "@/lib/text-utils";
import DiffViewer from "./DiffViewer";
import DocumentReportViewer from "./DocumentReportViewer";
import { generateDocxBlob, downloadDocxBlob } from "@/lib/docx-utils";

interface RewritePanelProps {
  text: string;
  originalText?: string;
  isLoading: boolean;
  isStreaming?: boolean;
  error: string | null;
  humanScore?: number;
  docTitle?: string;
  onClear: () => void;
  onRewriteAgain: () => void;
}

export default function RewritePanel({
  text,
  originalText = "",
  isLoading,
  isStreaming = false,
  error,
  humanScore,
  docTitle,
  onClear,
  onRewriteAgain,
}: RewritePanelProps) {
  const [copied, setCopied] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "diff" | "report">("text");

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle || "rephraze"}-humanized.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    if (!text) return;
    try {
      setIsExportingDocx(true);
      const title = docTitle ? `${docTitle} (Humanized)` : "Humanized Executive Report";
      const blob = await generateDocxBlob(text, title);
      downloadDocxBlob(blob, `${docTitle || "rephraze"}-humanized.docx`);
    } catch (err) {
      console.error("Failed to generate docx:", err);
      alert("Failed to export Word document.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 shadow-sm transition-all">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Humanized Result
          </h2>

          {text && (
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === "text"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Clean Text
              </button>
              {originalText && (
                <button
                  type="button"
                  onClick={() => setActiveTab("diff")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === "diff"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Changes (Diff)
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === "report"
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Report Preview
              </button>
            </div>
          )}

          {typeof humanScore === "number" && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                humanScore >= 75
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : humanScore >= 45
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {humanScore}% Human
            </span>
          )}
        </div>

        {text && !isLoading && !isStreaming && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors font-semibold flex items-center gap-1"
            >
              <span>{isExportingDocx ? "Exporting..." : "Download .docx"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="text-xs px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              .txt
            </button>
            <button
              type="button"
              onClick={onRewriteAgain}
              className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium"
            >
              Re-Humanize
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-xs px-2 py-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[400px] p-4 text-sm leading-relaxed text-gray-800 overflow-y-auto">
        {isLoading && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm font-medium text-gray-600">
              Transforming syntax and increasing perplexity…
            </p>
            <p className="text-xs text-gray-400">
              Simulating human burstiness to defeat detectors.
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
              <p className="text-sm font-medium text-red-800 mb-1">
                Humanization Failed
              </p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : text ? (
          activeTab === "diff" && originalText ? (
            <DiffViewer original={originalText} rewritten={text} />
          ) : activeTab === "report" ? (
            <DocumentReportViewer
              text={text}
              mode="humanized"
              title={docTitle ? `${docTitle} (Humanized)` : "Humanized Final Report"}
              humanScore={humanScore}
            />
          ) : (
            <div className="whitespace-pre-wrap font-sans text-gray-800">
              {text}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
              )}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                AI
              </div>
              <p className="text-gray-500 font-medium text-sm mb-1">
                Awaiting Input
              </p>
              <p className="text-xs text-gray-400">
                Paste your AI-generated text on the left, select an intensity level, and click &quot;Humanize Text&quot;.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {text && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{countWords(text)} words</span>
            <span className="text-gray-300">|</span>
            <span>{countCharacters(text)} characters</span>
          </div>
          {isStreaming && (
            <span className="text-blue-600 font-medium animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Streaming live from Ollama…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
