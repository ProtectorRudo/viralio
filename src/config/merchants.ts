import type { Merchant } from "@/domain/types";

export const merchants: Merchant[] = [
  {
    id: "merchant_moka",
    slug: "moka",
    name: "Moka",
    whatsappNumber: "5491100000000",
    rewardValidityDays: 7,
    theme: {
      displayName: "Moka",
      shortName: "Moka",
      monogram: "M",
      category: "coffee",
      heroEyebrow: "Un ritual hecho para vos",
      heroTitle: "Hay algo especial esperando",
      heroCopy: "Descubrí el detalle que Moka preparó para tu próxima pausa.",
      mysteryLabel: "Sorpresa Moka",
      shareTitle: "Compartí tu pase para abrirlo",
      shareCopy: "Invitá a alguien a descubrir su propia sorpresa. La tuya sigue siendo sólo tuya.",
      referralCopy: "Tengo un pase sorpresa de Moka. ¿Querés descubrir el tuyo?",
      palette: {
        canvas: "#F1E7D8",
        canvasAccent: "#DDBD91",
        surface: "#FCF8F1",
        surfaceRaised: "#FFFFFF",
        text: "#251A14",
        textMuted: "#6F5D51",
        primary: "#A84F2A",
        primaryHover: "#873D20",
        onPrimary: "#FFFFFF",
        accent: "#C98252",
        accentSecondary: "#738D72",
        border: "#DDCDBB",
        success: "#347052",
        warning: "#9A641F",
        danger: "#A13B36",
        wheel: ["#A84F2A", "#738D72", "#D49B66", "#69483A", "#E4C99F"],
      },
    },
    prizes: [
      { id: "upgrade", name: "Upgrade de café", probability: 35 },
      { id: "medialuna", name: "Medialuna gratis en tu próxima visita", probability: 30 },
      { id: "discount_10", name: "10% en tu próxima visita", probability: 20 },
      { id: "free_coffee", name: "Café gratis", probability: 14 },
      { id: "special", name: "Premio especial Moka", probability: 1 },
    ],
  },
  {
    id: "merchant_atlas",
    slug: "atlas-barber",
    name: "Atlas Barber",
    whatsappNumber: "5491100000001",
    rewardValidityDays: 10,
    theme: {
      displayName: "Atlas Barber",
      shortName: "Atlas",
      monogram: "A",
      category: "barber",
      heroEyebrow: "Tu próximo corte empieza acá",
      heroTitle: "Tu estilo tiene una sorpresa",
      heroCopy: "Abrí tu pase privado y descubrí un beneficio para tu próxima visita.",
      mysteryLabel: "Pase Atlas",
      shareTitle: "Pasá el código. Abrí tu beneficio.",
      shareCopy: "Compartilo con alguien de tu círculo para que también encuentre su propio pase.",
      referralCopy: "Atlas me dio un pase privado. Hay otro esperando por vos.",
      palette: {
        canvas: "#0C1117",
        canvasAccent: "#243140",
        surface: "#121A23",
        surfaceRaised: "#192431",
        text: "#F4F0E7",
        textMuted: "#AEB8C2",
        primary: "#D2A64C",
        primaryHover: "#E3BB68",
        onPrimary: "#17130B",
        accent: "#7C9EB2",
        accentSecondary: "#BA7A5C",
        border: "#344250",
        success: "#76B692",
        warning: "#D2A64C",
        danger: "#E17B71",
        wheel: ["#D2A64C", "#334C60", "#B36F52", "#718B9B", "#826D42"],
      },
    },
    prizes: [
      { id: "beard_detail", name: "Perfilado de barba sin cargo", probability: 30 },
      { id: "discount_15", name: "15% en tu próximo corte", probability: 30 },
      { id: "hair_treatment", name: "Tratamiento capilar premium", probability: 20 },
      { id: "product", name: "Producto de styling de regalo", probability: 15 },
      { id: "atlas_ritual", name: "Ritual Atlas completo", probability: 5 },
    ],
  },
];

export function getMerchantBySlug(slug: string): Merchant | undefined {
  return merchants.find((merchant) => merchant.slug === slug);
}

export function getMerchantById(id: string): Merchant | undefined {
  return merchants.find((merchant) => merchant.id === id);
}
