/** Experiencias aprobadas para venta y demostración pública. 
 * Conservar los modelos en código para poder reactivarlos después de la auditoría.
 * NO modificar regalos que los clientes ya hayan comprado.
 */
export const COMING_SOON_SLUGS = ["abuelos", "aniversario", "propuesta"] as const;
const paused = new Set<string>(COMING_SOON_SLUGS);
export function isComingSoon(slug: string): boolean {
  return paused.has(slug);
}
