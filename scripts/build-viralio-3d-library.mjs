/**
 * Viralio Escape: reusable GLB library materializer.
 * Sources are vetted CC0 item pages from data/viralio-3d/catalog.json.
 *
 * node scripts/build-viralio-3d-library.mjs --all
 * node scripts/build-viralio-3d-library.mjs --limit=8
 * node scripts/build-viralio-3d-library.mjs --validate-only
 *
 * Requires Node >= 20. Optional: ./node_modules/.bin/gltf-transform to
 * recompress PBR textures and quantize geometry without changing node names.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const exec = promisify(execFile);
const root = resolve(".");
const catalog = JSON.parse(readFileSync(join(root,"data/viralio-3d/catalog.json"),"utf8"));
const out = join(root,"public/viralio-3d");
const models = join(out,"models");
const reportPath = join(root,"data/viralio-3d/build-report.json");
const limitOption = process.argv.find(s=>s.startsWith("--limit="));
const limit = limitOption ? Math.max(1,Math.min(200,Number(limitOption.split("=")[1])||1)) : Infinity;
const validateOnly = process.argv.includes("--validate-only");
const forced = process.argv.includes("--force");
const minSuccessOption = process.argv.find(s=>s.startsWith("--min-success="));
const minSuccess = minSuccessOption ? Number(minSuccessOption.split("=")[1]) : 0;
const cli = join(root,"node_modules/.bin/gltf-transform");
const totalMaxBytes = 36*1024*1024; // strict single-source cap
const concurrency = 3;
const selected = catalog.assets.slice(0,limit);
mkdirSync(models,{recursive:true});
const sha = b=>createHash("sha256").update(b).digest("hex");

function verifyGlb(buf) {
  if (buf.length < 64 || buf.toString("ascii",0,4) !== "glTF") throw Error("Invalid GLB magic or small file");
  if (buf.readUInt32LE(4) !== 2) throw Error("GLB v2 required");
  if (buf.readUInt32LE(8) !== buf.length) throw Error("GLB header length mismatch");
  const len=buf.readUInt32LE(12), typ=buf.readUInt32LE(16);
  if (typ !== 0x4e4f534a || len > buf.length-20) throw Error("GLB JSON chunk missing");
  const gltf = JSON.parse(buf.subarray(20,20+len).toString("utf8"));
  if (!Array.isArray(gltf.meshes) || !gltf.meshes.length) throw Error("GLB contains no meshes");
  if (!Array.isArray(gltf.nodes) || !gltf.nodes.length) throw Error("GLB contains no scene nodes");
  return {
    meshes:gltf.meshes.length,
    nodes:gltf.nodes.length,
    materials:gltf.materials?.length||0,
    textures:gltf.textures?.length||0,
    animations:gltf.animations?.length||0,
    skins:gltf.skins?.length||0,
    clipNames:gltf.animations?.map(a=>a.name||"unnamed")||[],
    extensions:gltf.extensionsUsed||[],
  };
}

async function download(item) {
  const innersceneCC0=/^https:\/\/www\.innerscene\.com\/api\/library\/[a-z0-9-]+\/download$/;
  const clubKitCC0=/^https:\/\/cdn\.3dassets\.dev\/assets\/19143\/v1\/model\.glb$/;
  if (!innersceneCC0.test(item.source) && !(item.id==="football-soccer-club-grounds-starter" && clubKitCC0.test(item.source))) {
    throw Error("Unapproved source URL");
  }
  let err;
  for(let retry=0;retry<3;retry++) {
    try {
      const res=await fetch(item.source,{signal:AbortSignal.timeout(90000),
        headers:{"User-Agent":"ViralioEscape-CC0-AssetBuilder/1.0","Accept":"application/octet-stream,*/*"}});
      if(!res.ok)throw Error("HTTP "+res.status);
      const reported=Number(res.headers.get("content-length")||0);
      if(reported>totalMaxBytes)throw Error("Source too large: "+reported);
      const buffer=Buffer.from(await res.arrayBuffer());
      if(buffer.length>totalMaxBytes)throw Error("Source exceeds 36 MiB");
      verifyGlb(buffer);
      return buffer;
    } catch(e) { err=e; if(retry<2) await new Promise(r=>setTimeout(r,1200*(retry+1))); }
  }
  throw err;
}

const results=[];
let cursor=0;
async function worker(){
  while(cursor<selected.length){
    const item=selected[cursor++];
    const filename=item.id+".glb";
    const relative="/viralio-3d/models/"+filename;
    const target=join(models,filename);
    try {
      let info, optimized=false;
      if(existsSync(target)&&!forced){
        info=verifyGlb(readFileSync(target));
      } else if(!validateOnly){
        const raw=await download(item);
        const rawInfo=verifyGlb(raw);
        if(item.tier==="personaje-animado" && (rawInfo.skins<1||rawInfo.animations<7))
          throw Error("Animated character missing rig or 7 source clips");
        const temp=target+".source.glb";
        writeFileSync(temp,raw);
        if(existsSync(cli)){
          try {
            await exec(cli,[
              "optimize",temp,target,
              "--compress","quantize",
              "--texture-compress","webp",
              "--texture-size",item.tier==="hero-fotorealista"?"2048":"1024",
              "--flatten","false",
              "--join","false"
            ],{timeout:120000,maxBuffer:1024*1024});
            info=verifyGlb(readFileSync(target));
            if(item.tier==="personaje-animado"&&(info.skins<1||info.animations<7))
              throw Error("Optimized character lost skin or animations");
            optimized=true;
          }catch(e){
            console.warn("OPTIMIZE_FALLBACK",item.id,String(e.message).slice(0,160));
            writeFileSync(target,raw);
            info=verifyGlb(raw);
          }
        }else{
          writeFileSync(target,raw);
          info=verifyGlb(raw);
        }
        rmSync(temp,{force:true});
      } else throw Error("Missing GLB: "+relative);
      if(item.tier==="personaje-animado"&&(info.skins<1||info.animations<7))throw Error("Missing character skeleton or clips");
      const size=statSync(target).size;
      if(size>totalMaxBytes)throw Error("Output exceeds 36 MiB");
      const hash=sha(readFileSync(target));
      const entry={
        id:item.id,title:item.title,category:item.category,tier:item.tier,
        ...(item.sourceModelCount?{sourceModelCount:item.sourceModelCount}:{}),
        quality:item.quality,license:item.license,sourcePage:item.sourcePage,
        author:item.author,path:relative,
        byteSize:size,sha256:hash,
        meshes:info.meshes,nodes:info.nodes,materials:info.materials,
        textures:info.textures,animations:info.animations,skins:info.skins,clipNames:info.clipNames,
        optimized:optimized||info.extensions.includes("EXT_texture_webp")||info.extensions.includes("KHR_texture_webp")
      };
      results.push({ok:true,entry});
      console.log("OK",item.id,Math.round(size/1024)+" KiB",entry.textures+" textures");
    }catch(err){
      results.push({ok:false,id:item.id,sourcePage:item.sourcePage,error:String(err.message||err)});
      console.error("SKIP",item.id,String(err.message||err));
    }
  }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
const ordered=selected.map(item=>results.find(r=>r.ok&&r.entry.id===item.id)).filter(Boolean).map(r=>r.entry);
const failures=selected.map(item=>results.find(r=>!r.ok&&r.id===item.id)).filter(Boolean);
const index={name:"Viralio Escape — shared 3D models",version:catalog.version,generatedAt:new Date().toISOString(),
  total:ordered.length,license:"CC0-1.0",items:ordered};
if(!validateOnly){
  writeFileSync(join(out,"index.json"),JSON.stringify(index,null,2)+"\n");
  writeFileSync(reportPath,JSON.stringify({generatedAt:index.generatedAt,selected:selected.length,successful:ordered.length,
    failed:failures.length,totalBytes:ordered.reduce((n,e)=>n+e.byteSize,0),failures},null,2)+"\n");
}
console.log("VIRALIO_3D",JSON.stringify({catalog:catalog.assets.length,selected:selected.length,
  loaded:ordered.length,errors:failures.length,bytes:ordered.reduce((n,e)=>n+e.byteSize,0)}));
if(ordered.length<minSuccess) process.exitCode=1;
if(validateOnly && failures.length) process.exitCode=1;
const expectedCharacters=selected.filter(item=>item.tier==="personaje-animado");
if(expectedCharacters.some(item=>!ordered.some(entry=>entry.id===item.id))) process.exitCode=1;
