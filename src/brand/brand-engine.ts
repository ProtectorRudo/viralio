import type {
  BrandFontPreset,
  BrandSource,
  BrandStylePreset,
  MerchantBrandPalette,
  MerchantBrandProfile,
  MerchantTheme,
} from "@/domain/types";

export const BRAND_LOGO_MAX_BYTES = 700 * 1024;

const HEX = /^#[0-9A-F]{6}$/i;
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i;
const STYLE_PRESETS = new Set<BrandStylePreset>(["editorial", "minimal", "luxury", "bold", "warm", "urban"]);
const FONT_PRESETS = new Set<BrandFontPreset>(["editorial", "modern", "geometric", "humanist"]);
const SOURCES = new Set<BrandSource>(["template", "manual", "openai"]);

export interface BrandBaseColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface BrandProposal {
  source: BrandSource;
  logoDataUrl?: string;
  stylePreset: BrandStylePreset;
  fontPreset: BrandFontPreset;
  tone: string;
  keywords: string[];
  colors: BrandBaseColors;
  ai?: { model: string; generatedAt: string };
}

type Rgb = { r: number; g: number; b: number };

function hex(value: unknown, label = "color"): string {
  if (typeof value !== "string" || !HEX.test(value)) throw new Error(`Invalid ${label}`);
  return value.toUpperCase();
}

function rgb(value: string): Rgb {
  const normalized = hex(value).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function asHex(value: Rgb): string {
  const component = (channel: number) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");
  return `#${component(value.r)}${component(value.g)}${component(value.b)}`.toUpperCase();
}

export function mixColors(left: string, right: string, amount: number): string {
  const a = rgb(left);
  const b = rgb(right);
  const weight = Math.max(0, Math.min(1, amount));
  return asHex({
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  });
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(left: string, right: string): number {
  const luminance = (value: string) => {
    const valueRgb = rgb(value);
    return 0.2126 * channelLuminance(valueRgb.r)
      + 0.7152 * channelLuminance(valueRgb.g)
      + 0.0722 * channelLuminance(valueRgb.b);
  };
  const a = luminance(left);
  const b = luminance(right);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableForeground(background: string): string {
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#111111") ? "#FFFFFF" : "#111111";
}

function readableText(preferred: string, background: string): string {
  return contrastRatio(preferred, background) >= 4.5 ? preferred : readableForeground(background);
}

function wheelColor(value: string): string {
  let candidate = value;
  for (let step = 0; step < 8 && contrastRatio(candidate, "#FFFFFF") < 4.5; step += 1) {
    candidate = mixColors(candidate, "#000000", 0.12);
  }
  return candidate;
}

function normalizedTone(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid brand tone");
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 3 || normalized.length > 120) throw new Error("Invalid brand tone");
  return normalized;
}

function normalizedKeywords(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) throw new Error("Invalid brand keywords");
  const keywords = value.map((item) => {
    if (typeof item !== "string") throw new Error("Invalid brand keywords");
    const normalized = item.trim().replace(/\s+/g, " ");
    if (normalized.length < 2 || normalized.length > 28) throw new Error("Invalid brand keywords");
    return normalized;
  });
  if (new Set(keywords.map((item) => item.toLowerCase())).size !== keywords.length) {
    throw new Error("Invalid brand keywords");
  }
  return keywords;
}

export function normalizeLogoDataUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("Invalid brand logo");
  const match = value.match(DATA_URL);
  if (!match) throw new Error("Invalid brand logo");
  const payload = match[2];
  let bytes: Buffer;
  try {
    bytes = Buffer.from(payload, "base64");
  } catch {
    throw new Error("Invalid brand logo");
  }
  if (bytes.length < 8 || bytes.length > BRAND_LOGO_MAX_BYTES) throw new Error("Invalid brand logo");
  return `data:image/${match[1].toLowerCase()};base64,${payload}`;
}

function paletteFromBase(colors: BrandBaseColors): MerchantBrandPalette {
  const primary = hex(colors.primary, "primary color");
  const secondary = hex(colors.secondary, "secondary color");
  const accent = hex(colors.accent, "accent color");
  const canvas = hex(colors.background, "background color");
  const surface = hex(colors.surface, "surface color");
  const requestedText = hex(colors.text, "text color");
  const text = readableText(requestedText, canvas);
  const surfaceRaised = mixColors(surface, readableForeground(surface) === "#111111" ? "#FFFFFF" : canvas, 0.08);
  const canvasAccent = mixColors(canvas, secondary, 0.22);
  const textMutedBase = mixColors(text, canvas, 0.42);
  const textMuted = contrastRatio(textMutedBase, canvas) >= 3 ? textMutedBase : mixColors(text, canvas, 0.28);
  const primaryHover = mixColors(primary, readableForeground(primary) === "#FFFFFF" ? "#000000" : "#FFFFFF", 0.14);
  const onPrimary = readableForeground(primary);
  const border = mixColors(surface, text, 0.18);
  const wheelSeeds = [
    primary,
    accent,
    secondary,
    mixColors(primary, accent, 0.48),
    mixColors(secondary, primary, 0.52),
  ];

  return {
    canvas,
    canvasAccent,
    surface,
    surfaceRaised,
    text,
    textMuted,
    primary,
    primaryHover,
    onPrimary,
    accent,
    accentSecondary: secondary,
    border,
    success: "#24734B",
    warning: "#996018",
    danger: "#A63C3C",
    wheel: wheelSeeds.map(wheelColor),
  };
}

function brandStyle(value: unknown): BrandStylePreset {
  if (typeof value !== "string" || !STYLE_PRESETS.has(value as BrandStylePreset)) throw new Error("Invalid brand style");
  return value as BrandStylePreset;
}

function brandFont(value: unknown): BrandFontPreset {
  if (typeof value !== "string" || !FONT_PRESETS.has(value as BrandFontPreset)) throw new Error("Invalid brand font");
  return value as BrandFontPreset;
}

function brandSource(value: unknown): BrandSource {
  if (typeof value !== "string" || !SOURCES.has(value as BrandSource)) throw new Error("Invalid brand source");
  return value as BrandSource;
}

function modelMetadata(value: unknown): MerchantBrandProfile["ai"] {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid brand AI metadata");
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.model !== "string" || candidate.model.trim().length < 2 || candidate.model.length > 80) {
    throw new Error("Invalid brand AI metadata");
  }
  if (typeof candidate.generatedAt !== "string" || !Number.isFinite(Date.parse(candidate.generatedAt))) {
    throw new Error("Invalid brand AI metadata");
  }
  return { model: candidate.model.trim(), generatedAt: new Date(candidate.generatedAt).toISOString() };
}

export function buildMerchantBrandProfile(proposal: BrandProposal): MerchantBrandProfile {
  return {
    source: brandSource(proposal.source),
    logoDataUrl: normalizeLogoDataUrl(proposal.logoDataUrl),
    stylePreset: brandStyle(proposal.stylePreset),
    fontPreset: brandFont(proposal.fontPreset),
    tone: normalizedTone(proposal.tone),
    keywords: normalizedKeywords(proposal.keywords),
    palette: paletteFromBase({
      primary: hex(proposal.colors.primary),
      secondary: hex(proposal.colors.secondary),
      accent: hex(proposal.colors.accent),
      background: hex(proposal.colors.background),
      surface: hex(proposal.colors.surface),
      text: hex(proposal.colors.text),
    }),
    ai: modelMetadata(proposal.ai),
  };
}

export function validateMerchantBrandProfile(value: unknown): MerchantBrandProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid brand profile");
  const candidate = value as Record<string, unknown>;
  const palette = candidate.palette;
  if (!palette || typeof palette !== "object" || Array.isArray(palette)) throw new Error("Invalid brand palette");
  const p = palette as Record<string, unknown>;
  const wheel = p.wheel;
  if (!Array.isArray(wheel) || wheel.length !== 5) throw new Error("Invalid brand palette");
  const normalizedPalette: MerchantBrandPalette = {
    canvas: hex(p.canvas),
    canvasAccent: hex(p.canvasAccent),
    surface: hex(p.surface),
    surfaceRaised: hex(p.surfaceRaised),
    text: hex(p.text),
    textMuted: hex(p.textMuted),
    primary: hex(p.primary),
    primaryHover: hex(p.primaryHover),
    onPrimary: hex(p.onPrimary),
    accent: hex(p.accent),
    accentSecondary: hex(p.accentSecondary),
    border: hex(p.border),
    success: hex(p.success),
    warning: hex(p.warning),
    danger: hex(p.danger),
    wheel: wheel.map((item) => hex(item)),
  };
  if (contrastRatio(normalizedPalette.primary, normalizedPalette.onPrimary) < 4.5) {
    throw new Error("Invalid brand contrast");
  }
  if (contrastRatio(normalizedPalette.canvas, normalizedPalette.text) < 4.5) {
    throw new Error("Invalid brand contrast");
  }
  return {
    source: brandSource(candidate.source),
    logoDataUrl: normalizeLogoDataUrl(candidate.logoDataUrl),
    stylePreset: brandStyle(candidate.stylePreset),
    fontPreset: brandFont(candidate.fontPreset),
    tone: normalizedTone(candidate.tone),
    keywords: normalizedKeywords(candidate.keywords),
    palette: normalizedPalette,
    ai: modelMetadata(candidate.ai),
  };
}

export function templateBrandProfile(theme: MerchantTheme): MerchantBrandProfile {
  return {
    source: "template",
    stylePreset: theme.category === "coffee" ? "warm" : "urban",
    fontPreset: theme.category === "coffee" ? "editorial" : "modern",
    tone: theme.category === "coffee" ? "cálido, cuidado y contemporáneo" : "directo, premium y contemporáneo",
    keywords: theme.category === "coffee"
      ? ["cálido", "artesanal", "editorial"]
      : ["urbano", "preciso", "premium"],
    palette: { ...theme.palette, wheel: [...theme.palette.wheel] },
  };
}
