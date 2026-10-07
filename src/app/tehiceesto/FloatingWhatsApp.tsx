"use client";

// release: internal conversion CTA

import { usePathname } from "next/navigation";

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  if (
    pathname.includes("/r/") ||
    pathname.includes("/admin") ||
    pathname.includes("/pedido/") ||
    pathname.includes("/editar/") ||
    pathname.endsWith("/crear")
  ) {
    return null;
  }

  const compact = pathname.includes("/experiencias/");
  const home = pathname === "/" || pathname === "/tehiceesto";
  const experienceSlug=compact?pathname.split("/experiencias/")[1]?.split("/")[0]||"":"";
  const createBase=pathname.startsWith("/tehiceesto")?"/tehiceesto/crear":"/crear";
  const createHref=experienceSlug?`${createBase}?experiencia=${encodeURIComponent(experienceSlug)}`:createBase;

  return (
    <a
      className={`floating-whatsapp floating-create-cta ${home ? "floating-whatsapp--home" : ""} ${compact ? "floating-whatsapp--experience" : ""}`}
      href={createHref}
      aria-label="Elegir una experiencia de Te Hice Esto"
    >
      <span className="floating-whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M16 27.2 6.2 18C2.4 14.4 2.8 8.5 7 5.9c3.1-1.9 6.9-1.2 9 1.4 2.1-2.6 5.9-3.3 9-1.4 4.2 2.6 4.6 8.5.8 12.1L16 27.2Z" />
        </svg>
      </span>
      <span className="floating-whatsapp-copy">
        <small>{compact?"Esta experiencia":"Elegí la experiencia"}</small>
        <strong>Quiero el mío</strong>
      </span>
      <span className="floating-whatsapp-arrow" aria-hidden="true">→</span>
    </a>
  );
}
