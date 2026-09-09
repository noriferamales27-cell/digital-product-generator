import { authorized, mockMode } from "@/lib/auth";
import { parseJson, runStage } from "@/lib/claude";
import { mockPlanTurn } from "@/lib/mock";
import { jsonError, streamResponse } from "@/lib/ndjson";
import { planSystem, planUser } from "@/lib/prompts";
import { PlanInput, PlanTurn } from "@/lib/schemas";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = PlanInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Pick a product first.");
  const input = parsed.data;

  return streamResponse(async (emit) => {
    if (mockMode()) {
      await new Promise((r) => setTimeout(r, 500));
      emit({ type: "result", data: mockPlanTurn(input.opportunity.name, input.messages.length, input.finish) });
      return;
    }
    const text = await runStage({
      system: planSystem(),
      user: planUser(input.opportunity, input.profile, input.messages, input.finish),
      emit,
      format: PlanTurn,
      effort: "medium",
      maxTokens: 12000,
    });
    emit({ type: "result", data: parseJson(text, PlanTurn) });
  });
}
