export type FlowState = "LANDING" | "UNLOCK" | "SHARED" | "REWARDED";
export type RewardStatus = "AVAILABLE" | "REDEEMED" | "EXPIRED";
export type ShareChannel = "whatsapp" | "whatsapp_status" | "instagram_story" | "native" | "social";

export type EventName =
  | "landing_viewed"
  | "unlock_viewed"
  | "share_channel_selected"
  | "share_initiated"
  | "wheel_unlocked"
  | "wheel_spun"
  | "reward_issued"
  | "whatsapp_save_clicked"
  | "reward_viewed"
  | "reward_redeemed"
  | "referral_landing_viewed";

export interface PrizeDefinition {
  id: string;
  name: string;
  probability: number;
}

export type MerchantCategory = "coffee" | "barber";
export type MerchantTemplate = MerchantCategory;
export type BrandSource = "template" | "manual" | "openai";
export type BrandStylePreset = "editorial" | "minimal" | "luxury" | "bold" | "warm" | "urban";
export type BrandFontPreset = "editorial" | "modern" | "geometric" | "humanist";

export interface MerchantBrandPalette {
  canvas: string;
  canvasAccent: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  accent: string;
  accentSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  wheel: readonly string[];
}

export interface MerchantBrandProfile {
  source: BrandSource;
  logoDataUrl?: string;
  stylePreset: BrandStylePreset;
  fontPreset: BrandFontPreset;
  tone: string;
  keywords: string[];
  palette: MerchantBrandPalette;
  ai?: {
    model: string;
    generatedAt: string;
  };
}

export interface MerchantTheme {
  displayName: string;
  shortName: string;
  monogram: string;
  category: MerchantCategory;
  heroEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  mysteryLabel: string;
  shareTitle: string;
  shareCopy: string;
  referralCopy: string;
  socialHeadline: string;
  socialSubcopy: string;
  logoDataUrl?: string;
  stylePreset?: BrandStylePreset;
  fontPreset?: BrandFontPreset;
  tone?: string;
  palette: MerchantBrandPalette;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  whatsappNumber: string;
  rewardValidityDays: number;
  prizes: PrizeDefinition[];
  theme: MerchantTheme;
}

export interface MerchantExperienceCopy {
  displayName: string;
  shortName: string;
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

export interface MerchantCustomization {
  whatsappNumber: string;
  rewardValidityDays: number;
  prizes: PrizeDefinition[];
  copy: MerchantExperienceCopy;
  brand?: MerchantBrandProfile;
}

export interface MerchantSettingsRecord {
  merchantId: string;
  customization: MerchantCustomization;
  updatedAt: string;
}

export interface MerchantAccount {
  id: string;
  slug: string;
  name: string;
  template: MerchantTemplate;
  pinSalt: string;
  pinHash: string;
  createdAt: string;
}

export interface Session {
  id: string;
  merchantId: string;
  referralToken: string;
  referredBy?: string;
  state: FlowState;
  rewardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  token: string;
  shortCode: string;
  merchantId: string;
  sessionId: string;
  prizeId: string;
  prizeName: string;
  issuedAt: string;
  expiresAt: string;
  redeemedAt?: string;
}

export interface AnalyticsEvent {
  id: string;
  name: EventName;
  merchantId: string;
  sessionId?: string;
  rewardId?: string;
  referralToken?: string;
  shareChannel?: ShareChannel;
  timestamp: string;
}

export interface MerchantMetrics {
  sessions: number;
  referredSessions: number;
  shares: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  whatsappSaves: number;
  shareChannels: Record<ShareChannel, number>;
}

export interface Database {
  sessions: Session[];
  rewards: Reward[];
  events: AnalyticsEvent[];
  merchantSettings: MerchantSettingsRecord[];
  merchantAccounts: MerchantAccount[];
}
