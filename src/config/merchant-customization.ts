import { validateMerchantBrandProfile } from "@/brand/brand-engine";
import type { Merchant, MerchantCustomization, MerchantExperienceCopy, PrizeDefinition } from "@/domain/types";

const copyLimits: Record<keyof MerchantExperienceCopy, number> = {
  displayName: 60,
  shortName: 30,
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

function text(value: unknown, field: keyof MerchantExperienceCopy): string {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const normalized = value.trim();
  if (!normalized || normalized.length > copyLimits[field]) throw new Error(`Invalid ${field}`);
  return normalized;
}

function businessType(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error("Invalid businessType");
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 60 || /[<>]/.test(normalized)) throw new Error("Invalid businessType");
  return normalized;
}

function whatsapp(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid whatsappNumber");
  const normalized = value.replace(/\D/g, "");
  if (!/^\d{8,18}$/.test(normalized)) throw new Error("Invalid whatsappNumber");
  return normalized;
}

function validity(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 90) {
    throw new Error("Invalid rewardValidityDays");
  }
  return value;
}

function prizes(value: unknown, base: Merchant): PrizeDefinition[] {
  if (!Array.isArray(value) || value.length !== base.prizes.length) throw new Error("Invalid prizes");
  const byId = new Map(base.prizes.map((prize) => [prize.id, prize]));
  const seen = new Set<string>();
  const normalized = value.map((candidate) => {
    if (!candidate || typeof candidate !== "object") throw new Error("Invalid prizes");
    const item = candidate as Partial<PrizeDefinition>;
    if (typeof item.id !== "string" || !byId.has(item.id) || seen.has(item.id)) throw new Error("Invalid prizes");
    if (typeof item.name !== "string") throw new Error("Invalid prizes");
    const name = item.name.trim();
    if (name.length < 2 || name.length > 90) throw new Error("Invalid prizes");
    if (
      typeof item.probability !== "number" ||
      !Number.isInteger(item.probability) ||
      item.probability < 0 ||
      item.probability > 100
    ) {
      throw new Error("Invalid prizes");
    }
    seen.add(item.id);
    return { id: item.id, name, probability: item.probability };
  });
  if (normalized.reduce((sum, prize) => sum + prize.probability, 0) !== 100) {
    throw new Error("Prize probabilities must total 100");
  }
  return base.prizes.map((prize) => normalized.find((candidate) => candidate.id === prize.id)!);
}

export function defaultMerchantCustomization(merchant: Merchant): MerchantCustomization {
  return {
    whatsappNumber: merchant.whatsappNumber,
    rewardValidityDays: merchant.rewardValidityDays,
    businessType: merchant.theme.businessType ?? (merchant.theme.category === "coffee" ? "Café / gastronomía" : merchant.theme.category === "barber" ? "Barbería / peluquería" : "Comercio"),
    prizes: merchant.prizes.map((prize) => ({ ...prize })),
    copy: {
      displayName: merchant.theme.displayName,
      shortName: merchant.theme.shortName,
      heroEyebrow: merchant.theme.heroEyebrow,
      heroTitle: merchant.theme.heroTitle,
      heroCopy: merchant.theme.heroCopy,
      mysteryLabel: merchant.theme.mysteryLabel,
      shareTitle: merchant.theme.shareTitle,
      shareCopy: merchant.theme.shareCopy,
      referralCopy: merchant.theme.referralCopy,
      socialHeadline: merchant.theme.socialHeadline,
      socialSubcopy: merchant.theme.socialSubcopy,
    },
  };
}

export function validateMerchantCustomization(value: unknown, base: Merchant): MerchantCustomization {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid merchant settings");
  const candidate = value as Partial<MerchantCustomization>;
  if (!candidate.copy || typeof candidate.copy !== "object" || Array.isArray(candidate.copy)) {
    throw new Error("Invalid merchant settings");
  }
  const copy = candidate.copy as Partial<MerchantExperienceCopy>;
  const fallbackBusinessType = base.theme.businessType ?? (base.theme.category === "coffee" ? "Café / gastronomía" : base.theme.category === "barber" ? "Barbería / peluquería" : "Comercio");
  return {
    whatsappNumber: whatsapp(candidate.whatsappNumber),
    rewardValidityDays: validity(candidate.rewardValidityDays),
    businessType: businessType(candidate.businessType, fallbackBusinessType),
    prizes: prizes(candidate.prizes, base),
    copy: {
      displayName: text(copy.displayName, "displayName"),
      shortName: text(copy.shortName, "shortName"),
      heroEyebrow: text(copy.heroEyebrow, "heroEyebrow"),
      heroTitle: text(copy.heroTitle, "heroTitle"),
      heroCopy: text(copy.heroCopy, "heroCopy"),
      mysteryLabel: text(copy.mysteryLabel, "mysteryLabel"),
      shareTitle: text(copy.shareTitle, "shareTitle"),
      shareCopy: text(copy.shareCopy, "shareCopy"),
      referralCopy: text(copy.referralCopy, "referralCopy"),
      socialHeadline: text(copy.socialHeadline, "socialHeadline"),
      socialSubcopy: text(copy.socialSubcopy, "socialSubcopy"),
    },
    brand: candidate.brand === undefined ? undefined : validateMerchantBrandProfile(candidate.brand),
  };
}

export function applyMerchantCustomization(merchant: Merchant, customization?: MerchantCustomization): Merchant {
  if (!customization) return merchant;
  const brand = customization.brand;
  const visibleBusinessType = customization.businessType ?? merchant.theme.businessType;
  return {
    ...merchant,
    name: customization.copy.displayName,
    whatsappNumber: customization.whatsappNumber,
    rewardValidityDays: customization.rewardValidityDays,
    prizes: customization.prizes.map((prize) => ({ ...prize })),
    theme: {
      ...merchant.theme,
      ...customization.copy,
      businessType: visibleBusinessType,
      ...(brand ? {
        logoDataUrl: brand.logoDataUrl,
        stylePreset: brand.stylePreset,
        fontPreset: brand.fontPreset,
        tone: visibleBusinessType ?? brand.tone,
        artDirection: brand.artDirection,
        palette: { ...brand.palette, wheel: [...brand.palette.wheel] },
      } : {}),
    },
  };
}
