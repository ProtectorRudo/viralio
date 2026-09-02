import { NextResponse } from "next/server";
import { viralio } from "@/application";

export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    return NextResponse.json({ reward: await viralio.spin(sessionId) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
