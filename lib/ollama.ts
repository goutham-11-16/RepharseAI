// ---------------------------------------------------------------------------
// Ollama client — sends rewrite requests to the local Ollama instance.
//
// SERVER-ONLY: called from API routes only.
//
// Isolated so that Phase 2's document-processing pipeline can import and
// reuse `rewriteText()` without any UI coupling.
// ---------------------------------------------------------------------------

import { buildRewritePrompt } from "./prompts";
import {
  countWords,
  countCharacters,
  RewriteMode,
  RewriteResult,
  HumanizeIntensity,
} from "./text-utils";
import { analyzeAIText } from "./detector";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

/** Timeout for a single rewrite request (ms). */
const REQUEST_TIMEOUT_MS = 180_000;

/**
 * Send text to Ollama for rewriting and return the structured result with detection scores.
 */
export async function rewriteText(
  text: string,
  mode: RewriteMode,
  intensity: HumanizeIntensity = "balanced",
): Promise<RewriteResult> {
  const prompt = buildRewritePrompt(text, mode, intensity);

  // ---- Call Ollama --------------------------------------------------------
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        think: false,
        options: {
          temperature: intensity === "stealth" ? 0.85 : intensity === "clean" ? 0.5 : 0.75,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_predict: 2048,
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error(
        "Request timed out after 3 minutes. The model may be processing very long text.",
      );
    }
    throw new Error(
      `Cannot connect to Ollama at ${OLLAMA_HOST}. Make sure Ollama is running.`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404 || body.includes("not found")) {
      throw new Error(
        `Model "${OLLAMA_MODEL}" is not installed. Run: ollama pull ${OLLAMA_MODEL}`,
      );
    }
    throw new Error(`Ollama error (${response.status}): ${body}`);
  }

  const data = await response.json();
  let rewrittenText = (data.response || "").trim();

  // Strip <think>…</think> blocks if present
  rewrittenText = rewrittenText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  if (!rewrittenText) {
    throw new Error("The model returned an empty response. Try again.");
  }

  // Calculate real-time detection telemetry for both original and rewritten
  const originalDetection = analyzeAIText(text);
  const rewrittenDetection = analyzeAIText(rewrittenText);

  return {
    rewrittenText,
    model: OLLAMA_MODEL,
    mode,
    intensity,
    originalWordCount: countWords(text),
    rewrittenWordCount: countWords(rewrittenText),
    originalCharCount: countCharacters(text),
    rewrittenCharCount: countCharacters(rewrittenText),
    originalDetection,
    rewrittenDetection,
  };
}

/**
 * Stream rewritten text token-by-token from Ollama.
 */
export async function* streamRewriteTokens(
  text: string,
  mode: RewriteMode,
  intensity: HumanizeIntensity = "balanced",
): AsyncGenerator<{ token: string; done: boolean; result?: RewriteResult }> {
  const prompt = buildRewritePrompt(text, mode, intensity);

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: true,
      think: false,
      options: {
        temperature: intensity === "stealth" ? 0.85 : intensity === "clean" ? 0.5 : 0.75,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_predict: 2048,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to stream from Ollama (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          accumulatedText += parsed.response;
          yield { token: parsed.response, done: false };
        }
        if (parsed.done) {
          // Clean final accumulated text
          let cleanFinal = accumulatedText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          const originalDetection = analyzeAIText(text);
          const rewrittenDetection = analyzeAIText(cleanFinal);

          yield {
            token: "",
            done: true,
            result: {
              rewrittenText: cleanFinal,
              model: OLLAMA_MODEL,
              mode,
              intensity,
              originalWordCount: countWords(text),
              rewrittenWordCount: countWords(cleanFinal),
              originalCharCount: countCharacters(text),
              rewrittenCharCount: countCharacters(cleanFinal),
              originalDetection,
              rewrittenDetection,
            },
          };
          return;
        }
      } catch {
        // Ignore unparseable chunks
      }
    }
  }
}

/** Return the configured model name (for display). */
export function getModelName(): string {
  return OLLAMA_MODEL;
}
