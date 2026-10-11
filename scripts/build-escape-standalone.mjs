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
// Lightweight, animated CC0 GLB masked raider by 3dassets.dev, asset 32700.
// Source & license: https://3dassets.dev/assets/fps-survival-forest-outpost-figure-masked-raider-958f10e5
// Keep an exact local copy on GitHub Pages: the game works without third-party
// network requests once the static site is deployed. Downloaded only at build.
const modelDir=join(rescueOutput,"models");mkdirSync(modelDir,{recursive:true});
const glbFile=join(modelDir,"masked-raider.glb");
const glbSource="https://cdn.3dassets.dev/assets/32700/v1/model.glb";
const glbResponse=await fetch(glbSource,{signal:AbortSignal.timeout(30000)});
if(!glbResponse.ok)throw Error("CASO M: no se pudo descargar modelo GLB CC0: "+glbResponse.status);
const glbBuffer=Buffer.from(await glbResponse.arrayBuffer());
if(glbBuffer.length<100000||glbBuffer.length>4e6||glbBuffer.toString("ascii",0,4)!=="glTF")
 throw Error("CASO M: archivo 3D inválido o demasiado grande");
const jsize=glbBuffer.readUInt32LE(12),jkind=glbBuffer.readUInt32LE(16);
if(jkind!==0x4e4f534a||jsize>glbBuffer.length-20)throw Error("CASO M: GLB JSON inválido");
const glbJson=JSON.parse(glbBuffer.subarray(20,20+jsize).toString("utf8"));
if(!glbJson.meshes?.length||!glbJson.nodes?.length)throw Error("CASO M: GLB sin personaje");
writeFileSync(glbFile,glbBuffer);
console.log("CASO M authentic 3D raider:",glbBuffer.length,"bytes",glbJson.meshes.length,"meshes",glbJson.nodes.length,"nodes",glbJson.animations?.map(a=>a.name),glbJson.skins?.length||0,"skins");
const audioDir=join(rescueOutput,"audio");mkdirSync(audioDir,{recursive:true});
// Authentic four-second Mauro voice recording (not generated speech).
const originalVoice=resolve("src/app/escape/rescate/audio/mauro-voice.webm");
if(!existsSync(originalVoice))throw Error("CASO M: falta la grabación original de Mauro");
cpSync(originalVoice,join(audioDir,"mauro-voice.webm"));
console.log("CASO M original voice recorded message copied");
// Real cinematic score; mobile Safari / Chrome play PCM WAV reliably.
const {writeSuspenseSoundtrack}=await import("./generate-caso-m-soundtrack.mjs");
const soundtrack=writeSuspenseSoundtrack(join(audioDir,"suspense.wav"));
console.log("CASO M music:",soundtrack.seconds,"seconds,",soundtrack.bytes,"bytes");
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
