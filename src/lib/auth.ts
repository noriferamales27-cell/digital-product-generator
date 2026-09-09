/**
 * A single shared password keeps the generator private without a login system.
 * Empty APP_PASSWORD means open access (local development).
 */
export function authorized(req: Request): boolean {
  const required = process.env.APP_PASSWORD;
  if (!required) return true;
  return req.headers.get("x-app-password") === required;
}

/**
 * Demo mode: on when MOCK_MODE is set, or when there is no Anthropic key at all.
 * That way a fresh deploy shows the full flow with sample data instead of failing.
 */
export function mockMode(): boolean {
  if (process.env.MOCK_MODE === "1" || process.env.MOCK_MODE === "true") return true;
  return !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN;
}
