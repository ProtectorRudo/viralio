"use client";

import { usePathname } from "next/navigation";
import { getExperience } from "./data";

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  if (
    pathname.includes("/r/") ||
    pathname.includes("/admin") ||
    pathname.includes("/pedido/") ||
    pathname.endsWith("/crear")
  ) {
    return null;
  }

  const compact = pathname.includes("/experiencias/");
  const home = pathname === "/" || pathname === "/tehiceesto";
  const parts = pathname.split("/").filter(Boolean);
  const expIndex = parts.indexOf("experiencias");
  const experienceSlug = compact && expIndex >= 0 ? parts[expIndex + 1] || "" : "";
  const experience = experienceSlug ? getExperience(experienceSlug) : undefined;

  const message = experience
    ? `Hola! Vi el demo “${experience.title}” de Te Hice Esto y quiero crear uno para regalar. ¿Me contás cómo seguimos?`
    : "Hola! Vi Te Hice Esto y quiero crear una experiencia para regalar. ¿Me contás cómo funciona?";

  const whatsappHref =
    "https://wa.me/5492215653163?text=" + encodeURIComponent(message);

  return (
    <a
      className={`floating-whatsapp ${home ? "floating-whatsapp--home" : ""} ${compact ? "floating-whatsapp--experience" : ""}`}
      href={whatsappHref}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Consultar por Te Hice Esto en WhatsApp"
    >
      <span className="floating-whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M16.05 3.2c-6.94 0-12.58 5.52-12.58 12.31 0 2.16.58 4.27 1.68 6.11L3 29l7.58-2.05a12.8 12.8 0 0 0 5.46 1.22h.01c6.94 0 12.58-5.52 12.58-12.31C28.63 9.06 22.99 3.2 16.05 3.2Zm0 22.9h-.01a10.7 10.7 0 0 1-5.16-1.32l-.37-.2-4.5 1.22 1.2-4.29-.24-.39a10.13 10.13 0 0 1-1.58-5.61c0-5.65 4.77-10.25 10.66-10.25 5.88 0 10.66 4.6 10.66 10.25 0 5.99-4.78 10.59-10.66 10.59Zm5.85-7.67c-.32-.16-1.89-.91-2.18-1.02-.29-.1-.5-.16-.72.16-.21.31-.82 1.02-1 1.23-.19.21-.37.24-.69.08-.32-.15-1.35-.48-2.57-1.55-.95-.83-1.59-1.85-1.78-2.16-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.18.21-.31.32-.52.1-.21.05-.39-.03-.55-.08-.16-.72-1.67-.98-2.29-.26-.61-.53-.53-.72-.54h-.61c-.21 0-.56.08-.85.39-.29.31-1.11 1.06-1.11 2.59 0 1.53 1.14 3 1.3 3.21.16.21 2.25 3.35 5.45 4.7.76.32 1.35.51 1.81.66.76.24 1.46.2 2.01.12.61-.09 1.89-.76 2.16-1.49.27-.74.27-1.37.19-1.5-.08-.13-.29-.21-.61-.36Z" />
        </svg>
      </span>
      <span className="floating-whatsapp-copy">
        <small>¿Querés hacer uno?</small>
        <strong>{compact ? "Quiero el mío" : "Consultar"}</strong>
      </span>
      <span className="floating-whatsapp-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
