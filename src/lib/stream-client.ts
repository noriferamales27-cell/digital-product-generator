import type { StreamEvent } from "./schemas";

/**
 * Posts to a generator route and yields each NDJSON event as it arrives.
 * Throws on HTTP errors and on an { type: "error" } event.
 */
const KEY = "dpg.anthropicKey";
export function getApiKey(): string {
  try { return JSON.parse(localStorage.getItem(KEY) || '""'); } catch { return ""; }
}
export function setApiKey(key: string) {
  try { localStorage.setItem(KEY, JSON.stringify(key.trim())); } catch {}
}
const MODEL_KEY = "dpg.model";
export function getModel(): string {
  try { return JSON.parse(localStorage.getItem(MODEL_KEY) || '"claude-opus-5"'); } catch { return "claude-opus-5"; }
}
export function setModel(m: string) {
  try { localStorage.setItem(MODEL_KEY, JSON.stringify(m)); } catch {}
}
export function authHeaders(password: string): Record<string, string> {
  const h: Record<string, string> = { "x-app-password": password, "x-model": getModel() };
  const k = getApiKey();
  if (k) h["x-anthropic-key"] = k;
  return h;
}

export async function* streamStage(path: string, body: unknown, password: string): AsyncGenerator<StreamEvent> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(password) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(j.error ?? "Request failed");
  }
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "error") throw new Error(event.message);
      yield event;
    }
  }
  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim()) as StreamEvent;
    if (event.type === "error") throw new Error(event.message);
    yield event;
  }
}

export function downloadText(filename: string, text: string, mime = "text/markdown") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadDocx(title: string, author: string, markdown: string, password: string) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(password) },
    body: JSON.stringify({ title, author, markdown }),
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function slug(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
