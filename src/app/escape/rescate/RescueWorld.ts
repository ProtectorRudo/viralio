/** CASO M — full Three.js rendering engine and professional PBR scene.
 * Original authored meshes and puzzle coordinates are unchanged; all visuals,
 * GLB skeletal animation, lighting, tone mapping and shadows use Three.js. */
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
export type ClueId="calendar"|"cassette"|"memo"|"clock"|"drawer"|"envelope"|"phone"|"camera"|"board"|"locker"|"lamp"|"pipe";
export type SceneFlags={unlocked:boolean;clockActivated:boolean;intruder:boolean;remaining?:number};
export type Target={id:ClueId;label:string;pos:[number,number,number];reach:number;hint:string};
// Spatial blueprint: different corners, open approach to the lock and at least
// a metre of clear circulation between the three main puzzle stations.
export const ROOM_LAYOUT={
 recorder:{x:-3.68,z:.82,w:1.56,d:1.32},
 surveillance:{x:3.68,z:-3.30,w:1.56,d:1.32},
 lock:{x:0,z:-2.65,w:3.06,d:1.82},
 locker:{x:-3.75,z:-3.65,w:1.54,d:.90},
 trunk:{x:-3.85,z:-1.85,w:1.12,d:.82}
} as const;
export const TARGETS:Target[]=[
 {id:"calendar",label:"Fotografía dañada",pos:[-2.75,2.14,-5.16],reach:3.4,hint:"Alguien ocultó algo detrás de la fotografía."},
 {id:"cassette",label:"Grabador de voz",pos:[ROOM_LAYOUT.recorder.x-.04,1.15,ROOM_LAYOUT.recorder.z+.26],reach:3.1,hint:"La cinta está atascada en una grabación."},
 {id:"memo",label:"Archivo de vigilancia",pos:[3.70,1.47,-3.31],reach:3.2,hint:"Un monitor conserva una grabación de seguridad."},
 {id:"clock",label:"Reloj del interrogatorio",pos:[3.73,2.14,-5.20],reach:3.9,hint:"Las agujas se mueven, aunque el reloj está desconectado."},
 {id:"drawer",label:"Candado del cajón",pos:[.15,.91,-2.04],reach:2.9,hint:"Seis pequeñas ruedas numéricas protegen el cajón."},
 {id:"envelope",label:"Sobre encontrado",pos:[.02,.79,-1.48],reach:3.3,hint:"El papel lleva un sello rojo. Por fin llegaste."},
 {id:"phone",label:"Teléfono desconectado",pos:[3.65,1.12,-2.64],reach:3.0,hint:"No hay tono de llamada. ¿Quién cortó el cable?"},
 {id:"camera",label:"Cámara de seguridad",pos:[3.6,3.35,-5.06],reach:4.7,hint:"La luz roja se enciende cuando te movés."},
 {id:"board",label:"Tablero de seguimiento",pos:[1.55,2.2,-5.27],reach:4.0,hint:"Planos, fotos y horarios de los movimientos de Mauro."},
 {id:"locker",label:"Armario oxidado",pos:[-3.72,1.56,-3.4],reach:2.85,hint:"Tiene marcas de dedos en el polvo."},
 {id:"lamp",label:"Luz de interrogatorio",pos:[-.2,3.43,-1.8],reach:4.2,hint:"El foco emite un zumbido intermitente."},
 {id:"pipe",label:"Tubería de ventilación",pos:[3.8,2.15,-.1],reach:3.5,hint:"Algo golpea una tubería al otro lado."},
];
type V=[number,number,number];
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
 // Soft bevels on actual geometry, shared depth buffer and camera.
 bevelBox(x:number,y:number,z:number,w:number,h:number,d:number,bevel:number,color:string,kind="scene"){
  const half:V=[w/2,h/2,d/2],r=Math.max(.001,Math.min(bevel,...half)*.98),inner=half.map(v=>v-r) as V;
  const origin:V=[x,y,z];
  const corner=(axis:number,sign:number,u:number,v:number)=>{
   const ui=(axis+1)%3,vi=(axis+2)%3,p:V=[0,0,0];p[axis]=sign*half[axis];p[ui]=u;p[vi]=v;
   const core=p.map((n,i)=>Math.max(-inner[i],Math.min(inner[i],n))) as V;
   const delta=p.map((n,i)=>n-core[i]) as V,length=Math.hypot(...delta)||1;
   return {p:core.map((n,i)=>n+delta[i]*r/length+origin[i]) as V,n:delta.map(n=>n/length) as V};
  };
  const tri=(a:{p:V;n:V},b:{p:V;n:V},c:{p:V;n:V})=>{
   this.add(kind,a.p,a.n,color);this.add(kind,b.p,b.n,color);this.add(kind,c.p,c.n,color);
  };
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const ui=(axis+1)%3,vi=(axis+2)%3;
   const U=[-half[ui],-inner[ui],inner[ui],half[ui]],V=[-half[vi],-inner[vi],inner[vi],half[vi]];
   for(let a=0;a<3;a++)for(let b=0;b<3;b++){
    const p=corner(axis,sign,U[a],V[b]),q=corner(axis,sign,U[a+1],V[b]);
    const t=corner(axis,sign,U[a+1],V[b+1]),u=corner(axis,sign,U[a],V[b+1]);
    tri(p,q,t);tri(p,t,u);
   }
  }
 }
 // Solid concentric metal/tape reel with exposed raised top and rim.
 reelY(x:number,y:number,z:number,outer:number,inner:number,h:number,color:string,kind="metal",sides=16){
  const top=y+h/2,bot=y-h/2,p=(r:number,t:number,yy:number):V=>[x+Math.cos(t)*r,yy,z+Math.sin(t)*r];
  for(let i=0;i<sides;i++){
   const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;
   this.quad(kind,[p(outer,a,top),p(inner,a,top),p(inner,b,top),p(outer,b,top)],[0,1,0],color);
   const n:V=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];
   this.quad(kind,[p(outer,a,bot),p(outer,a,top),p(outer,b,top),p(outer,b,bot)],n,color);
   if(inner>.001)this.quad(kind,[p(inner,b,bot),p(inner,b,top),p(inner,a,top),p(inner,a,bot)],[-n[0],0,-n[2]],color);
  }
 }
 // Raised dial rings facing the player along +Z.
 reelZ(x:number,y:number,z:number,outer:number,inner:number,depth:number,color:string,kind="metal",sides=18){
  const front=z+depth/2,back=z-depth/2;
  const p=(r:number,t:number,zz:number):V=>[x+r*Math.cos(t),y+r*Math.sin(t),zz];
  for(let i=0;i<sides;i++){
   const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;
   this.quad(kind,[p(outer,a,front),p(inner,a,front),p(inner,b,front),p(outer,b,front)],[0,0,1],color);
   const n:V=[Math.cos((a+b)/2),Math.sin((a+b)/2),0];
   this.quad(kind,[p(outer,a,back),p(outer,a,front),p(outer,b,front),p(outer,b,back)],n,color);
   if(inner>.001)this.quad(kind,[p(inner,b,back),p(inner,b,front),p(inner,a,front),p(inner,a,back)],[-n[0],-n[1],0],color);
  }
 }
 // Rotated hardbacks are true 3D objects. Because the bookcase runs
 // along Z, lean each spine into its neighbour around the local X axis.
 tiltedBox(x:number,y:number,z:number,w:number,h:number,d:number,angle:number,color:string,kind="book"){
  const co=Math.cos(angle),si=Math.sin(angle);
  const pt=(u:number,v:number,depth:number):V=>[x+u,y+v*co-depth*si,z+v*si+depth*co];
  const norm=(u:number,v:number,depth:number):V=>[u,v*co-depth*si,v*si+depth*co];
  const l=-w/2,r=w/2,b=-h/2,t=h/2,f=-d/2,a=d/2;
  this.quad(kind,[pt(r,b,a),pt(r,t,a),pt(l,t,a),pt(l,b,a)],norm(0,0,1),color);
  this.quad(kind,[pt(l,b,f),pt(l,t,f),pt(r,t,f),pt(r,b,f)],norm(0,0,-1),color);
  this.quad(kind,[pt(l,t,a),pt(r,t,a),pt(r,t,f),pt(l,t,f)],norm(0,1,0),color);
  this.quad(kind,[pt(l,b,f),pt(r,b,f),pt(r,b,a),pt(l,b,a)],norm(0,-1,0),color);
  this.quad(kind,[pt(r,b,f),pt(r,t,f),pt(r,t,a),pt(r,b,a)],norm(1,0,0),color);
  this.quad(kind,[pt(l,b,a),pt(l,t,a),pt(l,t,f),pt(l,b,f)],norm(-1,0,0),color);
 }
 panel(x:number,y:number,z:number,w:number,h:number,color:string,kind:string){
  this.quad(kind,[[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2,y-h/2,z]],[0,0,1],color);
 }
 tube(a:V,b:V,r:number,color:string,kind="scene"){
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
   this.quad(kind,[make(a,aa),make(b,aa),make(b,bb),make(a,bb)],norm,color);
  }
 }
 // Softly faceted anatomical volumes: lower poly count than a GLTF,
 // but a real silhouette instead of stacked rectangular blocks.
 ellipsoid(cx:number,cy:number,cz:number,rx:number,ry:number,rz:number,color:string,kind="figure",rings=9,sides=12){
  const pos=(phi:number,theta:number):V=>[
   cx+rx*Math.sin(phi)*Math.cos(theta),
   cy+ry*Math.cos(phi),
   cz+rz*Math.sin(phi)*Math.sin(theta)];
  const norm=(p:V):V=>{
   const q:V=[(p[0]-cx)/rx,(p[1]-cy)/ry,(p[2]-cz)/rz];
   const d=Math.hypot(...q)||1;return q.map(v=>v/d) as V;
  };
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
   const p0=pos(Math.PI*i/rings,Math.PI*2*j/sides),p1=pos(Math.PI*(i+1)/rings,Math.PI*2*j/sides);
   const p2=pos(Math.PI*(i+1)/rings,Math.PI*2*(j+1)/sides),p3=pos(Math.PI*i/rings,Math.PI*2*(j+1)/sides);
   for(const [a,b,c] of [[p0,p1,p2],[p0,p2,p3]] as const){
    const n=norm([(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3]);
    this.add(kind,a,n,color);this.add(kind,b,n,color);this.add(kind,c,n,color);
   }
  }
 }
 limb(a:V,b:V,ra:number,rb:number,color:string,kind="figure"){
  const d:V=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],len=Math.hypot(...d)||1,axis=d.map(v=>v/len) as V;
  const seed:V=Math.abs(axis[1])<.93?[0,1,0]:[1,0,0];
  const cross=(x:V,y:V):V=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
  const unit=(v:V):V=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n) as V};
  const side=unit(cross(axis,seed)),front=unit(cross(axis,side)),sides=10;
  for(let j=0;j<sides;j++){
   const t=j*Math.PI*2/sides,u=(j+1)*Math.PI*2/sides;
   const at=(p:V,r:number,angle:number):V=>p.map((v,i)=>v+r*(side[i]*Math.cos(angle)+front[i]*Math.sin(angle))) as V;
   const normal=unit(side.map((v,i)=>v*Math.cos((t+u)/2)+front[i]*Math.sin((t+u)/2)) as V);
   this.quad(kind,[at(a,ra,t),at(b,rb,t),at(b,rb,u),at(a,ra,u)],normal,color);
  }
 }
}
const WALL="#383c42",FLOOR="#2d3033";
function scene(opened:boolean){
 const g=new Room();
 // A believable, limited navigable room, roughly 10 × 11 m.
 g.box(0,-.19,-.5,10,.38,11.6,FLOOR,"concrete");
 g.box(0,4.2,-.5,10,.27,11.6,"#34353b","concrete");
 g.box(0,2,-5.85,10,4.1,.35,WALL,"concrete");
 g.box(-5,2,-.5,.34,4.1,11.6,"#31383d","concrete");
 g.box(5,2,-.5,.34,4.1,11.6,"#3d3d41","concrete");
 // The main doorway remains open behind its animated door leaf.
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
 // Broken tile seams, patchy grout and stained baseboard on all 4 walls.
 for(let x=-4.52;x<4.6;x+=1.35){
  g.box(x,.020,-5.48,.39,.006,.060,"#4f4b48","concrete");
  g.box(x,.023,4.84,.56,.007,.043,"#5d5451","concrete");
 }
 for(const z of [-5.36,-3.98,-2.58,-1.18,.22,1.62,3.02,4.42]){
  for(const x of [-4.68,4.68])g.box(x,.39,z,.08,.72,.032,"#55504c","concrete");
 }
 // A restrained layer of age, mortar repairs and fine surface geometry.
 for(let i=0;i<16;i++){
  const x=-4.45+(i%8)*1.22,y=.57+Math.floor(i/8)*2.05;
  g.box(x,y,-5.639,.48+(i%3)*.13,.006,.007,i%4===0?"#66615e":"#30363a","concrete");
 }
 for(let i=0;i<12;i++){
  const z=-5.1+(i%6)*1.76,y=.38+Math.floor(i/6)*2.7;
  g.box(-4.813,y,z,.010,.65+(i%3)*.17,.026,i%3?"#3a3b3a":"#5a5350","concrete");
 }
 // The floor's worn enamel edging catches glancing light around each station.
 for(const x of [-4.72,4.72])g.box(x,.015,-.50,.048,.020,11.08,"#64605b","metal");
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
 // Swinging timber leaf with physically recessed panels and hinges.
 g.bevelBox(0,1.66,5.04,2.23,3.22,.15,.032,"#424243","door");
 for(const x of [-.99,.99])g.bevelBox(x,1.68,4.942,.062,2.91,.072,.013,"#62534c","door");
 for(const y of [.27,1.65,3.06])g.bevelBox(0,y,4.945,1.98,.065,.073,.014,"#62534c","door");
 for(const y of [.94,2.40]){
  g.bevelBox(0,y,4.937,1.75,1.04,.042,.023,"#262d30","door");
  g.bevelBox(0,y,4.910,1.57,.85,.027,.017,"#525451","door");
  g.box(0,y+.36,4.892,1.41,.018,.015,"#777069","door");
  g.box(-.73,y,4.893,.018,.70,.016,"#6b6058","door");
 }
 for(const y of [.44,1.66,2.90]){
  g.reelY(1.064,y,5.015,.071,.030,.041,"#706a61","door-metal",12);
  g.box(1.05,y,4.932,.030,.14,.035,"#9d8971","door-metal");
 }
 g.bevelBox(-.73,1.42,4.899,.19,.30,.061,.020,"#343537","door-metal");
 g.ellipsoid(-.73,1.42,4.833,.066,.068,.059,"#b99c73","door-metal",10,14);
 g.tube([-.73,1.42,4.84],[-.50,1.40,4.79],.028,"#c7ae80","door-metal");
 g.ellipsoid(-.48,1.4,4.79,.044,.025,.028,"#bd9e75","door-metal",8,12);
 g.box(-.73,1.287,4.847,.026,.071,.022,"#998366","door-metal");
 g.ellipsoid(.07,2.88,4.889,.046,.044,.021,"#b2a080","door-metal",8,12);
 for(let i=0;i<8;i++){
  const x=-.83+(i%4)*.49,y=.35+Math.floor(i/4)*2.68;
  g.box(x,y,4.874,.16,.009,.014,i%2?"#7d7165":"#24282a","door");
 }
 // The corridor stays EMPTY until the 60-second threat sequence.
 // A held knife appears only after its shadow has crossed the back wall.
 // Tall hooded intruder: sculpted shoulders, face recess, clothing folds
 // and staggered legs, all shaded as a true 3-D volume rather than Minecraft blocks.
 g.ellipsoid(.32,2.58,6.28,.315,.37,.295,"#111821","figure",13,18);
 g.ellipsoid(.32,2.55,6.00,.215,.275,.084,"#060a0e","figure",15,20); // under the hood
 g.ellipsoid(.32,2.56,5.912,.164,.233,.047,"#282928","figure",15,20); // dark half-masked face only briefly revealed
 g.ellipsoid(.250,2.62,5.856,.042,.013,.009,"#070a0b"); // shadowed left eye socket
 g.ellipsoid(.391,2.62,5.856,.042,.013,.009,"#070a0b");
 g.ellipsoid(.32,2.49,5.855,.060,.008,.006,"#171718"); // subtle mask seam
 g.box(.32,2.445,5.827,.015,.073,.013,"#6d574d"); // cracked surface

 g.ellipsoid(.30,2.94,6.31,.29,.12,.29,"#171b20"); // narrow hood rim
 g.ellipsoid(.32,2.07,6.29,.48,.25,.31,"#171c21"); // believable shoulder shape
 g.limb([.32,2.12,6.28],[.32,1.25,6.28],.40,.33,"#161b20"); // tailored coat
 g.limb([.32,1.31,6.28],[.32,.90,6.28],.34,.40,"#12171d"); // coat flare
 g.ellipsoid(.32,1.24,6.27,.34,.12,.25,"#242426"); // belt/fold
 g.limb([.27,2.36,6.13],[.32,1.35,6.11],.028,.038,"#252a2e"); // coat lapel
 g.limb([.05,2.30,6.14],[.24,1.30,6.12],.024,.018,"#26292b"); // first coat seam
 g.limb([.57,2.30,6.14],[.42,1.30,6.12],.024,.018,"#26292b"); // second seam
 for(const y of [1.88,1.61,1.34])g.ellipsoid(.32,y,6.11,.024,.019,.019,"#56544f"); // coat buttons
 g.box(.06,1.35,6.10,.22,.025,.020,"#272b2f");
 g.box(.56,1.35,6.10,.22,.025,.020,"#272b2f");

 g.limb([-.22,2.12,6.29],[-.31,1.58,6.23],.20,.157,"#181d23"); // left sleeve
 g.limb([-.31,1.58,6.23],[-.28,1.06,6.12],.152,.116,"#191c20");
 g.ellipsoid(-.32,1.06,6.10,.14,.15,.12,"#26272a"); // gloved hand
 g.limb([.82,2.10,6.30],[.92,1.59,6.23],.21,.161,"#191d20");
 g.limb([.92,1.59,6.23],[.89,1.01,6.08],.16,.116,"#1d2024"); // knife arm
 g.ellipsoid(.89,.98,6.06,.145,.16,.14,"#343435");
 g.limb([.03,1.03,6.33],[-.07,.33,6.32],.195,.145,"#131820","figure-leg");
 g.limb([.62,1.03,6.34],[.73,.33,6.32],.195,.145,"#10151c","figure-leg");
 g.ellipsoid(-.08,.11,6.20,.18,.106,.28,"#24252a","figure-leg"); // leather boots
 g.ellipsoid(.72,.11,6.18,.18,.106,.29,"#202227","figure-leg");
 g.limb([.87,.93,6.04],[.87,.70,6.03],.08,.064,"#322920"); // knife handle
 g.box(.87,.68,6.03,.21,.05,.14,"#84837b","figure"); // small guard
 g.limb([.87,.64,6.03],[.87,.32,6.03],.070,.038,"#7d8d95","knife-blade");
 g.box(.895,.50,5.958,.020,.36,.009,"#d2e2e8","knife-blade"); // highlight edge
 g.add("knife-blade",[.833,.34,5.955],[0,0,-1],"#9eacb2");
 g.add("knife-blade",[.916,.34,5.955],[0,0,-1],"#d0dbe0");
 g.add("knife-blade",[.869,.19,5.955],[0,0,-1],"#b6c7ce");
 // Mask mesh is attached to the animated GLB head in IntruderGLB.ts.
 // A separate foreshadowing SHADOW on the corridor wall, shown first.
 g.box(.98,1.17,6.645,.12,.47,.018,"#251923","knife-shadow");
 g.box(.98,.86,6.645,.18,.07,.02,"#251923","knife-shadow");
 g.box(.98,.60,6.645,.095,.46,.018,"#251923","knife-shadow");
 g.add("knife-shadow",[.93,.37,6.630],[0,0,-1],"#251923");
 g.add("knife-shadow",[1.03,.37,6.630],[0,0,-1],"#251923");
 g.add("knife-shadow",[.98,.16,6.630],[0,0,-1],"#251923");
 // Two side fluorescent lamps / grimy fixture.
 for(const z of [-3.2,1.15]){
  g.box(0,4.02,z,1.1,.15,.53,"#a69d82");
  g.box(0,3.92,z,.83,.035,.32,"#c6ac81","emissive");
 }
 // Isolated left/right investigation stations, away from combination lock.
 // The 1m central walkway is deliberately left clear.
 for(const {x,z} of [ROOM_LAYOUT.recorder,ROOM_LAYOUT.surveillance]){
  g.bevelBox(x,.828,z,1.52,.15,1.29,.025,"#454c51","metal");
  g.bevelBox(x,.932,z,1.56,.060,1.32,.023,"#79644f","wood");
  g.box(x,.971,z,1.39,.006,1.13,"#8c765f","wood");
  for(const dx of [-.62,.62])for(const dz of [-.48,.48]){
   g.bevelBox(x+dx,.420,z+dz,.105,.78,.105,.015,"#4c5457","metal");
   g.bevelBox(x+dx,.065,z+dz,.178,.11,.173,.015,"#222a2e","metal");
   g.reelY(x+dx,.982,z+dz,.028,.008,.012,"#b3a083","metal",10);
  }
  for(const dz of [-.44,.43])g.box(x,.58,z+dz,1.26,.054,.064,"#444c4e","metal");
  g.box(x,.025,z,1.64,.012,1.42,"#161a1b");
  g.box(x,.50,z-.58,1.26,.068,.056,"#596164","metal");
  for(let i=0;i<9;i++)g.box(x-.66+i*.16,.901,z+.648,.034,.011,.015,i%2?"#9d886d":"#5a4e43","wood");
 }
 // Heavy six-wheel combination lock on a real drawer cabinet.
 g.bevelBox(0,.83,-2.65,3.24,.22,1.76,.034,"#414449","metal");
 g.bevelBox(0,.957,-2.65,3.30,.061,1.82,.022,"#887158","wood");
 for(const x of [-1.43,1.43])for(const z of [-3.31,-2.04]){
  g.bevelBox(x,.40,z,.16,.79,.16,.018,"#555d60","metal");
  g.bevelBox(x,.038,z,.20,.074,.20,.016,"#303538","metal");
 }
 g.box(0,.02,-2.62,3.2,.02,1.82,"#16191b");
 g.bevelBox(0,.53,-2.61,2.88,.49,1.36,.025,"#30373e","metal");
 // Real inset drawer-front with oak trim, layered depth and brass pull handles.
 g.bevelBox(0,.67,-1.75,2.55,.42,.13,.031,"#755d4b","wood");
 g.bevelBox(0,.79,-1.66,2.34,.30,.070,.014,"#202b33","metal");
 g.box(0,.79,-1.612,2.27,.25,.029,"#938978","metal");
 g.bevelBox(0,1.012,-1.97,1.26,.080,.063,.016,"#b9a47e","wood");
 for(const x of [-1.22,1.22])for(const y of [.56,.83]){
  g.reelZ(x,y,-1.55,.061,.021,.026,"#a28f72","metal",12);
  g.tube([x,y,-1.54],[x,y,-1.485],.020,"#d4b486","metal");
 }
 if(opened){
  // Open drawer body has walls, genuine inner cavity and wooden underside.
  g.bevelBox(0,.66,-1.22,1.58,.066,1.12,.014,"#a38d70","drawer");
  for(const x of [-.76,.76])g.bevelBox(x,.73,-1.22,.075,.19,1.09,.008,"#786148","drawer");
  g.bevelBox(0,.73,-.67,1.65,.20,.10,.012,"#866448","drawer");
  g.box(0,.69,-1.20,1.38,.009,.88,"#514132","drawer");
  for(const x of [-.55,.55])g.tube([x,.74,-.66],[x,.74,-.58],.039,"#c0ab84","metal");
  // Folded envelope of stiff paper, visible triangular flap and wax seal.
  g.bevelBox(0,.707,-1.48,.43,.017,.27,.004,"#e5d4b1","envelope");
  g.quad("envelope",[[-.21,.720,-1.575],[0,.724,-1.43],[.21,.720,-1.575],[.0,.723,-1.47]],[0,1,0],"#c8b18e");
  g.quad("envelope",[[-.20,.719,-1.382],[0,.722,-1.44],[.20,.719,-1.382],[0,.720,-1.39]],[0,1,0],"#efe0c5");
  g.reelY(0,.732,-1.445,.055,.006,.009,"#8a302a","envelope",18);
  g.ellipsoid(0,.738,-1.445,.027,.004,.023,"#b65045","envelope",5,10);
 }else{
  // Bronze lock casing, faceplate and six individual metal number wheels.
  g.bevelBox(0,.75,-1.55,.42,.23,.135,.018,"#857b6e","metal");
  g.bevelBox(0,.75,-1.475,.25,.125,.036,.012,"#1e282c","metal");
  for(let i=0;i<6;i++){
   const x=-.82+i*.326;
   g.bevelBox(x,.79,-1.56,.280,.248,.072,.018,"#30383a","metal");
   g.reelZ(x,.79,-1.499,.124,.072,.055,"#aa9c82","metal",18);
   g.reelZ(x,.79,-1.462,.073,.029,.023,"#3d4548","metal",14);
   // Three etched numeral notches remain readable without text textures.
   for(let j=0;j<3;j++){
    const t=(j-1)*.43;
    g.box(x+Math.sin(t)*.059,.788+Math.cos(t)*.056,-1.432,.015,.020,.014,"#dfcba0","metal");
   }
   g.box(x,.906,-1.464,.044,.017,.022,"#d7be90","metal");
  }
  for(const x of [-1.035,1.035])g.reelZ(x,.79,-1.473,.044,.009,.018,"#baa782","metal",12);
 }
 // An actual analogue cassette recorder: beveled enclosure, twin tape
 // reels, spindle holes, etched ruler, button bank, speaker grille and LED.
 const rx=ROOM_LAYOUT.recorder.x,rz=ROOM_LAYOUT.recorder.z;
 g.bevelBox(rx-.01,1.068,rz+.08,1.08,.226,.62,.038,"#2a3439","recorder");
 g.bevelBox(rx-.01,1.188,rz+.20,.89,.034,.40,.012,"#b1a38d","metal");
 g.bevelBox(rx-.01,1.216,rz+.20,.70,.027,.27,.011,"#252c30","recorder");
 g.box(rx-.01,1.231,rz+.20,.53,.010,.215,"#151d22","recorder");
 for(const x of [rx-.21,rx+.19]){
  g.reelY(x,1.253,rz+.19,.111,.052,.030,"#b9b09b","metal",20);
  g.reelY(x,1.273,rz+.19,.056,.029,.018,"#51585b","metal",16);
  for(let k=0;k<5;k++){
   const t=k/5*Math.PI*2;
   g.box(x+.069*Math.cos(t),1.278,rz+.19+.069*Math.sin(t),.016,.012,.020,"#2c3336","metal");
  }
  g.tube([x,1.260,rz+.19],[x,1.300,rz+.19],.014,"#c3b8a3","metal");
 }
 // Black magnetic tape passes over the heads between the reels.
 g.box(rx-.01,1.253,rz+.20,.27,.012,.022,"#15191c","recorder");
 for(let i=0;i<15;i++)g.box(rx-.46+i*.065,1.088,rz+.395,.025,.050,.015,"#798185","metal");
 g.bevelBox(rx-.01,1.046,rz+.398,.45,.050,.032,.006,"#1b262b","recorder");
 for(let i=0;i<7;i++)g.box(rx-.18+i*.060,1.047,rz+.420,.014,.011,.010,"#95a69f","metal");
 for(let i=0;i<5;i++){
  const x=rx-.39+i*.175;
  g.bevelBox(x,.991,rz+.340,.100,.029,.110,.008,i===0?"#9b4b41":"#92968d","metal");
  g.box(x,.975,rz+.402,.063,.009,.009,"#202528","metal");
 }
 for(const x of [rx-.49,rx+.47]){
  g.reelZ(x,1.12,rz+.401,.027,.008,.018,"#9e988b","metal",12);
 }
 g.box(rx-.35,1.091,rz+.432,.071,.058,.030,"#b94a40","emissive");
 // Surveillance station: recessed CRT-inspired housing, vents,
 // glass inset, OSD lines, status LEDs, real stalk & die-cast foot.
 const mx=ROOM_LAYOUT.surveillance.x,mz=ROOM_LAYOUT.surveillance.z;
 g.bevelBox(mx,1.42,mz-.24,1.10,.89,.24,.045,"#273238","metal");
 g.bevelBox(mx,1.43,mz-.107,.964,.728,.045,.025,"#121b20","metal");
 g.bevelBox(mx,1.43,mz-.078,.872,.637,.015,.006,"#2f5360","memo");
 g.box(mx,1.58,mz-.060,.70,.018,.007,"#6a9899","memo");
 for(let i=0;i<8;i++){
  g.box(mx,1.19+i*.064,mz-.064,.79,.0035,.0045,i%3===0?"#507b7d":"#365964","memo");
 }
 // Surveillance silhouettes, date/time bars, tiny recording dot.
 for(let i=0;i<5;i++){
  const x=mx-.30+i*.142;
  g.box(x,1.43+(i%2)*.13,mz-.047,.12,.064,.007,i%2?"#56777c":"#31424a","memo");
 }
 g.box(mx,1.132,mz-.043,.72,.052,.008,"#17252c","memo");
 g.ellipsoid(mx+.358,1.735,mz-.046,.014,.014,.008,"#cd443d","emissive",5,8);
 for(let i=0;i<12;i++)g.box(mx-.52+i*.095,1.80,mz-.23,.049,.009,.020,"#10191b","metal");
 for(const x of [mx-.45,mx+.45])for(const y of [1.10,1.76])
  g.reelZ(x,y,mz-.070,.016,.006,.008,"#9b9b8e","metal",10);
 g.bevelBox(mx,.960,mz-.30,.115,.18,.13,.016,"#676d69","metal");
 g.bevelBox(mx,.862,mz-.30,.42,.045,.34,.016,"#545e5c","metal");
 for(let i=0;i<6;i++)g.box(mx-.34+i*.14,1.05,mz-.071,.044,.030,.017,i===5?"#ae473d":"#879390","metal");
 // Keyboard, rows of independent angled raised keys; mouse + cord.
 g.bevelBox(mx,1.016,mz+.31,.87,.046,.23,.016,"#30373b","metal");
 for(let row=0;row<3;row++)for(let col=0;col<10;col++){
  const x=mx-.35+col*.077,z=mz+.244+row*.064;
  g.bevelBox(x,1.046,z,.060,.019,.046,.004,row===2&&col>3&&col<8?"#626f6d":"#83908b","metal");
 }
 g.ellipsoid(mx+.53,1.032,mz+.22,.076,.047,.108,"#4e5b5d","metal",8,12);
 g.tube([mx+.58,1.036,mz+.16],[mx+.69,1.034,mz-.10],.009,"#353b3a","cable");
 // Analogue telephone: cradle, rounded handset, keypad, cord and jack.
 const tx=3.67,tz=-2.82;
 g.bevelBox(tx,1.025,tz,.54,.14,.34,.043,"#303b40","metal");
 g.box(tx,1.106,tz+.038,.32,.032,.18,"#151f23","metal");
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)
  g.bevelBox(tx-.105+col*.105,1.131,tz-.015+row*.058,.058,.017,.043,.004,"#8c9290","metal");
 g.ellipsoid(tx-.22,1.184,tz,.060,.060,.092,"#737a76","metal",8,10);
 g.ellipsoid(tx+.22,1.184,tz,.060,.060,.092,"#737a76","metal",8,10);
 g.tube([tx-.21,1.205,tz],[tx+.21,1.205,tz],.049,"#8b938e","metal");
 g.tube([tx+.245,1.168,tz+.03],[tx+.35,1.115,tz+.12],.014,"#2b3335","cable");
 for(let i=0;i<9;i++){
  const t=i/9*Math.PI*2,z=tz+.12+Math.sin(t)*.026,x=tx+.35+i*.023;
  g.tube([x,1.109,z],[x+.02,1.104,z+.01],.012,"#3b4241","cable");
 }
 // The right-side lane must remain completely open to the security monitor
 // and wall clock. Removed the decorative chair that blocked navigation.
 // Full-height utilitarian shelf: brackets, warped wooden shelves,
 // staggered books, printed labels, file boxes, folders and fallen paper.
 for(const x of [-4.67,-4.23])g.bevelBox(x,1.48,3.25,.068,2.65,1.62,.014,"#51534f","metal");
 for(const y of [.53,1.18,1.83,2.48]){
  g.bevelBox(-4.48,y,3.27,.63,.072,1.60,.016,"#74604a","wood");
  for(const z of [2.55,4.01]){
   g.bevelBox(-4.47,y-.12,z,.46,.044,.037,.010,"#6f736e","metal");
   g.tube([-4.59,y-.11,z],[-4.67,y-.33,z],.023,"#8f8779","metal");
  }
 }
 const spinePalette=["#414e4c","#776a58","#5b514a","#354c54","#7a554c","#6d6957","#3b454d","#977d60","#59443e"];
 for(let shelf=0;shelf<3;shelf++){
  const z0=2.62,baseY=.57+shelf*.65;
  for(let i=0;i<12;i++){
   const z=z0+i*.114+(i%3)*.004;
   const h=.29+(i*7+shelf*5)%5*.049,w=.11+(i%4)*.009;
   const angle=(i===3||i===10)?.14:(i===7?-.11:0);
   const cy=baseY+h/2-.018;
   g.tiltedBox(-4.41,cy,z,w,h,.080,angle,spinePalette[(i+shelf*3)%spinePalette.length],"book");
   g.box(-4.338,cy+.028,z,.007,.065,.047,"#ad9b78","book");
   for(let mark=0;mark<2;mark++)g.box(-4.331,cy-.083+mark*.033,z,.007,.007,.056,"#c2b394","book");
  }
  // A leaning dossier and a cardboard case disrupt the repetitive rhythm.
  g.bevelBox(-4.45,baseY+.075,3.89,.31,.16,.11,.011,"#7d6b56","wood");
  g.box(-4.283,baseY+.09,3.89,.009,.065,.078,"#d1bc8f","paper");
 }
 for(let i=0;i<4;i++)g.box(-4.39,2.57+i*.018,2.73+i*.036,.24,.009,.18,i%2?"#b5a184":"#dad0b2","paper");
 // Evidence trunk: battered steel edges, leather straps, rivets and latch.
 const trunk=ROOM_LAYOUT.trunk;
 g.bevelBox(trunk.x,.33,trunk.z,1.08,.58,.74,.06,"#414643","metal");
 g.bevelBox(trunk.x,.65,trunk.z,1.12,.086,.78,.028,"#6f6658","wood");
 for(const dx of [-.46,.46]){
  g.box(trunk.x+dx,.38,trunk.z,.052,.53,.76,"#877862","metal");
  for(const dz of [-.31,.31])for(const y of [.16,.48,.65])
   g.reelZ(trunk.x+dx,y,trunk.z+dz,.020,.007,.014,"#b6a07a","metal",10);
 }
 for(const dz of [-.28,.28])g.box(trunk.x,.343,trunk.z+dz,1.04,.042,.049,"#77766a","metal");
 g.bevelBox(trunk.x,.405,trunk.z-.393,.31,.15,.064,.013,"#baa37d","metal");
 g.bevelBox(trunk.x,.414,trunk.z-.436,.17,.059,.023,.006,"#4a453b","metal");
 g.tube([trunk.x-.065,.400,trunk.z-.447],[trunk.x+.065,.400,trunk.z-.447],.018,"#c8af86","metal");
 for(let i=0;i<7;i++){
  const t=i/6*Math.PI*1.6;
  g.tube([trunk.x+.58+.14*Math.cos(t),.028,trunk.z+.23+.12*Math.sin(t)],
         [trunk.x+.58+.14*Math.cos(t+.31),.028,trunk.z+.23+.12*Math.sin(t+.31)],.014,"#242b2c","cable");
 }
 // Damaged evidence photograph, raised double frame, beveled glass,
 // torn corners, physical paper under tape, and emulsion scratches.
 g.bevelBox(-2.75,2.12,-5.59,1.65,1.94,.105,.021,"#62574b","wood");
 g.bevelBox(-2.75,2.12,-5.491,1.54,1.82,.047,.016,"#c8b79b","paper");
 g.bevelBox(-2.75,2.27,-5.449,1.36,1.32,.024,.010,"#253a42","calendar");
 g.box(-2.74,2.16,-5.424,1.12,.93,.021,"#28343e","calendar");
 g.box(-2.74,2.48,-5.402,.74,.27,.021,"#556367","calendar");
 g.box(-2.65,1.97,-5.40,.40,.22,.022,"#756458","calendar");
 for(const [x,y] of [[-3.1,2.96],[-2.38,2.98],[-3.05,1.37]]){
  g.bevelBox(x,y,-5.418,.38,.14,.027,.004,"#ad9571","paper");
  g.box(x,y,-5.399,.32,.006,.008,"#e3d1ac","paper");
 }
 for(let i=0;i<7;i++){
  const x=-3.25+i*.165,y=2.32+(i%3)*.041;
  g.box(x,y,-5.390,.16,.008,.008,i%2?"#8c806d":"#c7b79a","paper");
 }
 // The wall clock retains its same spindle animation and clickable target.
 const cx=3.73,cy=2.14,cz=-5.43;
 g.bevelBox(cx,cy,cz,1.46,1.46,.15,.040,"#51483d","wood");
 g.bevelBox(cx,cy,cz+.083,1.23,1.24,.071,.034,"#b0a28c","wood");
 g.bevelBox(cx,cy,cz+.128,1.07,1.07,.021,.009,"#d4c9ac","paper");
 for(let i=0;i<60;i++){
  const t=i*Math.PI/30,x=cx+Math.sin(t)*(i%5===0?.476:.50),y=cy+Math.cos(t)*(i%5===0?.476:.50);
  g.box(x,y,cz+.151,i%5===0?.037:.009,i%5===0?.072:.022,.011,i%5===0?"#403c35":"#827a69","metal");
 }
 g.reelZ(cx,cy,cz+.173,.052,.014,.018,"#806747","metal",18);
 g.bevelBox(cx,cy+.205,cz+.17,.07,.45,.045,.009,"#262b2b","clock-hour");
 g.bevelBox(cx,cy+.315,cz+.19,.038,.66,.042,.006,"#5b3329","clock-minute");
 g.ellipsoid(cx,cy,cz+.23,.054,.054,.032,"#c9aa74","metal",8,14);
 // A real conspiracy board: layered images, routes, schedules and red thread.
 g.bevelBox(1.51,2.15,-5.68,2.76,1.94,.15,.024,"#5d3e33","wood");
 g.bevelBox(1.51,2.15,-5.573,2.59,1.78,.023,.010,"#8f795e","paper");
 for(const x of [.175,2.845])g.bevelBox(x,2.15,-5.535,.070,1.93,.040,.010,"#6d5140","wood");
 for(const y of [1.22,3.09])g.bevelBox(1.51,y,-5.535,2.74,.070,.040,.010,"#6d5140","wood");
 for(const x of [.31,2.71])for(const y of [1.34,2.94])
  g.reelZ(x,y,-5.496,.022,.009,.016,"#b7a384","metal",10);
 const notes=[
  [.54,2.66,.53,.45,"#d5c4a9"],[1.12,2.74,.44,.44,"#ead7b8"],
  [1.78,2.70,.51,.51,"#c6b499"],[2.36,2.61,.51,.43,"#e1d0b3"],
  [.51,2.12,.49,.52,"#cec1a7"],[1.10,2.18,.49,.46,"#efe2c6"],
  [1.70,2.14,.58,.48,"#bda585"],[2.34,2.13,.48,.49,"#d5c0a2"],
  [.55,1.66,.52,.43,"#ddc8aa"],[1.15,1.62,.42,.39,"#bba78d"],
  [1.71,1.63,.49,.44,"#dbceb4"],[2.36,1.65,.55,.38,"#c4b69b"]
 ] as const;
 for(let i=0;i<notes.length;i++){
  const [x,y,w,h,shade]=notes[i],z=-5.549+(i%3)*.006;
  g.bevelBox(x,y,z,w,h,.014,.003,shade,"paper");
  g.box(x+.016,y-.012,z+.012,w-.08,.003,.006,"#8f806b","paper");
  if(i%3===0){
   g.box(x,y+.07,z+.017,w*.66,h*.53,.016,"#465960");
   g.ellipsoid(x,y+.12,z+.036,.06,.07,.012,"#a5a193","scene");
   g.box(x,y-.13,z+.017,w*.69,.024,.012,"#5d5147");
  }else{
   for(let row=0;row<4;row++){
    const lineW=w*(.69-.055*row),lineY=y+h*.31-row*.087;
    g.box(x-.025,lineY,z+.018,lineW,.013,.013,row===0?"#574e49":"#817468");
   }
  }
  g.bevelBox(x-.11,y+h/2,z+.027,.22,.047,.012,.004,"#c0ae8c","paper"); // physical tape
  g.reelZ(x,y+h/2-.033,z+.045,.022,.004,.020,i%2?"#a74a3e":"#566963","metal",10); // actual pin
  if(i%4===2){
   for(let k=0;k<3;k++)g.box(x+w*.26,y-h*.26+k*.028,z+.021,.12,.010,.010,"#7b6b57","paper");
  }
 }
 const nodes:V[]=[[.54,2.66,-5.491],[1.12,2.74,-5.487],[2.36,2.61,-5.481],
  [1.70,2.14,-5.483],[.55,1.66,-5.482],[1.71,1.63,-5.477],[2.34,2.13,-5.478]];
 for(const [i,j] of [[0,3],[3,2],[0,4],[4,5],[1,6],[6,2],[5,3]] as const)
  g.tube(nodes[i],nodes[j],.011,"#9b312d");
 // Broad strip of security-camera timeline under the observation notes.
 for(let i=0;i<5;i++){
  const x=.77+i*.36;
  g.bevelBox(x,1.42,-5.532,.30,.040,.012,.005,i%2?"#52463b":"#8c513e","paper");
  g.box(x,1.417,-5.520,.22,.008,.005,"#d1c0a5","paper");
 }
 for(let i=0;i<3;i++){
  const x=.73+i*.72,y=1.31,z=-5.518;
  g.box(x,y,z,.53,.045,.009,"#3b4543","paper");
  g.box(x+.08,y+.015,z+.014,.31,.010,.009,"#b7a188","paper");
 }
 // Worn steel locker: inset double doors, rolled corners, vent slits,
 // individual rivets, rust patina, hinge barrels and latch handle.
 const lx=ROOM_LAYOUT.locker.x,lz=ROOM_LAYOUT.locker.z;
 g.bevelBox(lx,1.51,lz,1.54,2.98,.90,.042,"#414b4d","metal");
 for(const x of [lx-.365,lx+.365]){
  g.bevelBox(x,1.54,lz+.466,.693,2.78,.050,.020,"#4f5c5e","metal");
  g.box(x,1.54,lz+.503,.55,2.58,.007,"#465254","metal");
  for(const y of [.60,1.18,2.04,2.65]){
   g.box(x,y,lz+.509,.44,.025,.012,"#747d7b","metal");
   g.box(x,y+.044,lz+.510,.44,.008,.012,"#283337","metal");
  }
  for(const hy of [.30,1.45,2.70]){
   const hx=x+(x<lx?-.322:.322);
   g.tube([hx,hy-.08,lz+.475],[hx,hy+.08,lz+.475],.023,"#a9a398","metal");
   g.reelY(hx,hy+.083,lz+.475,.031,.013,.026,"#766f63","metal",12);
  }
  for(const vy of [.75,1.90,2.44])for(let i=0;i<7;i++){
   g.box(x-.21+i*.068,vy,lz+.522,.036,.014,.012,"#293338","metal");
  }
 }
 g.bevelBox(lx+.37,1.65,lz+.535,.082,.39,.077,.013,"#d0b88e","metal");
 g.reelZ(lx+.37,1.63,lz+.579,.034,.011,.014,"#615a50","metal",12);
 for(let i=0;i<10;i++){
  const y=.42+i*.24;
  g.box(lx-.757,y,lz+.15,.007,.10,.115,i%4===0?"#74675a":"#555652","metal");
 }
 // Ceiling camera: body, lens housing, glass, infrared ring, pan mount,
 // bracket, exposed cable and recording indicator.
 const camX=3.48,camY=3.41,camZ=-5.32;
 g.bevelBox(camX,camY,camZ,.55,.26,.51,.034,"#828987","metal");
 g.bevelBox(camX,camY+.015,camZ+.245,.40,.214,.065,.016,"#343b3e","metal");
 g.reelZ(camX,camY,camZ+.30,.112,.066,.040,"#afb6ad","metal",20);
 g.reelZ(camX,camY,camZ+.323,.068,.032,.022,"#111a21","metal",18);
 g.ellipsoid(camX,camY,camZ+.337,.033,.034,.011,"#273b4b","metal",8,12);
 for(let i=0;i<8;i++){
  const t=i*Math.PI/4;
  g.ellipsoid(camX+.159*Math.cos(t),camY+.159*Math.sin(t),camZ+.280,.015,.015,.010,"#a3aba0","metal",6,8);
 }
 g.box(3.24,3.45,-5.019,.070,.08,.060,"#c6463c","emissive");
 g.tube([3.46,3.54,-5.52],[3.83,3.82,-5.58],.070,"#8e968e","metal");
 g.bevelBox(3.85,3.81,-5.62,.24,.12,.14,.019,"#767f80","metal");
 g.tube([3.81,3.78,-5.58],[4.15,3.67,-5.59],.012,"#252d2d","cable");
 // Exposed utility ducts: bolted flanges, clamped elbows, rusty inspection
 // panel, slotted ventilation grille and grounding wire.
 for(const x of [4.45,4.25,4.05]){
  g.tube([x,.25,3.4],[x,3.75,3.4],.070,"#67615a","metal");
  for(const y of [.42,1.60,2.95,3.56]){
   g.tube([x,y-.043,3.40],[x,y+.043,3.40],.083,"#988575","metal");
   g.box(x+.02,y,3.48,.07,.065,.027,"#4f5554","metal");
  }
 }
 for(const y of [.75,1.65,2.67]){
  g.tube([4.45,y,3.4],[4.45,y,-.44],.055,"#83776c","metal");
  for(const z of [-.18,1.22,2.77])g.tube([4.45,y,z-.037],[4.45,y,z+.037],.075,"#9d8771","metal");
 }
 g.bevelBox(4.66,2.0,-1.3,.13,1.21,1.0,.025,"#907d65","metal");
 g.box(4.585,2,-1.3,.028,.84,.70,"#20292c","metal");
 for(let i=0;i<10;i++){
  const y=1.64+i*.078;
  g.box(4.556,y,-1.3,.016,.023,.58,"#777f78","metal");
 }
 for(const y of [1.48,2.52])for(const z of [-1.70,-.91])
  g.bevelBox(4.553,y,z,.014,.026,.028,.003,"#c5ab83","metal");
 g.tube([4.54,2.40,-1.0],[4.53,2.82,-.63],.012,"#77634c","cable");
 // Ceiling luminaire: enamel shade, recessed diffuser, four fasteners,
 // protected cable and heat-darkened reflector.
 g.tube([0,4.00,-1.65],[0,3.23,-1.65],.055,"#89837a","metal");
 g.bevelBox(0,3.20,-1.65,.65,.20,.59,.030,"#ae9b80","metal");
 g.bevelBox(0,3.077,-1.65,.46,.038,.37,.011,"#d6b68d","metal");
 g.box(0,3.052,-1.65,.39,.012,.30,"#ffe2ad","emissive");
 for(const dx of [-.23,.23])for(const dz of [-.19,.19])
  g.reelY(dx,3.110,-1.65+dz,.028,.008,.012,"#8d8373","metal",10);
 g.tube([-.25,3.20,-1.62],[-.32,3.46,-1.62],.014,"#3e4140","cable");
 // Every tabletop accessory has real thickness, handle, paper and detail.
 // Ringed mug with a visible interior and hooked handle.
 g.reelY(rx-.48,1.13,rz-.31,.088,.063,.18,"#d3bea0","paper",18);
 g.reelY(rx-.48,1.237,rz-.31,.092,.068,.019,"#6a5747","metal",18);
 g.tube([rx-.40,1.11,rz-.31],[rx-.35,1.16,rz-.31],.015,"#ddd1b8","paper");
 g.tube([rx-.40,1.16,rz-.31],[rx-.40,1.21,rz-.31],.015,"#ddd1b8","paper");
 g.bevelBox(rx+.15,1.000,rz-.41,.31,.015,.19,.002,"#dbc5a6","paper");
 for(let i=0;i<4;i++)g.box(rx+.09,1.011,rz-.49+i*.041,.19,.006,.011,"#635748","paper");
 g.box(rx+.15,1.02,rz-.41,.18,.010,.013,"#5d5551");
 for(let i=0;i<4;i++){
  const x=3.17+i%2*.18,z=-2.96+Math.floor(i/2)*.16;
  g.bevelBox(x,1.0,z,.16,.015,.12,.002,"#c6b698","paper");
  g.box(x,1.014,z,.096,.009,.071,i%2?"#435252":"#6a6159");
 }
 // Torn witness reports, visually low but clearly resting on the floor.
 for(let i=0;i<12;i++){
  const x=-.6+.33*(i%4),z=-4.5+.21*Math.floor(i/4);
  g.tiltedBox(x,.032,z,.22+.04*(i%2),.015,.12,(i%3-1)*.10,"#8e8470","paper");
  g.box(x+.02,.041,z,.15,.006,.011,"#373c3a");
 }
 // Bolts and worn enamel border on the lock station.
 for(const x of [-1.55,1.55]){
  g.box(x,.985,-2.62,.035,.022,1.56,"#cab18a");
  for(const z of [-3.22,-2.14])g.box(x,.99,z,.063,.018,.064,"#756753");
 }
 // Patchy repairs and conduit on side walls.
 for(let j=0;j<7;j++){
  const z=-4.45+j*1.29,y=1.18+j%3*.59;
  g.box(-4.79,y,z,.028,.20,.69,j%2?"#4a4644":"#414247");
  g.box(4.79,y+.24,z,.025,.26,.55,j%2?"#524942":"#41444a");
 }
 g.tube([3.85,3.65,-5.53],[3.88,2.8,-5.55],.032,"#262b2c");
 g.tube([3.88,2.8,-5.55],[4.70,2.39,-4.20],.025,"#242829");
 // Hanging coat almost melts into darkness: the eye reads it as a person.
 g.box(-4.28,2.65,-1.0,.39,.082,.095,"#796b5d");
 g.tube([-4.28,2.64,-1.02],[-4.28,2.42,-1.02],.022,"#958270");
 g.ellipsoid(-4.28,1.87,-.92,.35,.66,.13,"#212629","scene");
 // 12 metal scraps on floor: atmospheric, not all puzzle relevant.
 for(let i=0;i<15;i++){
  const x=Math.sin(i*7.13)*4.07,z=Math.cos(i*5.17)*4.15-.35;
  if(x>-1.8&&x<1.8&&z>-3.5&&z<-.9)continue;
  g.box(x,.023,z,.17+(i%3)*.11,.01,.06,"#766d60");
 }
 return g;
}
export type Pose={x:number;y:number;z:number;yaw:number;pitch:number};
export type World={
 move:(f:number,s:number,dt:number)=>void;
 look:(dx:number,dy:number)=>void;
 pick:(x:number,y:number,w:number,h:number)=>Target|null;
 lookAt:(target:Target)=>void;
 project:(position:V)=>{x:number;y:number;visible:boolean;distance:number};
 aim:()=>Target|null;
 nearby:()=>Target[];
 getPose:()=>Pose;
 setFlags:(v:SceneFlags)=>void;
 setFlashlight:(on:boolean)=>void;
 dispose:()=>void;
};

/** The visual model data is authored once above, keeping all story and
 * collision coordinates stable while the complete renderer is Three.js. */
const shadowCasterIds=new Set(["door","door-metal","wood","metal","book","drawer","recorder","envelope","paper","clock-hour","clock-minute","scene"]);
function makePBR(kind:string):THREE.Material{
 if(kind==="emissive")return new THREE.MeshBasicMaterial({vertexColors:true,color:0xffd1a7,side:THREE.DoubleSide});
 const metal=kind==="metal"||kind==="door-metal";
 const wood=kind==="wood"||kind==="door"||kind==="drawer";
 const paper=kind==="paper"||kind==="book"||kind==="envelope";
 return new THREE.MeshStandardMaterial({
  vertexColors:true,
  side:THREE.DoubleSide,
  metalness:metal?.68:kind==="cable"?.14:0,
  roughness:wood?.79:metal?.46:paper?.93:kind==="concrete"?.99:.86,
  envMapIntensity:.5
 });
}
const clamp=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
const linear=(x:number)=>x<.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
const extents:Record<ClueId,[number,number]>={
 calendar:[1.65,1.94],cassette:[1.1,.62],memo:[1.1,.89],board:[2.65,1.9],
 clock:[1.54,1.55],drawer:[1.6,.95],envelope:[.43,.32],
 phone:[.85,.58],camera:[.62,.4],locker:[1.7,3.05],lamp:[.72,.66],pipe:[1.18,1.45]
};
export function createWorld(canvas:HTMLCanvasElement,flags:SceneFlags,onFrame?:(p:Pose,aim:Target|null)=>void):World{
 // r180+ is WebGL2-only. Avoid claiming WebGL1 support after this migration.
 const gl=canvas.getContext("webgl2",{alpha:false,antialias:false,depth:true,powerPreference:"high-performance"});
 if(!gl)throw Error("CASO M 2.0 necesita WebGL2. Actualizá Chrome o activá la aceleración gráfica.");
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:false,antialias:false,powerPreference:"high-performance"});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.24;
 renderer.setClearColor(0x080b10,1);
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const room=new THREE.Scene();
 room.background=new THREE.Color(0x091018);
 room.fog=new THREE.FogExp2(0x0b1119,.023);
 const camera=new THREE.PerspectiveCamera(68.86,1,.075,75);
 camera.rotation.order="YXZ";
 const cameraPose:Pose={x:0,y:1.67,z:3.6,yaw:0,pitch:0};
 const cameraLight=new THREE.SpotLight(0xffebc5,16,10,Math.PI*.19,.68,1.7);
 cameraLight.position.set(0,-.02,0);
 cameraLight.target.position.set(0,0,-5);
 cameraLight.castShadow=false;cameraLight.visible=false;
 camera.add(cameraLight,cameraLight.target);
 room.add(camera);
 room.add(new THREE.HemisphereLight(0x9bb1c6,0x19130f,1.05));
 const ambient=new THREE.AmbientLight(0x9caabd,.34);room.add(ambient);
 const overhead=new THREE.PointLight(0xffcfaa,29,12,2);
 overhead.position.set(0,3.07,-1.65);overhead.castShadow=false;
 room.add(overhead);
 // Directional shadows require a single pass, avoiding the six-face
 // shadow cubemap required by a shadow-casting point light.
 const shadowSource=new THREE.DirectionalLight(0xffddb6,3.2);
 shadowSource.position.set(-1.5,4.8,-1.3);shadowSource.target.position.set(0,0,-.5);
 shadowSource.castShadow=true;shadowSource.shadow.mapSize.set(512,512);
 shadowSource.shadow.bias=-.0004;shadowSource.shadow.normalBias=.047;
 shadowSource.shadow.camera.left=-6;shadowSource.shadow.camera.right=6;
 shadowSource.shadow.camera.top=6;shadowSource.shadow.camera.bottom=-6;
 shadowSource.shadow.camera.near=.2;shadowSource.shadow.camera.far=15;
 room.add(shadowSource,shadowSource.target);
 const emergency=new THREE.PointLight(0xee3530,12,12,2);
 emergency.position.set(1.7,2.55,4.9);room.add(emergency);
 const farFill=new THREE.PointLight(0x6c96bd,7,13,2);
 farFill.position.set(-3.8,2.7,-4.35);room.add(farFill);
 const focusLight=new THREE.PointLight(0xffd49a,.9,2.6,2);
 focusLight.visible=false;room.add(focusLight);
 const objects=new Map<string,THREE.Mesh>();
 let current={...flags},flashlight=false;
 let active=true,raf=0,lastDraw=0,lastHud=0,renderScale=1,slowFrames=0,fastFrames=0;
 let drawerOpenedAt=flags.unlocked?performance.now()-1200:0;
 let clockStarted=flags.clockActivated?performance.now()-3100:0;
 let intruderStarted=flags.intruder?performance.now()-1500:0;
 let actor:THREE.Group|null=null,mixer:THREE.AnimationMixer|null=null;
 let walkAction:THREE.AnimationAction|null=null,idleAction:THREE.AnimationAction|null=null;
 let headBone:THREE.Bone|null=null;const shoulders:THREE.Bone[]=[];
 let lastAnimate=performance.now(),rigLoaded=false;
 const ambientContacts:THREE.Mesh[]=[];
 const contactMaterial=new THREE.MeshBasicMaterial({color:0x090b0e,transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide});
 function addContact(x:number,z:number,rx:number,rz:number){
  const geometry=new THREE.CircleGeometry(1,24);
  geometry.rotateX(-Math.PI/2);geometry.scale(rx,rz,1);
  const shadow=new THREE.Mesh(geometry,contactMaterial);
  shadow.position.set(x,.014,z);shadow.rotation.y=.14;
  room.add(shadow);ambientContacts.push(shadow);
 }
 addContact(ROOM_LAYOUT.recorder.x,ROOM_LAYOUT.recorder.z,1.05,.91);
 addContact(ROOM_LAYOUT.surveillance.x,ROOM_LAYOUT.surveillance.z,1.05,.91);
 addContact(ROOM_LAYOUT.lock.x,ROOM_LAYOUT.lock.z,1.63,1.00);
 addContact(ROOM_LAYOUT.locker.x,ROOM_LAYOUT.locker.z,.87,.62);
 addContact(ROOM_LAYOUT.trunk.x,ROOM_LAYOUT.trunk.z,.76,.55);
 function makeGeometry(data:number[]):THREE.BufferGeometry{
  const count=Math.floor(data.length/9);
  const p=new Float32Array(count*3),n=new Float32Array(count*3),c=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   const source=i*9,target=i*3;
   for(let j=0;j<3;j++){
    p[target+j]=data[source+j];n[target+j]=data[source+3+j];
    c[target+j]=linear(data[source+6+j]);
   }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.BufferAttribute(p,3));
  geometry.setAttribute("normal",new THREE.BufferAttribute(n,3));
  geometry.setAttribute("color",new THREE.BufferAttribute(c,3));
  geometry.computeBoundingSphere();
  return geometry;
 }
 const materials=new Map<string,THREE.Material>();
 function removeMeshes(){
  objects.forEach(mesh=>{room.remove(mesh);mesh.geometry.dispose();});
  objects.clear();
 }
 function build(opened:boolean){
  removeMeshes();
  for(const [id,data] of scene(opened).groups){
   const geometry=makeGeometry(data);
   if(id==="door"||id==="door-metal")geometry.translate(-1.07,0,-5.04);
   if(id==="clock-hour"||id==="clock-minute")geometry.translate(-3.73,-2.14,0);
   let material=materials.get(id);
   if(!material){material=makePBR(id);materials.set(id,material);}
   const mesh=new THREE.Mesh(geometry,material);
   mesh.name=id;mesh.frustumCulled=false;
   mesh.castShadow=shadowCasterIds.has(id)&&id!=="scene";
   mesh.receiveShadow=id!=="emissive";
   if(id==="door"||id==="door-metal")mesh.position.set(1.07,0,5.04);
   if(id==="clock-hour"||id==="clock-minute")mesh.position.set(3.73,2.14,0);
   if(["figure","figure-leg","knife-blade","knife-shadow"].includes(id))mesh.visible=false;
   objects.set(id,mesh);room.add(mesh);
  }
 }
 build(current.unlocked);
 // The existing, detailed humanoid GLB is loaded by Three's GPU skinned
 // renderer. No manual CPU-bone palette or second WebGL context is needed.
 const loader=new GLTFLoader();
 void loader.loadAsync("./models/stalker-skeletal.glb").then(gltf=>{
  if(!active){gltf.scene.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();}});return;}
  const figure=gltf.scene;
  figure.updateMatrixWorld(true);
  const bbox=new THREE.Box3().setFromObject(figure),min=bbox.min,max=bbox.max;
  const height=Math.max(.1,max.y-min.y),scale=Math.min(2.2,2.85/height);
  const cx=(min.x+max.x)/2,cz=(min.z+max.z)/2;
  figure.scale.setScalar(scale);
  figure.rotation.y=Math.PI;
  figure.position.set(.32+cx*scale,-min.y*scale,6.28+cz*scale);
  figure.traverse(node=>{
   if(node instanceof THREE.Mesh){
    node.castShadow=true;node.receiveShadow=true;node.frustumCulled=false;
    const src=Array.isArray(node.material)?node.material:[node.material];
    const upgraded=src.map(m=>{
     const cloned=m.clone();
     if(cloned instanceof THREE.MeshStandardMaterial){
      cloned.roughness=Math.max(.64,cloned.roughness);
      cloned.metalness=Math.min(.12,cloned.metalness);
      if(/cloth|shirt|jacket|pants|trouser|hood|fabric/i.test(m.name+" "+node.name)){
       cloned.color.multiplyScalar(.36);
      }
      cloned.side=THREE.DoubleSide;
     }
     return cloned;
    });
    node.material=Array.isArray(node.material)?upgraded:upgraded[0];
   }
   if(node instanceof THREE.Bone){
    if(!headBone&&/(^|[._:| ])head($|[._:| ])/i.test(node.name))headBone=node;
    if(/spine|chest|clavicle|shoulder/i.test(node.name))shoulders.push(node);
   }
  });
  // Lightweight sculpted porcelain face and worn fabric hood, parented
  // to the actual head bone. Eyes use deep slots rather than a cartoon disc.
  if(headBone){
   const mask=new THREE.Mesh(new THREE.SphereGeometry(1,22,16),
      new THREE.MeshStandardMaterial({color:0x9c9180,roughness:.86,metalness:.0,side:THREE.DoubleSide}));
   mask.scale.set(.118,.178,.045);mask.position.set(0,.077,.15);
   mask.castShadow=true;headBone.add(mask);
   const hood=new THREE.Mesh(new THREE.TorusGeometry(.170,.034,8,28),
      new THREE.MeshStandardMaterial({color:0x131c1d,roughness:1,side:THREE.DoubleSide}));
   hood.position.set(0,.070,.097);hood.scale.set(.91,1.23,.67);
   headBone.add(hood);
   for(const side of [-1,1]){
    const slit=new THREE.Mesh(new THREE.BoxGeometry(.054,.016,.012),
      new THREE.MeshBasicMaterial({color:0x07090d}));
    slit.position.set(side*.051,.119,.194);slit.rotation.z=side*.12;
    headBone.add(slit);
   }
  }
  // Carry the threatening blade on the animated right hand.
  const rightHand=figure.getObjectByName("RightHand")??figure.getObjectByName("hand_r")??figure.getObjectByName("Hand.R");
  if(rightHand){
   const steel=new THREE.Mesh(new THREE.BoxGeometry(.105,.56,.019),
      new THREE.MeshStandardMaterial({color:0x8b908b,metalness:.92,roughness:.31}));
   steel.position.set(.012,-.37,.085);steel.rotation.z=.05;
   steel.castShadow=true;rightHand.add(steel);
   const grip=new THREE.Mesh(new THREE.CylinderGeometry(.026,.03,.18,8),
      new THREE.MeshStandardMaterial({color:0x271e1a,roughness:.96}));
   grip.position.set(0,-.03,.085);rightHand.add(grip);
  }
  const figureHolder=new THREE.Group();figureHolder.name="skeletal-antagonist";
  figureHolder.add(figure);room.add(figureHolder);
  actor=figureHolder;
  const skinCount=figure.getObjectsByProperty("type","SkinnedMesh").length;
  const bones=figure.getObjectsByProperty("type","Bone").length;
  rigLoaded=skinCount>0&&bones>20;
  canvas.dataset.intruderModel=rigLoaded?"skinned-glb":"fallback";
  canvas.dataset.intruderBones=String(bones);
  canvas.dataset.intruderFinish=rigLoaded?"skeletal-human":"glb-no-skin";
  canvas.dataset.intruderAppearance="worn-coat-porcelain-mask";
  mixer=new THREE.AnimationMixer(figure);
  const walk=gltf.animations.find(c=>/walk/i.test(c.name))??gltf.animations[0];
  const idle=gltf.animations.find(c=>/idle/i.test(c.name));
  if(walk){walkAction=mixer.clipAction(walk);walkAction.play();walkAction.timeScale=.72;}
  if(idle){idleAction=mixer.clipAction(idle);idleAction.play();idleAction.enabled=false;}
 }).catch(err=>{
  console.warn("CASO M: glTF humano inaccesible, respaldo 3D activado",err);
  canvas.dataset.intruderModel="fallback";
  canvas.dataset.intruderBones="0";
  canvas.dataset.intruderFinish="fallback";
 });
 function basis(){
  const cp=Math.cos(cameraPose.pitch);
  const forward:V=[-Math.sin(cameraPose.yaw)*cp,Math.sin(cameraPose.pitch),-Math.cos(cameraPose.yaw)*cp];
  const right:V=[Math.cos(cameraPose.yaw),0,-Math.sin(cameraPose.yaw)];
  const up:V=[-right[2]*Math.sin(cameraPose.pitch),cp,right[0]*Math.sin(cameraPose.pitch)];
  return {forward,right,up};
 }
 function targets(){return TARGETS.filter(t=>current.unlocked||t.id!=="envelope");}
 function nearby(){
  return targets().filter(t=>Math.hypot(t.pos[0]-cameraPose.x,t.pos[2]-cameraPose.z)<4.6)
   .sort((a,b)=>Math.hypot(a.pos[0]-cameraPose.x,a.pos[2]-cameraPose.z)-Math.hypot(b.pos[0]-cameraPose.x,b.pos[2]-cameraPose.z));
 }
 function project(position:V){
  const width=canvas.clientWidth,height=canvas.clientHeight;
  camera.position.set(cameraPose.x,cameraPose.y,cameraPose.z);
  camera.rotation.set(cameraPose.pitch,cameraPose.yaw,0,"YXZ");
  camera.updateMatrixWorld();
  const v=new THREE.Vector3(...position);
  const dist=v.distanceTo(camera.position);
  v.project(camera);
  const x=(v.x+1)*width*.5,y=(1-v.y)*height*.5;
  return {x,y,visible:v.z>=-1&&v.z<1&&x>60&&x<width-60&&y>170&&y<height-150,distance:dist};
 }
 function aim(){
  const {forward}=basis();let best:Target|null=null,score=1e6;
  for(const target of targets()){
   const v:V=[target.pos[0]-cameraPose.x,target.pos[1]-cameraPose.y,target.pos[2]-cameraPose.z];
   const dist=Math.hypot(...v),front=v[0]*forward[0]+v[1]*forward[1]+v[2]*forward[2];
   if(front<.25||dist>target.reach)continue;
   const miss=Math.sqrt(Math.max(0,dist*dist-front*front));
   if(miss>.64||miss+dist*.07>score)continue;
   score=miss+dist*.07;best=target;
  }
  return best;
 }
 function pick(x:number,y:number,w:number,h:number):Target|null{
  if(w<=0||h<=0||x<0||y<0||x>w||y>h)return null;
  const {forward,right,up}=basis(),ratio=w/h;
  let selected:Target|null=null,rank=Infinity;
  for(const target of targets()){
   const v:V=[target.pos[0]-cameraPose.x,target.pos[1]-cameraPose.y,target.pos[2]-cameraPose.z];
   const depth=v[0]*forward[0]+v[1]*forward[1]+v[2]*forward[2];
   if(depth<=.2)continue;
   const px=w/2+(v[0]*right[0]+v[1]*right[1]+v[2]*right[2])*1.46/(ratio*depth)*w/2;
   const py=h/2-(v[0]*up[0]+v[1]*up[1]+v[2]*up[2])*1.46/depth*h/2;
   const [width,height]=extents[target.id];
   const halfW=Math.max(26,width*1.46/depth*h/4+10);
   const halfH=Math.max(26,height*1.46/depth*h/4+10);
   const dx=(x-px)/halfW,dy=(y-py)/halfH;
   if(Math.abs(dx)>1||Math.abs(dy)>1)continue;
   const score=depth+Math.hypot(dx,dy)*1.9;
   if(score<rank){rank=score;selected=target;}
  }
  return selected;
 }
 const obstacles=[
  {x:ROOM_LAYOUT.lock.x,z:ROOM_LAYOUT.lock.z,w:3.28,d:1.92},
  {x:ROOM_LAYOUT.locker.x,z:ROOM_LAYOUT.locker.z,w:ROOM_LAYOUT.locker.w+.22,d:ROOM_LAYOUT.locker.d+.23},
  {x:ROOM_LAYOUT.recorder.x,z:ROOM_LAYOUT.recorder.z,w:ROOM_LAYOUT.recorder.w+.04,d:ROOM_LAYOUT.recorder.d+.05},
  {x:ROOM_LAYOUT.surveillance.x,z:ROOM_LAYOUT.surveillance.z,w:ROOM_LAYOUT.surveillance.w+.04,d:ROOM_LAYOUT.surveillance.d+.05},
  {x:ROOM_LAYOUT.trunk.x,z:ROOM_LAYOUT.trunk.z,w:ROOM_LAYOUT.trunk.w,d:ROOM_LAYOUT.trunk.d}
 ];
 function collides(x:number,z:number){
  if(x< -4.48||x>4.48||z< -5.17||z>4.79)return true;
  return obstacles.some(o=>Math.abs(o.x-x)<o.w/2+.23&&Math.abs(o.z-z)<o.d/2+.23);
 }
 function frame(now:number){
  if(!active)return;raf=requestAnimationFrame(frame);
  const delta=now-lastDraw;
  if(delta<32)return;
  lastDraw=now;
  if(delta>51){slowFrames++;fastFrames=0;}else if(delta<39){fastFrames++;slowFrames=Math.max(0,slowFrames-2);}
  if(slowFrames>22&&renderScale>.8){renderScale=.76;slowFrames=0;}
  if(fastFrames>170&&renderScale<1){renderScale=1;fastFrames=0;}
  const pixelRatio=Math.min(window.devicePixelRatio||1,1.45)*renderScale;
  const width=Math.max(2,canvas.clientWidth),height=Math.max(2,canvas.clientHeight);
  const targetWidth=Math.floor(width*pixelRatio),targetHeight=Math.floor(height*pixelRatio);
  if(canvas.width!==targetWidth||canvas.height!==targetHeight){
   renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height,false);
   camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  camera.position.set(cameraPose.x,cameraPose.y,cameraPose.z);
  camera.rotation.set(cameraPose.pitch,cameraPose.yaw,0,"YXZ");
  const elapsed=current.intruder?Math.max(0,60-(current.remaining??60)):0;
  const progress=intruderStarted?clamp((now-intruderStarted)/4000,0,1):0;
  const smooth=progress*progress*(3-2*progress);
  for(const name of ["door","door-metal"]){const m=objects.get(name);if(m)m.rotation.y=-1.15*smooth;}
  const drawerT=current.unlocked?clamp((now-drawerOpenedAt)/900,0,1):0;
  const easedDrawer=drawerT*drawerT*(3-2*drawerT);
  for(const name of ["drawer","envelope"]){const m=objects.get(name);if(m)m.position.z=-.52*(1-easedDrawer);}
  canvas.dataset.drawerMotion=current.unlocked?(drawerT>=1?"open":"sliding"):"locked";
  const clockT=clockStarted?clamp((now-clockStarted)/3000,0,1):0;
  const clockEase=clockT*clockT*(3-2*clockT);
  const hour=objects.get("clock-hour"),minute=objects.get("clock-minute");
  if(hour)hour.rotation.z=-clockEase*(Math.PI*6+Math.PI*5/6);
  if(minute)minute.rotation.z=-clockEase*Math.PI*8;
  const walk=Math.max(0,elapsed-9);
  const paused=(walk>=8.5&&walk<10.3)||(walk>=23.5&&walk<24.8)||(walk>=37.5&&walk<39.1);
  const stalk=Math.max(0,walk-Math.min(1.8,Math.max(0,walk-8.5))
                         -Math.min(1.3,Math.max(0,walk-23.5))
                         -Math.min(1.6,Math.max(0,walk-37.5)));
  const advance=stalk<=10?stalk*.038:stalk<=24?.38+(stalk-10)*.057:stalk<=37?1.178+(stalk-24)*.087:2.309+(stalk-37)*.09;
  const safeAdvance=Math.max(0,6.28-(cameraPose.z+.95));
  const approach=current.intruder?Math.min(2.85,safeAdvance,advance):0;
  const seen=current.intruder&&elapsed>=9;
  canvas.dataset.intruderApproach=approach.toFixed(2);
  canvas.dataset.intruderFinish=rigLoaded?"skeletal-human":actor?"glb-no-skin":"fallback";
  canvas.dataset.intruderAppearance=rigLoaded?"worn-coat-porcelain-mask":"fallback";
  canvas.dataset.intruderMood=paused?"watching":elapsed>11?"stalking":"waiting";
  canvas.dataset.intruderVisible=seen?"yes":"no";
  canvas.dataset.roomProps="complete-hd-props-v3";
  canvas.dataset.renderVersion="threejs-pbr-migration-v1";
  canvas.dataset.renderEngine="threejs";
  canvas.dataset.flashlight=flashlight?"on":"off";
  canvas.dataset.renderQuality=renderScale<1?"battery-friendly":"high";
  cameraLight.visible=flashlight;
  emergency.intensity=(current.intruder?10+6*Math.sin(now*.007):12);
  overhead.intensity=(30+Math.sin(now*.011)*.6);
  if(actor){
   actor.visible=seen;
   actor.position.z=-approach;
   actor.position.x=(cameraPose.x-.32)*.19+.028*Math.sin(walk*2.5);
   if(mixer&&seen){
    const dt=clamp((now-lastAnimate)/1000,0,.08);
    if(walkAction)walkAction.paused=paused||approach>=2.82;
    if(idleAction&&walkAction){idleAction.enabled=paused;idleAction.paused=!paused;}
    mixer.update(dt);
    if(headBone)headBone.rotation.z+=.013*Math.sin(now*.0014);
   }
  }
  lastAnimate=now;
  for(const name of ["figure","figure-leg","knife-blade","knife-shadow"]){
   const model=objects.get(name);
   if(model){
    model.visible=!rigLoaded&&seen;
    model.position.z=-approach;
    model.position.x=(cameraPose.x-.32)*.19;
   }
  }
  renderer.render(room,camera);
  if(now-lastHud>125){
   lastHud=now;const aimed=aim();
   focusLight.visible=!!aimed;const fp=aimed?.pos??[0,-10,0];focusLight.position.set(fp[0],fp[1],fp[2]);
   canvas.dataset.focusedObject=aimed?.id??"none";
   onFrame?.({...cameraPose},aimed);
  }
 }
 raf=requestAnimationFrame(frame);
 return{
  move:(f:number,s:number,dt:number)=>{
   if(Math.abs(f)+Math.abs(s)<.02)return;
   const {forward,right}=basis(),length=Math.max(1,Math.hypot(f,s)),step=2.75*Math.min(dt,.22);
   const count=Math.max(1,Math.ceil(step/.07));
   const dx=(f*forward[0]+s*right[0])/length*step/count;
   const dz=(f*forward[2]+s*right[2])/length*step/count;
   for(let i=0;i<count;i++){
    if(!collides(cameraPose.x+dx,cameraPose.z))cameraPose.x+=dx;
    if(!collides(cameraPose.x,cameraPose.z+dz))cameraPose.z+=dz;
   }
  },
  look:(dx:number,dy:number)=>{
   cameraPose.yaw=(cameraPose.yaw-dx*.0048+Math.PI*4)%(Math.PI*2);
   cameraPose.pitch=clamp(cameraPose.pitch-dy*.0038,-1.05,1.05);
  },
  lookAt:(target:Target)=>{
   const dx=target.pos[0]-cameraPose.x,dy=target.pos[1]-cameraPose.y,dz=target.pos[2]-cameraPose.z;
   cameraPose.yaw=Math.atan2(-dx,-dz);
   cameraPose.pitch=Math.atan2(dy,Math.hypot(dx,dz));
  },
  project,pick,aim,nearby,getPose:()=>({...cameraPose}),
  setFlashlight:(on:boolean)=>{flashlight=on;cameraLight.visible=on;canvas.dataset.flashlight=on?"on":"off";},
  setFlags:(next:SceneFlags)=>{
   if(next.clockActivated&&!current.clockActivated)clockStarted=performance.now();
   if(next.intruder&&!current.intruder)intruderStarted=performance.now();
   if(next.unlocked!==current.unlocked){if(next.unlocked)drawerOpenedAt=performance.now();build(next.unlocked);}
   current={...next};
  },
  dispose:()=>{
   active=false;cancelAnimationFrame(raf);
   removeMeshes();materials.forEach(m=>m.dispose());
   ambientContacts.forEach(m=>m.geometry.dispose());
   contactMaterial.dispose();
   actor?.traverse(n=>{
    if(n instanceof THREE.Mesh){
     n.geometry.dispose();
     const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(m=>m.dispose());
    }
   });
   renderer.dispose();
  }
 };
}
