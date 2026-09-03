import type { MerchantCategory } from "@/domain/types";

export function BrandIcon({ category, className = "" }: { category: MerchantCategory; className?: string }) {
  if (category === "barber") {
    return (
      <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 12l28 40M46 12L18 52" />
        <circle cx="14" cy="9" r="6" /><circle cx="50" cy="9" r="6" />
        <path d="M27 31h10" />
      </svg>
    );
  }
  if (category === "generic") {
    return (
      <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 8l5.6 15.7L54 30l-16.4 6.3L32 52l-5.6-15.7L10 30l16.4-6.3L32 8Z" />
        <circle cx="32" cy="30" r="5" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M16 24h32v16a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12V24Z" />
      <path d="M48 29h4a7 7 0 0 1 0 14h-5M24 17c-4-5 4-6 0-11M36 17c-4-5 4-6 0-11" />
    </svg>
  );
}
