import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { linkQrEntry, QR_ENTRY_COOKIE } from "@/analytics/qr-attribution";
import { viralio } from "@/application";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { merchantSlug?: string; sessionId?: string; referralToken?: string };
    if (!body.merchantSlug) return NextResponse.json({ error: "merchantSlug is required" }, { status: 400 });

    const result = await viralio.startSession(body.merchantSlug, body.sessionId, body.referralToken);
    const store = await cookies();
    const entryToken = body.referralToken ? undefined : store.get(QR_ENTRY_COOKIE)?.value;
    if (entryToken) {
      try {
        await linkQrEntry(result.merchant.id, entryToken, result.session.id);
      } catch {
        // Attribution must never block the customer experience.
      }
    }

    const response = NextResponse.json(result);
    if (entryToken) response.cookies.delete(QR_ENTRY_COOKIE);
    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
