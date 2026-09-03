import { describe, expect, it, vi } from "vitest";
import { BRAND_DRAFT_SCHEMA, generateOpenAiBrandDraft } from "@/ai/openai-brand";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl1ZQAAAABJRU5ErkJggg==";

const rawDraft = {
  stylePreset: "luxury",
  fontPreset: "editorial",
  tone: "elegante, cálido y contemporáneo",
  keywords: ["premium", "cálido", "artesanal"],
  colors: {
    primary: "#6A3F2B",
    secondary: "#3D6B5A",
    accent: "#C8895B",
    background: "#F6F0E8",
    surface: "#FFFDF8",
    text: "#241C18",
  },
  copy: {
    heroEyebrow: "Un detalle para vos",
    heroTitle: "Tu visita guarda una sorpresa",
    heroCopy: "Abrí tu pase y descubrí un beneficio preparado para tu próxima visita.",
    mysteryLabel: "Pase Bruma",
    shareTitle: "Compartí el pase para abrirlo",
    shareCopy: "Elegí dónde compartirlo. Tu premio sigue siendo privado.",
    referralCopy: "Bruma me dejó un pase sorpresa. Hay otro esperando por vos.",
    socialHeadline: "Bruma dejó una sorpresa esperando",
    socialSubcopy: "Abrí tu propio pase y descubrí qué te toca.",
  },
};

const environment = {
  NODE_ENV: "test",
  OPENAI_API_KEY: "sk-test-key-that-is-long-enough-for-unit-testing",
  OPENAI_BRAND_MODEL: "gpt-5.6-terra",
} as NodeJS.ProcessEnv;

function responseFor(value: unknown) {
  return new Response(JSON.stringify({
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function errorResponse(status: number, code: string, message = "upstream detail must stay private") {
  return new Response(JSON.stringify({ error: { code, message, type: "api_error" } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function collectSchemaKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaKeys(item, keys);
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectSchemaKeys(child, keys);
  }
  return keys;
}

const input = {
  name: "Bruma Café",
  template: "coffee" as const,
  brief: "Café de especialidad cálido y premium.",
};

describe("OpenAI brand assistant", () => {
  it("uses Responses API with store false, strict schema and optional logo image", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    let capturedAuthorization = "";
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      capturedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
      return responseFor(rawDraft);
    }) as unknown as typeof fetch;

    const result = await generateOpenAiBrandDraft({
      name: "Bruma Café",
      template: "coffee",
      brief: "Café de especialidad cálido y premium, de barrio.",
      logoDataUrl: tinyPng,
    }, {
      environment,
      fetchImpl,
      now: () => new Date("2026-09-03T12:00:00.000Z"),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(capturedAuthorization).toBe(`Bearer ${environment.OPENAI_API_KEY}`);
    expect(capturedBody?.model).toBe("gpt-5.6-terra");
    expect(capturedBody?.store).toBe(false);
    expect((capturedBody?.text as { format?: { type?: string; strict?: boolean; schema?: unknown } }).format).toMatchObject({
      type: "json_schema",
      strict: true,
      schema: BRAND_DRAFT_SCHEMA,
    });
    const apiInput = capturedBody?.input as Array<{ role: string; content: Array<Record<string, unknown>> }>;
    expect(apiInput.find((item) => item.role === "user")?.content.some((part) => part.type === "input_image" && part.image_url === tinyPng)).toBe(true);
    expect(result.brand.source).toBe("openai");
    expect(result.brand.ai?.model).toBe("gpt-5.6-terra");
    expect(result.copy.socialHeadline).toContain("Bruma");
  });

  it("keeps the strict schema inside the supported Structured Outputs subset", () => {
    const keys = collectSchemaKeys(BRAND_DRAFT_SCHEMA);
    expect(keys.has("minLength")).toBe(false);
    expect(keys.has("maxLength")).toBe(false);
    expect(keys.has("uniqueItems")).toBe(false);
    expect(BRAND_DRAFT_SCHEMA.additionalProperties).toBe(false);
    expect(BRAND_DRAFT_SCHEMA.properties.keywords).toMatchObject({ minItems: 2, maxItems: 6 });
    expect(BRAND_DRAFT_SCHEMA.properties.colors.properties.primary).toMatchObject({
      type: "string",
      pattern: "^#[0-9A-Fa-f]{6}$",
    });
  });

  it("still rejects drafts that violate Viralio local brand limits", async () => {
    const tooLongCopy = {
      ...rawDraft,
      copy: { ...rawDraft.copy, heroTitle: "x".repeat(101) },
    };
    const duplicateKeywords = {
      ...rawDraft,
      keywords: ["premium", "Premium"],
    };

    const copyFetch = vi.fn(async () => responseFor(tooLongCopy)) as unknown as typeof fetch;
    await expect(generateOpenAiBrandDraft(input, { environment, fetchImpl: copyFetch })).rejects.toMatchObject({
      diagnosticCode: "invalid_response",
    });

    const keywordFetch = vi.fn(async () => responseFor(duplicateKeywords)) as unknown as typeof fetch;
    await expect(generateOpenAiBrandDraft(input, { environment, fetchImpl: keywordFetch })).rejects.toMatchObject({
      diagnosticCode: "invalid_response",
    });
  });

  it("omits image input when no logo exists", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return responseFor(rawDraft);
    }) as unknown as typeof fetch;

    await generateOpenAiBrandDraft(input, { environment, fetchImpl });

    const apiInput = capturedBody?.input as Array<{ role: string; content: Array<Record<string, unknown>> }>;
    expect(apiInput.flatMap((item) => item.content).some((part) => part.type === "input_image")).toBe(false);
  });

  it("fails closed on malformed model output and missing configuration", async () => {
    const malformedFetch = vi.fn(async () => responseFor({ unexpected: true })) as unknown as typeof fetch;
    await expect(generateOpenAiBrandDraft(input, { environment, fetchImpl: malformedFetch })).rejects.toMatchObject({
      diagnosticCode: "invalid_response",
    });

    await expect(generateOpenAiBrandDraft(input, { environment: { NODE_ENV: "test" }, fetchImpl: malformedFetch })).rejects.toMatchObject({
      diagnosticCode: "not_configured",
    });
  });

  it.each([
    [401, "invalid_api_key", "auth"],
    [403, "permission_denied", "permission"],
    [404, "model_not_found", "model_access"],
    [429, "insufficient_quota", "quota"],
    [429, "rate_limit_exceeded", "rate_limit"],
    [400, "invalid_request_error", "invalid_request"],
    [500, "server_error", "upstream"],
  ] as const)("classifies OpenAI HTTP %s safely as %s", async (status, code, diagnosticCode) => {
    const privateUpstreamMessage = `private-${status}-${code}-${environment.OPENAI_API_KEY}`;
    const fetchImpl = vi.fn(async () => errorResponse(status, code, privateUpstreamMessage)) as unknown as typeof fetch;

    let captured: unknown;
    try {
      await generateOpenAiBrandDraft(input, { environment, fetchImpl });
    } catch (error) {
      captured = error;
    }

    expect(captured).toMatchObject({ diagnosticCode, upstreamStatus: status, upstreamCode: code });
    expect(String((captured as Error).message)).not.toContain(privateUpstreamMessage);
    expect(String((captured as Error).message)).not.toContain(String(environment.OPENAI_API_KEY));
  });

  it("drops malformed upstream error codes instead of reflecting them", async () => {
    const fetchImpl = vi.fn(async () => errorResponse(400, "bad code with spaces <secret>")) as unknown as typeof fetch;

    let captured: unknown;
    try {
      await generateOpenAiBrandDraft(input, { environment, fetchImpl });
    } catch (error) {
      captured = error;
    }

    expect(captured).toMatchObject({ diagnosticCode: "invalid_request", upstreamStatus: 400 });
    expect((captured as { upstreamCode?: string }).upstreamCode).toBeUndefined();
  });

  it("classifies an aborted OpenAI call as timeout", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })) as unknown as typeof fetch;

    await expect(generateOpenAiBrandDraft(input, { environment, fetchImpl, timeoutMs: 5 })).rejects.toMatchObject({
      diagnosticCode: "timeout",
    });
  });
});
