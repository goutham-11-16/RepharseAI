"use client";

// ---------------------------------------------------------------------------
// TextEditor — input panel with textarea, file upload, and live word/char count.
// ---------------------------------------------------------------------------

import { useRef, useState } from "react";
import { countWords, countCharacters } from "@/lib/text-utils";
import type { DetectionResult } from "@/lib/detector";
import AIHighlighter from "@/components/AIHighlighter";
import DocumentReportViewer from "@/components/DocumentReportViewer";
import { parseDocxFile } from "@/lib/docx-utils";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  detection?: DetectionResult;
  docTitle?: string;
  onDocTitleChange?: (title: string) => void;
}

export default function TextEditor({
  value,
  onChange,
  disabled,
  detection,
  docTitle,
  onDocTitleChange,
}: TextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "highlights" | "report">("edit");
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isDocx = fileName.endsWith(".docx") || fileName.endsWith(".doc");

    if (isDocx) {
      try {
        setIsParsingDoc(true);
        const { text } = await parseDocxFile(file);
        onChange(text);
        const cleanTitle = fileName.replace(/\.[^/.]+$/, "");
        if (onDocTitleChange) onDocTitleChange(cleanTitle);
        setActiveTab("report"); // Switch directly to neat report layout
      } catch (err) {
        console.error("Failed to parse docx:", err);
        alert("Failed to parse Word document. Please make sure it is a valid .docx file.");
      } finally {
        setIsParsingDoc(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onChange(text);
        if (onDocTitleChange) onDocTitleChange(fileName.replace(/\.[^/.]+$/, ""));
      };
      reader.readAsText(file);
    }

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const flaggedCount =
    detection?.overallSentences?.filter((s) => s.aiScore >= 65).length ??
    detection?.paragraphs?.flatMap((p) => p.sentences).filter((s) => s.aiScore >= 65).length ??
    0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0 shadow-sm">
      {/* Toolbar & Tabs */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "edit"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Edit Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("highlights")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "highlights"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>AI Highlight Map</span>
            {flaggedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {flaggedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "report"
                ? "bg-white text-indigo-700 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>Report Layout</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {detection && (
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
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

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isParsingDoc}
            className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
          >
            {isParsingDoc ? "Loading..." : "Upload .docx / .txt"}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("");
              if (onDocTitleChange) onDocTitleChange("Document Report");
            }}
            disabled={disabled || !value}
            className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.txt,text/plain"
          onChange={handleFileLoad}
          className="hidden"
          aria-label="Upload document file"
        />
      </div>

      {/* Main Content Area: Edit textarea vs AI Highlighter vs Document Report */}
      {activeTab === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste, type your text, or upload a .docx report here…"
          className="flex-1 min-h-[440px] p-4 resize-none text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm leading-relaxed bg-transparent"
          spellCheck={false}
        />
      ) : activeTab === "highlights" ? (
        <AIHighlighter detection={detection} text={value} />
      ) : (
        <DocumentReportViewer
          text={value}
          mode="highlight"
          title={docTitle || "Uploaded Document Report"}
          detection={detection}
        />
      )}

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <span>{countWords(value)} words</span>
          <span className="text-gray-300">|</span>
          <span>{countCharacters(value)} characters</span>
          {docTitle && <span className="text-indigo-600 font-medium">Doc: {docTitle}</span>}
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== "report" && value.trim() && (
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View Report Layout &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
