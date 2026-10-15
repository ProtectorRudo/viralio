/**
 * Download independent lighting/atmosphere references, not game levels.
 * Curated CC0 photographs of real spaces from official Poly Haven API.
 * Saves 1K Radiance RGBE HDR to public/viralio-3d/hdri, indexed by SHA-256.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";

const root=resolve(".");
const manifest=JSON.parse(readFileSync(join(root,"data/viralio-3d/polyhaven-hdri.json"),"utf8"));
const output=join(root,"public/viralio-3d/hdri");
const reportFile=join(root,"data/viralio-3d/hdri-report.json");
mkdirSync(output,{recursive:true});
const maxBytes=12*1024*1024;
const sha=b=>createHash("sha256").update(b).digest("hex");
async function download(url,limit){
 const parsed=new URL(url);
 if(parsed.protocol!=="https:"||!["api.polyhaven.com","dl.polyhaven.org"].includes(parsed.hostname))throw Error("Unapproved HDR source "+parsed.origin);
 const response=await fetch(url,{signal:AbortSignal.timeout(65000),headers:{"User-Agent":"ViralioEscape-CC0-HDRI/1.0"}});
 if(!response.ok)throw Error("HDR download HTTP "+response.status);
 if(Number(response.headers.get("content-length")||0)>limit)throw Error("HDR oversized");
 const b=Buffer.from(await response.arrayBuffer());
 if(b.length>limit)throw Error("HDR exceeds size limit");
 return b;
}
function verify(b){
 const header=b.subarray(0,220).toString("latin1");
 if(b.length<500||!(header.startsWith("#?RADIANCE")||header.startsWith("#?RGBE"))||!header.includes("FORMAT=32-bit_rle_rgbe"))
  throw Error("Missing Radiance HDR signature or RGBE format");
 return true;
}
const results=[],errors=[];
for(const item of manifest.sources){
 try{
  if(!/^[a-z0-9_]+$/.test(item.assetId)||!/^[a-z0-9-]+$/.test(item.id))throw Error("Invalid ID");
  const metadata=JSON.parse((await download("https://api.polyhaven.com/files/"+item.assetId,2*1024*1024)).toString("utf8"));
  const variants=metadata.hdri??metadata;
  const entry=variants["1k"]?.hdr??variants["1k"]?.exr;
  if(!entry?.url||!new URL(entry.url).pathname.endsWith(".hdr"))throw Error("Official 1k HDR not available");
  const file=join(output,item.id+".hdr");
  let b;
  if(existsSync(file))b=readFileSync(file);
  else {b=await download(entry.url,maxBytes);verify(b);writeFileSync(file,b);}
  verify(b);
  results.push({id:item.id,title:item.title,category:item.category,license:"CC0-1.0",sourcePage:item.sourcePage,format:"HDR RGBE 1K",role:item.role,
    path:"/viralio-3d/hdri/"+item.id+".hdr",bytes:b.length,sha256:sha(b)});
  console.log("HDRI_OK",item.id,b.length);
 }catch(e){errors.push({id:item.id,error:String(e.message??e)});console.error("HDRI_SKIP",item.id,String(e.message??e));}
}
writeFileSync(join(output,"index.json"),JSON.stringify({name:manifest.title,license:"CC0-1.0",total:results.length,items:results},null,2)+"\n");
writeFileSync(reportFile,JSON.stringify({selected:manifest.sources.length,successful:results.length,failed:errors.length,errors},null,2)+"\n");
console.log("VIRALIO_HDRI",JSON.stringify({selected:manifest.sources.length,successful:results.length,failed:errors.length}));
if(results.length<5)process.exitCode=1;
