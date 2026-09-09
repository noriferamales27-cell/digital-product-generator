import { apiKeyFor, authorized, mockMode, modelFor } from "@/lib/auth";
import { parseJson, runStage } from "@/lib/claude";
import { mockLaunch } from "@/lib/mock";
import { jsonError, streamResponse } from "@/lib/ndjson";
import { launchSystem, launchUser } from "@/lib/prompts";
import { LaunchInput, LaunchResult } from "@/lib/schemas";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = LaunchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Generate the product first.");
  const input = parsed.data;

  return streamResponse(async (emit) => {
    if (mockMode(req)) {
      await new Promise((r) => setTimeout(r, 600));
      emit({ type: "result", data: mockLaunch(input.product_title) });
      return;
    }
    emit({ type: "status", text: `Building the launch kit for ${input.product_title}` });
    const text = await runStage({
      apiKey: apiKeyFor(req),
      model: modelFor(req),
      system: launchSystem(input.brand),
      user: launchUser(input),
      emit,
      format: LaunchResult,
      effort: "high",
      maxTokens: 32000,
    });
    emit({ type: "result", data: parseJson(text, LaunchResult) });
  });
}
