import { NextResponse } from "next/server";
import { generateOpenAiBrandDraft } from "@/ai/openai-brand";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return NextResponse.json({ error: "Clave de alta inválida" }, { status: 401 });
    }
    const template = body.template;
    if (template !== "coffee" && template !== "barber" && template !== "generic") {
      return NextResponse.json({ error: "Datos de marca inválidos" }, { status: 400 });
    }
    const draft = await generateOpenAiBrandDraft({
      name: body.name as string,
      template,
      businessType: body.businessType as string,
      brief: body.brief as string,
      logoDataUrl: body.logoDataUrl as string | undefined,
    });
    return NextResponse.json(draft, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not configured") || message.includes("temporarily unavailable") || message.includes("timed out")) {
      return NextResponse.json({ error: "ChatGPT para branding no está disponible en este momento" }, { status: 503 });
    }
    return NextResponse.json({ error: "No pudimos generar una identidad válida para esa marca" }, { status: 400 });
  }
}
