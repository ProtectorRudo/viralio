import { NextResponse } from "next/server";
import { viralio } from "@/application";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { merchantSlug?: string; sessionId?: string; referralToken?: string };
    if (!body.merchantSlug) return NextResponse.json({ error: "merchantSlug is required" }, { status: 400 });
    const result = await viralio.startSession(body.merchantSlug, body.sessionId, body.referralToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
