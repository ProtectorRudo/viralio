import { normalizeLogoDataUrl, templateBrandProfile, validateMerchantBrandProfile } from "@/brand/brand-engine";
import { getMerchantBySlug } from "@/config/merchants";
import type {
  Merchant,
  MerchantAccount,
  MerchantBrandProfile,
  MerchantCustomization,
  MerchantExperienceCopy,
  MerchantTemplate,
} from "@/domain/types";

export interface MerchantOnboardingInput {
  name: string;
  slug: string;
  template: MerchantTemplate;
  whatsappNumber: string;
  pin: string;
  logoDataUrl?: string;
  brand?: MerchantBrandProfile;
  brandCopy?: Partial<MerchantExperienceCopy>;
}

const reservedSlugs = new Set([
  "api",
  "alta",
  "comercio",
  "experiencia",
  "moka",
  "atlas-barber",
  "premio",
  "validar",
]);

function cleanText(value: unknown, label: string, max: number, min = 2): string {
  if (typeof value !== "string") throw new Error(`Invalid ${label}`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) throw new Error(`Invalid ${label}`);
  return normalized;
}

export function normalizeMerchantSlug(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid slug");
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(normalized)) throw new Error("Invalid slug");
  if (reservedSlugs.has(normalized)) throw new Error("Slug is reserved");
  return normalized;
}

function normalizeWhatsapp(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid whatsappNumber");
  const normalized = value.replace(/\D/g, "");
  if (!/^\d{8,18}$/.test(normalized)) throw new Error("Invalid whatsappNumber");
  return normalized;
}

const generatedCopyLimits: Partial<Record<keyof MerchantExperienceCopy, number>> = {
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

function parseBrandCopy(value: unknown): Partial<MerchantExperienceCopy> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid brand copy");
  const candidate = value as Record<string, unknown>;
  const result: Partial<MerchantExperienceCopy> = {};
  for (const [key, limit] of Object.entries(generatedCopyLimits) as Array<[keyof MerchantExperienceCopy, number]>) {
    if (candidate[key] !== undefined) result[key] = cleanText(candidate[key], `brand copy ${key}`, limit);
  }
  return result;
}

export function parseMerchantOnboarding(value: unknown): MerchantOnboardingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid merchant onboarding");
  const candidate = value as Record<string, unknown>;
  const template = candidate.template;
  if (template !== "coffee" && template !== "barber") throw new Error("Invalid template");
  if (typeof candidate.pin !== "string" || !/^\d{4,12}$/.test(candidate.pin)) throw new Error("Invalid pin");
  return {
    name: cleanText(candidate.name, "name", 60),
    slug: normalizeMerchantSlug(candidate.slug),
    template,
    whatsappNumber: normalizeWhatsapp(candidate.whatsappNumber),
    pin: candidate.pin,
    logoDataUrl: normalizeLogoDataUrl(candidate.logoDataUrl),
    brand: candidate.brand === undefined ? undefined : validateMerchantBrandProfile(candidate.brand),
    brandCopy: parseBrandCopy(candidate.brandCopy),
  };
}

function templateBase(template: MerchantTemplate): Merchant {
  const merchant = getMerchantBySlug(template === "coffee" ? "moka" : "atlas-barber");
  if (!merchant) throw new Error("Merchant template not found");
  return merchant;
}

function shortName(name: string): string {
  return name.length <= 30 ? name : `${name.slice(0, 29).trim()}…`;
}

function monogram(name: string): string {
  return name.match(/[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/)?.[0]?.toUpperCase() ?? "V";
}

export function merchantFromAccount(account: MerchantAccount): Merchant {
  const base = templateBase(account.template);
  return {
    ...base,
    id: account.id,
    slug: account.slug,
    name: account.name,
    whatsappNumber: "5491100000000",
    theme: {
      ...base.theme,
      displayName: account.name,
      shortName: shortName(account.name),
      monogram: monogram(account.name),
    },
    prizes: base.prizes.map((prize) => ({ ...prize })),
  };
}

export function defaultCustomizationForAccount(
  account: MerchantAccount,
  whatsappNumber: string,
  options: { brand?: MerchantBrandProfile; brandCopy?: Partial<MerchantExperienceCopy>; logoDataUrl?: string } = {},
): MerchantCustomization {
  const name = account.name;
  const baseMerchant = merchantFromAccount(account);
  const fallbackBrand = templateBrandProfile(baseMerchant.theme);
  const brand: MerchantBrandProfile = options.brand ?? {
    ...fallbackBrand,
    source: options.logoDataUrl ? "manual" : "template",
    logoDataUrl: options.logoDataUrl,
  };

  const customization: MerchantCustomization = account.template === "coffee" ? {
    whatsappNumber,
    rewardValidityDays: 7,
    prizes: [
      { id: "upgrade", name: "Upgrade de bebida", probability: 35 },
      { id: "medialuna", name: "Acompañamiento gratis en tu próxima visita", probability: 30 },
      { id: "discount_10", name: "10% en tu próxima visita", probability: 20 },
      { id: "free_coffee", name: "Bebida gratis", probability: 14 },
      { id: "special", name: `Premio especial ${name}`, probability: 1 },
    ],
    copy: {
      displayName: name,
      shortName: shortName(name),
      heroEyebrow: "Un detalle hecho para vos",
      heroTitle: "Hay algo especial esperando",
      heroCopy: `Descubrí la sorpresa que ${name} preparó para tu próxima visita.`,
      mysteryLabel: `Sorpresa ${shortName(name)}`,
      shareTitle: "Compartí tu pase para abrirlo",
      shareCopy: "Elegí dónde compartir tu pase. La sorpresa que te toca sigue siendo sólo tuya.",
      referralCopy: `${name} me dejó un pase sorpresa. Hay otro esperando por vos.`,
      socialHeadline: `${name} dejó una sorpresa esperando`,
      socialSubcopy: "Abrí tu propio pase y descubrí qué te toca.",
    },
    brand,
  } : {
    whatsappNumber,
    rewardValidityDays: 10,
    prizes: [
      { id: "beard_detail", name: "Detalle de terminación sin cargo", probability: 30 },
      { id: "discount_15", name: "15% en tu próxima visita", probability: 30 },
      { id: "hair_treatment", name: "Tratamiento premium", probability: 20 },
      { id: "product", name: "Producto de styling de regalo", probability: 15 },
      { id: "atlas_ritual", name: "Experiencia premium completa", probability: 5 },
    ],
    copy: {
      displayName: name,
      shortName: shortName(name),
      heroEyebrow: "Tu próxima visita empieza acá",
      heroTitle: "Tu estilo tiene una sorpresa",
      heroCopy: `Abrí tu pase privado y descubrí un beneficio de ${name}.`,
      mysteryLabel: `Pase ${shortName(name)}`,
      shareTitle: "Pasá el código. Abrí tu beneficio.",
      shareCopy: "Elegí dónde compartir tu pase para que alguien de tu círculo encuentre el suyo.",
      referralCopy: `${name} me dio un pase privado. Hay otro esperando por vos.`,
      socialHeadline: `Hay un pase privado de ${name} para vos`,
      socialSubcopy: "Entrá, abrilo y descubrí tu beneficio.",
    },
    brand,
  };

  if (options.brandCopy) {
    customization.copy = {
      ...customization.copy,
      ...options.brandCopy,
      displayName: name,
      shortName: shortName(name),
    };
  }
  return customization;
}

export function merchantExperiencePath(slug: string): string {
  return slug === "moka" || slug === "atlas-barber" ? `/${slug}` : `/experiencia/${slug}`;
}
