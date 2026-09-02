import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { rewardStatus } from "@/domain/rewards";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const sessionId = new URL(request.url).searchParams.get("sessionId") ?? undefined;
    const reward = await viralio.getReward(token, sessionId);
    return NextResponse.json({ reward, status: rewardStatus(reward) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}
