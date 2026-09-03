import { ImageResponse } from "next/og";
import React from "react";
import { viralio } from "@/application";

export const runtime = "nodejs";

function textStyle(color: string, size: number, weight = 700): React.CSSProperties {
  return { color, fontSize: size, fontWeight: weight, lineHeight: 1.02, letterSpacing: "-0.025em" };
}

export async function GET(request: Request, context: { params: Promise<{ referralToken: string }> }) {
  try {
    const { referralToken } = await context.params;
    const { merchant } = await viralio.getShareContext(referralToken);
    const origin = new URL(request.url).origin;
    const referralUrl = `${origin}/${merchant.slug}?ref=${encodeURIComponent(referralToken)}`;
    const p = merchant.theme.palette;
    const logo = merchant.theme.logoDataUrl;
    const editorial = merchant.theme.fontPreset === "editorial" || merchant.theme.stylePreset === "luxury";
    const displayFont = editorial ? "Georgia, serif" : "Arial, sans-serif";
    const bodyFont = "Arial, sans-serif";

    const tree = React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "78px 72px 68px",
          background: p.canvas,
          color: p.text,
          position: "relative",
          overflow: "hidden",
          fontFamily: bodyFont,
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 42,
          border: `2px solid ${p.border}`,
          opacity: 0.88,
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          top: 238,
          bottom: 238,
          left: 556,
          width: 2,
          background: p.border,
          opacity: 0.65,
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 34,
            borderBottom: `2px solid ${p.border}`,
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 22 } },
          React.createElement(
            "div",
            {
              style: {
                width: 82,
                height: 82,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${p.text}`,
                borderRadius: 999,
                background: p.surface,
                color: p.text,
                fontFamily: displayFont,
                fontSize: 34,
                fontWeight: 600,
                overflow: "hidden",
              },
            },
            logo
              ? React.createElement("img", { src: logo, width: 62, height: 62, alt: "", style: { objectFit: "contain" } })
              : merchant.theme.monogram,
          ),
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 7 } },
            React.createElement("div", { style: { color: p.text, fontSize: 29, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" } }, merchant.theme.displayName),
            React.createElement("div", { style: { color: p.textMuted, fontSize: 20, letterSpacing: "0.06em" } }, "INVITACIÓN PRIVADA"),
          ),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 } },
          React.createElement("span", { style: { color: p.textMuted, fontSize: 18, letterSpacing: "0.12em" } }, "EDICIÓN"),
          React.createElement("strong", { style: { color: p.text, fontSize: 28, fontWeight: 500, letterSpacing: "0.05em" } }, "01 / V"),
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flex: 1,
            alignItems: "stretch",
            padding: "92px 0 74px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: "58%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingRight: 54,
            },
          },
          React.createElement("div", { style: { color: p.primary, fontSize: 22, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase", marginBottom: 30 } }, "HAY ALGO PARA VOS"),
          React.createElement("div", { style: { ...textStyle(p.text, 78, editorial ? 500 : 720), maxWidth: 530, fontFamily: displayFont } }, merchant.theme.socialHeadline),
          React.createElement("div", { style: { color: p.textMuted, fontSize: 31, lineHeight: 1.42, maxWidth: 510, marginTop: 34 } }, merchant.theme.socialSubcopy),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                width: 190,
                marginTop: 54,
                paddingTop: 18,
                borderTop: `2px solid ${p.accent}`,
                color: p.textMuted,
                fontSize: 19,
                lineHeight: 1.35,
              },
            },
            "Abrí tu propia oportunidad",
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              width: "42%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingLeft: 54,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 278,
                height: 278,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${p.accent}`,
                borderRadius: 999,
                background: p.surface,
                color: p.text,
                position: "relative",
              },
            },
            React.createElement("div", { style: { fontFamily: displayFont, fontSize: 104, fontWeight: 400, lineHeight: 1 } }, "?"),
            React.createElement("div", { style: { position: "absolute", top: -22, right: -6, color: p.textMuted, fontSize: 18, letterSpacing: "0.08em" } }, "PASE · 01"),
          ),
          React.createElement("div", { style: { width: 278, marginTop: 24, color: p.textMuted, fontSize: 18, lineHeight: 1.4, textAlign: "right" } }, "La recompensa de quien comparte permanece oculta."),
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 28,
            paddingTop: 34,
            borderTop: `2px solid ${p.border}`,
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28 } },
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 9, maxWidth: 760 } },
            React.createElement("span", { style: { color: p.textMuted, fontSize: 17, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase" } }, "ABRÍ TU PASE"),
            React.createElement("span", { style: { color: p.text, fontSize: 22, lineHeight: 1.35, wordBreak: "break-all" } }, referralUrl),
          ),
          React.createElement("span", { style: { color: p.text, fontSize: 25, fontWeight: 800, letterSpacing: "0.05em" } }, "VIRALIO"),
        ),
        React.createElement("div", { style: { color: p.textMuted, fontSize: 17, lineHeight: 1.35 } }, "Una invitación de la marca. Tu oportunidad es independiente y el premio de quien comparte no se revela."),
      ),
    );

    return new ImageResponse(tree, {
      width: 1080,
      height: 1920,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response("Share card not found", { status: 404 });
  }
}
