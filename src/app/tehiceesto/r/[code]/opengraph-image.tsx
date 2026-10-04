import { ImageResponse } from "next/og";

export const alt = "Te Hice Esto — Tenés algo esperando";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PrivateGiftOpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden",
      background: "#080709", color: "#f4efea", padding: "58px 66px", fontFamily: "Georgia, serif",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "radial-gradient(circle at 76% 42%, rgba(226,182,160,.17), transparent 27%), radial-gradient(circle at 12% 10%, rgba(255,255,255,.05), transparent 25%)" }} />
      <div style={{ position: "absolute", width: 510, height: 510, borderRadius: 999, border: "1px solid rgba(226,182,160,.12)", right: -65, top: 62, display: "flex", boxShadow: "0 0 0 64px rgba(226,182,160,.022), 0 0 0 128px rgba(226,182,160,.01)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Arial, sans-serif", fontSize: 17, letterSpacing: ".18em", color: "#817a82" }}>
          <span>TE HICE ESTO</span><span>EXPERIENCIA PRIVADA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 820 }}>
          <div style={{ display: "flex", fontFamily: "Arial, sans-serif", fontSize: 18, letterSpacing: ".12em", color: "#b69b8f", marginBottom: 24 }}>ALGUIEN HIZO ESTO PARA VOS</div>
          <div style={{ display: "flex", fontSize: 94, lineHeight: .91, letterSpacing: "-.045em" }}>Tenés algo</div>
          <div style={{ display: "flex", fontSize: 94, lineHeight: .91, letterSpacing: "-.045em", color: "#e1b49f", marginTop: 8 }}>esperando.</div>
          <div style={{ display: "flex", fontFamily: "Arial, sans-serif", fontSize: 22, lineHeight: 1.45, color: "#9a9298", marginTop: 30, width: 620 }}>Abrilo cuando tengas un momento para vos.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Arial, sans-serif", fontSize: 18, color: "#777078" }}>
          <span style={{ marginRight: 12 }}>●</span><span>Este enlace fue creado para una sola persona</span>
        </div>
      </div>
    </div>,
    size,
  );
}
