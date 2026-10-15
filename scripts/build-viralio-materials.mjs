/**
 * Downloads CC0 Poly Haven PBR texture sets for reusable modular architecture.
 * Each material needs color, normal (OpenGL) and packed AO/roughness/metal maps.
 * node scripts/build-viralio-materials.mjs
 * node scripts/build-viralio-materials.mjs --validate-only
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync,rmSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";

const root=resolve(".");
const data=JSON.parse(readFileSync(join(root,"data/viralio-3d/materials.json"),"utf8"));
const targetRoot=join(root,"public/viralio-3d/materials");
mkdirSync(targetRoot,{recursive:true});
const validateOnly=process.argv.includes("--validate-only");
const sharp = !validateOnly ? (await import("sharp").then(m=>m.default).catch(()=>null)) : null;
const output=[];
const errors=[];

function isPng(buffer){return buffer.length>256&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));}
function validWebp(b){return b.length>200&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";}
async function fetchPng(url){
  if(!/^https:\/\/dl\.polyhaven\.org\/file\/ph-assets\/Textures\/png\/1k\/[a-z0-9_]+\/[a-z0-9_]+\.png$/.test(url))
    throw Error("Texture URL not approved");
  for(let attempt=0;attempt<3;attempt++){
    try{
      const res=await fetch(url,{signal:AbortSignal.timeout(40000),headers:{"User-Agent":"ViralioEscape-CC0-Materials/1.0"}});
      if(!res.ok)throw Error("HTTP "+res.status);
      const b=Buffer.from(await res.arrayBuffer());
      if(b.length>9*1024*1024||!isPng(b))throw Error("Not a valid 1K PNG");
      return b;
    }catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,700*(attempt+1)));}
  }
}
for(const mat of data.materials){
  const paths={};
  try{
    for(const [channel,url] of Object.entries(mat.maps)){
      const webpFile=join(targetRoot,mat.id+"-"+channel+".webp");
      const ext=validateOnly?(existsSync(webpFile)?".webp":".png"):(sharp?".webp":".png");
      const rel="/viralio-3d/materials/"+mat.id+"-"+channel+ext;
      const outputPath=join(targetRoot,mat.id+"-"+channel+ext);
      if(!existsSync(outputPath)){
        if(validateOnly)throw Error("Missing material map: "+rel);
        const source=await fetchPng(url);
        const bytes=sharp
          ?await sharp(source).resize({width:1024,height:1024,fit:"inside",withoutEnlargement:true})
            .webp(channel==="normal"?{lossless:true}:{quality:85,effort:5}).toBuffer()
          :source;
        writeFileSync(outputPath,bytes);
      }
      const b=readFileSync(outputPath);
      if(!validWebp(b)&&!isPng(b))throw Error("Corrupt saved texture: "+rel);
      paths[channel]={path:rel,bytes:statSync(outputPath).size,sha256:createHash("sha256").update(b).digest("hex")};
    }
    output.push({id:mat.id,license:"CC0-1.0",sourcePage:mat.sourcePage,maps:paths});
    console.log("MATERIAL_OK",mat.id);
  }catch(e){
    console.error("MATERIAL_SKIP",mat.id,String(e.message||e));
    errors.push({id:mat.id,error:String(e.message||e)});
    if(!validateOnly){for(const channel of ["color","normal","arm"]){for(const ext of [".webp",".png"]){
      rmSync(join(targetRoot,mat.id+"-"+channel+ext),{force:true});
    }}}
  }
}
if(!validateOnly){
  writeFileSync(join(targetRoot,"index.json"),JSON.stringify({
    name:"Viralio PBR Material Library",createdAt:new Date().toISOString(),
    total:output.length,license:"CC0-1.0",materials:output,errors
  },null,2)+"\n");
}
console.log("VIRALIO_PBR",JSON.stringify({ready:output.length,failed:errors.length,total:data.materials.length}));
if(output.length<8||(validateOnly&&errors.length))process.exitCode=1;
