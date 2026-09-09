import { authorized } from "@/lib/auth";
import { markdownToDocx } from "@/lib/docx";
import { jsonError } from "@/lib/ndjson";
import { ExportInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorized(req)) return jsonError("Wrong password", 401);
  const parsed = ExportInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Nothing to export.");
  const { title, author, markdown } = parsed.data;
  const buffer = await markdownToDocx(title, author, markdown);
  const filename = title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "product";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
    },
  });
}
