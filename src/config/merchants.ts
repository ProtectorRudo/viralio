import type { Merchant } from "@/domain/types";

export const merchants: Merchant[] = [
  {
    id: "merchant_moka",
    slug: "moka",
    name: "Moka",
    whatsappNumber: "5491100000000",
    rewardValidityDays: 7,
    prizes: [
      { id: "upgrade", name: "Upgrade de café", probability: 35 },
      { id: "medialuna", name: "Medialuna gratis en tu próxima visita", probability: 30 },
      { id: "discount_10", name: "10% en tu próxima visita", probability: 20 },
      { id: "free_coffee", name: "Café gratis", probability: 14 },
      { id: "special", name: "Premio especial Moka", probability: 1 },
    ],
  },
];

export function getMerchantBySlug(slug: string): Merchant | undefined {
  return merchants.find((merchant) => merchant.slug === slug);
}

export function getMerchantById(id: string): Merchant | undefined {
  return merchants.find((merchant) => merchant.id === id);
}
