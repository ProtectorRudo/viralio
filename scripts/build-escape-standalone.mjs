import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

/* Independent birthday-invitation game. Keep UMBRAL's shipped files intact. */
const rescueOutput=resolve("showcase/rescate-mauro");
mkdirSync(rescueOutput,{recursive:true});
await build({
  entryPoints:["src/app/escape/rescate/main.tsx"],
  bundle:true,
  platform:"browser",
  format:"iife",
  target:["es2022"],
  jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},
  outdir:rescueOutput,
  entryNames:"app",
  minify:true,
  legalComments:"none",
  plugins:[{
    name:"local-css-modules",
    setup(e){
      e.onLoad({filter:/\.module\.css$/},({path})=>({
        contents:readFileSync(path,"utf8"),
        loader:"local-css",
        resolveDir:resolve(path,".."),
      }));
    }
  }],
  logLevel:"warning",
});
// Build a locally hosted recording, so mobile WebViews do not depend on
// unreliable speechSynthesis. Prefer an expressive Argentine Spanish voice,
// fall back to offline Latin-American Spanish if neural TTS is unavailable.
const audioDir=join(rescueOutput,"audio");mkdirSync(audioDir,{recursive:true});
const voiceFile=join(audioDir,"rescue-message.mp3");
if(!existsSync(voiceFile)){
 try{
  execFileSync("edge-tts",["--voice","es-AR-TomasNeural","--text","Por favor... no pierdas tiempo... van a volver.","--write-media",voiceFile],{timeout:25000,stdio:"ignore"});
  console.log("CASO M voice: Argentine Spanish recording ready");
 }catch{
  try{
   const wav=join(audioDir,"rescue-tmp.wav");
   execFileSync("espeak",["-v","es-la","-s","150","-p","36","-a","180","-w",wav,"Por favor. No pierdas tiempo. Van a volver."],{timeout:8000,stdio:"ignore"});
   execFileSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",wav,"-af","highpass=f=180,lowpass=f=3800,acompressor=threshold=-25dB:ratio=3:attack=12:release=125,volume=1.8","-ar","22050","-ac","1","-b:a","48k",voiceFile],{timeout:12000,stdio:"ignore"});
   unlinkSync(wav);console.log("CASO M voice: offline backup recording ready");
  }catch{console.warn("CASO M voice unavailable; browser voice fallback stays enabled");}
 }
}
writeFileSync(join(rescueOutput,"index.html"),
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no"><meta name="theme-color" content="#070a0e"><meta name="description" content="Una misteriosa misión de tres minutos para encontrar a Mauro. Escape room 3D de ficción con una sorpresa final."><meta property="og:title" content="CASO M: ¿Dónde está Mauro?"><meta property="og:description" content="Tenés 3 minutos. Encontrá las pistas. Abrí el sobre. Una experiencia interactiva de ficción."><title>CASO M · Rescate a Mauro</title><link rel="stylesheet" href="./app.css"></head><body style="margin:0;background:#070a0e"><div id="rescate-root"></div><script defer src="./app.js"></script></body></html>');
console.log("Rescate Mauro 3D invitation built:",readFileSync(join(rescueOutput,"app.js")).length,"JS bytes");
