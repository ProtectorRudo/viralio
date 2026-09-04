import { ImageResponse } from "next/og";
import React from "react";
import { viralio } from "@/application";
import { shareCardLayout } from "@/brand/share-card-layout";

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
    const layout = shareCardLayout(merchant.theme);
    const editorial = merchant.theme.fontPreset === "editorial" || merchant.theme.stylePreset === "luxury";
    const displayFont = editorial ? "Georgia, serif" : "Arial, sans-serif";
    const bodyFont = "Arial, sans-serif";
    const centered = layout.textAlign === "center";
    const row = layout.bodyDirection === "row";
    const brandedVisual = layout.composition !== "editorial-poster";

    const brandVisual = logo
      ? React.createElement("img", { src: logo, width: Math.round(layout.visualSize * 0.58), height: Math.round(layout.visualSize * 0.58), alt: "", style: { objectFit: "contain" } })
      : React.createElement(
          "div",
          {
            style: {
              fontFamily: displayFont,
              fontSize: brandedVisual ? Math.max(54, Math.round(layout.visualSize * 0.28)) : 104,
              fontWeight: brandedVisual ? 600 : 400,
              lineHeight: 1,
              letterSpacing: brandedVisual ? "0.02em" : "0",
            },
          },
          brandedVisual ? merchant.theme.monogram : "?",
        );

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
      layout.frameBorderWidth > 0
        ? React.createElement("div", {
            style: {
              position: "absolute",
              inset: layout.frameInset,
              border: `${layout.frameBorderWidth}px solid ${p.border}`,
              opacity: 0.88,
            },
          })
        : null,
      layout.composition === "editorial-poster"
        ? React.createElement("div", {
            style: {
              position: "absolute",
              top: 238,
              bottom: 238,
              left: 556,
              width: 2,
              background: p.border,
              opacity: 0.65,
            },
          })
        : null,
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
                borderRadius: layout.composition === "branded-announcement" ? 12 : 999,
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
            React.createElement("div", { style: { color: p.textMuted, fontSize: 20, letterSpacing: "0.06em" } }, layout.invitationLabel),
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
            flexDirection: layout.bodyDirection,
            alignItems: layout.bodyAlign,
            padding: layout.bodyPadding,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: layout.textWidth,
              order: layout.copyOrder,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: centered ? "center" : "flex-start",
              paddingRight: row ? 54 : 0,
              textAlign: layout.textAlign,
            },
          },
          React.createElement("div", { style: { color: p.primary, fontSize: 22, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase", marginBottom: 30 } }, layout.eyebrow),
          React.createElement(
            "div",
            {
              style: {
                ...textStyle(p.text, layout.headlineSize, editorial ? Math.min(layout.headlineWeight, 560) : layout.headlineWeight),
                maxWidth: layout.headlineMaxWidth,
                fontFamily: displayFont,
              },
            },
            merchant.theme.socialHeadline,
          ),
          React.createElement("div", { style: { color: p.textMuted, fontSize: 31, lineHeight: 1.42, maxWidth: Math.min(layout.headlineMaxWidth, 760), marginTop: 34 } }, merchant.theme.socialSubcopy),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                width: centered ? 260 : 190,
                marginTop: 54,
                paddingTop: 18,
                borderTop: `2px solid ${p.accent}`,
                color: p.textMuted,
                fontSize: 19,
                lineHeight: 1.35,
                justifyContent: centered ? "center" : "flex-start",
              },
            },
            "Abrí tu propia oportunidad",
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              width: layout.visualWidth,
              order: layout.visualOrder,
              display: "flex",
              flexDirection: "column",
              alignItems: centered ? "center" : row ? "flex-end" : "flex-start",
              justifyContent: "center",
              paddingLeft: row ? 54 : 0,
              marginTop: layout.visualMarginTop,
              marginBottom: layout.visualOrder < layout.copyOrder ? 54 : 0,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: layout.visualSize,
                height: layout.visualSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `${layout.visualBorderWidth}px solid ${p.accent}`,
                borderRadius: layout.visualRadius,
                background: layout.composition === "branded-announcement" ? p.primary : p.surface,
                color: layout.composition === "branded-announcement" ? p.onPrimary : p.text,
                position: "relative",
                overflow: "hidden",
              },
            },
            brandVisual,
            React.createElement("div", { style: { position: "absolute", top: 18, right: 20, color: layout.composition === "branded-announcement" ? p.onPrimary : p.textMuted, fontSize: 18, letterSpacing: "0.08em" } }, "PASE · 01"),
          ),
          React.createElement(
            "div",
            {
              style: {
                width: layout.visualSize,
                marginTop: 24,
                color: p.textMuted,
                fontSize: 18,
                lineHeight: 1.4,
                textAlign: centered ? "center" : row ? "right" : "left",
              },
            },
            "La recompensa de quien comparte permanece oculta.",
          ),
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
