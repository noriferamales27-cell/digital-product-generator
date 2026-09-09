import { authorized, mockMode } from "@/lib/auth";
import { runStage } from "@/lib/claude";
import { mockProduct } from "@/lib/mock";
import { jsonError, streamResponse } from "@/lib/ndjson";
import { generateSystem, generateUser } from "@/lib/prompts";
import { GenerateInput } from "@/lib/schemas";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = GenerateInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Pick an opportunity first.");
  const input = parsed.data;

  return streamResponse(async (emit) => {
    if (mockMode()) {
      const text = mockProduct(input.opportunity.name);
      for (const chunk of text.match(/[\s\S]{1,80}/g) ?? []) {
        emit({ type: "delta", text: chunk });
        await new Promise((r) => setTimeout(r, 15));
      }
      emit({ type: "result", data: { markdown: text } });
      return;
    }
    emit({ type: "status", text: `Writing ${input.opportunity.name}` });
    const markdown = await runStage({
      system: generateSystem(input.voice, input.author),
      user: generateUser(input.opportunity, input.audience, input.plan?.length ?? input.length, input.plan, input.profile),
      emit,
      streamText: true,
      effort: (input.plan?.length ?? input.length) === "long" ? "xhigh" : "high",
      maxTokens: (input.plan?.length ?? input.length) === "long" ? 64000 : 40000,
    });
    emit({ type: "result", data: { markdown } });
  });
}
