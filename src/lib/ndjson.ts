import type { StreamEvent } from "./schemas";
import { describeError } from "./claude";

/**
 * Wraps a stage function in a streaming NDJSON response. The stage receives an
 * emit() callback; every event becomes one line the browser can parse as it lands.
 */
export function streamResponse(run: (emit: (e: StreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await run(emit);
      } catch (err) {
        emit({ type: "error", message: describeError(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}
