import { authorized, mockMode } from "@/lib/auth";
import { parseJson, runStage } from "@/lib/claude";
import { mockResearch } from "@/lib/mock";
import { jsonError, streamResponse } from "@/lib/ndjson";
import { researchSystem, researchUser } from "@/lib/prompts";
import { ResearchInput, ResearchResult } from "@/lib/schemas";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = ResearchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Give a category to research.");
  const input = parsed.data;

  return streamResponse(async (emit) => {
    if (mockMode()) {
      emit({ type: "status", text: "Mock mode" });
      emit({ type: "search", query: `${input.category} best sellers etsy` });
      await new Promise((r) => setTimeout(r, 600));
      emit({ type: "result", data: mockResearch(input.category) });
      return;
    }
    emit({ type: "status", text: `Researching ${input.category}` });
    const text = await runStage({
      system: researchSystem(),
      user: researchUser(input),
      emit,
      webSearch: { maxUses: 14 },
      format: ResearchResult,
      effort: "high",
      maxTokens: 24000,
    });
    emit({ type: "result", data: parseJson(text, ResearchResult) });
  });
}
