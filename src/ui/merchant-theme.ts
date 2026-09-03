import type { CSSProperties } from "react";
import type { BrandFontPreset, BrandStylePreset, Merchant } from "@/domain/types";

type ThemeProperties = CSSProperties & Record<`--${string}`, string>;

const safeColor = /^#[0-9A-F]{6}$/i;
const fallback = "#000000";

const fontTokens: Record<BrandFontPreset, { display: string; body: string }> = {
  editorial: {
    display: 'Georgia, "Times New Roman", serif',
    body: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modern: {
    display: '"Segoe UI", Inter, ui-sans-serif, sans-serif',
    body: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  geometric: {
    display: 'Avenir, "Trebuchet MS", "Segoe UI", sans-serif',
    body: 'Avenir, "Trebuchet MS", "Segoe UI", sans-serif',
  },
  humanist: {
    display: 'Optima, Candara, "Segoe UI", sans-serif',
    body: 'Optima, Candara, "Segoe UI", sans-serif',
  },
};

const styleTokens: Record<BrandStylePreset, Record<string, string>> = {
  editorial: {
    "--radius-md": "1rem", "--radius-xl": "1.75rem", "--brand-mark-radius": "50%",
    "--shadow-card": "0 1.6rem 5.2rem color-mix(in srgb, var(--color-text) 14%, transparent)",
    "--shadow-button": "0 .7rem 1.6rem color-mix(in srgb, var(--color-primary) 26%, transparent)",
  },
  minimal: {
    "--radius-md": ".7rem", "--radius-xl": "1.15rem", "--brand-mark-radius": ".65rem",
    "--shadow-card": "0 1rem 3.5rem color-mix(in srgb, var(--color-text) 9%, transparent)",
    "--shadow-button": "0 .45rem 1.1rem color-mix(in srgb, var(--color-primary) 18%, transparent)",
  },
  luxury: {
    "--radius-md": ".8rem", "--radius-xl": "1.4rem", "--brand-mark-radius": "50%",
    "--shadow-card": "0 2rem 6rem color-mix(in srgb, var(--color-text) 20%, transparent)",
    "--shadow-button": "0 .8rem 1.9rem color-mix(in srgb, var(--color-primary) 30%, transparent)",
  },
  bold: {
    "--radius-md": "1.35rem", "--radius-xl": "2.4rem", "--brand-mark-radius": "1rem",
    "--shadow-card": "0 1.7rem 4.8rem color-mix(in srgb, var(--color-text) 20%, transparent)",
    "--shadow-button": "0 .8rem 1.7rem color-mix(in srgb, var(--color-primary) 34%, transparent)",
  },
  warm: {
    "--radius-md": "1.2rem", "--radius-xl": "2.15rem", "--brand-mark-radius": "50%",
    "--shadow-card": "0 1.5rem 5rem color-mix(in srgb, var(--color-text) 17%, transparent)",
    "--shadow-button": "0 .65rem 1.5rem color-mix(in srgb, var(--color-primary) 28%, transparent)",
  },
  urban: {
    "--radius-md": ".75rem", "--radius-xl": "1.2rem", "--brand-mark-radius": ".65rem",
    "--shadow-card": "0 1.8rem 5.4rem color-mix(in srgb, var(--color-text) 24%, transparent)",
    "--shadow-button": "0 .7rem 1.4rem color-mix(in srgb, var(--color-primary) 32%, transparent)",
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
