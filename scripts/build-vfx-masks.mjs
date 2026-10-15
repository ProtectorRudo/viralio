/**
 * Build six reusable transparency masks for VFX compositing.
 * These are texture assets only. They DO NOT add effects or behavior to games.
 * No external audio/visual asset or third-party license is required.
 */
import sharp from "sharp";
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";

const root=resolve("."),folder=join(root,"public/viralio-3d/vfx");
mkdirSync(folder,{recursive:true});
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const mix=(a,b,t)=>a*(1-t)+b*t;
const smooth=t=>t*t*(3-2*t);
function rand(x,y,seed=1){let a=((x|0)*374761393+(y|0)*668265263+seed*1442695041)|0;a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967295;}
function noise(x,y,seed=1){
 const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
 return mix(mix(rand(ix,iy,seed),rand(ix+1,iy,seed),fx),mix(rand(ix,iy+1,seed),rand(ix+1,iy+1,seed),fx),fy);
}
function fbm(x,y,seed){
 let sum=0,amp=.56,total=0;
 for(let k=0;k<5;k++){sum+=noise(x,y,seed+k*7)*amp;total+=amp;x*=2.03;y*=2.03;amp*=.52;}
 return sum/total;
}
const defs=[
 {id:"smoke-wisp",width:512,height:512,description:"Soft multiscale smoke curl for atmosphere or dissipating trails; procedural alpha only",kind:"smoke"},
 {id:"fog-low",width:1024,height:512,description:"Low-lying fog-bank transparency with tapered edges; alpha only, not volumetric simulation",kind:"fog"},
 {id:"dust-haze",width:512,height:512,description:"Uneven dust plume visible against light; procedural mask, not actual captured dust",kind:"dust"},
 {id:"dust-motes",width:512,height:512,description:"Sparse fine airborne particles and micro highlights; repeatable alpha texture",kind:"motes"},
 {id:"ember-sparks",width:512,height:512,description:"Scattered streaky ember glints, intended for additive particle sprites",kind:"sparks"},
 {id:"light-shaft-mask",width:512,height:512,description:"Soft irregular volumetric-looking beam mask; alpha texture not physical volumetric light",kind:"shafts"}
];
function opacity(kind,nx,ny,px,py){
 const xx=nx*2-1,yy=ny*2-1,r=Math.sqrt(xx*xx+yy*yy),cloud=fbm(nx*5,ny*5,42);
 if(kind==="smoke"){
  const warped=fbm(nx*7+.3*ny,ny*4,73);
  const swirl=fbm(nx*4+Math.sin(ny*6)*.5,ny*5,91);
  const a=clamp((.7*warped+.5*swirl-.4)*3.5)*clamp((1-r)/.7);
  return a*.9;
 }
 if(kind==="fog"){
  const v=fbm(nx*7,ny*5,64);
  return clamp((v-.30)*2.1)*clamp((1-Math.abs(xx)**3)*2)*clamp((ny-.04)*6)*clamp((1-ny)*3)*.65;
 }
 if(kind==="dust"){
  const f=fbm(nx*8,ny*7,32);
  const center=Math.exp(-3.4*(xx*xx+yy*yy));
  return clamp((f-.33)*2.3)*center*.55;
 }
 if(kind==="motes"){
  const cx=Math.floor(px/18),cy=Math.floor(py/18),acc=[];
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
   const kx=cx+ox,ky=cy+oy,chance=rand(kx,ky,105);
   if(chance>.32)continue;
   const mx=(kx+rand(kx,ky,107))*18,my=(ky+rand(kx,ky,109))*18;
   const radius=chance<.065?2.5:1.0,d2=(mx-px)**2+(my-py)**2;
   acc.push(Math.exp(-d2/(radius*radius*1.35))*.7);
  }
  return Math.min(.9,acc.reduce((a,b)=>a+b,0))*clamp(1-r);
 }
 if(kind==="sparks"){
  let max=0,cx=Math.floor(px/44),cy=Math.floor(py/44);
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
   const tx=cx+ox,ty=cy+oy;
   if(rand(tx,ty,121)>.43)continue;
   const sx=(tx+rand(tx,ty,127))*44,sy=(ty+rand(tx,ty,131))*44;
   const dx=(px-sx)/7,dy=(py-sy)/1.3;
   const a=Math.exp(-(dx*dx+dy*dy)*.8)*.9;
   if(a>max)max=a;
  }
  return max*clamp((1-r)/.55);
 }
 if(kind==="shafts"){
  const theta=Math.atan2(xx,yy+1.3),angular=.5+.5*Math.cos(theta*16+fbm(nx*5,ny*5,13)*2);
  const width=clamp(1-Math.abs(xx)/(.2+ny*.5));
  const fade=clamp((ny-.05)*3)*clamp((1-ny)*2);
  return angular**3*width*fade*.55;
 }
 return cloud;
}
const entries=[];
for(const spec of defs) {
 const {width:w,height:h}=spec,b=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const nx=(x+.5)/w,ny=(y+.5)/h,alpha=opacity(spec.kind,nx,ny,x,y);
  const n=(y*w+x)*4;b[n]=b[n+1]=b[n+2]=255;b[n+3]=Math.round(clamp(alpha)*255);
 }
 const bytes=await sharp(b,{raw:{width:w,height:h,channels:4}})
  .png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
 const name=spec.id+".png";
 writeFileSync(join(folder,name),bytes);
 entries.push({id:spec.id,category:"vfx-sprite-alpha",path:"/viralio-3d/vfx/"+name,
  width:w,height:h,format:"PNG RGBA",sha256:createHash("sha256").update(bytes).digest("hex"),
  bytes:bytes.length,description:spec.description,license:"Viralio original",characteristics:"White RGBA mask, transparent, tint and animate at runtime only if chosen for a game"});
 console.log("VFX_MASK_OK",spec.id,bytes.length);
}
writeFileSync(join(folder,"index.json"),JSON.stringify({name:"Viralio — reusable original VFX alpha sprites",version:"1.0.0",count:entries.length,notes:"Sprite texture files ONLY. No game scene behavior or HDR effects are installed.",items:entries},null,2)+"\n");
console.log("VIRALIO_VFX",JSON.stringify({count:entries.length,totalBytes:entries.reduce((s,x)=>s+x.bytes,0)}));
