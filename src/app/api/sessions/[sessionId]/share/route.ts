import { NextResponse } from "next/server";
import { viralio } from "@/application";
import type { ShareChannel } from "@/domain/types";

const channels: ShareChannel[] = ["whatsapp", "whatsapp_status", "instagram_story", "native", "social"];

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const { channel } = await request.json() as { channel?: ShareChannel };
    if (!channel || !channels.includes(channel)) return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    return NextResponse.json({ session: await viralio.initiateShare(sessionId, channel) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
