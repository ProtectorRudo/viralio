import type { Metadata } from "next";
import AffiliateRedirect from "../r/[code]/AffiliateRedirect";

/**
 * Discreet TeHiceEsto-host alias for Ailín's affiliate campaign. 
 * Dedicated host rewrites /a to /tehiceesto/a, so the handler MUST live here.
 * Reuses the existing verified 30-day attribution flow rather than creating
 * a separate tracking mechanism. The address bar is cleaned to "/" after
 * tracking succeeds. The original /r/ailin remains compatible.
 */
export const metadata: Metadata = {
  title: "Te Hice Esto — Un regalo que se siente",
  description: "Experiencias digitales únicas para emocionar y sorprender a quienes más querés.",
  openGraph: {
    title: "Te Hice Esto — Un regalo que se siente",
    description: "Un detalle que se transforma en un recuerdo inolvidable.",
    siteName: "Te Hice Esto",
    type: "website",
    url: "https://tehiceesto.com/",
  },
  robots: { index: false, follow: true },
};

export default function AilinDiscreetShortLink() {
  return <AffiliateRedirect code="ailin" source="short" />;
}
