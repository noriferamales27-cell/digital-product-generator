import { apiKeyFor, mockMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Tells the UI whether Claude is connected for this browser and whether a password is set. */
export async function GET(req: Request) {
  const userKey = req.headers.get("x-anthropic-key")?.trim();
  return Response.json({
    mock: mockMode(req),
    passwordRequired: Boolean(process.env.APP_PASSWORD),
    connected: Boolean(apiKeyFor(req)),
    source: userKey ? "app" : process.env.ANTHROPIC_API_KEY ? "server" : "none",
  });
}
