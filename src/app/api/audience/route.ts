import { apiKeyFor, authorized, mockMode, modelFor } from "@/lib/auth";
import { parseJson, runStage } from "@/lib/claude";
import { mockAudience } from "@/lib/mock";
import { jsonError, streamResponse } from "@/lib/ndjson";
import { audienceSystem, audienceUser } from "@/lib/prompts";
import { AudienceInput, AudienceResult } from "@/lib/schemas";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = AudienceInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Pick an opportunity first.");
  const { opportunity, region } = parsed.data;

  return streamResponse(async (emit) => {
    if (mockMode(req)) {
      emit({ type: "search", query: `${opportunity.audience} facebook group` });
      await new Promise((r) => setTimeout(r, 600));
      emit({ type: "result", data: mockAudience(opportunity.name) });
      return;
    }
    emit({ type: "status", text: `Finding buyers for ${opportunity.name}` });
    const text = await runStage({
      apiKey: apiKeyFor(req),
      model: modelFor(req),
      system: audienceSystem(),
      user: audienceUser(opportunity, region),
      emit,
      webSearch: { maxUses: 12 },
      format: AudienceResult,
      effort: "high",
      maxTokens: 20000,
    });
    emit({ type: "result", data: parseJson(text, AudienceResult) });
  });
}
