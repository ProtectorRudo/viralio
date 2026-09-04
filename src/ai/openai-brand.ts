import {
  BRAND_EXPERIENCE_FAMILIES,
  BRAND_LAYOUT_MOODS,
  BRAND_MOTION_MOODS,
  BRAND_REWARD_OBJECT_STYLES,
  BRAND_SHAPE_LANGUAGES,
  BRAND_SHARE_COMPOSITIONS,
  BRAND_SURFACE_LANGUAGES,
  BRAND_VISUAL_MOODS,
  normalizeBrandArtDirection,
} from "@/brand/art-direction";
import { buildMerchantBrandProfile, normalizeLogoDataUrl } from "@/brand/brand-engine";
import type { MerchantBrandArtDirection, MerchantBrandProfile, MerchantTemplate } from "@/domain/types";

export const DEFAULT_OPENAI_BRAND_MODEL = "gpt-5.6-terra";

export type BrandAiDiagnosticCode =
  | "not_configured"
  | "auth"
  | "permission"
  | "model_access"
  | "quota"
  | "rate_limit"
  | "invalid_request"
  | "upstream"
  | "network"
  | "timeout"
  | "invalid_response";

export class BrandAiError extends Error {
  readonly diagnosticCode: BrandAiDiagnosticCode;
  readonly upstreamStatus?: number;
  readonly upstreamCode?: string;

  constructor(
    diagnosticCode: BrandAiDiagnosticCode,
    message: string,
    upstreamStatus?: number,
    upstreamCode?: string,
  ) {
    super(message);
    this.name = "BrandAiError";
    this.diagnosticCode = diagnosticCode;
    this.upstreamStatus = upstreamStatus;
    this.upstreamCode = upstreamCode;
  }
}

export interface GeneratedBrandCopy {
  heroEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  mysteryLabel: string;
  shareTitle: string;
  shareCopy: string;
  referralCopy: string;
  socialHeadline: string;
  socialSubcopy: string;
}

export interface OpenAiBrandDraft {
  brand: MerchantBrandProfile;
  copy: GeneratedBrandCopy;
}

export interface BrandAssistantInput {
  name: string;
  template: MerchantTemplate;
  businessType?: string;
  brief: string;
  logoDataUrl?: string;
}

interface RawBrandDraft {
  stylePreset: "editorial" | "minimal" | "luxury" | "bold" | "warm" | "urban";
  fontPreset: "editorial" | "modern" | "geometric" | "humanist";
  tone: string;
  keywords: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  artDirection: MerchantBrandArtDirection;
  copy: GeneratedBrandCopy;
}

// OpenAI Structured Outputs intentionally receives only keywords from its supported
// JSON Schema subset. Length/uniqueness constraints are enforced again below by
// Viralio before a generated draft is accepted or persisted.
const copyProperties = {
  heroEyebrow: { type: "string" },
  heroTitle: { type: "string" },
  heroCopy: { type: "string" },
  mysteryLabel: { type: "string" },
  shareTitle: { type: "string" },
  shareCopy: { type: "string" },
  referralCopy: { type: "string" },
  socialHeadline: { type: "string" },
  socialSubcopy: { type: "string" },
} as const;

const artDirectionProperties = {
  family: { type: "string", enum: [...BRAND_EXPERIENCE_FAMILIES] },
  visualMood: { type: "string", enum: [...BRAND_VISUAL_MOODS] },
  layoutMood: { type: "string", enum: [...BRAND_LAYOUT_MOODS] },
  shapeLanguage: { type: "string", enum: [...BRAND_SHAPE_LANGUAGES] },
  surfaceLanguage: { type: "string", enum: [...BRAND_SURFACE_LANGUAGES] },
  motionMood: { type: "string", enum: [...BRAND_MOTION_MOODS] },
  rewardObjectStyle: { type: "string", enum: [...BRAND_REWARD_OBJECT_STYLES] },
  shareComposition: { type: "string", enum: [...BRAND_SHARE_COMPOSITIONS] },
} as const;

export const BRAND_DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["stylePreset", "fontPreset", "tone", "keywords", "colors", "artDirection", "copy"],
  properties: {
    stylePreset: { type: "string", enum: ["editorial", "minimal", "luxury", "bold", "warm", "urban"] },
    fontPreset: { type: "string", enum: ["editorial", "modern", "geometric", "humanist"] },
    tone: { type: "string" },
    keywords: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" },
    },
    colors: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary", "accent", "background", "surface", "text"],
      properties: {
        primary: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        secondary: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        accent: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        background: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        surface: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        text: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
      },
    },
    artDirection: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(artDirectionProperties),
      properties: artDirectionProperties,
    },
    copy: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(copyProperties),
      properties: copyProperties,
    },
  },
} as const;

function cleanInput(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${label}`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max || /[<>]/.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function defaultBusinessType(template: MerchantTemplate): string {
  if (template === "coffee") return "Café / gastronomía";
  if (template === "barber") return "Barbería / peluquería";
  return "Comercio";
}

function modelName(environment: NodeJS.ProcessEnv): string {
  const model = environment.OPENAI_BRAND_MODEL?.trim() || DEFAULT_OPENAI_BRAND_MODEL;
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(model)) {
    throw new BrandAiError("not_configured", "Brand AI is not configured");
  }
  return model;
}

function apiKey(environment: NodeJS.ProcessEnv): string {
  const key = environment.OPENAI_API_KEY?.trim() ?? "";
  if (!key || key.length < 20) {
    throw new BrandAiError("not_configured", "Brand AI is not configured");
  }
  return key;
}

function outputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Brand AI returned an invalid response");
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) throw new Error("Brand AI returned an invalid response");
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const candidate = part as { type?: unknown; text?: unknown };
      if (candidate.type === "output_text" && typeof candidate.text === "string" && candidate.text.trim()) {
        return candidate.text;
      }
    }
  }
  throw new Error("Brand AI returned an invalid response");
}

function normalizeCopy(value: unknown): GeneratedBrandCopy {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Brand AI returned invalid copy");
  const candidate = value as Record<string, unknown>;
  const limits: Record<keyof GeneratedBrandCopy, number> = {
    heroEyebrow: 80,
    heroTitle: 100,
    heroCopy: 220,
    mysteryLabel: 60,
    shareTitle: 100,
    shareCopy: 220,
    referralCopy: 220,
    socialHeadline: 100,
    socialSubcopy: 180,
  };
  const result = {} as GeneratedBrandCopy;
  for (const key of Object.keys(limits) as Array<keyof GeneratedBrandCopy>) {
    result[key] = cleanInput(candidate[key], `brand copy ${key}`, 2, limits[key]);
  }
  return result;
}

function normalizeRawDraft(value: unknown): RawBrandDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Brand AI returned an invalid draft");
  const candidate = value as Record<string, unknown>;
  if (!candidate.colors || typeof candidate.colors !== "object" || Array.isArray(candidate.colors)) {
    throw new Error("Brand AI returned an invalid draft");
  }
  return {
    stylePreset: candidate.stylePreset as RawBrandDraft["stylePreset"],
    fontPreset: candidate.fontPreset as RawBrandDraft["fontPreset"],
    tone: candidate.tone as string,
    keywords: candidate.keywords as string[],
    colors: candidate.colors as RawBrandDraft["colors"],
    artDirection: normalizeBrandArtDirection(candidate.artDirection),
    copy: normalizeCopy(candidate.copy),
  };
}

function sanitizeUpstreamCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^[A-Za-z0-9_.-]{1,80}$/.test(value) ? value : undefined;
}

async function upstreamErrorCode(response: Response): Promise<string | undefined> {
  try {
    const payload = await response.json() as { error?: { code?: unknown } };
    return sanitizeUpstreamCode(payload?.error?.code);
  } catch {
    return undefined;
  }
}

function classifyUpstreamFailure(status: number, code?: string): BrandAiError {
  if (status === 401) return new BrandAiError("auth", "OpenAI authentication failed", status, code);
  if (status === 403) return new BrandAiError("permission", "OpenAI permission denied", status, code);
  if (status === 404 || code === "model_not_found") return new BrandAiError("model_access", "OpenAI model is unavailable", status, code);
  if (status === 429 && code === "insufficient_quota") return new BrandAiError("quota", "OpenAI quota is unavailable", status, code);
  if (status === 429) return new BrandAiError("rate_limit", "OpenAI rate limit reached", status, code);
  if (status >= 400 && status < 500) return new BrandAiError("invalid_request", "OpenAI rejected the request", status, code);
  return new BrandAiError("upstream", "OpenAI is temporarily unavailable", status, code);
}

export async function generateOpenAiBrandDraft(
  input: BrandAssistantInput,
  options: {
    environment?: NodeJS.ProcessEnv;
    fetchImpl?: typeof fetch;
    now?: () => Date;
    timeoutMs?: number;
  } = {},
): Promise<OpenAiBrandDraft> {
  const environment = options.environment ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const name = cleanInput(input.name, "merchant name", 2, 60);
  const businessType = cleanInput(input.businessType ?? defaultBusinessType(input.template), "business type", 2, 60);
  const brief = cleanInput(input.brief, "brand brief", 3, 700);
  if (input.template !== "coffee" && input.template !== "barber" && input.template !== "generic") throw new Error("Invalid merchant template");
  const logoDataUrl = normalizeLogoDataUrl(input.logoDataUrl);
  const model = modelName(environment);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  const userContent: Array<Record<string, unknown>> = [{
    type: "input_text",
    text: `Comercio: ${name}\nRubro real: ${businessType}\nFallback técnico: ${input.template}\nBrief de marca: ${brief}`,
  }];
  if (logoDataUrl) userContent.push({ type: "input_image", image_url: logoDataUrl, detail: "high" });

  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey(environment)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "developer",
            content: [{
              type: "input_text",
              text: "Sos el director de marca de Viralio. Diseñá una identidad premium, profesional y fiel al rubro REAL del negocio para un funnel móvil de recompensas. No dejes que el fallback técnico coffee/barber/generic contamine la identidad si contradice el rubro real. Elegí únicamente los presets y tokens enumerados en artDirection: nunca escribas CSS, HTML, clases, URLs ni código. Viralio controla la composición final. Evitá estética de casino, kermés o plantilla genérica. Las cuatro familias de experiencia posibles son Editorial Luxury, Warm Crafted, Bold Contemporary y Minimal Professional; elegí la más fiel al comercio y usá los demás campos para matizarla. Devolvé sólo el schema solicitado. Los colores deben ser #RRGGBB. No cambies premios, probabilidades ni reglas del producto. El copy debe sonar natural en español rioplatense y funcionar también aislado en una Story/Estado 9:16.",
            }],
          },
          { role: "user", content: userContent },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "viralio_brand_draft",
            strict: true,
            schema: BRAND_DRAFT_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw classifyUpstreamFailure(response.status, await upstreamErrorCode(response));
    }

    const payload = await response.json() as unknown;
    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText(payload));
    } catch {
      throw new BrandAiError("invalid_response", "Brand AI returned an invalid response");
    }
    const draft = normalizeRawDraft(parsed);
    const brand = buildMerchantBrandProfile({
      source: "openai",
      logoDataUrl,
      stylePreset: draft.stylePreset,
      fontPreset: draft.fontPreset,
      tone: draft.tone,
      keywords: draft.keywords,
      colors: draft.colors,
      artDirection: draft.artDirection,
      ai: { model, generatedAt: now().toISOString() },
    });
    return { brand, copy: draft.copy };
  } catch (error) {
    if (error instanceof BrandAiError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new BrandAiError("timeout", "Brand AI timed out");
    }
    if (error instanceof TypeError) {
      throw new BrandAiError("network", "Brand AI network request failed");
    }
    throw new BrandAiError("invalid_response", "Brand AI returned an invalid response");
  } finally {
    clearTimeout(timer);
  }
}
