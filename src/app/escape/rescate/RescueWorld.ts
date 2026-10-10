/**
 * RESCATE MAURO — standalone, genuine WebGL room.
 * Original mesh-based 3D geometry (not a moving photograph).
 * Supports WebGL1 mobiles without any third-party runtime or CDN.
 */
export type ClueId="calendar"|"cassette"|"memo"|"clock"|"drawer"|"envelope"|"phone"|"camera"|"locker"|"lamp"|"pipe";
export type SceneFlags={unlocked:boolean;clockActivated:boolean;intruder:boolean};
export type Target={id:ClueId;label:string;pos:[number,number,number];reach:number;hint:string};
export const TARGETS:Target[]=[
 {id:"calendar",label:"Calendario arrancado",pos:[-2.7,2.1,-5.16],reach:3.4,hint:"La fecha parece marcada con demasiada insistencia."},
 {id:"cassette",label:"Grabador de voz",pos:[-2.8,1.03,-2.53],reach:2.9,hint:"La cinta está atascada en una grabación."},
 {id:"memo",label:"Informe confidencial",pos:[2.45,1.02,-2.55],reach:2.9,hint:"Un informe arrugado con instrucciones."},
 {id:"clock",label:"Reloj del interrogatorio",pos:[3.73,2.14,-5.20],reach:3.9,hint:"Las agujas se mueven, aunque el reloj está desconectado."},
 {id:"drawer",label:"Candado del cajón",pos:[.15,.91,-2.04],reach:2.9,hint:"Seis pequeñas ruedas numéricas protegen el cajón."},
 {id:"envelope",label:"Sobre encontrado",pos:[.15,1.11,-1.73],reach:2.9,hint:"El papel lleva un sello rojo. Por fin llegaste."},
 {id:"phone",label:"Teléfono desconectado",pos:[2.4,1.18,-3.14],reach:2.6,hint:"No hay tono de llamada. ¿Quién cortó el cable?"},
 {id:"camera",label:"Cámara de seguridad",pos:[3.6,3.35,-5.06],reach:4.7,hint:"La luz roja se enciende cuando te movés."},
 {id:"locker",label:"Armario oxidado",pos:[-3.72,1.56,-3.4],reach:2.85,hint:"Tiene marcas de dedos en el polvo."},
 {id:"lamp",label:"Luz de interrogatorio",pos:[-.2,3.43,-1.8],reach:4.2,hint:"El foco emite un zumbido intermitente."},
 {id:"pipe",label:"Tubería de ventilación",pos:[3.8,2.15,-.1],reach:3.5,hint:"Algo golpea una tubería al otro lado."},
];
type V=[number,number,number];
const stride=9; // pos3 normal3 color3
const hex=(x:string):V=>[0,2,4].map(i=>parseInt(x.slice(i+1,i+3),16)/255) as V;
class Room {
 groups=new Map<string,number[]>();
 add(kind:string,p:V,n:V,color:string){let g=this.groups.get(kind);if(!g){g=[];this.groups.set(kind,g)}g.push(...p,...n,...hex(color))}
 quad(kind:string,v:[V,V,V,V],n:V,color:string){for(const i of [0,1,2,0,2,3])this.add(kind,v[i],n,color)}
 box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,kind="scene"){
  const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,f=z-d/2,a=z+d/2;
  this.quad(kind,[[r,b,a],[r,t,a],[l,t,a],[l,b,a]],[0,0,1],color);
  this.quad(kind,[[l,b,f],[l,t,f],[r,t,f],[r,b,f]],[0,0,-1],color);
  this.quad(kind,[[l,t,a],[r,t,a],[r,t,f],[l,t,f]],[0,1,0],color);
  this.quad(kind,[[l,b,f],[r,b,f],[r,b,a],[l,b,a]],[0,-1,0],color);
  this.quad(kind,[[r,b,f],[r,t,f],[r,t,a],[r,b,a]],[1,0,0],color);
  this.quad(kind,[[l,b,a],[l,t,a],[l,t,f],[l,b,f]],[-1,0,0],color);
 }
 panel(x:number,y:number,z:number,w:number,h:number,color:string,kind:string){
  this.quad(kind,[[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2,y-h/2,z]],[0,0,1],color);
 }
 tube(a:V,b:V,r:number,color:string){
  const vec:V=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const len=Math.hypot(...vec)||1,axis=vec.map(x=>x/len) as V;
  const seed:V=Math.abs(axis[1])<.93?[0,1,0]:[1,0,0];
  const cross=(x:V,y:V):V=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
  const normalize=(x:V):V=>{const n=Math.hypot(...x)||1;return x.map(t=>t/n) as V};
  const side=normalize(cross(axis,seed)),up=normalize(cross(axis,side));
  const make=(base:V,angle:number):V=>base.map((x,i)=>x+r*(Math.cos(angle)*side[i]+Math.sin(angle)*up[i])) as V;
  const sides=8;
  for(let i=0;i<sides;i++){
   const aa=i*Math.PI*2/sides,bb=(i+1)*Math.PI*2/sides;
   const norm=normalize(side.map((x,j)=>x*Math.cos((aa+bb)/2)+up[j]*Math.sin((aa+bb)/2)) as V);
   this.quad("scene",[make(a,aa),make(b,aa),make(b,bb),make(a,bb)],norm,color);
  }
 }
}
const WALL="#383c42",FLOOR="#2d3033",WOOD="#644735";
function scene(opened:boolean){
 const g=new Room();
 // A believable, limited navigable room, roughly 10 × 11 m.
 g.box(0,-.19,-.5,10,.38,11.6,FLOOR);
 g.box(0,4.2,-.5,10,.27,11.6,"#34353b");
 g.box(0,2,-5.85,10,4.1,.35,WALL);
 g.box(-5,2,-.5,.34,4.1,11.6,"#31383d");
 g.box(5,2,-.5,.34,4.1,11.6,"#3d3d41");
 g.box(0,2,5.3,10,4.1,.34,"#292e34");
 // Floor tiles, grimy checkerboard, concrete cracks.
 for(let x=-4.62;x<=4.65;x+=.72)for(let z=-5.35;z<=4.85;z+=.72){
  const shade=(Math.round(x*100)+Math.round(z*90))%4===0?"#414347":"#333639";
  g.box(x,-.004,z,.699,.012,.695,shade);
 }
 for(const x of [-4.76,4.76]){
  g.box(x,.22,-.5,.16,.44,11.3,"#525056");
  g.box(x,3.55,-.5,.20,.16,11.3,"#777471");
  for(let z=-5;z<4.85;z+=1.35)g.box(x,1.73,z,.06,3.46,.14,"#66686a");
 }
 for(let z=-5;z<5.1;z+=2.3)g.box(0,3.94,z,9.7,.20,.19,"#4f5154");
 // Doorway, real swinging door and shadowy intruder.
 for(const [x,w] of [[-3.1,3.8],[3.1,3.8]])g.box(x,2,5.28,w,4.1,.35,"#30363b");
 g.box(0,3.75,5.28,2.4,.88,.35,"#33373d");
 g.box(0,-.05,5.78,2.37,.12,1.9,"#77665b");
 g.box(-1.16,1.9,5.84,.12,3.7,1.95,"#4b383b");
 g.box(1.16,1.9,5.84,.12,3.7,1.95,"#4b383b");
 g.box(0,1.8,6.72,2.3,3.55,.08,"#693737");
 g.box(0,3.47,6.28,1.5,.06,.13,"#b84039","emissive");
 for(const x of [-1.2,1.2])g.box(x,1.63,5.02,.12,3.35,.18,"#a88e79");
 g.box(0,3.30,5.02,2.5,.12,.2,"#a88e79");
 g.box(0,1.66,5.04,2.23,3.22,.18,"#43484b","door");
 for(let y=.38;y<2.95;y+=.57)g.box(0,y,4.92,1.94,.032,.067,"#7a7770","door");
 g.box(-.72,1.41,4.87,.17,.12,.16,"#dab880","door");
 g.box(-.64,1.41,4.78,.32,.055,.12,"#a99c85","door");
 g.box(.32,2.60,6.28,.55,.57,.40,"#15151b","figure");
 g.box(.32,1.72,6.28,.82,1.32,.42,"#12151b","figure");
 for(const x of [-.27,.91])g.box(x,1.65,6.28,.24,1.30,.33,"#18181e","figure");
 for(const x of [.09,.58])g.box(x,.52,6.28,.27,1.12,.35,"#121419","figure");
 // Two side fluorescent lamps / grimy fixture.
 for(const z of [-3.2,1.15]){
  g.box(0,4.02,z,1.1,.15,.53,"#a69d82");
  g.box(0,3.92,z,.83,.035,.32,"#c6ac81","emissive");
 }
 // Central interrogation table, visible 3D unlocked drawer.
 g.box(0,.85,-2.65,3.18,.15,1.65,WOOD);
 for(const x of [-1.4,1.4])for(const z of [-3.25,-2.1])g.box(x,.40,z,.15,.83,.16,"#6d5a4b");
 g.box(0,.52,-2.63,2.84,.52,1.29,"#463e3a");
 g.box(0,.68,-1.79,1.46,.43,.09,"#8c7158");
 for(let i=-1;i<=1;i++)g.box(i*.43,.68,-1.729,.28,.24,.027,"#64554c");
 // The drawer emerges into the room after unlocking.
 if(opened){
  g.box(.02,.62,-1.23,1.5,.13,.97,"#aa8b69","drawer");
  g.box(.02,.70,-.73,1.52,.26,.09,"#6b5140","drawer");
  g.box(.02,.72,-1.50,.25,.037,.19,"#e5d1a9","envelope");
 }else{
  g.box(0,.65,-1.724,.27,.28,.09,"#b6ad92");
  g.box(0,.64,-1.672,.075,.11,.05,"#1c2021");
 }
 // Four-digit lock physically attached to drawer.
 if(!opened){for(let i=0;i<6;i++){const x=-.66+i*.255;g.box(x,.86,-1.685,.20,.26,.12,"#aaa293");g.box(x,.86,-1.612,.165,.14,.024,"#343b3d");}}
 // Cassette recorder with tape reels and a glowing REC lamp.
 g.box(-2.7,1.05,-2.68,1.02,.28,.64,"#343d40");
 g.box(-2.7,1.199,-2.57,.83,.016,.36,"#c8b795");
 g.box(-2.7,1.215,-2.57,.68,.016,.25,"#303b3d");
 for(const x of [-2.92,-2.48]){
  g.box(x,1.23,-2.56,.19,.025,.19,"#c0baa8");
  g.box(x,1.249,-2.56,.065,.014,.065,"#414347");
 }
 g.box(-2.99,1.08,-2.34,.10,.09,.07,"#b94b42","emissive");
 for(let x=-2.8;x<=-2.37;x+=.13)g.box(x,1.08,-2.34,.10,.055,.07,"#b4a68d");
 // Files and a stamped investigative memo.
 g.box(2.32,1.0,-2.8,.7,.024,.42,"#cfbb9d","memo");
 g.box(2.51,1.024,-2.61,.14,.005,.04,"#663f39");
 g.box(-.76,.98,-2.8,.81,.031,.42,"#8c765d");
 g.box(-.88,1.001,-2.8,.52,.007,.31,"#d5c4aa");
 // Chair legs and backrest. Touch of world context beyond clues.
 for(const x of [1.0,2.4])for(const z of [-.73,.06])g.box(x,.44,z,.11,.85,.11,"#414449");
 g.box(1.7,.85,-.3,1.53,.17,1.03,"#515252");
 g.box(1.7,1.58,.18,1.5,1.28,.14,"#4e3d34");
 for(let y=1.2;y<2.01;y+=.18)g.box(1.7,y,.28,1.31,.045,.06,"#79634d");
 // Actually legible calendar, with an inked date in its month grid.
 g.box(-2.75,2.14,-5.59,1.75,1.98,.17,"#a79b87");
 g.box(-2.75,2.15,-5.47,1.58,1.80,.035,"#ecdfc9","calendar");
 g.box(-2.75,2.92,-5.42,1.60,.28,.075,"#8c3b38");
 for(let col=0;col<8;col++)g.box(-3.46+col*.202,2.03,-5.432,.008,1.17,.015,"#8c8578");
 for(let row=0;row<6;row++)g.box(-2.75,2.60-row*.232,-5.432,1.42,.009,.015,"#8c8578");
 g.box(-3.15,2.25,-5.411,.195,.18,.027,"#b8554b");
 const digit=(n:number,x:number,y:number)=>{
  const segments=n===1?[1,2]:[0,1,6,2,3];
  for(const k of segments){
   const horizontal=[0,3,6].includes(k),dx=k===1||k===2?.075:k===4||k===5?-.075:0;
   const dy=k===0?.113:k===3?-.113:k===6?0:k===1||k===5?.058:-.058;
   g.box(x+dx,y+dy,-5.375,horizontal?.13:.022,horizontal?.022:.10,.024,"#5d2529");
  }
 };
 digit(1,-3.22,2.23);digit(3,-3.04,2.23);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;g.box(-3.13+Math.cos(a)*.235,2.23+Math.sin(a)*.23,-5.365,.058,.024,.018,"#a83734");}
 g.box(-2.75,1.19,-5.43,1.64,.045,.08,"#928370");
 // Clock with real WebGL hands that animate around a shared spindle.
 const cx=3.73,cy=2.14,cz=-5.43;
 g.box(cx,cy,cz,1.46,1.46,.15,"#65503f");
 g.box(cx,cy,cz+.09,1.23,1.24,.07,"#b3a891");
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=cx+Math.sin(a)*.48,y=cy+Math.cos(a)*.48;
  g.box(x,y,cz+.147,.055,.072,.031,"#443930");
 }
 g.box(cx,cy+.205,cz+.17,.07,.45,.045,"#262b2b","clock-hour");
 g.box(cx,cy+.315,cz+.19,.038,.66,.042,"#5b3329","clock-minute");
 g.box(cx,cy,cz+.23,.11,.11,.06,"#c9aa74");
 // Evidence board, family photographs and other false leads on the back wall.
 g.box(1.55,2.11,-5.66,2.5,1.65,.17,"#69463c");
 g.box(1.55,2.12,-5.54,2.33,1.49,.01,"#ae8660");
 for(const [x,y,shade] of [[.71,2.49,"#c5b6a1"],[1.74,2.57,"#bbb3a6"],[2.2,1.65,"#cec2a9"],[.82,1.72,"#bfb59d"]] as const){
  g.box(x,y,-5.51,.63,.48,.014,shade);
  g.box(x,y+.15,-5.495,.34,.14,.012,"#786d66");
  g.box(x,y-.11,-5.495,.43,.025,.014,"#6e6053");
 }
 // Armario, fake lead, beside the wall.
 g.box(-3.75,1.51,-3.65,1.54,2.98,.90,"#414d50");
 g.box(-3.35,1.65,-3.18,.08,.41,.08,"#d1b380");
 for(const y of [.65,1.16,2.15,2.67])g.box(-3.74,y,-3.185,1.28,.035,.06,"#666f73");
 // Telephone with angular volumetric mouthpiece.
 g.box(2.44,1.10,-2.85,.6,.23,.54,"#39434b");
 g.tube([2.25,1.25,-2.92],[2.67,1.25,-2.92],.085,"#797e78");
 g.tube([2.75,1.06,-2.81],[2.95,.88,-2.82],.037,"#9c9180");
 // Security camera, red recording indicator.
 g.box(3.48,3.41,-5.32,.53,.24,.51,"#87918f");
 g.box(3.48,3.44,-5.03,.26,.17,.06,"#222831");
 g.box(3.25,3.44,-5.02,.07,.09,.08,"#c6463c","emissive");
 g.tube([3.46,3.54,-5.52],[3.83,3.82,-5.58],.07,"#8e968e");
 // Pipes, rusty utility panel and warning labels.
 for(const x of [4.45,4.25,4.05])g.tube([x,.25,3.4],[x,3.75,3.4],.072,"#67615a");
 for(const y of [.75,1.65,2.67])g.tube([4.45,y,3.4],[4.45,y,-.44],.055,"#83776c");
 g.box(4.66,2.0,-1.3,.13,1.21,1.0,"#9b8569");
 g.box(4.54,2,-1.3,.13,.66,.65,"#343d40");
 // Spotlight; unique highlight falls on the drawer and empty chair.
 g.tube([0,4.00,-1.65],[0,3.23,-1.65],.055,"#89837a");
 g.box(0,3.20,-1.65,.61,.18,.55,"#c2a47c");
 g.box(0,3.08,-1.65,.4,.032,.31,"#ffd9a2","emissive");
 // 12 metal scraps on floor: atmospheric, not all puzzle relevant.
 for(let i=0;i<15;i++){
  const x=Math.sin(i*7.13)*4.07,z=Math.cos(i*5.17)*4.15-.35;
  if(x>-1.8&&x<1.8&&z>-3.5&&z<-.9)continue;
  g.box(x,.023,z,.17+(i%3)*.11,.01,.06,"#766d60");
 }
 return g;
}
const VS=`attribute vec3 p;attribute vec3 n;attribute vec3 c;
uniform vec3 eye,right,up,forward;
uniform float ratio,clockAngle;
uniform vec2 clockPivot;
varying vec3 vPos,vNorm,vColor;varying float vDistance;
void main(){
 vec3 w=p;
 float ss=sin(clockAngle),cc=cos(clockAngle);
 w.xy=clockPivot+vec2((p.x-clockPivot.x)*cc+(p.y-clockPivot.y)*ss,-(p.x-clockPivot.x)*ss+(p.y-clockPivot.y)*cc);
 vec3 d=w-eye;
 float x=dot(d,right),y=dot(d,up),z=dot(d,forward);
 gl_Position=vec4(x*1.46/ratio,y*1.46,z*1.002-.1201,z);
 vPos=w;vNorm=n;vColor=c;vDistance=z;
}`;
const FS=`precision mediump float;
varying vec3 vPos,vNorm,vColor;varying float vDistance;
uniform float time,emission;
void main(){
 vec3 overhead=vec3(0.0,3.05,-1.7),red=vec3(3.45,3.5,-5.1);
 float d=distance(vPos,overhead);
 vec3 toL=normalize(overhead-vPos);
 float lam=max(.0,dot(normalize(vNorm),toL));
 float lamp=(.31+lam*3.05/(1.0+d*.29+d*d*.055))*(.94+.055*sin(time*12.0)+.025*sin(time*27.0));
 float redGlow=.48/(1.0+length(vPos-red)*.18);
 vec3 outColor=vColor*lamp + vColor*vec3(.19,.06,.05)*redGlow;
 outColor+=vColor*vec3(.02,.04,.055)*max(.0,dot(vNorm,vec3(1.,.2,0.)));
 float fog=clamp((vDistance-5.8)/15.0,0.,.69);
 outColor=mix(outColor,vec3(.028,.037,.050),fog);
 if(emission>.5)outColor+=vColor*vec3(.32,.21,.11);
 gl_FragColor=vec4(pow(outColor,vec3(.9)),1.0);
}`;
function compile(gl:WebGLRenderingContext,type:number,code:string){
 const sh=gl.createShader(type);if(!sh)throw Error("No se pudo crear el shader");
 gl.shaderSource(sh,code);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh)||"Error del shader");
 return sh;
}
export type Pose={x:number;y:number;z:number;yaw:number;pitch:number};
export type World={
 move:(f:number,s:number,dt:number)=>void;
 look:(dx:number,dy:number)=>void;
 lookAt:(target:Target)=>void;
 aim:()=>Target|null;
 nearby:()=>Target[];
 getPose:()=>Pose;
 setFlags:(v:SceneFlags)=>void;
 dispose:()=>void;
};
export function createWorld(canvas:HTMLCanvasElement,flags:SceneFlags,onFrame?:(p:Pose,aim:Target|null)=>void):World{
 const raw=canvas.getContext("webgl",{alpha:false,antialias:true,depth:true,powerPreference:"high-performance"});
 if(!raw)throw Error("Este navegador no permite gráficos WebGL. Activá la aceleración de hardware o probá otro navegador.");
 const gl:WebGLRenderingContext=raw;
 const program=gl.createProgram();if(!program)throw Error("No se pudo crear WebGL");
 const a=compile(gl,gl.VERTEX_SHADER,VS),b=compile(gl,gl.FRAGMENT_SHADER,FS);
 gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||"Error de WebGL");
 gl.useProgram(program);
 const attrib=(name:string)=>gl.getAttribLocation(program,name),uniform=(name:string)=>gl.getUniformLocation(program,name);
 const ap=attrib("p"),an=attrib("n"),ac=attrib("c");
 const ue=uniform("eye"),ur=uniform("right"),uu=uniform("up"),uf=uniform("forward"),uq=uniform("ratio"),ut=uniform("time"),um=uniform("emission"),ua=uniform("clockAngle"),upiv=uniform("clockPivot");
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.022,.029,.038,1);
 type Buf={id:string;buffer:WebGLBuffer;count:number};
 let mesh:Buf[]=[];
 const rebuild=(opened:boolean)=>{
  mesh.forEach(x=>gl.deleteBuffer(x.buffer));mesh=[];
  for(const [id,data] of scene(opened).groups){
   const buffer=gl.createBuffer();if(!buffer)continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
   mesh.push({id,buffer,count:data.length/stride});
  }
 };
 let current={...flags};rebuild(current.unlocked);
 const pose:Pose={x:0,y:1.67,z:3.6,yaw:0,pitch:0};
 let active=true,raf=0,lastHud=0,clockStarted=flags.clockActivated?performance.now()-3100:0;
 function basis(){
  const cp=Math.cos(pose.pitch);
  const forward:V=[-Math.sin(pose.yaw)*cp,Math.sin(pose.pitch),-Math.cos(pose.yaw)*cp];
  const right:V=[Math.cos(pose.yaw),0,-Math.sin(pose.yaw)];
  const up:V=[-right[2]*Math.sin(pose.pitch),cp,right[0]*Math.sin(pose.pitch)];
  return {forward,right,up};
 }
 function targets(){
  return TARGETS.filter(t=>current.unlocked||t.id!=="envelope");
 }
 function nearby(){
  return targets().filter(t=>Math.hypot(t.pos[0]-pose.x,t.pos[2]-pose.z)<3.25)
  .sort((a,b)=>Math.hypot(a.pos[0]-pose.x,a.pos[2]-pose.z)-Math.hypot(b.pos[0]-pose.x,b.pos[2]-pose.z));
 }
 function aim(){
  const {forward}=basis();let best:Target|null=null,score=1e6;
  for(const target of targets()){
   const v:V=[target.pos[0]-pose.x,target.pos[1]-pose.y,target.pos[2]-pose.z];
   const dist=Math.hypot(...v),front=v[0]*forward[0]+v[1]*forward[1]+v[2]*forward[2];
   if(front<.25||dist>target.reach)continue;
   const miss=Math.sqrt(Math.max(0,dist*dist-front*front));
   if(miss>.64||miss+dist*.07>score)continue;
   score=miss+dist*.07;best=target;
  }
  return best;
 }
 const obstacles=[{x:0,z:-2.65,w:3.52,d:1.92},{x:-3.72,z:-3.65,w:1.76,d:1.13},{x:1.7,z:0,w:1.64,d:1.3}];
 function collides(x:number,z:number){
  if(x< -4.48||x>4.48||z< -5.17||z>4.79)return true;
  return obstacles.some(o=>Math.abs(o.x-x)<o.w/2+.23&&Math.abs(o.z-z)<o.d/2+.23);
 }
 function frame(now:number){
  if(!active)return;raf=requestAnimationFrame(frame);
  const ratio=Math.min(window.devicePixelRatio||1,1.6),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
  if(w>0&&h>0&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const {forward,right,up}=basis();
  gl.useProgram(program);
  gl.uniform3fv(ue,[pose.x,pose.y,pose.z]);gl.uniform3fv(ur,right);gl.uniform3fv(uu,up);gl.uniform3fv(uf,forward);
  gl.uniform1f(uq,canvas.width/Math.max(canvas.height,1));gl.uniform1f(ut,now*.001);
  gl.enableVertexAttribArray(ap);gl.enableVertexAttribArray(an);gl.enableVertexAttribArray(ac);
  for(const m of mesh){
   gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);
   gl.vertexAttribPointer(ap,3,gl.FLOAT,false,stride*4,0);
   gl.vertexAttribPointer(an,3,gl.FLOAT,false,stride*4,12);
   gl.vertexAttribPointer(ac,3,gl.FLOAT,false,stride*4,24);
   gl.uniform1f(um,m.id==="emissive"?1:0);
   const t=clockStarted?Math.min(1,Math.max(0,(now-clockStarted)/3000)):0;
   const eased=t*t*(3-2*t);
   gl.uniform2f(upiv,3.73,2.14);
   gl.uniform1f(ua,m.id==="clock-hour"?eased*(Math.PI*6+Math.PI*5/6):
      m.id==="clock-minute"?eased*Math.PI*8:0);
   gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  if(onFrame&&now-lastHud>125){lastHud=now;onFrame({...pose},aim());}
 }
 raf=requestAnimationFrame(frame);
 return {
  move:(f:number,s:number,dt:number)=>{
   if(Math.abs(f)+Math.abs(s)<.02)return;
   const {forward,right}=basis(),length=Math.max(1,Math.hypot(f,s)),d=2.75*Math.min(dt,.22);
   const dx=(f*forward[0]+s*right[0])/length*d,dz=(f*forward[2]+s*right[2])/length*d;
   if(!collides(pose.x+dx,pose.z))pose.x+=dx;
   if(!collides(pose.x,pose.z+dz))pose.z+=dz;
  },
  look:(dx:number,dy:number)=>{pose.yaw=(pose.yaw-dx*.0048+Math.PI*4)%(Math.PI*2);pose.pitch=Math.max(-1.05,Math.min(1.05,pose.pitch-dy*.0038));},
  lookAt:(target:Target)=>{
    const dx=target.pos[0]-pose.x,dy=target.pos[1]-pose.y,dz=target.pos[2]-pose.z;
    pose.yaw=Math.atan2(-dx,-dz);pose.pitch=Math.atan2(dy,Math.hypot(dx,dz));
  },
  aim,nearby,getPose:()=>({...pose}),
  setFlags:(next:SceneFlags)=>{if(next.clockActivated&&!current.clockActivated)clockStarted=performance.now();if(next.unlocked!==current.unlocked)rebuild(next.unlocked);current={...next}},
  dispose:()=>{active=false;cancelAnimationFrame(raf);for(const m of mesh)gl.deleteBuffer(m.buffer);gl.deleteProgram(program);gl.flush()},
 };
}
