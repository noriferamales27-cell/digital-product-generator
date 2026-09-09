import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { StreamEvent } from "./schemas";

export const MODEL = "claude-opus-5";

let cached: Anthropic | null = null;
export function client(): Anthropic {
  if (!cached) cached = new Anthropic();
  return cached;
}

export type Emit = (event: StreamEvent) => void;

type RunOptions = {
  system: string;
  user: string;
  emit: Emit;
  /** Allow Claude to search the web. Off for pure generation steps. */
  webSearch?: { maxUses: number };
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Stream text deltas to the client as they arrive. */
  streamText?: boolean;
  /** Constrain the output to a JSON schema. */
  format?: z.ZodType;
};

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Runs one stage of the generator: a single Claude turn that may use web search
 * (with pause_turn resumed automatically) and streams progress back to the UI.
 * Returns the full text of the final assistant message.
 */
export async function runStage(opts: RunOptions): Promise<string> {
  const anthropic = client();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.user }];
  const tools: Anthropic.ToolUnion[] = opts.webSearch
    ? [{ type: "web_search_20260209", name: "web_search", max_uses: opts.webSearch.maxUses }]
    : [];

  let useFormat = Boolean(opts.format);
  let finalText = "";

  for (let iteration = 0; iteration < 8; iteration++) {
    const params: Anthropic.MessageStreamParams = {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 32000,
      system: opts.system,
      messages,
      thinking: { type: "adaptive" },
      output_config: {
        effort: opts.effort ?? "high",
        ...(useFormat && opts.format ? { format: zodOutputFormat(opts.format) } : {}),
      },
      ...(tools.length ? { tools } : {}),
    };

    let message: Anthropic.Message;
    try {
      const stream = anthropic.messages.stream(params);
      stream.on("contentBlock", (block) => {
        if (block.type === "server_tool_use" && block.name === "web_search") {
          const input = block.input as { query?: string };
          if (input?.query) opts.emit({ type: "search", query: input.query });
        }
      });
      if (opts.streamText) {
        stream.on("text", (delta) => opts.emit({ type: "delta", text: delta }));
      }
      message = await stream.finalMessage();
    } catch (err) {
      // Structured output plus server tools is the newest combination in this
      // request. If the API rejects the format parameter, fall back to prompt-only
      // JSON and parse it ourselves.
      if (err instanceof Anthropic.BadRequestError && useFormat && /output_config|format/i.test(err.message)) {
        useFormat = false;
        opts.emit({ type: "status", text: "Retrying without strict schema mode" });
        iteration--;
        continue;
      }
      throw err;
    }

    if (message.stop_reason === "refusal") {
      const why = message.stop_details && "explanation" in message.stop_details ? message.stop_details.explanation : "";
      throw new Error(`The model declined this request. ${why ?? ""}`.trim());
    }

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      opts.emit({ type: "status", text: "Still researching" });
      continue;
    }

    if (message.stop_reason === "max_tokens") {
      throw new Error("The response ran out of room. Try a shorter length.");
    }

    finalText = extractText(message);
    break;
  }

  if (!finalText) throw new Error("No text came back from the model.");
  return finalText;
}

/** Pulls the first JSON object out of a text response and validates it. */
export function parseJson<T>(text: string, schema: z.ZodType<T>): T {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidates.unshift(fence[1].trim());
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(trimmed.slice(first, last + 1));

  let lastError: unknown = null;
  for (const c of candidates) {
    try {
      return schema.parse(JSON.parse(c));
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(`Could not read the model's JSON: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the API. Wait a minute and try again.";
  if (err instanceof Anthropic.APIConnectionError) return "Could not reach the Anthropic API.";
  if (err instanceof Anthropic.APIError) return `API error ${err.status}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
