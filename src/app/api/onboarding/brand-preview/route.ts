import { NextResponse } from "next/server";
import { BrandAiError, generateOpenAiBrandDraft } from "@/ai/openai-brand";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

export const runtime = "nodejs";

function jsonNoStore(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function publicBrandAiMessage(error: BrandAiError): string {
  switch (error.diagnosticCode) {
    case "not_configured":
      return "Brand Engine no está configurado para producción";
    case "auth":
      return "OpenAI rechazó la API key configurada";
    case "permission":
      return "La API key de OpenAI no tiene permiso para esta operación";
    case "model_access":
      return "El modelo configurado no está disponible para esta API key";
    case "quota":
      return "OpenAI rechazó la solicitud por cuota o crédito del proyecto";
    case "rate_limit":
      return "OpenAI aplicó un límite temporal de solicitudes";
    case "invalid_request":
      return "OpenAI rechazó el formato de la solicitud del Brand Engine";
    case "network":
      return "Viralio no pudo conectarse con OpenAI";
    case "timeout":
      return "OpenAI excedió el tiempo de respuesta del Brand Engine";
    case "invalid_response":
      return "OpenAI respondió, pero Viralio no pudo validar la identidad generada";
    case "upstream":
    default:
      return "OpenAI no está disponible en este momento";
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ error: "Unauthorized" }, 403);
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return jsonNoStore({ error: "Clave de alta inválida" }, 401);
    }
    const template = body.template;
    if (template !== "coffee" && template !== "barber" && template !== "generic") {
      return jsonNoStore({ error: "Datos de marca inválidos" }, 400);
    }
    const draft = await generateOpenAiBrandDraft({
      name: body.name as string,
      template,
      businessType: body.businessType as string,
      brief: body.brief as string,
      logoDataUrl: body.logoDataUrl as string | undefined,
    });
    return jsonNoStore(draft);
  } catch (error) {
    if (error instanceof BrandAiError) {
      return jsonNoStore({
        error: publicBrandAiMessage(error),
        diagnosticCode: error.diagnosticCode,
        ...(error.upstreamStatus ? { upstreamStatus: error.upstreamStatus } : {}),
      }, error.diagnosticCode === "invalid_response" ? 502 : 503);
    }
    return jsonNoStore({ error: "No pudimos generar una identidad válida para esa marca" }, 400);
  }
}
