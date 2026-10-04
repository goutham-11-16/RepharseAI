"use client";

// ---------------------------------------------------------------------------
// RephrazeAI — Production AI Humanizer & Detection Suite
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import TextEditor from "@/components/TextEditor";
import RewritePanel from "@/components/RewritePanel";
import ModeSelector from "@/components/ModeSelector";
import DetectorGauge from "@/components/DetectorGauge";
import Stats from "@/components/Stats";
import { analyzeAIText } from "@/lib/detector";
import type {
  RewriteMode,
  HumanizeIntensity,
  RewriteResult,
} from "@/lib/text-utils";

const SAMPLE_AI_PARAGRAPH =
  "Artificial intelligence has transformed numerous industries over the past decade, from healthcare diagnostics to financial fraud detection. Machine learning models, particularly deep neural networks, have achieved unprecedented accuracy in tasks that were previously considered exclusive to human intelligence. Natural language processing has enabled chatbots and virtual assistants to understand and respond to human queries with remarkable fluency. Computer vision systems can now identify objects, faces, and medical anomalies with accuracy that rivals or exceeds human experts. However, these advances come with significant challenges, including concerns about bias in training data, the environmental cost of training large models, the need for explainability in high-stakes decisions, and the broader societal implications of automation on employment.";

export default function Home() {
  // ---- State --------------------------------------------------------------
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<RewriteMode>("natural");
  const [intensity, setIntensity] = useState<HumanizeIntensity>("balanced");
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model] = useState(
    process.env.NEXT_PUBLIC_OLLAMA_MODEL || "qwen3:8b",
  );
  const [docTitle, setDocTitle] = useState("Document Report");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Live detection of input text as user types/pastes
  const liveInputDetection = inputText.trim()
    ? analyzeAIText(inputText)
    : undefined;

  // ---- Handlers -----------------------------------------------------------
  const handleRewriteStream = useCallback(async () => {
    if (!inputText.trim() || isLoading || isStreaming) return;

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setStreamingText("");
    setResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/rewrite/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, mode, intensity }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status}): ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorMsg = errJson.error;
          }
        } catch {
          // If response is HTML (like 404 or 500 error page), use status text
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("No readable stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      setIsLoading(false); // Switch from initial spinner to streaming text

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.replace("data: ", "");

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "token") {
              accumulated += data.token;
              setStreamingText(accumulated);
            } else if (data.type === "done") {
              setResult(data.result);
              setStreamingText(data.result.rewrittenText);
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e: unknown) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              console.error("Stream parse error:", e);
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        console.log("Rewrite request cancelled.");
      } else {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [inputText, mode, intensity, isLoading, isStreaming]);

  const handleClearAll = useCallback(() => {
    setInputText("");
    setResult(null);
    setStreamingText("");
    setError(null);
  }, []);

  const handleClearOutput = useCallback(() => {
    setResult(null);
    setStreamingText("");
    setError(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_AI_PARAGRAPH);
    setResult(null);
    setStreamingText("");
    setError(null);
  }, []);

  // Display text is either the final result or the live streaming text
  const displayText = result?.rewrittenText || streamingText;

  // ---- Render -------------------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col bg-gray-50/70">
      <Header model={model} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Banner with Sample Button */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-500/20 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                100% Local Inference
              </span>
              <span className="text-xs text-blue-200/80">
                No Cloud APIs • Zero Data Logging
              </span>
            </div>
            <h2 className="text-lg font-bold">
              Bypass AI Detectors While Preserving Meaning
            </h2>
            <p className="text-xs text-blue-100/70 max-w-2xl mt-0.5">
              Computes real-time Perplexity and Burstiness metrics to simulate
              GPTZero, Turnitin, and CopyLeaks detection likelihoods.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading || isStreaming}
              className="text-xs font-semibold px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 whitespace-nowrap"
            >
              Load Sample AI Text (105 words)
            </button>
          </div>
        </div>

        {/* Two-panel comparison editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <TextEditor
            value={inputText}
            onChange={setInputText}
            disabled={isLoading || isStreaming}
            detection={liveInputDetection}
            docTitle={docTitle}
            onDocTitleChange={setDocTitle}
          />

          <RewritePanel
            text={displayText}
            originalText={inputText}
            isLoading={isLoading}
            isStreaming={isStreaming}
            error={error}
            humanScore={result?.rewrittenDetection?.humanScore}
            docTitle={docTitle}
            onClear={handleClearOutput}
            onRewriteAgain={handleRewriteStream}
          />
        </div>

        {/* Controls Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <ModeSelector
            mode={mode}
            onModeChange={setMode}
            intensity={intensity}
            onIntensityChange={setIntensity}
            disabled={isLoading || isStreaming}
          />

          <div className="flex items-center gap-3">
            {inputText && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isLoading || isStreaming}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg"
              >
                Reset All
              </button>
            )}

            <button
              type="button"
              onClick={handleRewriteStream}
              disabled={isLoading || isStreaming || !inputText.trim()}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              {isStreaming ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Streaming Output…
                </>
              ) : isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Humanizing…
                </>
              ) : (
                "Humanize Text (Bypass AI)"
              )}
            </button>
          </div>
        </div>

        {/* AI Detection Telemetry Section (Before vs After) */}
        {(liveInputDetection || result?.rewrittenDetection) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                AI Detection & Humanizer Telemetry
              </h3>
              <span className="text-xs text-gray-400">
                Calibrated against GPTZero & Turnitin heuristics
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetectorGauge
                title="Input Text Detection"
                subtitle="Before Humanization"
                result={liveInputDetection}
              />

              <DetectorGauge
                title="Rewritten Output Detection"
                subtitle="After RephrazeAI Humanization"
                result={result?.rewrittenDetection}
              />
            </div>

            {/* Paragraph-by-Paragraph AI Breakdown Card */}
            {liveInputDetection?.paragraphs && liveInputDetection.paragraphs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      Paragraph-by-Paragraph AI Scoring
                    </h4>
                    <p className="text-xs text-gray-500">
                      Breakdown of each paragraph&apos;s AI probability, word count, and sentence density
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                    {liveInputDetection.paragraphs.length} Paragraph{liveInputDetection.paragraphs.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {liveInputDetection.paragraphs.map((p) => {
                    const isHigh = p.aiScore >= 65;
                    const isMed = p.aiScore >= 40 && p.aiScore < 65;

                    return (
                      <div
                        key={p.index}
                        className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                          isHigh
                            ? "bg-rose-50/50 border-rose-200"
                            : isMed
                            ? "bg-amber-50/50 border-amber-200"
                            : "bg-emerald-50/50 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800">
                            Paragraph #{p.index + 1}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                              isHigh
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : isMed
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            {p.aiScore}% AI ({p.verdict})
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isHigh
                                ? "bg-rose-500"
                                : isMed
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${p.aiScore}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{p.wordCount} words &bull; {p.sentences.length} sentences</span>
                          <span className="italic">
                            {p.sentences.filter((s) => s.aiScore >= 65).length} flagged AI
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Continuous Model Improvement Banner */}
                <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/80 to-purple-50/80 border border-indigo-100 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative mt-1 sm:mt-0 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
                    </span>
                    <div>
                      <span className="font-bold text-indigo-950">
                        Keep Improving the Model for Future Benchmarks:
                      </span>{" "}
                      <span className="text-indigo-800">
                        Live sentence heuristics, burstiness variability, and paragraph entropy profiles are continuously monitored to iteratively train and upgrade the model weights to defeat next-generation commercial AI detectors (Turnitin, GPTZero, CopyLeaks).
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-white px-2 py-1 rounded shadow-xs border border-indigo-200 shrink-0 self-start sm:self-center">
                    Future-Ready AI Engine
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Statistics */}
        {result && (
          <Stats
            originalText={inputText}
            rewrittenText={result.rewrittenText}
          />
        )}
      </div>
    </main>
  );
}
