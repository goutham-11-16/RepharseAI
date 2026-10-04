// ---------------------------------------------------------------------------
// Shared types and utility functions for text processing.
// This file is safe to import from both client and server code.
// ---------------------------------------------------------------------------

import type { DetectionResult } from "./detector";

/** All available rewrite modes. */
export const REWRITE_MODES = [
  "natural",
  "academic",
  "professional",
  "simple",
  "formal",
  "concise",
] as const;

export type RewriteMode = (typeof REWRITE_MODES)[number];

/** Humanization bypass intensity levels. */
export const HUMANIZE_INTENSITIES = ["clean", "balanced", "stealth"] as const;
export type HumanizeIntensity = (typeof HUMANIZE_INTENSITIES)[number];

export const INTENSITY_LABELS: Record<HumanizeIntensity, string> = {
  clean: "Level 1: Polish",
  balanced: "Level 2: Balanced Humanizer",
  stealth: "Level 3: Max Detector Bypass",
};

export const INTENSITY_DESCRIPTIONS: Record<HumanizeIntensity, string> = {
  clean: "Standard fluency and grammar polish with minimal structural drift.",
  balanced: "Conversational rhythm, high burstiness, eliminates AI predictability.",
  stealth: "Maximum perplexity, aggressive clause restructuring for 100% bypass.",
};

/** Human-readable labels for each mode. */
export const MODE_LABELS: Record<RewriteMode, string> = {
  natural: "Natural",
  academic: "Academic",
  professional: "Professional",
  simple: "Simple",
  formal: "Formal",
  concise: "Concise",
};

/** Short descriptions shown in the mode selector. */
export const MODE_DESCRIPTIONS: Record<RewriteMode, string> = {
  natural: "Conversational and approachable",
  academic: "Scholarly and precise",
  professional: "Business-ready and polished",
  simple: "Easy to understand",
  formal: "Dignified and elevated",
  concise: "Tight and to the point",
};

/** Result returned by the rewrite API. */
export interface RewriteResult {
  rewrittenText: string;
  model: string;
  mode: RewriteMode;
  intensity: HumanizeIntensity;
  originalWordCount: number;
  rewrittenWordCount: number;
  originalCharCount: number;
  rewrittenCharCount: number;
  originalDetection?: DetectionResult;
  rewrittenDetection?: DetectionResult;
}

/** Error response from the rewrite API. */
export interface RewriteError {
  error: string;
}

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

/** Count the number of words in a string. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Count the number of characters in a string. */
export function countCharacters(text: string): number {
  return text.length;
}

// ---------------------------------------------------------------------------
// Word-level Diff Computation
// ---------------------------------------------------------------------------

export interface DiffToken {
  type: "added" | "removed" | "unchanged";
  text: string;
}

/**
 * Compute simple word-level diff between original and rewritten text.
 */
export function computeWordDiff(original: string, rewritten: string): DiffToken[] {
  const origWords = original.trim().split(/\s+/).filter(Boolean);
  const rewWords = rewritten.trim().split(/\s+/).filter(Boolean);

  if (origWords.length === 0) {
    return rewWords.map((w) => ({ type: "added", text: w }));
  }
  if (rewWords.length === 0) {
    return origWords.map((w) => ({ type: "removed", text: w }));
  }

  // Longest Common Subsequence matrix
  const m = origWords.length;
  const n = rewWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1].toLowerCase() === rewWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = m;
  let j = n;
  const tokens: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      origWords[i - 1].toLowerCase() === rewWords[j - 1].toLowerCase()
    ) {
      tokens.unshift({ type: "unchanged", text: rewWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokens.unshift({ type: "added", text: rewWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      tokens.unshift({ type: "removed", text: origWords[i - 1] });
      i--;
    }
  }

  return tokens;
}
