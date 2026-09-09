/**
 * A single shared password keeps the generator private without a login system.
 * Empty APP_PASSWORD means open access (local development).
 */
export function authorized(req: Request): boolean {
  const required = process.env.APP_PASSWORD;
  if (!required) return true;
  return req.headers.get("x-app-password") === required;
}

/** The Anthropic key to use for this request: the user's own key from the app, else the server's. */
export function apiKeyFor(req: Request): string | undefined {
  const fromUser = req.headers.get("x-anthropic-key")?.trim();
  if (fromUser && /^sk-ant-/.test(fromUser)) return fromUser;
  return process.env.ANTHROPIC_API_KEY || undefined;
}

/** Demo mode: forced by MOCK_MODE, or automatic when no key is available for this request. */
export function mockMode(req?: Request): boolean {
  if (process.env.MOCK_MODE === "1" || process.env.MOCK_MODE === "true") return true;
  return !(req ? apiKeyFor(req) : process.env.ANTHROPIC_API_KEY);
}

export const MODELS = { "claude-opus-5": "Claude Opus 5 (best quality)", "claude-sonnet-5": "Claude Sonnet 5 (faster, cheaper)" } as const;
export type ModelId = keyof typeof MODELS;

/** The model chosen in the app, defaulting to Opus 5. */
export function modelFor(req: Request): ModelId {
  const m = req.headers.get("x-model") as ModelId | null;
  return m && m in MODELS ? m : "claude-opus-5";
}
