import type { CSSProperties } from "react";
import type { Merchant } from "@/domain/types";

type ThemeProperties = CSSProperties & Record<`--${string}`, string>;

const safeColor = /^#[0-9A-F]{6}$/i;
const fallback = "#000000";

function color(value: string): string {
  return safeColor.test(value) ? value : fallback;
}

export function merchantThemeStyle(merchant: Merchant): ThemeProperties {
  const { palette } = merchant.theme;
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
  };
}
