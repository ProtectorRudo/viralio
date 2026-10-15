import * as THREE from "three";
type Surface="concrete"|"rubber"|"ceiling";
type Output={material:THREE.MeshStandardMaterial;textures:THREE.Texture[]};

/**
 * Subtle original PBR surface maps: albedo, normals and roughness. No tile
 * images, no pixellated styling, no third-party texture downloads.
 * Textures repeat in UV space at architectural scale and keep memory bounded.
 */
export function proceduralSurface(surface:Surface,mobile:boolean):Output{
 const side=mobile?256:512;
 const c=document.createElement("canvas");c.width=side;c.height=side;
 const r=document.createElement("canvas");r.width=side;r.height=side;
 const n=document.createElement("canvas");n.width=side;n.height=side;
 const cx=c.getContext("2d")!,rx=r.getContext("2d")!,nx=n.getContext("2d")!;
 const color=cx.createImageData(side,side);
 const rough=rx.createImageData(side,side);
 const normal=nx.createImageData(side,side);
 const height=new Float32Array(side*side);
 let seed=surface==="concrete"?4724:surface==="rubber"?7123:2281;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
 const base=surface==="concrete"?[91,109,121]:surface==="rubber"?[67,78,89]:[48,65,79];
 const tile=surface==="rubber"?side/3:side/2;
 const lineThickness=Math.max(1,Math.round(side/230));
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const i=y*side+x,p=i*4;
  const fine=(random()-.5)*13,large=Math.sin(x/12)*3+Math.cos(y/17)*3;
  const seam=surface==="rubber"?(x%tile<lineThickness||y%tile<lineThickness):
   surface==="concrete"?(x%tile<lineThickness&&y%7<4):
    x%Math.round(side/9)<lineThickness;
  const grooves=surface==="ceiling"?Math.sin(x*.25)*4:0;
  const value=large+fine+grooves-(seam?19:0);
  height[i]=value*.012;
  const light=surface==="concrete"?1:surface==="rubber"?.98:.92;
  for(let channel=0;channel<3;channel++)
   color.data[p+channel]=Math.max(0,Math.min(255,Math.round(base[channel]*light+value)));
  color.data[p+3]=255;
  const rv=surface==="concrete"?219:surface==="rubber"?234:248;
  const v=Math.max(20,Math.min(255,rv+(random()-.5)*24+(seam?15:0)));
  rough.data[p]=rough.data[p+1]=rough.data[p+2]=v;rough.data[p+3]=255;
 }
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const i=y*side+x,p=i*4;
  const hL=height[y*side+(x+side-1)%side],hR=height[y*side+(x+1)%side];
  const hD=height[((y+side-1)%side)*side+x],hU=height[((y+1)%side)*side+x];
  const strength=surface==="rubber"?1.3:.8;
  let vx=(hL-hR)*strength,vy=(hD-hU)*strength,vz=1;
  const len=Math.hypot(vx,vy,vz);vx/=len;vy/=len;vz/=len;
  normal.data[p]=Math.round((vx*.5+.5)*255);
  normal.data[p+1]=Math.round((vy*.5+.5)*255);
  normal.data[p+2]=Math.round((vz*.5+.5)*255);
  normal.data[p+3]=255;
 }
 cx.putImageData(color,0,0);rx.putImageData(rough,0,0);nx.putImageData(normal,0,0);
 const map=new THREE.CanvasTexture(c),roughnessMap=new THREE.CanvasTexture(r),normalMap=new THREE.CanvasTexture(n);
 map.colorSpace=THREE.SRGBColorSpace;
 const repeat=surface==="concrete"?new THREE.Vector2(3,1.5):
   surface==="rubber"?new THREE.Vector2(5,5):new THREE.Vector2(4,3);
 for(const texture of [map,roughnessMap,normalMap]){
  texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.copy(repeat);texture.anisotropy=mobile?2:8;
 }
 const material=new THREE.MeshStandardMaterial({
  color:0xffffff,map,normalMap,roughnessMap,
  metalness:surface==="rubber"?.08:.05,
  roughness:surface==="rubber"?.87:.9,
  normalScale:new THREE.Vector2(.36,.36)
 });
 return {material,textures:[map,roughnessMap,normalMap]};
}
