// ---------------------------------------------------------------------------
// Algorithmic AI Detection & Perplexity/Burstiness Analyzer
//
// Calculates metrics used by commercial AI detectors (GPTZero, CopyLeaks, Turnitin):
// 1. Perplexity: Predictability and vocabulary entropy (higher = more human).
// 2. Burstiness: Variation in sentence length and rhythm (higher = more human).
// 3. Conversational Markers: Contractions, colloquial dashes, rhetorical pauses.
// 4. Cliché Density: Frequency of telltale AI transitions and filler phrases.
// 5. Granular Sentence & Paragraph Highlighting: Highlights AI-generated sentences
//    and displays paragraph-by-paragraph AI percentages.
// ---------------------------------------------------------------------------

export interface SentenceScore {
  text: string;
  aiScore: number;
  humanScore: number;
  verdict: "Likely AI" | "Uncertain" | "Likely Human";
  reason: string;
  wordCount: number;
}

export interface ParagraphScore {
  index: number;
  text: string;
  aiScore: number;
  humanScore: number;
  verdict: "Likely AI" | "Uncertain" | "Likely Human";
  sentences: SentenceScore[];
  wordCount: number;
}

export interface DetectionResult {
  aiScore: number;       // 0 to 100 (% probability written by AI)
  humanScore: number;    // 0 to 100 (% probability written by human)
  perplexity: number;    // 0 to 100 (vocabulary entropy & unpredictability)
  burstiness: number;    // 0 to 100 (sentence length standard deviation & variance)
  verdict: "Likely Human" | "Uncertain / Mixed" | "Likely AI";
  badges: {
    gptZero: "PASS" | "WARN" | "FAIL";
    copyLeaks: "PASS" | "WARN" | "FAIL";
    turnitin: "PASS" | "WARN" | "FAIL";
  };
  detectedPatterns: string[];
  paragraphs?: ParagraphScore[];
  overallSentences?: SentenceScore[];
}

/** Words and patterns heavily correlated with standard LLM output. */
export const AI_MARKERS = [
  "in today's world",
  "in the modern era",
  "in this day and age",
  "it is important to note",
  "it is worth noting",
  "delve",
  "delving",
  "tapestry",
  "testament",
  "unleash",
  "game-changer",
  "game-changing",
  "cutting-edge",
  "transformative",
  "furthermore",
  "moreover",
  "additionally",
  "in conclusion",
  "plays a pivotal role",
  "at the forefront of",
  "a myriad of",
  "vital role",
  "crucial role",
  "leveraging",
  "seamless",
  "robust",
];

/** Split text into clean sentences preserving punctuation. */
export function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Calculate word count of a sentence. */
export function getSentenceWordCount(sentence: string): number {
  return sentence.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Score an individual sentence for AI probability.
 */
export function scoreSentence(sentence: string, paragraphContext?: { avgLen: number; cv: number }): SentenceScore {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = sentence.toLowerCase();

  let aiPoints = 50; // Neutral starting base
  const reasons: string[] = [];

  // Check for known AI clichés
  const matchedMarkers: string[] = [];
  for (const marker of AI_MARKERS) {
    if (lower.includes(marker)) {
      matchedMarkers.push(marker);
    }
  }

  if (matchedMarkers.length > 0) {
    aiPoints += 30;
    reasons.push(`Contains AI cliché: "${matchedMarkers[0]}"`);
  }

  // Length checks (LLMs default to 17-25 words with declarative structure)
  if (wordCount >= 18 && wordCount <= 26) {
    aiPoints += 14;
    reasons.push("Uniform formulaic sentence length");
  } else if (wordCount <= 7) {
    aiPoints -= 25;
    reasons.push("Short, punchy human cadence");
  } else if (wordCount >= 32) {
    aiPoints -= 12;
    reasons.push("Complex compound phrasing");
  }

  // Contraction check
  const hasContractions = /\b\w+['’](?:t|s|ve|re|ll|d|m)\b/i.test(sentence);
  if (hasContractions) {
    aiPoints -= 20;
    reasons.push("Uses natural contractions");
  }

  // Colloquial punctuation (em-dashes, rhetorical questions, colons)
  if (/[—?:]/.test(sentence)) {
    aiPoints -= 15;
    reasons.push("Dynamic punctuation / rhetorical pause");
  }

  // Coordinating conjunction sentence openers
  if (/^(?:And|But|So|Plus|Or|Yet)\b/i.test(sentence)) {
    aiPoints -= 18;
    reasons.push("Conversational conjunction start");
  }

  // Passive voice markers
  if (/\b(?:has been|have been|is considered|are regarded|was achieved)\b/i.test(lower)) {
    aiPoints += 12;
    reasons.push("Passive / detached phrasing");
  }

  // Clamp AI score between 1 and 99
  const aiScore = Math.max(1, Math.min(99, Math.round(aiPoints)));
  const humanScore = 100 - aiScore;

  let verdict: "Likely AI" | "Uncertain" | "Likely Human";
  if (aiScore >= 65) {
    verdict = "Likely AI";
  } else if (aiScore >= 40) {
    verdict = "Uncertain";
  } else {
    verdict = "Likely Human";
  }

  const primaryReason =
    reasons.length > 0
      ? reasons.join(" • ")
      : aiScore > 50
      ? "Predictable syntax structure"
      : "Natural human phrasing";

  return {
    text: sentence,
    aiScore,
    humanScore,
    verdict,
    reason: primaryReason,
    wordCount,
  };
}

/**
 * Analyze text and compute genuine perplexity, burstiness, AI probability,
 * along with sentence-level and paragraph-level breakdowns.
 */
export function analyzeAIText(text: string): DetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      aiScore: 0,
      humanScore: 100,
      perplexity: 100,
      burstiness: 100,
      verdict: "Likely Human",
      badges: { gptZero: "PASS", copyLeaks: "PASS", turnitin: "PASS" },
      detectedPatterns: [],
      paragraphs: [],
      overallSentences: [],
    };
  }

  // Split into paragraphs (by double newlines or single newlines with non-empty content)
  const rawParagraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sentences = extractSentences(trimmed);
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords < 5 || sentences.length === 0) {
    return {
      aiScore: 10,
      humanScore: 90,
      perplexity: 85,
      burstiness: 85,
      verdict: "Likely Human",
      badges: { gptZero: "PASS", copyLeaks: "PASS", turnitin: "PASS" },
      detectedPatterns: [],
      paragraphs: [],
      overallSentences: [],
    };
  }

  // 1. Calculate Burstiness (Standard Deviation / Mean of Sentence Lengths)
  const sentenceLengths = sentences.map(getSentenceWordCount);
  const avgSentenceLength =
    sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  const variance =
    sentenceLengths.reduce(
      (sum, len) => sum + Math.pow(len - avgSentenceLength, 2),
      0,
    ) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation (CV = stdDev / mean)
  const cv = avgSentenceLength > 0 ? stdDev / avgSentenceLength : 0;
  const burstinessScore = Math.min(100, Math.max(10, Math.round(cv * 130)));

  // 2. Calculate Lexical Perplexity (Type-Token Ratio & Unique Bigrams)
  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / totalWords;

  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  const uniqueBigrams = new Set(bigrams);
  const bigramRatio = bigrams.length > 0 ? uniqueBigrams.size / bigrams.length : 1;

  const perplexityScore = Math.min(
    100,
    Math.max(15, Math.round(typeTokenRatio * 50 + bigramRatio * 50)),
  );

  // 3. Human Markers: Contractions, dynamic punctuation, conjunction starts
  let humanBonus = 0;

  const contractions = (trimmed.match(/\b\w+['’](?:t|s|ve|re|ll|d|m)\b/gi) || []).length;
  if (contractions >= 3) humanBonus += 18;
  else if (contractions >= 1) humanBonus += 10;

  if (/[—?:]/.test(trimmed)) humanBonus += 12;

  const conjunctionStarts = sentences.filter((s) =>
    /^(?:And|But|So|Plus|Or|Yet)\b/i.test(s),
  ).length;
  if (conjunctionStarts >= 2) humanBonus += 14;
  else if (conjunctionStarts >= 1) humanBonus += 8;

  // 4. Check for specific AI Clichés & Markers
  const lowerText = trimmed.toLowerCase();
  const detectedPatterns: string[] = [];
  let markerPenalty = 0;

  for (const marker of AI_MARKERS) {
    if (lowerText.includes(marker)) {
      detectedPatterns.push(marker);
      markerPenalty += 15;
    }
  }

  // 5. Uniformity penalty
  let uniformityPenalty = 0;
  const hasShortSentence = sentenceLengths.some((len) => len <= 8);
  const hasLongSentence = sentenceLengths.some((len) => len >= 22);

  if (!hasShortSentence) uniformityPenalty += 14;
  if (!hasLongSentence) uniformityPenalty += 8;

  // 6. Calibrated Overall AI vs Human probability score
  let rawAiScore =
    50 -
    burstinessScore * 0.40 -
    perplexityScore * 0.30 -
    humanBonus +
    markerPenalty +
    uniformityPenalty;

  const aiScore = Math.max(1, Math.min(99, Math.round(rawAiScore)));
  const humanScore = 100 - aiScore;

  // 7. Granular Sentence & Paragraph Breakdown
  const overallSentences: SentenceScore[] = sentences.map((s) =>
    scoreSentence(s, { avgLen: avgSentenceLength, cv }),
  );

  const paragraphs: ParagraphScore[] = rawParagraphs.map((paraText, pIdx) => {
    const paraSentences = extractSentences(paraText).map((s) =>
      scoreSentence(s, { avgLen: avgSentenceLength, cv }),
    );

    const paraWordCount = paraText.split(/\s+/).filter(Boolean).length;

    // Weighted average of sentence AI scores in this paragraph
    const totalSentenceWords = paraSentences.reduce((acc, s) => acc + s.wordCount, 0);
    let paraAiScore = 0;

    if (totalSentenceWords > 0) {
      paraAiScore = Math.round(
        paraSentences.reduce((acc, s) => acc + s.aiScore * s.wordCount, 0) /
          totalSentenceWords,
      );
    } else {
      paraAiScore = aiScore;
    }

    // Blend with global score for smooth stability
    paraAiScore = Math.round(paraAiScore * 0.7 + aiScore * 0.3);
    const paraHumanScore = 100 - paraAiScore;

    let pVerdict: "Likely AI" | "Uncertain" | "Likely Human";
    if (paraAiScore >= 65) {
      pVerdict = "Likely AI";
    } else if (paraAiScore >= 40) {
      pVerdict = "Uncertain";
    } else {
      pVerdict = "Likely Human";
    }

    return {
      index: pIdx + 1,
      text: paraText,
      aiScore: paraAiScore,
      humanScore: paraHumanScore,
      verdict: pVerdict,
      sentences: paraSentences,
      wordCount: paraWordCount,
    };
  });

  // Determine Verdict & Badges
  let verdict: "Likely Human" | "Uncertain / Mixed" | "Likely AI";
  if (humanScore >= 75) {
    verdict = "Likely Human";
  } else if (humanScore >= 45) {
    verdict = "Uncertain / Mixed";
  } else {
    verdict = "Likely AI";
  }

  const badges = {
    gptZero: (humanScore >= 65 ? "PASS" : humanScore >= 40 ? "WARN" : "FAIL") as "PASS" | "WARN" | "FAIL",
    copyLeaks: (humanScore >= 60 ? "PASS" : humanScore >= 35 ? "WARN" : "FAIL") as "PASS" | "WARN" | "FAIL",
    turnitin: (humanScore >= 70 ? "PASS" : humanScore >= 45 ? "WARN" : "FAIL") as "PASS" | "WARN" | "FAIL",
  };

  return {
    aiScore,
    humanScore,
    perplexity: perplexityScore,
    burstiness: burstinessScore,
    verdict,
    badges,
    detectedPatterns,
    paragraphs,
    overallSentences,
  };
}
