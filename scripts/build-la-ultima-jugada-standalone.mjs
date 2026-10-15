/**
 * Standalone web build for GitHub Pages, using the real React/Three.js game.
 * Only asset URL bases change; gameplay/puzzles/audio/3D remain identical.
 */
import {build} from "esbuild";
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";

const pagesRoot="/viralio";
const output=resolve("showcase/la-ultima-jugada");
mkdirSync(output,{recursive:true});
const sources=resolve("src/app/la-ultima-jugada");
const asPages=(code)=>code
 .replaceAll('"/la-ultima-jugada/','"'+pagesRoot+'/la-ultima-jugada/')
 .replaceAll("'/la-ultima-jugada/","'"+pagesRoot+"/la-ultima-jugada/")
 .replaceAll('"/viralio-3d/','"'+pagesRoot+'/viralio-3d/')
 .replaceAll("'/viralio-3d/","'"+pagesRoot+"/viralio-3d/")
 .replaceAll('href="/#experiencias"','href="'+pagesRoot+'/");

const result=await build({
 entryPoints:["scripts/la-ultima-jugada-standalone-entry.tsx"],
 bundle:true,splitting:true,platform:"browser",format:"esm",
 target:["es2022"],jsx:"automatic",
 define:{"process.env.NODE_ENV":'"production"'},
 outdir:output,entryNames:"app",chunkNames:"chunks/[name]-[hash]",
 minify:true,legalComments:"none",metafile:true,
 plugins:[{
  name:"pages-asset-base",
  setup(b){
   b.onLoad({filter:/\.(tsx?|jsx?)$/},({path})=>{
    if(!path.startsWith(sources))return;
    return {contents:asPages(readFileSync(path,"utf8")),
     loader:path.endsWith(".tsx")?"tsx":path.endsWith(".jsx")?"jsx":path.endsWith(".js")?"js":"ts",
     resolveDir:dirname(path)};
   });
  }
 }],
 logLevel:"warning"
});
const chunks=Object.keys(result.metafile.outputs);
for(const ext of ["app.js","app.css"]){
 if(!existsSync(join(output,ext)))throw Error("Missing "+ext);
}
for(const p of chunks){
 if(!p.endsWith(".js"))continue;
 const js=readFileSync(p,"utf8");
 if(js.includes('"/viralio-3d/')||js.includes('"/la-ultima-jugada/'))
  throw Error("Bundle has a root-relative asset path incompatible with GitHub Pages: "+p);
}
const index=[
 '<!doctype html>','<html lang="es">','<head>',
 '<meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
 '<meta name="theme-color" content="#07131d">',
 '<meta name="description" content="La Última Jugada: una final, un informe saboteado, tres salas 3D y 15 minutos para resolver el misterio.">',
 '<title>La Última Jugada — Viralio Escape (vista de prueba)</title>',
 '<link rel="stylesheet" href="./app.css">',
 '</head>','<body style="margin:0;background:#07131d">',
 '<div id="ultima-jugada-root"></div>',
 '<script type="module" src="./app.js"></script>',
 '</body>','</html>'
].join("\n");
writeFileSync(join(output,"index.html"),index);
const standaloneAssets=resolve("public/la-ultima-jugada");
const sharedAssets=resolve("public/viralio-3d");
if(!existsSync(standaloneAssets)||!existsSync(sharedAssets))throw Error("Verified local GLBs/PBR files are missing");
cpSync(standaloneAssets,output,{recursive:true,force:true});
cpSync(sharedAssets,resolve("showcase/viralio-3d"),{recursive:true,force:true});
for(const file of ["models/player-quaternius.glb","models/chair-olve.glb","models/shelf-kant.glb","models/table-lamp-ember.glb"]){
 if(!existsSync(join(output,file)))throw Error("Missing local model "+file);
}
for(const file of ["models/npc-sam-locomotion.glb","models/steel-office-desk.glb","materials/concrete_tiles-color.webp"]){
 if(!existsSync(resolve("showcase/viralio-3d",file)))throw Error("Missing premium model/material "+file);
}
console.log("PLAYABLE:",pagesRoot+"/la-ultima-jugada/");
console.log("JS chunks:",chunks.filter(p=>p.endsWith(".js")).length);
console.log("BUNDLED BYTES:",chunks.filter(p=>p.endsWith(".js")).reduce((n,p)=>n+readFileSync(p).length,0));
