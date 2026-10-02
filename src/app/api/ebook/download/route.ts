import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  EBOOK_ACCESS_COOKIE,
  getPurchase,
  loadEbookPdf,
  markDownload,
  verifyAccessToken,
} from "@/ebook/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(EBOOK_ACCESS_COOKIE)?.value;
    const token = verifyAccessToken(raw);

    if (!token) {
      return NextResponse.json({ error: "access_required" }, { status: 401 });
    }

    const purchase = await getPurchase(token.paymentId);
    if (!purchase || purchase.status !== "approved") {
      return NextResponse.json({ error: "purchase_not_found" }, { status: 403 });
    }

    const asset = await loadEbookPdf();
    await markDownload(purchase.payment_id).catch(() => undefined);

    return new Response(new Uint8Array(asset.bytes), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": 'attachment; filename="' + asset.filename.replace(/"/g, "") + '"',
        "Content-Length": String(asset.bytes.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[ebook-download]", error);
    return NextResponse.json({ error: "download_unavailable" }, { status: 503 });
  }
}
