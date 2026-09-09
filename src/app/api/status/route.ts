import { mockMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ mock: mockMode(), passwordRequired: Boolean(process.env.APP_PASSWORD) });
}
