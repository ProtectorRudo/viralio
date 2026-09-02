import { ImageResponse } from "next/og";
import React from "react";
import { viralio } from "@/application";

export const runtime = "nodejs";

function textStyle(color: string, size: number, weight = 700): React.CSSProperties {
  return { color, fontSize: size, fontWeight: weight, lineHeight: 1.08, letterSpacing: "-0.02em" };
}

export async function GET(request: Request, context: { params: Promise<{ referralToken: string }> }) {
  try {
    const { referralToken } = await context.params;
    const { merchant } = await viralio.getShareContext(referralToken);
    const origin = new URL(request.url).origin;
    const referralUrl = `${origin}/${merchant.slug}?ref=${encodeURIComponent(referralToken)}`;
    const p = merchant.theme.palette;
    const dark = merchant.theme.category === "barber";

    const tree = React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "96px 84px 82px",
          background: dark
            ? `linear-gradient(155deg, ${p.canvas} 0%, ${p.surface} 56%, ${p.canvasAccent} 135%)`
            : `linear-gradient(155deg, ${p.surfaceRaised} 0%, ${p.canvas} 54%, ${p.canvasAccent} 145%)`,
          color: p.text,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute", width: 760, height: 760, borderRadius: 999,
          border: `2px solid ${p.accent}`, opacity: 0.22, right: -350, top: -270,
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute", width: 580, height: 580, borderRadius: 999,
          border: `2px solid ${p.accentSecondary}`, opacity: 0.16, left: -300, bottom: 180,
        },
      }),
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 26 } },
        React.createElement(
          "div",
          {
            style: {
              width: 104, height: 104, borderRadius: dark ? 24 : 999, display: "flex",
              alignItems: "center", justifyContent: "center", background: p.primary, color: p.onPrimary,
              fontSize: 48, fontWeight: 800, boxShadow: "0 22px 55px rgba(0,0,0,.18)",
            },
          },
          merchant.theme.monogram,
        ),
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 7 } },
          React.createElement("div", { style: { ...textStyle(p.text, 42, 800), textTransform: "uppercase", letterSpacing: "0.08em" } }, merchant.theme.displayName),
          React.createElement("div", { style: { color: p.textMuted, fontSize: 24, letterSpacing: "0.05em" } }, "PASE SORPRESA · VIRALIO"),
        ),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 42, marginTop: 70 } },
        React.createElement(
          "div",
          {
            style: {
              width: 330, height: 330, borderRadius: dark ? 54 : 999,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${p.border}`, background: p.surfaceRaised,
              boxShadow: "0 35px 90px rgba(0,0,0,.17)", color: p.primary,
              fontSize: 156, fontWeight: 800,
            },
          },
          "?",
        ),
        React.createElement("div", { style: { ...textStyle(p.primary, 30, 800), textTransform: "uppercase", letterSpacing: "0.16em" } }, "HAY ALGO PARA VOS"),
        React.createElement("div", { style: { ...textStyle(p.text, 86, dark ? 800 : 700), maxWidth: 850 } }, merchant.theme.socialHeadline),
        React.createElement("div", { style: { color: p.textMuted, fontSize: 38, lineHeight: 1.35, maxWidth: 820 } }, merchant.theme.socialSubcopy),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 24 } },
        React.createElement(
          "div",
          {
            style: {
              display: "flex", flexDirection: "column", gap: 10, padding: "30px 34px",
              border: `2px solid ${p.border}`, borderRadius: 28, background: p.surface,
            },
          },
          React.createElement("div", { style: { color: p.textMuted, fontSize: 21, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" } }, "Abrí tu pase"),
          React.createElement("div", { style: { color: p.text, fontSize: 25, lineHeight: 1.3 } }, referralUrl),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", justifyContent: "space-between", color: p.textMuted, fontSize: 22 } },
          React.createElement("span", null, "Tu sorpresa es distinta. El premio de quien comparte no se revela."),
          React.createElement("span", { style: { color: p.text, fontWeight: 800 } }, "Viralio"),
        ),
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
