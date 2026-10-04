// ---------------------------------------------------------------------------
// Prompt builder — reads the template from prompts/rewrite.txt and injects
// mode-specific instructions, bypass intensity directives, and user text.
//
// SERVER-ONLY: uses Node.js `fs` and `path`.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { RewriteMode, HumanizeIntensity } from "./text-utils";

/**
 * Mode-specific instructions injected into the prompt template.
 * Edit these to change the rewriting style without touching the template file.
 */
const MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  natural:
    "Rewrite in a natural, conversational tone — like a knowledgeable friend " +
    "explaining something clearly. Use contractions (don't, it's, they've) " +
    "where they sound natural. Mix sentence lengths: follow a longer " +
    "explanatory sentence with a short direct one. Start some sentences " +
    "with 'But', 'And', or 'So' when it feels right. Use everyday vocabulary " +
    "— if a simpler word works just as well, prefer it. The reader should " +
    "feel like a real person wrote this, not a machine.",

  academic:
    "Rewrite in a scholarly academic tone suitable for a peer-reviewed " +
    "journal or thesis. Use precise, discipline-appropriate terminology. " +
    "Employ hedging language where appropriate ('suggests', 'appears to', " +
    "'may indicate') rather than absolute claims. Structure sentences to " +
    "foreground evidence and methodology. Vary between complex and compound " +
    "sentences — avoid making every sentence the same length. Do NOT use " +
    "generic academic filler ('it is important to note', 'studies have shown') " +
    "without specific referents. Keep the tone authoritative but not pompous.",

  professional:
    "Rewrite in a clean, professional business tone — the kind you'd see in " +
    "a well-written company blog post, investor update, or internal memo. " +
    "Be direct and confident. Lead with the key point in each paragraph. " +
    "Avoid corporate buzzwords and jargon soup ('synergy', 'leverage', " +
    "'paradigm'). Use action verbs. Keep sentences tight but not choppy — " +
    "aim for a rhythm that's easy to scan. This should read like it was " +
    "written by a competent professional, not a PR template.",

  simple:
    "Rewrite using simple, plain language that anyone can understand — aim " +
    "for an 8th-grade reading level. Use short sentences (under 20 words " +
    "each when possible). Pick the most common word available: 'use' not " +
    "'utilize', 'help' not 'facilitate', 'start' not 'commence'. Break " +
    "complex ideas into smaller pieces. One idea per sentence. Avoid " +
    "jargon — if a technical term must stay, briefly explain it in context. " +
    "The result should be instantly clear on first read.",

  formal:
    "Rewrite in a formal, dignified tone appropriate for official " +
    "correspondence, legal documents, or executive communications. Use " +
    "complete sentences without contractions. Choose precise, elevated " +
    "vocabulary — but avoid sounding archaic or artificially stiff. " +
    "Maintain a measured cadence: vary between shorter declarative " +
    "sentences and longer qualified ones. The tone should convey authority " +
    "and gravitas without sacrificing clarity. Avoid colloquialisms, " +
    "slang, and informal expressions.",

  concise:
    "Rewrite to be as concise as possible — aim to reduce word count by " +
    "20-30% while preserving every key fact and the overall meaning. " +
    "Cut filler words, redundant phrases, and unnecessary qualifiers. " +
    "Combine sentences where doing so improves density without hurting " +
    "clarity. Prefer active voice. Remove throat-clearing openings. " +
    "Every word should earn its place. The result should be tight, " +
    "information-dense, and scannable.",
};

/**
 * Intensity modifiers that control detector bypass strength and syntactic burstiness.
 */
const INTENSITY_MODIFIERS: Record<HumanizeIntensity, string> = {
  clean:
    "Intensity: Level 1 (Polish). Keep the text's original structure mostly intact. Focus on fixing grammar, improving word choice, and polishing sentence flow while keeping the layout close to the input.",

  balanced:
    "Intensity: Level 2 (Balanced Humanizer). Apply high burstiness and varied sentence lengths. Break up monotonous sentence structures, replace overly formal transitions with natural conversational links, and introduce authentic human cadence.",

  stealth:
    "Intensity: Level 3 (Max Detector Bypass). Prioritize maximum perplexity and structural unpredictability to bypass strict statistical AI detectors. Radically vary sentence lengths (insert very short 3-6 word sentences alongside longer compound thoughts). Invert clause orders, use punchy verbs, insert conversational pauses, and ensure zero predictable LLM transition patterns remain.",
};

/** Cache the template after first read (cleared on server restart / HMR). */
let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;

  const templatePath = path.join(process.cwd(), "prompts", "rewrite.txt");
  cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  return cachedTemplate;
}

/**
 * Build the full rewrite prompt by injecting mode instructions, intensity directives,
 * and user text into the template.
 */
export function buildRewritePrompt(
  text: string,
  mode: RewriteMode,
  intensity: HumanizeIntensity = "balanced",
): string {
  const template = loadTemplate();
  const fullStyleInstruction = `${MODE_INSTRUCTIONS[mode]}\n\n${INTENSITY_MODIFIERS[intensity]}`;

  return template
    .replace("{{MODE_INSTRUCTION}}", fullStyleInstruction)
    .replace("{{TEXT}}", text);
}

/**
 * Invalidate the cached template. Useful during development when
 * experimenting with prompt changes.
 */
export function clearPromptCache(): void {
  cachedTemplate = null;
}
