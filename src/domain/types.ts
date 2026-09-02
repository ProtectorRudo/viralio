export type FlowState = "LANDING" | "UNLOCK" | "SHARED" | "REWARDED";
export type RewardStatus = "AVAILABLE" | "REDEEMED" | "EXPIRED";
export type ShareChannel = "whatsapp" | "native" | "social";

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
  palette: {
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
  };
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

export interface Database {
  sessions: Session[];
  rewards: Reward[];
  events: AnalyticsEvent[];
}
