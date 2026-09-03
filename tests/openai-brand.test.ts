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
    const input = capturedBody?.input as Array<{ role: string; content: Array<Record<string, unknown>> }>;
    expect(input.find((item) => item.role === "user")?.content.some((part) => part.type === "input_image" && part.image_url === tinyPng)).toBe(true);
    expect(result.brand.source).toBe("openai");
    expect(result.brand.ai?.model).toBe("gpt-5.6-terra");
    expect(result.copy.socialHeadline).toContain("Bruma");
  });

  it("omits image input when no logo exists", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return responseFor(rawDraft);
    }) as unknown as typeof fetch;

    await generateOpenAiBrandDraft({
      name: "Bruma Café",
      template: "coffee",
      brief: "Café de especialidad cálido y premium.",
    }, { environment, fetchImpl });

    const input = capturedBody?.input as Array<{ role: string; content: Array<Record<string, unknown>> }>;
    expect(input.flatMap((item) => item.content).some((part) => part.type === "input_image")).toBe(false);
  });

  it("fails closed on malformed model output and missing configuration", async () => {
    const malformedFetch = vi.fn(async () => responseFor({ unexpected: true })) as unknown as typeof fetch;
    await expect(generateOpenAiBrandDraft({
      name: "Bruma Café",
      template: "coffee",
      brief: "Café de especialidad cálido.",
    }, { environment, fetchImpl: malformedFetch })).rejects.toThrow(/invalid/);

    await expect(generateOpenAiBrandDraft({
      name: "Bruma Café",
      template: "coffee",
      brief: "Café de especialidad cálido.",
    }, { environment: { NODE_ENV: "test" }, fetchImpl: malformedFetch })).rejects.toThrow(/not configured/);
  });
});
