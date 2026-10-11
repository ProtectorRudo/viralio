/** CC0 raider model from 3dassets.dev asset 32700. Tiny WebGL1 glTF 2 reader.
 * No extra renderer, no additional browser downloads after initial GLB. */
type M=Float32Array;
type Node={mesh?:number;children?:number[];matrix?:number[];translation?:number[];rotation?:number[];scale?:number[]};
type GLTF={nodes:Node[];meshes:{primitives:{attributes:{POSITION:number;NORMAL?:number;TEXCOORD_0?:number};indices?:number;material?:number;mode?:number}[]}[];materials?:{pbrMetallicRoughness?:{baseColorFactor?:number[];baseColorTexture?:{index:number}}}[];textures?:{source?:number;extensions?:{EXT_texture_webp?:{source:number}}}[];images?:{bufferView?:number;mimeType?:string}[];accessors:{bufferView?:number;byteOffset?:number;count:number;componentType:number;type:string;normalized?:boolean}[];bufferViews:{buffer:number;byteOffset?:number;byteStride?:number;byteLength:number}[];animations?:{name?:string;samplers:{input:number;output:number;interpolation?:string}[];channels:{sampler:number;target:{node?:number;path:string}}[]}[];skins?:unknown[]};
const eye=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const mul=(a:M,b:M)=>{const r=new Float32Array(16);
 for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)r[j*4+i]+=a[k*4+i]*b[j*4+k];return r;};
const trs=(t:number[],q:number[],s:number[])=>{const [x,y,z,w]=q,X=x*2,Y=y*2,Z=z*2;
 return new Float32Array([(1-(y*Y+z*Z))*s[0],(x*Y+w*Z)*s[0],(x*Z-w*Y)*s[0],0,
 (x*Y-w*Z)*s[1],(1-(x*X+z*Z))*s[1],(y*Z+w*X)*s[1],0,
 (x*Z+w*Y)*s[2],(y*Z-w*X)*s[2],(1-(x*X+y*Y))*s[2],0,
 t[0],t[1],t[2],1]);};
const vpos=(m:M,p:number[])=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
 m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const lerp=(a:number[],b:number[],f:number,quat=false)=>{let sign=1;
 if(quat&&a.reduce((z,v,i)=>z+v*b[i],0)<0)sign=-1;
 const r=a.map((v,i)=>v*(1-f)+b[i]*f*sign),len=Math.hypot(...r)||1;
 return quat?r.map(x=>x/len):r;};
export type RigPart={buffer:WebGLBuffer;count:number;node:number;texture:WebGLTexture|null;hasUV:boolean};
export type Rig={parts:RigPart[];matrices:M[];animate:(elapsed:number)=>void;dispose:()=>void};
export async function loadRig(gl:WebGLRenderingContext,url:string):Promise<Rig>{
 const res=await fetch(url,{cache:"force-cache"});if(!res.ok)throw Error("GLB "+res.status);
 const file=await res.arrayBuffer(),dv=new DataView(file);
 if(file.byteLength<100||file.byteLength>4e6||dv.getUint32(0,true)!==0x46546c67)throw Error("GLB corrupto");
 let off=12,doc:GLTF|null=null,bin:ArrayBuffer|null=null;
 while(off+8<=file.byteLength){const len=dv.getUint32(off,true),type=dv.getUint32(off+4,true);off+=8;
  if(off+len>file.byteLength)throw Error("GLB truncado");
  if(type===0x4e4f534a)doc=JSON.parse(new TextDecoder().decode(new Uint8Array(file,off,len))) as GLTF;
  if(type===0x004e4942)bin=file.slice(off,off+len);off+=len;
 }
 if(!doc||!bin||!doc.meshes?.length)throw Error("GLB sin mallas");
 if(doc.skins?.length)throw Error("GLB skinned: se mantiene modelo de respaldo");
 const json=doc,raw=new DataView(bin),sizes:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 const acc=(id:number):number[][]=>{
  const a=json.accessors[id],v=json.bufferViews[a?.bufferView??-1];if(!a||!v||v.buffer!==0||!sizes[a.type]||a.count>150000)throw Error("Accessor invalid");
  const unit=({5120:1,5121:1,5122:2,5123:2,5125:4,5126:4} as Record<number,number>)[a.componentType];if(!unit)throw Error("GLB component");
  const n=sizes[a.type],stride=v.byteStride??n*unit,start=(v.byteOffset??0)+(a.byteOffset??0);
  const sample=(p:number)=>{if(p+unit>raw.byteLength)throw Error("GLB range");switch(a.componentType){
   case 5120:return raw.getInt8(p);case 5121:return raw.getUint8(p);
   case 5122:return raw.getInt16(p,true);case 5123:return raw.getUint16(p,true);
   case 5125:return raw.getUint32(p,true);default:return raw.getFloat32(p,true);}};
  const out:number[][]=[];
  for(let i=0;i<a.count;i++){const values:number[]=[];for(let k=0;k<n;k++){
   let x=sample(start+i*stride+k*unit);
   if(a.normalized&&a.componentType!==5126){const max=({5120:127,5121:255,5122:32767,5123:65535,5125:4294967295} as Record<number,number>)[a.componentType]||1;x=Math.max(-1,x/max);}
   values.push(x);}out.push(values);}return out;
 };
 const parents=new Array(json.nodes.length).fill(-1);
 json.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parents[c]=i));
 const base=json.nodes.map(n=>({t:n.translation??[0,0,0],q:n.rotation??[0,0,0,1],s:n.scale??[1,1,1]}));
 const rest:M[]=json.nodes.map((n,i)=>n.matrix?new Float32Array(n.matrix):trs(base[i].t,base[i].q,base[i].s));
 const world:M[]=json.nodes.map(()=>eye());
 const derive=(locals:M[])=>{const seen=new Set<number>();
  const visit=(i:number):M=>{if(seen.has(i))return world[i];const p=parents[i];world[i]=p<0?locals[i]:mul(visit(p),locals[i]);seen.add(i);return world[i];};
  json.nodes.forEach((_,i)=>visit(i));};
 derive(rest);
 // Embedded glTF/WebP albedo textures, shared across materials; decode before
 // first draw so old model remains visible while the new asset is loading.
 const imageTextures:(WebGLTexture|null)[]=[];
 for(const image of json.images??[]){
  if(image.bufferView===undefined||!image.mimeType||typeof createImageBitmap!=="function"){imageTextures.push(null);continue;}
  try{
   const v=json.bufferViews[image.bufferView];
   const bytes=new Uint8Array(bin,v.byteOffset??0,v.byteLength);
   if(!bytes.byteLength){imageTextures.push(null);continue;}
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:image.mimeType}),{colorSpaceConversion:"none"});
   const tex=gl.createTexture();if(!tex){bitmap.close();imageTextures.push(null);continue;}
   gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   bitmap.close();imageTextures.push(tex);
  }catch{imageTextures.push(null);}
 }
 const parts:RigPart[]=[],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 try{for(let ni=0;ni<json.nodes.length;ni++){
  const mesh=json.nodes[ni].mesh;if(mesh===undefined)continue;
  for(const p of json.meshes[mesh].primitives){
   if(p.mode!==undefined&&p.mode!==4)continue;
   const vertices=acc(p.attributes.POSITION),normals=p.attributes.NORMAL===undefined?[]:acc(p.attributes.NORMAL),uvs=p.attributes.TEXCOORD_0===undefined?[]:acc(p.attributes.TEXCOORD_0);
   const ids=p.indices===undefined?vertices.map((_,i)=>i):acc(p.indices).map(row=>row[0]);
   if(ids.length>250000)throw Error("GLB demasiado grande");
   // glTF 2.0 defaults to WHITE (1,1,1,1), not gray; texture and factor
   // are multiplied in the shader. Never clamp a material into muddy gray.
   const factor=json.materials?.[p.material??-1]?.pbrMetallicRoughness?.baseColorFactor??[1,1,1,1];
   const color=factor.slice(0,3).map(v=>Math.min(1,Math.max(0,v)));
   const data=new Float32Array(ids.length*11);
   ids.forEach((v,i)=>{const P=vertices[v],N=normals[v]??[0,1,0];if(!P)throw Error("GLB index");
    data.set([P[0],P[1],P[2],N[0],N[1],N[2],...color,...(uvs[v]??[0,0])],i*11);});
   vertices.forEach(v=>vpos(world[ni],v).forEach((x,k)=>{lo[k]=Math.min(lo[k],x);hi[k]=Math.max(hi[k],x);}));
   const buffer=gl.createBuffer();if(!buffer)throw Error("WebGL buffer");
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
   const textureIndex=json.materials?.[p.material??-1]?.pbrMetallicRoughness?.baseColorTexture?.index;
   const textureRef=textureIndex===undefined?undefined:json.textures?.[textureIndex];
   const imageId=textureRef?.extensions?.EXT_texture_webp?.source??textureRef?.source;
   parts.push({buffer,count:ids.length,node:ni,hasUV:!!uvs.length,texture:imageId===undefined?null:(imageTextures[imageId]??null)});
  }
 }}catch(e){parts.forEach(p=>gl.deleteBuffer(p.buffer));throw e;}
 if(!parts.length)throw Error("GLB sin triángulos");
 const scale=Math.min(2.2,2.85/Math.max(.1,hi[1]-lo[1])),cx=(lo[0]+hi[0])/2,cz=(lo[2]+hi[2])/2;
 const root=mul(trs([.32,-lo[1]*scale,6.28],[0,1,0,0],[scale,scale,scale]),trs([-cx,0,-cz],[0,0,0,1],[1,1,1]));
 const anim=(json.animations??[]).map(a=>({name:(a.name??"").toLowerCase(),channels:a.channels.map(c=>{
  const s=a.samplers[c.sampler];return {node:c.target.node??-1,path:c.target.path,interpolation:s.interpolation??"LINEAR",
   times:acc(s.input).map(v=>v[0]),values:acc(s.output)};})}));
 const animate=(elapsed:number)=>{
  const a=(elapsed>43?anim.find(c=>c.name.includes("weapon")):elapsed>17?anim.find(c=>c.name.includes("arm")):elapsed>8?anim.find(c=>c.name.includes("head")):undefined)??anim.find(c=>c.name.includes("idle"))??anim[0];
  const transforms=base.map(b=>({t:[...b.t],q:[...b.q],s:[...b.s]}));
  if(a)for(const c of a.channels){
   if(c.node<0||!transforms[c.node]||!c.times.length)continue;
   const duration=c.times[c.times.length-1],t=duration>0?elapsed%duration:0;let j=0;
   while(j<c.times.length-2&&c.times[j+1]<t)j++;
   const k=Math.min(j+1,c.times.length-1),diff=c.times[k]-c.times[j],f=c.interpolation==="STEP"||diff<=0?0:Math.max(0,Math.min(1,(t-c.times[j])/diff));
   const v=c.values[c.interpolation==="CUBICSPLINE"?j*3+1:j],w=c.values[c.interpolation==="CUBICSPLINE"?k*3+1:k];
   if(!v||!w)continue;const value=lerp(v,w,f,c.path==="rotation");
   if(c.path==="translation")transforms[c.node].t=value;
   if(c.path==="rotation")transforms[c.node].q=value;
   if(c.path==="scale")transforms[c.node].s=value;
  }
  derive(transforms.map((t,i)=>json.nodes[i].matrix?rest[i]:trs(t.t,t.q,t.s)));
  world.forEach((m,i)=>world[i]=mul(root,m));
 };
 animate(0);
 return {parts,matrices:world,animate,dispose:()=>{parts.forEach(p=>gl.deleteBuffer(p.buffer));imageTextures.forEach(t=>{if(t)gl.deleteTexture(t);});}};
}
