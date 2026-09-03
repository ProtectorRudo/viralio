import { describe, expect, it, vi } from "vitest";
import { generateOpenAiBrandDraft } from "@/ai/openai-brand";
import { ViralioService } from "@/application/viralio-service";
import { inferMerchantTemplate, parseMerchantOnboarding } from "@/config/merchant-accounts";
import { MemoryRepository } from "@/persistence/memory-repository";

const authEnvironment = {
  NODE_ENV: "test",
  VIRALIO_AUTH_SECRET: "universal-business-test-auth-secret-with-32-characters",
} as NodeJS.ProcessEnv;

const openAiEnvironment = {
  NODE_ENV: "test",
  OPENAI_API_KEY: "sk-test-key-that-is-long-enough-for-unit-testing",
  OPENAI_BRAND_MODEL: "gpt-5.6-terra",
} as NodeJS.ProcessEnv;

const aiDraft = {
  stylePreset: "luxury",
  fontPreset: "editorial",
  tone: "sofisticado, delicado y contemporáneo",
  keywords: ["joyería", "delicado", "premium"],
  colors: {
    primary: "#4B3A35",
    secondary: "#6D7569",
    accent: "#B58B5E",
    background: "#F6F2ED",
    surface: "#FFFDF9",
    text: "#211D1B",
  },
  copy: {
    heroEyebrow: "Un detalle para vos",
    heroTitle: "Tu visita guarda una sorpresa",
    heroCopy: "Abrí tu pase y descubrí un beneficio preparado para tu próxima visita.",
    mysteryLabel: "Pase Lumen",
    shareTitle: "Compartí el pase para abrirlo",
    shareCopy: "Elegí dónde compartirlo. Tu premio sigue siendo privado.",
    referralCopy: "Lumen me dejó un pase sorpresa. Hay otro esperando por vos.",
    socialHeadline: "Lumen dejó algo esperando por vos",
    socialSubcopy: "Abrí tu propio pase y descubrí qué te toca.",
  },
};

function responseFor(value: unknown) {
  return new Response(JSON.stringify({
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("universal merchant business types", () => {
  it("infers technical fallbacks without restricting the real business type", () => {
    expect(inferMerchantTemplate("Cafetería de especialidad")).toBe("coffee");
    expect(inferMerchantTemplate("Barbería clásica")).toBe("barber");
    expect(inferMerchantTemplate("Joyería")).toBe("generic");
    expect(inferMerchantTemplate("Gimnasio funcional")).toBe("generic");
    expect(inferMerchantTemplate("Pet shop")).toBe("generic");

    const parsed = parseMerchantOnboarding({
      name: "Lumen Joyas",
      slug: "lumen-joyas",
      businessType: "Joyería artesanal",
      whatsappNumber: "5492215550000",
      pin: "482619",
    });
    expect(parsed.template).toBe("generic");
    expect(parsed.businessType).toBe("Joyería artesanal");
  });

  it("creates a generic merchant with neutral copy and preserves its real category", async () => {
    const service = new ViralioService(
      new MemoryRepository(),
      () => 0.7,
      () => new Date("2026-09-03T12:00:00.000Z"),
    );

    const merchant = await service.createMerchant({
      name: "Lumen Joyas",
      slug: "lumen-joyas",
      businessType: "Joyería",
      whatsappNumber: "5492215550000",
      pin: "482619",
    }, authEnvironment);

    expect(merchant.theme.category).toBe("generic");
    expect(merchant.theme.businessType).toBe("Joyería");
    expect(merchant.theme.tone).toBe("Joyería");
    expect(merchant.prizes.reduce((sum, prize) => sum + prize.probability, 0)).toBe(100);
    expect(merchant.theme.heroCopy.toLowerCase()).not.toMatch(/café|cafe|barber|peluquer|corte/);
    expect(merchant.prizes.map((prize) => prize.name).join(" ").toLowerCase()).not.toMatch(/café|cafe|barber|peluquer|corte/);
  });

  it("grounds ChatGPT in the real category instead of the technical fallback", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return responseFor(aiDraft);
    }) as unknown as typeof fetch;

    await generateOpenAiBrandDraft({
      name: "Lumen Joyas",
      template: "generic",
      businessType: "Joyería artesanal",
      brief: "Piezas delicadas, atención personalizada y estética premium sobria.",
    }, { environment: openAiEnvironment, fetchImpl });

    const input = capturedBody?.input as Array<{ role: string; content: Array<{ type: string; text?: string }> }>;
    const userText = input.find((item) => item.role === "user")?.content.find((part) => part.type === "input_text")?.text ?? "";
    expect(userText).toContain("Rubro real: Joyería artesanal");
    expect(userText).toContain("Fallback técnico: generic");
  });
});
