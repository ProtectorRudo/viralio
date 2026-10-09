import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";

const output = resolve("showcase/escape");
mkdirSync(output, { recursive: true });

await build({
  entryPoints: ["src/app/escape/standalone.tsx"],
  bundle: true,
  external: ["/escape/images/*"],
  platform: "browser",
  format: "iife",
  target: ["es2022"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outdir: output,
  entryNames: "app",
  minify: true,
  legalComments: "none",
  plugins: [{
    name: "local-css-modules",
    setup(e) {
      e.onLoad({ filter: /\.module\.css$/ }, ({ path }) => ({
        contents: readFileSync(path, "utf8"),
        loader: "local-css",
        resolveDir: resolve(path, ".."),
      }));
    }
  }],
  logLevel: "warning",
});

for (const file of ["app.js", "app.css"]) {
  const path = join(output, file);
  const content = readFileSync(path, "utf8")
    .replaceAll("/escape/images/", "./images/")
    .replaceAll("/escape/audio/", "./audio/");
  writeFileSync(path, content);
}

cpSync(resolve("public/escape/images"), join(output,"images"), {recursive:true});
cpSync(resolve("public/escape/audio"), join(output,"audio"), {recursive:true});
writeFileSync(join(output,"index.html"), 
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#070b0e"><title>UMBRAL · Viralio Escape</title><meta name="description" content="Cuatro capítulos de misterio. Encontrá las pistas y escapá de la casa."><link rel="preload" as="image" href="./images/retina/mansion.webp" media="(min-resolution: 2dppx)" fetchpriority="high"><link rel="stylesheet" href="./app.css"></head><body style="margin:0;background:#070b0e"><div id="escape-root"></div><script defer src="./app.js"></script></body></html>');
console.log("UMBRAL standalone built:", readFileSync(join(output,"app.js")).length, "JS bytes,", readFileSync(join(output,"app.css")).length, "CSS bytes");
