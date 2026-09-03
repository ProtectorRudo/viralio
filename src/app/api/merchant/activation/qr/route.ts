import { viralio } from "@/application";
import { merchantPublicUrl, publicOriginFromRequest } from "@/activation/public-url";
import { qrSvg } from "@/activation/qr";
import { merchantSessionFromRequest } from "@/security/merchant-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = merchantSessionFromRequest(request);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const merchant = await viralio.getMerchantForId(session.merchantId);
    const publicUrl = merchantPublicUrl(publicOriginFromRequest(request), merchant.slug);
    const svg = qrSvg(publicUrl);
    const download = new URL(request.url).searchParams.get("download") === "1";

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Disposition": download ? `attachment; filename="viralio-${merchant.slug}-qr.svg"` : "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("QR unavailable", { status: 400 });
  }
}
