/**
 * A single shared password keeps the generator private without a login system.
 * Empty APP_PASSWORD means open access (local development).
 */
export function authorized(req: Request): boolean {
  const required = process.env.APP_PASSWORD;
  if (!required) return true;
  return req.headers.get("x-app-password") === required;
}

export function mockMode(): boolean {
  return process.env.MOCK_MODE === "1" || process.env.MOCK_MODE === "true";
}
