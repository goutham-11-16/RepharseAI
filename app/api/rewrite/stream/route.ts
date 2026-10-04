import { NextRequest } from "next/server";
import { streamRewriteTokens } from "@/lib/ollama";
import {
  REWRITE_MODES,
  RewriteMode,
  HUMANIZE_INTENSITIES,
  HumanizeIntensity,
} from "@/lib/text-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode = "natural", intensity = "balanced" } = body as {
      text?: string;
      mode?: string;
      intensity?: string;
    };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!REWRITE_MODES.includes(mode as RewriteMode)) {
      return new Response(JSON.stringify({ error: "Invalid mode." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validIntensity = HUMANIZE_INTENSITIES.includes(
      intensity as HumanizeIntensity,
    )
      ? (intensity as HumanizeIntensity)
      : "balanced";

    // Set up Server-Sent Events (SSE) stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamRewriteTokens(
            text.trim(),
            mode as RewriteMode,
            validIntensity,
          )) {
            if (chunk.done && chunk.result) {
              const data = JSON.stringify({ type: "done", result: chunk.result });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.token) {
              const data = JSON.stringify({ type: "token", token: chunk.token });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.close();
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error streaming response.";
          const errorData = JSON.stringify({ type: "error", error: message });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
