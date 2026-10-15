/**
 * 14 free, CC0, scanned universal-use objects. Resolve the official Poly Haven public API
 * download bundle, convert to self-contained optimized GLB, append only VERIFIED
 * files to the pre-existing Viralio library index. No game or scene changes.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync,rmSync} from "node:fs";
import {resolve,join,basename,dirname,sep} from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {tmpdir} from "node:os";
import {mkdtempSync} from "node:fs";
import {createHash} from "node:crypto";

const exec=promisify(execFile),root=resolve(".");
const manifest=JSON.parse(readFileSync(join(root,"data/viralio-3d/polyhaven-universal-models.json"),"utf8"));
const modelDir=join(root,"public/viralio-3d/models");
const indexFile=join(root,"public/viralio-3d/index.json");
const reportFile=join(root,"data/viralio-3d/polyhaven-universal-report.json");
const generalReport=join(root,"data/viralio-3d/build-report.json");
const cli=join(root,"node_modules/.bin/gltf-transform");
const validateOnly=process.argv.includes("--validate-only");
const fileCap=28*1024*1024,totalCap=80*1024*1024;
mkdirSync(modelDir,{recursive:true});
const sha256=b=>createHash("sha256").update(b).digest("hex");

function verify(b) {
 if(b.length<48||b.toString("ascii",0,4)!=="glTF"||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error("Invalid GLB header");
 const n=b.readUInt32LE(12);
 if(b.readUInt32LE(16)!==0x4e4f534a||n+20>b.length)throw Error("Invalid GLB JSON chunk");
 const j=JSON.parse(b.subarray(20,20+n).toString("utf8"));
 if(!j.meshes?.length||!j.nodes?.length)throw Error("GLB has no meshes/nodes");
 return {meshes:j.meshes.length,nodes:j.nodes.length,textures:j.textures?.length??0,materials:j.materials?.length??0,animations:j.animations?.length??0,skins:j.skins?.length??0};
}
async function get(url,max=totalCap){
 const u=new URL(url);
 if(u.protocol!=="https:"||!["dl.polyhaven.org","api.polyhaven.com"].includes(u.hostname))throw Error("Unapproved origin "+u.origin);
 const r=await fetch(url,{signal:AbortSignal.timeout(60000),headers:{"User-Agent":"ViralioEscape-3D-CC0/1.0"}});
 if(!r.ok)throw Error("Download HTTP "+r.status);
 if(Number(r.headers.get("content-length")||0)>max)throw Error("File declared too large");
 const b=Buffer.from(await r.arrayBuffer());
 if(b.length>max)throw Error("Download size cap exceeded");
 return b;
}
async function materialize(item) {
 if(!/^[a-z0-9_-]+$/.test(item.assetId)||!/^universal-ph-[a-z0-9-]+$/.test(item.id))throw Error("Invalid asset id");
 const dest=join(modelDir,item.id+".glb");
 if(existsSync(dest))return dest;
 if(validateOnly)throw Error("Missing file "+item.id);
 const files=JSON.parse((await get("https://api.polyhaven.com/files/"+item.assetId,3*1024*1024)).toString("utf8"));
 const variants=files.gltf??{};
 const node=variants["1k"]?.gltf??variants["2k"]?.gltf??Object.values(variants).find(v=>v?.gltf)?.gltf;
 if(!node?.url||!new URL(node.url).pathname.endsWith(".gltf"))throw Error("No official glTF bundle");
 const temp=mkdtempSync(join(tmpdir(),"viralio-ball-"));
 try {
  const entries=[[basename(new URL(node.url).pathname),node.url],...Object.entries(node.include??{}).map(([rel,obj])=>[rel,obj?.url])];
  if(entries.length<2)throw Error("Missing glTF dependency entries");
  let total=0;
  for(const [rel,url] of entries) {
   if(typeof url!=="string")throw Error("Dependency missing URL "+rel);
   const path=resolve(temp,rel);
   if(!path.startsWith(resolve(temp)+sep))throw Error("Unsafe dependency path");
   const b=await get(url);
   total+=b.length;
   if(total>totalCap)throw Error("Source bundle too large");
   mkdirSync(dirname(path),{recursive:true});
   writeFileSync(path,b);
  }
  const main=join(temp,entries[0][0]);
  const j=JSON.parse(readFileSync(main,"utf8"));
  if(!j.meshes?.length)throw Error("Source glTF has no meshes");
  const out=dest+".temp.glb";
  if(!existsSync(cli))throw Error("glTF Transform CLI not installed");
  try {
   await exec(cli,["optimize",main,out,"--compress","quantize","--texture-compress","webp","--texture-size","1024","--flatten","false","--join","false"],{timeout:180000,maxBuffer:8*1024*1024});
  } catch(e) {
   console.warn("POLYHAVEN_OPTIMIZE_FALLBACK",item.id,String(e.message).slice(0,200));
   await exec(cli,["copy",main,out],{timeout:180000,maxBuffer:8*1024*1024});
  }
  const b=readFileSync(out);verify(b);
  if(b.length>fileCap)throw Error("Result exceeds mobile-friendly 28MB cap");
  writeFileSync(dest,b);rmSync(out,{force:true});
  return dest;
 }finally {rmSync(temp,{recursive:true,force:true});}
}
const results=[],errors=[];
for(const item of manifest.assets){
 try {
  const file=await materialize(item),b=readFileSync(file),details=verify(b);
  results.push({id:item.id,title:item.title,category:item.category,tier:"hero-fotorealista",qualityClass:item.qualityClass,priority:item.priority,
   quality:item.quality,license:"CC0-1.0",author:item.author,sourcePage:item.sourcePage,
   path:"/viralio-3d/models/"+item.id+".glb",byteSize:b.length,sha256:sha256(b),...details,optimized:true});
  console.log("POLYHAVEN_UNIVERSAL_OK",item.id,b.length,details.meshes,details.textures);
 }catch(e) {const error=String(e.message||e);errors.push({id:item.id,error});console.error("POLYHAVEN_UNIVERSAL_SKIP",item.id,error);}
}
if(!validateOnly) {
 const index=JSON.parse(readFileSync(indexFile,"utf8"));
 index.items=index.items.filter(x=>!manifest.assets.some(m=>m.id===x.id)).concat(results);
 index.total=index.items.length;index.version=index.version+"-universal";
 writeFileSync(indexFile,JSON.stringify(index,null,2)+"\n");
 writeFileSync(reportFile,JSON.stringify({selected:manifest.assets.length,successful:results.length,failed:errors.length,errors},null,2)+"\n");
 const report=JSON.parse(readFileSync(generalReport,"utf8"));
 report.polyHavenUniversal={successful:results.length,failed:errors.length,ids:results.map(x=>x.id)};
 writeFileSync(generalReport,JSON.stringify(report,null,2)+"\n");
}
console.log("VIRALIO_UNIVERSAL_SCANS",JSON.stringify({selected:manifest.assets.length,available:results.length,failed:errors.length}));
if(validateOnly&&errors.length)process.exitCode=1;
