import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/ui/merchant-onboarding.tsx"],
    rules: {
      // The onboarding QR is an exact SVG data URL generated server-side for download/printing.
      // Next Image optimization is intentionally not used for this transient operator-only preview.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "playwright-report/**", "test-results/**", "data/**"]),
]);
