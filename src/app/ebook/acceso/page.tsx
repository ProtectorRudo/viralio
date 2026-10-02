import { cookies } from "next/headers";
import Link from "next/link";
import {
  EBOOK_ACCESS_COOKIE,
  getPurchase,
  verifyAccessToken,
} from "@/ebook/server";

export const dynamic = "force-dynamic";

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!domain) return value;
  const visible = name.slice(0, Math.min(2, name.length));
  return visible + "•••@" + domain;
}

export default async function EbookAccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;

  const cookieStore = await cookies();
  const raw = cookieStore.get(EBOOK_ACCESS_COOKIE)?.value;
  const token = verifyAccessToken(raw);
  const purchase = token ? await getPurchase(token.paymentId).catch(() => undefined) : undefined;
  const hasAccess = Boolean(purchase && purchase.status === "approved");

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 0%, rgba(199,255,74,.15), transparent 35%), #080b10",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      padding: "28px",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <section style={{
        width: "min(620px, 100%)",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: "28px",
        background: "rgba(255,255,255,.055)",
        padding: "clamp(28px, 6vw, 54px)",
        boxShadow: "0 28px 80px rgba(0,0,0,.28)",
      }}>
        <div style={{
          display: "inline-flex",
          borderRadius: "999px",
          padding: "8px 11px",
          background: "#c7ff4a",
          color: "#080b10",
          fontSize: "10px",
          fontWeight: 900,
          letterSpacing: ".12em",
        }}>
          ANUNCIOS QUE VENDEN
        </div>

        {hasAccess ? (
          <>
            <h1 style={{ fontSize: "clamp(38px, 8vw, 62px)", lineHeight: .98, letterSpacing: "-.055em", margin: "25px 0 16px" }}>
              Tu Playbook ya es tuyo.
            </h1>
            <p style={{ color: "#a8b1bd", lineHeight: 1.65, fontSize: "16px" }}>
              Pago confirmado. Tu acceso quedó habilitado
              {purchase?.payer_email ? <> para <strong style={{color:"#fff"}}>{maskEmail(purchase.payer_email)}</strong></> : null}.
            </p>
            <a
              href="/api/ebook/download"
              style={{
                marginTop: "26px",
                minHeight: "62px",
                borderRadius: "15px",
                background: "#c7ff4a",
                color: "#080b10",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 21px",
                fontWeight: 900,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              DESCARGAR ANUNCIOS QUE VENDEN <span style={{fontSize:"21px"}}>↓</span>
            </a>
            <p style={{ color: "#66717e", fontSize: "11px", lineHeight: 1.55, marginTop: "17px" }}>
              Guardá una copia del PDF en tu dispositivo. Este acceso está asociado a tu compra.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "clamp(34px, 8vw, 55px)", lineHeight: 1, letterSpacing: "-.05em", margin: "25px 0 16px" }}>
              {state === "pending" ? "Tu pago está pendiente." : "Todavía no pudimos habilitar el acceso."}
            </h1>
            <p style={{ color: "#a8b1bd", lineHeight: 1.65, fontSize: "16px" }}>
              {state === "pending"
                ? "Cuando Mercado Pago confirme la operación, se habilitará tu Playbook."
                : "El acceso se activa únicamente después de verificar un pago aprobado de Mercado Pago."}
            </p>
            <Link
              href="/ebook"
              style={{
                marginTop: "25px",
                display: "inline-flex",
                color: "#c7ff4a",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← VOLVER A LA PÁGINA DEL PRODUCTO
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
