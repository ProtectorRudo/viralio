import type { CSSProperties } from "react";
import type { BrandFontPreset, BrandStylePreset, Merchant } from "@/domain/types";

type ThemeProperties = CSSProperties & Record<`--${string}`, string>;

const safeColor = /^#[0-9A-F]{6}$/i;
const fallback = "#000000";

const uiSans = '"Avenir Next", Avenir, "Segoe UI", Helvetica, Arial, sans-serif';

const fontTokens: Record<BrandFontPreset, { display: string; body: string }> = {
  editorial: {
    display: '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
    body: uiSans,
  },
  modern: {
    display: '"Helvetica Neue", Helvetica, "Avenir Next", Avenir, "Segoe UI", sans-serif',
    body: uiSans,
  },
  geometric: {
    display: 'Avenir, "Avenir Next", Futura, "Century Gothic", "Segoe UI", sans-serif',
    body: uiSans,
  },
  humanist: {
    display: 'Optima, Candara, "Gill Sans", "Segoe UI", sans-serif',
    body: 'Optima, Candara, "Segoe UI", sans-serif',
  },
};

const styleTokens: Record<BrandStylePreset, Record<string, string>> = {
  editorial: {
    "--radius-md": ".625rem",
    "--radius-xl": "1rem",
    "--radius-control": ".5rem",
    "--radius-panel": ".75rem",
    "--radius-shell": ".875rem",
    "--brand-mark-radius": "50%",
    "--display-weight": "500",
    "--display-tracking": "-.04em",
    "--shadow-card": "0 24px 72px color-mix(in srgb, var(--color-text) 8%, transparent)",
    "--shadow-button": "none",
  },
  minimal: {
    "--radius-md": ".4rem",
    "--radius-xl": ".65rem",
    "--radius-control": ".35rem",
    "--radius-panel": ".5rem",
    "--radius-shell": ".55rem",
    "--brand-mark-radius": ".45rem",
    "--display-weight": "540",
    "--display-tracking": "-.035em",
    "--shadow-card": "0 20px 64px color-mix(in srgb, var(--color-text) 6%, transparent)",
    "--shadow-button": "none",
  },
  luxury: {
    "--radius-md": ".45rem",
    "--radius-xl": ".75rem",
    "--radius-control": ".32rem",
    "--radius-panel": ".55rem",
    "--radius-shell": ".7rem",
    "--brand-mark-radius": "50%",
    "--display-weight": "480",
    "--display-tracking": "-.045em",
    "--shadow-card": "0 28px 84px color-mix(in srgb, var(--color-text) 9%, transparent)",
    "--shadow-button": "none",
  },
  bold: {
    "--radius-md": ".9rem",
    "--radius-xl": "1.35rem",
    "--radius-control": ".7rem",
    "--radius-panel": ".9rem",
    "--radius-shell": "1.15rem",
    "--brand-mark-radius": ".7rem",
    "--display-weight": "720",
    "--display-tracking": "-.05em",
    "--shadow-card": "0 24px 70px color-mix(in srgb, var(--color-text) 10%, transparent)",
    "--shadow-button": "none",
  },
  warm: {
    "--radius-md": ".85rem",
    "--radius-xl": "1.25rem",
    "--radius-control": ".72rem",
    "--radius-panel": ".95rem",
    "--radius-shell": "1.15rem",
    "--brand-mark-radius": "50%",
    "--display-weight": "520",
    "--display-tracking": "-.038em",
    "--shadow-card": "0 24px 72px color-mix(in srgb, var(--color-text) 8%, transparent)",
    "--shadow-button": "none",
  },
  urban: {
    "--radius-md": ".48rem",
    "--radius-xl": ".8rem",
    "--radius-control": ".42rem",
    "--radius-panel": ".6rem",
    "--radius-shell": ".7rem",
    "--brand-mark-radius": ".5rem",
    "--display-weight": "680",
    "--display-tracking": "-.045em",
    "--shadow-card": "0 24px 72px color-mix(in srgb, var(--color-text) 10%, transparent)",
    "--shadow-button": "none",
  },
};

function color(value: string): string {
  return safeColor.test(value) ? value : fallback;
}

export function merchantThemeStyle(merchant: Merchant): ThemeProperties {
  const { palette } = merchant.theme;
  const fontPreset = merchant.theme.fontPreset ?? (merchant.theme.category === "coffee" ? "editorial" : "modern");
  const stylePreset = merchant.theme.stylePreset ?? (merchant.theme.category === "coffee" ? "warm" : "urban");
  const fonts = fontTokens[fontPreset];
  return {
    "--color-canvas": color(palette.canvas),
    "--color-canvas-accent": color(palette.canvasAccent),
    "--color-surface": color(palette.surface),
    "--color-surface-raised": color(palette.surfaceRaised),
    "--color-text": color(palette.text),
    "--color-text-muted": color(palette.textMuted),
    "--color-primary": color(palette.primary),
    "--color-primary-hover": color(palette.primaryHover),
    "--color-on-primary": color(palette.onPrimary),
    "--color-accent": color(palette.accent),
    "--color-accent-secondary": color(palette.accentSecondary),
    "--color-border": color(palette.border),
    "--color-success": color(palette.success),
    "--color-warning": color(palette.warning),
    "--color-danger": color(palette.danger),
    "--font-display": fonts.display,
    "--font-body": fonts.body,
    ...styleTokens[stylePreset],
  };
}
