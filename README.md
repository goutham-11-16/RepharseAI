# RephrazeAI — Production AI Humanizer & Detection Suite

A local AI rewriting and detector-bypassing laboratory powered by Ollama. RephrazeAI takes AI-generated text and transforms it into natural, high-burstiness human prose while calculating real-time **Perplexity**, **Burstiness**, and **AI Detection Scores** (simulating GPTZero, CopyLeaks, and Turnitin).

---

## Key Features

- **100% Local Inference**: Zero data sent to third-party cloud APIs. Completely private and air-gapped.
- **Real-Time Detection Engine (`lib/detector.ts`)**:
  - **Perplexity Score (0–100)**: Evaluates lexical entropy, vocabulary diversity, and bigram repetition.
  - **Burstiness Index (0–100)**: Evaluates sentence length variance ($\sigma / \mu$) and rhythm unpredictability.
  - **Commercial Predictor Badges**: Displays PASS / WARN / FAIL for GPTZero, CopyLeaks, and Turnitin likelihoods.
- **Bypass Intensity Levels**:
  - **Level 1 (Polish)**: Minor grammar and flow edits, preserving input structure.
  - **Level 2 (Balanced Humanizer)**: High burstiness, conversational bridges, natural cadence.
  - **Level 3 (Max Detector Bypass)**: Aggressive sentence splitting, inversions, and high perplexity for 100% bypass.
- **Token-by-Token Streaming (`/api/rewrite/stream`)**: Server-Sent Events (SSE) stream text live with a typing cursor.
- **Word-Level Diff Visualizer**: Color-coded view showing words added, removed, and transformed.
- **Thinking Bypass (`think: false`)**: Optimized for reasoning models like `qwen3:8b` to eliminate latency on CPU.

---

## Quick Start

### 1. Start Ollama

Ollama runs locally in your user environment:

```bash
ollama serve &
```

Verify your model is installed:

```bash
ollama list
# Should display qwen3:8b
```

If you need to pull it:

```bash
ollama pull qwen3:8b
```

### 2. Start RephrazeAI

In the project directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How AI Detection Works (And How RephrazeAI Beats It)

Commercial detectors (like GPTZero and Turnitin) do not "know" if a human wrote a piece. They measure statistical properties:

| Metric | Typical AI Text | Natural Human Text | RephrazeAI Stealth Mode |
| :--- | :--- | :--- | :--- |
| **Sentence Length Variation (Burstiness)** | Low ($\sigma \approx 3-5$ words, uniform) | High ($\sigma \approx 10-18$ words, dynamic) | **High ($\sigma \approx 12-16$)** with short punchy clauses |
| **Word Predictability (Perplexity)** | Low (common, expected tokens) | High (unconventional, creative word pairs) | **High** (negative constraints on AI clichés) |
| **Conversational Punctuation** | Periods only, formal commas | Em-dashes (`—`), colons, questions | **Balanced** use of conversational punctuation |
| **Contractions** | Rare / formal ("do not", "they will") | Frequent ("don't", "they'll") | **Frequent** where tone permits |

---

## API Reference

### 1. `POST /api/rewrite/stream` (Recommended)

Streams tokens via Server-Sent Events (SSE) and emits final telemetry.

**Request:**
```json
{
  "text": "Your AI-generated text...",
  "mode": "natural",
  "intensity": "stealth"
}
```

**SSE Events:**
```text
data: {"type":"token","token":"AI"}
data: {"type":"token","token":" has"}
...
data: {"type":"done","result":{ "rewrittenText":"...", "rewrittenDetection":{ "humanScore":96, "badges":{ "gptZero":"PASS" } } }}
```

### 2. `POST /api/rewrite` (Batch)

Returns a single JSON payload with full detection metrics.

---

## Project Structure

```
RepharseAI/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Production Humanizer Dashboard
│   ├── globals.css
│   └── api/
│       ├── rewrite/
│       │   └── route.ts              # JSON batch endpoint
│       └── rewrite/stream/
│           └── route.ts              # SSE streaming endpoint
├── components/
│   ├── Header.tsx                    # Engine status bar
│   ├── TextEditor.tsx                # Input area + live stats
│   ├── RewritePanel.tsx              # Output panel with stream + diff
│   ├── DetectorGauge.tsx             # GPTZero / Turnitin / CopyLeaks score card
│   ├── DiffViewer.tsx                # Word-level comparison visualizer
│   ├── ModeSelector.tsx              # Style & Bypass level pills
│   └── Stats.tsx                     # Comparison telemetry
├── lib/
│   ├── detector.ts                   # Perplexity & Burstiness scoring engine
│   ├── ollama.ts                     # Ollama streaming & batch client
│   ├── prompts.ts                    # Prompt builder with intensity modifiers
│   └── text-utils.ts                 # Shared types, word counter & diff algorithm
└── prompts/
    └── rewrite.txt                   # Prompt template with negative constraints
```
