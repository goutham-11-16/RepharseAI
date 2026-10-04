import { NextRequest, NextResponse } from "next/server";
import { rewriteText } from "@/lib/ollama";
import {
  REWRITE_MODES,
  RewriteMode,
  HUMANIZE_INTENSITIES,
  HumanizeIntensity,
} from "@/lib/text-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode, intensity = "balanced" } = body as {
      text?: string;
      mode?: string;
      intensity?: string;
    };

    // --- Validate input ----------------------------------------------------
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required and cannot be empty." },
        { status: 400 },
      );
    }

    if (
      !mode ||
      typeof mode !== "string" ||
      !REWRITE_MODES.includes(mode as RewriteMode)
    ) {
      return NextResponse.json(
        {
          error: `Invalid mode. Must be one of: ${REWRITE_MODES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const validIntensity = HUMANIZE_INTENSITIES.includes(
      intensity as HumanizeIntensity,
    )
      ? (intensity as HumanizeIntensity)
      : "balanced";

    // --- Rewrite -----------------------------------------------------------
    const result = await rewriteText(
      text.trim(),
      mode as RewriteMode,
      validIntensity,
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[POST /api/rewrite]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
