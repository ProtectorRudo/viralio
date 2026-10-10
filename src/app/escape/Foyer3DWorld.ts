/**
 * UMBRAL | The first genuinely volumetric room.
 * Lightweight WebGL1 mesh renderer, collision and perspective camera.
 * No remote runtime or external CDN. Everything is real triangle geometry,
 * depth-tested, lit, walkable and ray-interactable. Not a panorama illusion.
 */
export type FoyerItem = "drawer"|"bronze-key"|"lockbox"|"clock"|"elias"|"mara"|"nora"|"stairs"|"sconce"|"door"|"letter";
export type FoyerFlags = {drawer:boolean;key:boolean;box:boolean;clock:boolean};
export type FoyerTarget = {id:FoyerItem;name:string;hint:string;position:[number,number,number];range:number};
export const FOYER_TARGETS:FoyerTarget[] = [
  {id:"drawer",name:"Cajón de la consola",hint:"La madera parece hinchada por la humedad.",position:[-2.75,1.0,-2.32],range:3.1},
  {id:"bronze-key",name:"Llave de bronce",hint:"Algo brilla en el interior del cajón.",position:[-2.75,1.04,-1.88],range:2.7},
  {id:"lockbox",name:"Caja de caoba",hint:"La cerradura lleva una inicial grabada.",position:[1.75,.85,-2.7],range:2.9},
  {id:"clock",name:"Reloj de péndulo",hint:"Las agujas están detenidas a las 03:13.",position:[4.15,1.85,-1.55],range:3.1},
  {id:"elias",name:"Retrato de Elías",hint:"El guardián de la familia. Año 1891.",position:[-3.6,2.15,-5.75],range:4.0},
  {id:"mara",name:"Retrato de Mara",hint:"Un ramito de flores sigue en el marco.",position:[-1.8,2.15,-5.75],range:4.0},
  {id:"nora",name:"Retrato de Nora",hint:"La pequeña parece mirar detrás de vos.",position:[0,2.15,-5.75],range:4.0},
  {id:"stairs",name:"Escalera principal",hint:"Las huellas suben. Ninguna baja.",position:[3.25,1.4,-4.0],range:4.0},
  {id:"sconce",name:"Aplique que parpadea",hint:"No hay electricidad. Pero la luz sigue allí.",position:[-5.26,2.9,-1.3],range:3.4},
  {id:"door",name:"Puerta de entrada",hint:"La puerta cerró detrás de vos.",position:[0,1.4,6.3],range:3},
  {id:"letter",name:"Correspondencia olvidada",hint:"Un sobre sin destinatario.",position:[-2.1,1.16,-2.5],range:2.9},
];

type Mesh = {buffer:WebGLBuffer;count:number;texture:string;shift?:[number,number,number]};
type Geo = {vertices:number[];kind:string};
type Vec = [number,number,number];
const STRIDE=11;
const BOX_UV:[number,number][]=[[0,0],[1,0],[1,1],[0,1]];
const palette={
  wall:"#4d4a45",wallDark:"#343a3d",wood:"#76513a",woodDark:"#34271f",
  floor:"#302821",tile:"#434348",trim:"#ab8b5b",gold:"#bb9160",metal:"#777a70",
  carpet:"#502e36",ink:"#10171a",paper:"#dec8a2",glass:"#899ba5",
};
function rgb(hex:string):Vec {const h=hex.replace("#","");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255) as Vec;}
function clamp(x:number,a:number,b:number){return Math.max(a,Math.min(b,x));}
class Geometry {
  groups=new Map<string,Geo>();
  group(kind:string){let g=this.groups.get(kind);if(!g){g={vertices:[],kind};this.groups.set(kind,g);}return g.vertices;}
  quad(kind:string,pts:[Vec,Vec,Vec,Vec],normal:Vec,color:string,uv:[number,number][]=BOX_UV){
    const v=this.group(kind), col=rgb(color);
    for(const id of [0,1,2,0,2,3])v.push(...pts[id],...normal,...uv[id],...col);
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,kind="plain"){
    const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
    this.quad(kind,[[b,c,g],[b,e,g],[a,e,g],[a,c,g]],[0,0,1],color);
    this.quad(kind,[[a,c,f],[a,e,f],[b,e,f],[b,c,f]],[0,0,-1],color);
    this.quad(kind,[[a,e,g],[b,e,g],[b,e,f],[a,e,f]],[0,1,0],color);
    this.quad(kind,[[a,c,f],[b,c,f],[b,c,g],[a,c,g]],[0,-1,0],color);
    this.quad(kind,[[b,c,f],[b,e,f],[b,e,g],[b,c,g]],[1,0,0],color);
    this.quad(kind,[[a,c,g],[a,e,g],[a,e,f],[a,c,f]],[-1,0,0],color);
  }
  panel(x:number,y:number,z:number,w:number,h:number,color:string,texture:string){
    this.quad(texture,[[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2,y-h/2,z]],[0,0,1],color);
  }
  cylinder(x:number,y:number,z:number,r:number,h:number,color:string,segments=11){
    for(let i=0;i<segments;i++){
      const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
      const x1=x+Math.cos(a)*r,z1=z+Math.sin(a)*r,x2=x+Math.cos(b)*r,z2=z+Math.sin(b)*r;
      const normal:Vec=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];
      this.quad("plain",[[x1,y-h/2,z1],[x1,y+h/2,z1],[x2,y+h/2,z2],[x2,y-h/2,z2]],normal,color);
    }
  }
  // Convex mesh source: procedural details rather than cardboard sprite trees.
  beam(a:Vec,b:Vec,r:number,color:string){
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);
    if(!len)return;
    const v:Vec=[dx/len,dy/len,dz/len];
    const perp:Vec=Math.abs(v[1])<.8?[0,1,0]:[1,0,0];
    const side:Vec=[v[1]*perp[2]-v[2]*perp[1],v[2]*perp[0]-v[0]*perp[2],v[0]*perp[1]-v[1]*perp[0]];
    const sl=Math.hypot(...side)||1;for(let i=0;i<3;i++)side[i]/=sl;
    const up:Vec=[v[1]*side[2]-v[2]*side[1],v[2]*side[0]-v[0]*side[2],v[0]*side[1]-v[1]*side[0]];
    const n=7,co=rgb(color),arr=this.group("plain");
    const vertex=(p:Vec,norm:Vec,u:number,w:number)=>{arr.push(...p,...norm,u,w,...co);};
    for(let i=0;i<n;i++){
      const aa=i*2*Math.PI/n,bb=(i+1)*2*Math.PI/n;
      const make=(p:Vec,t:number):Vec=>p.map((x,j)=>x+r*(side[j]*Math.cos(t)+up[j]*Math.sin(t))) as Vec;
      const norm:Vec=side.map((x,j)=>x*Math.cos((aa+bb)/2)+up[j]*Math.sin((aa+bb)/2)) as Vec;
      const p1=make(a,aa),p2=make(a,bb),p3=make(b,bb),p4=make(b,aa);
      for(const [p,u,w] of [[p1,0,0],[p4,0,1],[p3,1,1],[p1,0,0],[p3,1,1],[p2,1,0]] as [Vec,number,number][])vertex(p,norm,u,w);
    }
  }
}
function makeFoyer(flags:FoyerFlags){
  const g=new Geometry();
  // Walkable solid envelope, ceiling, walls, dado, skirting, window frames.
  g.box(0,-.22,0,11.7,.44,14.7,palette.floor,"floor");
  g.box(0,4.7,0,11.7,.28,14.7,"#343c3e","plaster");
  g.box(0,2.25,-6.9,11.65,4.9,.3,palette.wall,"plaster");
  g.box(-5.75,2.25,0,.35,4.9,14.7,palette.wallDark,"plaster");
  g.box(5.75,2.25,0,.35,4.9,14.7,palette.wallDark,"plaster");
  // Entrance wall with a real 3D door (wide enough to walk up to).
  g.box(-3.8,2.3,6.95,4.1,4.7,.25,palette.wall,"plaster");
  g.box(3.8,2.3,6.95,4.1,4.7,.25,palette.wall,"plaster");
  g.box(0,4.2,6.95,3.55,.85,.25,palette.wall,"plaster");
  g.box(0,1.72,6.82,3.15,3.5,.24,"#593923","wood");
  for(const x of [-.84,.84])for(const y of [.95,2.44])g.box(x,y,6.67,1.14,1.11,.1,"#39271f","wood");
  g.cylinder(1.22,1.55,6.61,.095,.13,palette.gold);
  // Floor: many small patterned 3D slabs. All in world coordinates.
  for(let x=-5.35;x<5.4;x+=.9)for(let z=-6.45;z<7;z+=.9){
    const shade=((Math.round(x*10)+Math.round(z*10))%3===0)?"#4e4840":"#3c3835";
    g.box(x,-.006,z,.875,.028,.875,shade,"floor");
  }
  // Carpet, perimeter border and repeated inlaid tesserae.
  g.box(-.45,.025,1.12,3.9,.03,5.15,"#502e36","carpet");
  g.box(-.45,.051,1.12,3.45,.008,4.72,"#9b7852","carpet");
  g.box(-.45,.056,1.12,3.2,.009,4.5,"#532d37","carpet");
  for(let z=-.85;z<3.5;z+=.38)for(let x=-1.73;x<.94;x+=.37)if((Math.round((x+2)*2.7)+Math.round((z+1)*2.6))%4===0)
    g.box(x,.064,z,.11,.009,.21,"#7c5949","carpet");
  for(const x of [-5.54,5.54]){
    g.box(x,.29,0,.18,.6,13.9,"#876b4c","wood");
    g.box(x,1.47,0,.22,.16,13.9,"#85633f","wood");
    g.box(x,3.75,0,.24,.18,13.9,"#a18a63","wood");
    for(let z=-6.1;z<6.5;z+=1.45){
      g.box(x,1.03,z,.12,1.95,.09,"#90744f","wood");
      g.box(x,3.95,z,.1,.48,.09,"#987750","wood");
    }
  }
  for(let x=-5.2;x<=5.2;x+=1.4){
    g.box(x,1.1,-6.71,.12,2.1,.16,"#90724f","wood");
    g.box(x,3.85,-6.71,.16,.7,.18,"#ad906b","wood");
  }
  g.box(0,1.43,-6.65,11.4,.15,.23,"#ab8c65","wood");
  // Window openings are volumetric inset panels framed by stone and glow.
  for(const z of [-3.8,1.95]){
    for(const wall of [-1,1]){
      const x=wall*5.50;
      g.box(x,2.77,z,.1,2.15,1.45,"#1b282f","glass");
      g.box(x-wall*.04,2.77,z,.13,2.35,.12,"#a08862","wood");
      g.box(x-wall*.05,2.77,z,.11,.12,1.5,"#b9a077","wood");
      g.box(x-wall*.06,2.77,z,.13,2.25,.12,"#b3a07c","wood");
    }
  }
  // Foundation / stairwell runs up into the upper landing.
  for(let i=0;i<11;i++){
    const z=-1.85-i*.36,y=.15+i*.205;
    g.box(3.45,y,z,3.15,.28,.40,"#7a634b","wood");
    g.box(3.45,y-.08,z+.1,3.15,.13,.39,"#3f3025","wood");
  }
  g.box(3.45,2.55,-5.62,3.5,.3,2.65,"#7e684e","wood");
  for(let i=0;i<12;i++){
    const z=-1.78-i*.36,y=.24+i*.207;
    g.beam([1.85,y,z],[1.85,y+.83,z],.038,"#bda06e");
  }
  g.beam([1.85,.98,-1.78],[1.85,3.2,-5.85],.065,"#b9986a");
  // Decorative stone pillars + fluted bases.
  for(const x of [-4.84,4.84])for(const z of [-5.7,5.3]){
    g.box(x,2.3,z,.53,4.55,.52,"#797167","plaster");
    g.box(x,.25,z,.79,.5,.78,"#7e7465","stone");
    g.box(x,4.34,z,.92,.36,.9,"#8a7c68","stone");
    for(const t of [-.13,0,.13])g.box(x+t,2.25,z+.275,.035,3.5,.025,"#a09382","stone");
  }
  // Ceiling structure; beams in true 3D.
  for(let x=-4.4;x<=4.5;x+=2.25)g.box(x,4.47,0,.29,.3,13.4,"#523c2b","wood");
  for(let z=-5.1;z<=6.0;z+=2.25)g.box(0,4.46,z,10.9,.27,.28,"#654934","wood");
  // Entry console, physical drawer, clock, and lockbox.
  g.box(-2.7,.89,-2.65,1.97,.20,.93,"#765139","wood");
  for(const x of [-3.51,-1.92])for(const z of [-2.94,-2.35])g.box(x,.43,z,.13,.79,.14,"#604530","wood");
  g.box(-2.7,1.26,-2.72,2.04,.13,.99,"#94724b","wood");
  g.box(-2.7,1.04,-2.24,1.65,.38,.18,"#422d20","drawer");
  g.box(-2.7,1.04,-2.12,1.43,.23,.13,"#765037","drawer");
  g.cylinder(-2.7,1.04,-2.008,.05,.09,"#bb9768");
  if(flags.drawer){
    g.box(-2.7,1.065,-1.54,1.37,.07,.8,"#9b7752","drawer");
    g.box(-2.7,1.165,-1.14,1.37,.15,.065,"#554032","drawer");
  }
  if(flags.drawer&&!flags.key){
    g.beam([-2.81,1.20,-1.35],[-2.49,1.20,-1.35],.04,"#e5be73");
    g.cylinder(-2.85,1.20,-1.35,.13,.035,"#d8a75a");
  }
  // Letter and candle on top of console.
  g.box(-2.18,1.34,-2.59,.54,.012,.31,"#ddc9ab","paper");
  g.cylinder(-3.43,1.54,-2.66,.055,.52,"#ecdebf");
  g.cylinder(-3.43,1.78,-2.66,.08,.09,"#d6a879");
  // Gilded frames containing three actually different family portraits.
  for(const [i,id] of ["elias","mara","nora"].entries()){
    const x=-4.3+i*1.72;
    g.box(x,2.43,-6.57,1.42,1.88,.16,"#94744d","wood");
    g.box(x,2.43,-6.46,1.25,1.7,.11,"#30261f","wood");
    g.panel(x,2.43,-6.38,1.16,1.54,"#ffffff",id);
    g.box(x,1.52,-6.40,.53,.10,.16,"#c5a375","gold");
  }
  // Open top staircase light well.
  g.box(4.24,3.04,-6.24,2.4,.15,.28,"#a99475","stone");
  // Grandfather clock: two-dimensional visual is no longer enough.
  g.box(4.45,1.57,-1.14,.82,3.13,.51,"#4c3023","wood");
  g.box(4.45,2.65,-.85,.66,.76,.09,"#ab936e","wood");
  g.cylinder(4.45,2.66,-.78,.26,.028,"#e2c795",32);
  g.box(4.44,1.37,-.845,.47,1.28,.055,"#947650","wood");
  g.cylinder(4.45,1.5,-.77,.065,.08,"#cfb17a");
  g.beam([4.45,1.9,-.76],[4.45,1.2,-.76],.012,"#deb987");
  // Chest that accepts the bronze key.
  g.box(1.75,.72,-2.7,1.13,.67,.78,"#4f3026","wood");
  g.box(1.75,1.10+(flags.box?.24:0),-2.7,1.2,.18,.88,"#a17d4a","boxlid");
  g.box(1.75,.83,-2.25,.17,.24,.09,"#d1b07f","gold");
  if(flags.box)g.box(1.75,.76,-2.7,.7,.03,.43,"#b39467","paper");
  // Plants and sconces that reward visual attention.
  for(const [x,z] of [[-4.7,-3.2],[4.8,3.7]]){
    g.cylinder(x,.42,z,.38,.82,"#80684e",12);
    for(let i=0;i<9;i++){
      const a=i*2.4;
      g.beam([x,.72,z],[x+Math.sin(a)*.60,1.35+(i%4)*.21,z+Math.cos(a)*.62],.047,"#354d38");
    }
  }
  for(const z of [-1.2,3.8]){
    const x=-5.36;
    g.box(x,2.66,z,.16,.48,.31,"#bb9369","gold");
    g.beam([x+.12,2.7,z],[x+.44,2.98,z],.07,"#c7a676");
    g.cylinder(x+.44,3.08,z,.078,.26,"#c9a78a");
  }
  // Chandelier: multiple arms in 3D with real candle forms.
  g.beam([0,4.59,-.9],[0,3.24,-.9],.057,"#b08b5c");
  g.cylinder(0,3.19,-.9,.13,.42,"#c79e5b");
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*.72,z=-.9+Math.sin(a)*.72;
    g.beam([0,3.10,-.9],[x,2.97,z],.045,"#ae8e5c");
    g.beam([x,2.97,z],[x,3.25,z],.038,"#c49d64");
    g.cylinder(x,3.28,z,.061,.24,"#e4cc97");
  }
  // Tiny brass wall plates and light-reactive metail details.
  for(let i=0;i<9;i++)g.box(-5.52,2.18,-5.65+i*1.45,.055,.04,.27,"#ce9f60","gold");
  return g;
}
function shader(gl:WebGLRenderingContext,type:number,source:string){
  const sh=gl.createShader(type);if(!sh)throw Error("Shader unavailable");
  gl.shaderSource(sh,source);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const reason=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error("3D shader: "+reason)}
  return sh;
}
const VS=`
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
attribute vec3 aColor;
uniform vec3 uEye,uRight,uUp,uForward,uShift;
uniform float uRatio;
varying vec3 vNormal,vWorld,vColor;
varying vec2 vUv;
varying float vDepth;
void main(){
 vec3 world=aPosition+uShift;
 vec3 delta=world-uEye;
 float x=dot(delta,uRight), y=dot(delta,uUp),z=dot(delta,uForward);
 float focal=1.57;
 gl_Position=vec4(x*focal/uRatio,y*focal,z*1.003-.1602,z);
 vDepth=z;vNormal=aNormal;vWorld=world;vColor=aColor;vUv=aUv;
}`;
const FS=`
precision mediump float;
varying vec3 vNormal,vWorld,vColor;
varying vec2 vUv;
varying float vDepth;
uniform sampler2D uMap;
uniform float uUseMap,uTime,uPower;
void main(){
 vec3 lamp=vec3(-.72,3.65,.2);
 float d=length(vWorld-lamp);
 vec3 L=normalize(lamp-vWorld);
 float diffuse=max(.08,dot(normalize(vNormal),L));
 float flicker=.92+.05*sin(uTime*6.4)+.025*sin(uTime*19.0);
 float lit=(.21+diffuse*2.25/(1.0+d*.32+d*d*.09))*flicker;
 vec3 albedo=vColor;
 if(uUseMap>.5)albedo*=texture2D(uMap,vUv).rgb;
 vec3 color=albedo*lit;
 // A controlled moonlit side contributes to volumetric depth.
 color+=albedo*vec3(.035,.055,.075)*max(0.,dot(normalize(vNormal),normalize(vec3(1.,.3,-.2))));
 float fog=clamp((vDepth-3.8)/17.,0.,.80);
 color=mix(color,vec3(.038,.063,.082),fog);
 color=pow(color,vec3(.88));
 gl_FragColor=vec4(color,1.);
}`;
function compileProgram(gl:WebGLRenderingContext){
 const prog=gl.createProgram();if(!prog)throw Error("WebGL program unavailable");
 const a=shader(gl,gl.VERTEX_SHADER,VS),b=shader(gl,gl.FRAGMENT_SHADER,FS);
 gl.attachShader(prog,a);gl.attachShader(prog,b);gl.linkProgram(prog);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error("3D link: "+gl.getProgramInfoLog(prog));
 return prog;
}
type Pose={x:number;y:number;z:number;yaw:number;pitch:number};
export type FoyerWorld={
  move:(forward:number,side:number,seconds:number)=>void;
  look:(dx:number,dy:number)=>void;
  position:()=>Pose;
  aim:()=>FoyerTarget|null;
  nearby:()=>FoyerTarget[];
  setFlags:(v:FoyerFlags)=>void;
  destroy:()=>void;
  available:boolean;
};
export function createFoyerWorld(canvas:HTMLCanvasElement,flags:FoyerFlags,onFrame?:(pose:Pose,target:FoyerTarget|null)=>void):FoyerWorld {
  const context=canvas.getContext("webgl",{alpha:false,antialias:false,depth:true,stencil:false,powerPreference:"high-performance"});
  if(!context)throw Error("Tu dispositivo no permite WebGL en este navegador.");
  const gl:WebGLRenderingContext=context;
  const program=compileProgram(gl);gl.useProgram(program);
  const att=(n:string)=>gl.getAttribLocation(program,n);
  const pos=att("aPosition"),norm=att("aNormal"),uv=att("aUv"),col=att("aColor");
  const uni=(n:string)=>gl.getUniformLocation(program,n);
  const uEye=uni("uEye"),uRight=uni("uRight"),uUp=uni("uUp"),uForward=uni("uForward");
  const uShift=uni("uShift"),uRatio=uni("uRatio"),uMap=uni("uMap"),uUseMap=uni("uUseMap"),uTime=uni("uTime"),uPower=uni("uPower");
  gl.uniform1i(uMap,0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  gl.clearColor(.018,.029,.038,1);
  let current={...flags},meshes:Mesh[]=[];
  const pose:Pose={x:0,y:1.66,z:4.0,yaw:0,pitch:0};
  let active=true,raf=0,lastUi=0,animation=0;
  const textures=new Map<string,WebGLTexture>();
  const textureSources:Record<string,string>={
    elias:"/escape/images/retina/characters/elias.webp",
    mara:"/escape/images/retina/characters/mara.webp",
    nora:"/escape/images/retina/characters/nora.webp",
  };
  const makeTexture=(name:string)=>{
    const texture=gl.createTexture();if(!texture)return;
    textures.set(name,texture);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([140,129,110,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const img=new Image();img.decoding="async";
    img.onload=()=>{
      if(!active)return;
      gl.bindTexture(gl.TEXTURE_2D,texture);
      // The source isn't vertically flipped, so portrait cards are upright.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    };
    img.src=textureSources[name];
  };
  for(const name of Object.keys(textureSources))makeTexture(name);
  function rebuild(){
    for(const m of meshes)gl.deleteBuffer(m.buffer);
    meshes=[];
    for(const [kind,geo] of makeFoyer(current).groups){
      const buffer=gl.createBuffer();if(!buffer)continue;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.vertices),gl.STATIC_DRAW);
      meshes.push({buffer,count:geo.vertices.length/STRIDE,texture:kind});
    }
  }
  rebuild();
  function direction(){
    const cp=Math.cos(pose.pitch);
    const forward:Vec=[-Math.sin(pose.yaw)*cp,Math.sin(pose.pitch),-Math.cos(pose.yaw)*cp];
    const right:Vec=[Math.cos(pose.yaw),0,-Math.sin(pose.yaw)];
    const up:Vec=[-right[2]*Math.sin(pose.pitch),cp,right[0]*Math.sin(pose.pitch)];
    return {forward,right,up};
  }
  function aim(){
    const {forward}=direction();let winner:FoyerTarget|null=null,best=100;
    for(const t of FOYER_TARGETS){
      if(t.id==="bronze-key"&&(!current.drawer||current.key))continue;
      const d=[t.position[0]-pose.x,t.position[1]-pose.y,t.position[2]-pose.z] as Vec;
      const dist=Math.hypot(...d),front=d[0]*forward[0]+d[1]*forward[1]+d[2]*forward[2];
      if(dist>t.range||front<=.3)continue;
      const miss=Math.sqrt(Math.max(0,dist*dist-front*front));
      if(miss>.55+(t.id==="stairs"?.66:.0))continue;
      const score=miss+dist*.06;if(score<best){best=score;winner=t;}
    }
    return winner;
  }
  function nearby(){
    return FOYER_TARGETS.filter(t=>{
      if(t.id==="bronze-key"&&(!current.drawer||current.key))return false;
      return Math.hypot(t.position[0]-pose.x,t.position[2]-pose.z)<3.25;
    }).sort((a,b)=>Math.hypot(a.position[0]-pose.x,a.position[2]-pose.z)-Math.hypot(b.position[0]-pose.x,b.position[2]-pose.z)).slice(0,5);
  }
  function resize(){
    const pixel=Math.min(window.devicePixelRatio||1,1.5);
    const w=Math.round(canvas.clientWidth*pixel),h=Math.round(canvas.clientHeight*pixel);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function draw(now:number){
    if(!active)return;
    raf=requestAnimationFrame(draw);
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const {forward,right,up}=direction();
    gl.useProgram(program);
    gl.uniform3f(uEye,pose.x,pose.y,pose.z);
    gl.uniform3fv(uRight,right);gl.uniform3fv(uUp,up);gl.uniform3fv(uForward,forward);
    gl.uniform1f(uRatio,canvas.width/Math.max(1,canvas.height));
    gl.uniform1f(uTime,now*.001);gl.uniform1f(uPower,1);
    gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(norm);gl.enableVertexAttribArray(uv);gl.enableVertexAttribArray(col);
    for(const mesh of meshes){
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
      gl.vertexAttribPointer(pos,3,gl.FLOAT,false,STRIDE*4,0);
      gl.vertexAttribPointer(norm,3,gl.FLOAT,false,STRIDE*4,3*4);
      gl.vertexAttribPointer(uv,2,gl.FLOAT,false,STRIDE*4,6*4);
      gl.vertexAttribPointer(col,3,gl.FLOAT,false,STRIDE*4,8*4);
      const texture=textures.get(mesh.texture);
      gl.uniform1f(uUseMap,texture?1:0);
      if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);}
      const dz=mesh.texture==="drawer"?(animation*.64):0;
      gl.uniform3f(uShift,0,0,dz);
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
    }
    const goal=current.drawer?1:0;
    animation+=clamp((goal-animation)*.12,-.16,.16);
    if(onFrame&&now-lastUi>170){lastUi=now;onFrame({...pose},aim());}
  }
  raf=requestAnimationFrame(draw);
  const collide=(x:number,z:number)=>{
    if(x< -5.12||x>5.12||z< -6.15||z>6.45)return true;
    // Objects occupy actual 3D volumes rather than acting as flat overlays.
    if(x>-3.8&&x<-1.5&&z> -3.25&&z< -1.9)return true;
    if(x>1.6&&x<5.14&&z> -5.9&&z< -1.65)return true;
    if(x>1.1&&x<2.55&&z>-3.3&&z< -2.05)return true;
    if(x>3.85&&x<4.95&&z> -1.6&&z< -.5)return true;
    return false;
  };
  return {
    available:true,
    position:()=>({...pose}),
    aim,nearby,
    move:(forward:number,side:number,seconds:number)=>{
      const f=clamp(forward,-1,1),s=clamp(side,-1,1);
      if(Math.abs(f)+Math.abs(s)<.04)return;
      const length=Math.max(1,Math.hypot(f,s)),d=direction(),speed=2.45*Math.min(seconds,.075);
      const dx=(f*d.forward[0]+s*d.right[0])/length*speed;
      const dz=(f*d.forward[2]+s*d.right[2])/length*speed;
      if(!collide(pose.x+dx,pose.z))pose.x+=dx;
      if(!collide(pose.x,pose.z+dz))pose.z+=dz;
    },
    look:(dx:number,dy:number)=>{
      pose.yaw=(pose.yaw-dx*.0049+Math.PI*4)%(Math.PI*2);
      pose.pitch=clamp(pose.pitch-dy*.0033,-1.02,1.02);
    },
    setFlags:(value:FoyerFlags)=>{
      // The parent timer rerenders each second; only rebuild GPU geometry
      // when actual drawers, locks or recovered objects change.
      if(current.drawer===value.drawer&&current.key===value.key&&current.box===value.box&&current.clock===value.clock)return;
      current={...value};rebuild();
    },
    destroy:()=>{active=false;cancelAnimationFrame(raf);for(const m of meshes)gl.deleteBuffer(m.buffer);for(const t of textures.values())gl.deleteTexture(t);gl.deleteProgram(program);gl.flush();},
  };
}
