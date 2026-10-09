export const TEHICEESTO_BASE_PRICE_ARS = 25_000;

export function formatTeHiceEstoPrice(value = TEHICEESTO_BASE_PRICE_ARS) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
