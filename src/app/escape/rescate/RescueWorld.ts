/**
 * RESCATE MAURO — standalone, genuine WebGL room.
 * Original mesh-based 3D geometry (not a moving photograph).
 * Supports WebGL1 mobiles without any third-party runtime or CDN.
 */
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
 chair:{x:3.79,z:1.10,w:1.0,d:.84},
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
 g.box(0,-.19,-.5,10,.38,11.6,FLOOR);
 g.box(0,4.2,-.5,10,.27,11.6,"#34353b");
 g.box(0,2,-5.85,10,4.1,.35,WALL);
 g.box(-5,2,-.5,.34,4.1,11.6,"#31383d");
 g.box(5,2,-.5,.34,4.1,11.6,"#3d3d41");
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
  g.box(x,.826,z,1.52,.17,1.29,"#454c51");
  g.box(x,.933,z,1.56,.046,1.32,"#8b6b4c");
  for(const dx of [-.62,.62])for(const dz of [-.48,.48]){
   g.box(x+dx,.421,z+dz,.12,.84,.12,"#52585a");
   g.box(x+dx,.04,z+dz,.17,.075,.17,"#2b3132");
  }
  g.box(x,.035,z,1.66,.018,1.43,"#151819");
  g.box(x,.49,z-.57,1.28,.07,.055,"#535554");
 }
 // Heavy six-wheel combination-lock cabinet: readable goal from spawn.
 g.box(0,.83,-2.65,3.24,.22,1.76,"#3e4449");
 g.box(0,.957,-2.65,3.30,.061,1.82,"#a17c57");
 for(const x of [-1.43,1.43])for(const z of [-3.31,-2.04]){
  g.box(x,.40,z,.16,.79,.16,"#65676a");
  g.box(x,.038,z,.20,.074,.20,"#33373b");
 }
 g.box(0,.02,-2.62,3.2,.02,1.82,"#16191b");
 g.box(0,.53,-2.61,2.88,.49,1.36,"#30373e");
 g.box(0,.67,-1.75,2.55,.42,.13,"#8a6d52");
 g.box(0,.79,-1.66,2.34,.30,.07,"#202b33");
 g.box(0,.79,-1.612,2.27,.25,.029,"#a69b86");
 g.box(0,1.012,-1.97,1.26,.080,.063,"#d4b787");
 for(const x of [-1.22,1.22])for(const y of [.56,.83])g.tube([x,y,-1.58],[x,y,-1.53],.051,"#dabd8e");
 if(opened){
  g.box(0,.66,-1.22,1.58,.066,1.12,"#bba078","drawer");
  for(const x of [-.76,.76])g.box(x,.73,-1.22,.075,.19,1.09,"#846850","drawer");
  g.box(0,.73,-.67,1.65,.20,.10,"#866448","drawer");
  g.box(0,.706,-1.48,.43,.021,.27,"#e5d4b1","envelope");
  g.box(0,.72,-1.445,.10,.022,.10,"#983f32","envelope");
 }else{
  g.box(0,.75,-1.55,.34,.22,.12,"#b5a885");
  g.box(0,.75,-1.49,.14,.12,.05,"#222a30");
  for(let i=0;i<6;i++){
   const x=-.82+i*.326;
   g.box(x,.79,-1.56,.282,.246,.068,"#354047");
   g.tube([x,.79,-1.529],[x,.79,-1.44],.11,"#c4b7a0");
   g.box(x,.79,-1.422,.11,.09,.026,"#39474c");
   g.box(x,.876,-1.410,.065,.027,.023,"#f2d8ab");
  }
 }
 // Tape recorder is now in its own front-left zone, not pressed against
 // the central lock or the rusted locker. All reels are on the relocated desk.
 const rx=ROOM_LAYOUT.recorder.x,rz=ROOM_LAYOUT.recorder.z;
 g.box(rx-.01,1.067,rz+.08,1.08,.22,.62,"#333f43");
 g.box(rx-.01,1.195,rz+.20,.89,.023,.40,"#c8b898");
 g.box(rx-.01,1.222,rz+.20,.70,.025,.27,"#30383b");
 for(const x of [rx-.21,rx+.19]){
  g.tube([x,1.249,rz+.19],[x,1.265,rz+.19],.095,"#d9cbb0");
  g.tube([x,1.270,rz+.19],[x,1.280,rz+.19],.04,"#393d40");
 }
 g.box(rx-.35,1.092,rz+.43,.090,.081,.07,"#bd544a","emissive");
 // Surveillance monitor occupies right-side workspace; its screen is readable.
 g.box(3.68,1.42,-3.54,1.07,.87,.18,"#1c2429");
 g.box(3.68,1.43,-3.433,.88,.65,.030,"#46616c","memo");
 g.box(3.68,1.688,-3.414,.85,.105,.020,"#20333c");
 for(let i=0;i<5;i++)g.box(3.36+i*.16,1.685,-3.401,.085,.024,.016,"#beb19a");
 g.box(3.56,1.30,-3.400,.22,.17,.022,"#809598");
 g.box(3.83,1.39,-3.400,.26,.19,.022,"#2a414d");
 g.box(3.68,.974,-3.53,.12,.11,.13,"#777b79");
 g.box(3.68,.947,-3.53,.41,.037,.33,"#6f7978");
 // Telephone lies beneath surveillance monitor, slightly toward player.
 g.box(3.67,1.028,-2.82,.51,.14,.31,"#303b40");
 g.tube([3.47,1.148,-2.84],[3.87,1.148,-2.84],.076,"#92938b");
 g.tube([3.92,1.04,-2.85],[4.07,.95,-2.87],.025,"#b1a28e");
 // A deliberately overturned office chair in the right-rear corner,
 // no giant panel blocking the player's line of sight to the lock.
 for(const x of [3.47,4.11])for(const z of [.75,1.43])g.box(x,.34,z,.075,.68,.095,"#353d3e");
 g.box(3.79,.70,1.10,.81,.13,.74,"#4a4c4d");
 g.box(4.12,1.13,1.31,.13,.82,.72,"#403b36");
 for(const y of [.89,1.12,1.34])g.box(4.07,y,1.33,.060,.046,.58,"#756253");
 // Shelved files occupy the far-left utility alcove, away from the lock.
 for(const y of [.58,1.23,1.90])g.box(-4.48,y,3.27,.58,.072,1.55,"#63584c");
 for(let i=0;i<12;i++){const z=2.60+i*.125;
  g.box(-4.42,1.57,z,.12,.48,.085,i%3?"#766a58":"#3d5556");
 }
 // A low evidence trunk fills the LEFT side-wall midpoint, leaving
 // an obvious walkable gap between the tape desk and the rear locker.
 const trunk=ROOM_LAYOUT.trunk;
 g.box(trunk.x,.33,trunk.z,1.08,.58,.74,"#4b4e4b");
 g.box(trunk.x,.66,trunk.z,1.12,.08,.78,"#7c715c");
 g.box(trunk.x,.41,trunk.z-.41,.29,.14,.047,"#a29073");
 for(let i=0;i<7;i++){
  const t=i/6*Math.PI*1.6;
  g.tube([trunk.x+.58+.14*Math.cos(t),.028,trunk.z+.23+.12*Math.sin(t)],
         [trunk.x+.58+.14*Math.cos(t+.31),.028,trunk.z+.23+.12*Math.sin(t+.31)],.014,"#242b2c");
 }
 // Evidence photograph on the wall. Nothing displays the solution on its front.
 // Cream paper frame, dark developed photograph, aged tape and damaged corners.
 g.box(-2.75,2.12,-5.59,1.65,1.94,.10,"#6e6254");
 g.box(-2.75,2.12,-5.49,1.54,1.82,.039,"#d9c8aa","calendar");
 g.box(-2.75,2.27,-5.449,1.36,1.32,.024,"#323b43","calendar");
 g.box(-2.74,2.16,-5.424,1.12,.93,.021,"#28343e");
 g.box(-2.74,2.48,-5.402,.74,.27,.021,"#4f5250");
 g.box(-2.65,1.97,-5.40,.40,.22,.022,"#6b5d55");
 g.box(-3.1,2.96,-5.425,.38,.14,.037,"#aa9270");
 g.box(-2.38,2.98,-5.425,.38,.14,.037,"#aa9270");
 g.box(-2.75,1.33,-5.431,.90,.035,.022,"#786856");
 // Rough tear / crack across developed picture.
 for(let i=0;i<6;i++)g.box(-3.24+i*.17,2.32+(i%2)*.04,-5.391,.22,.014,.012,"#8f8171");
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
 // A real conspiracy board: layered images, routes, schedules and red thread.
 g.box(1.51,2.15,-5.68,2.76,1.94,.15,"#5d3e33");
 g.box(1.51,2.15,-5.573,2.59,1.78,.023,"#9e8061");
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
  g.box(x,y,z,w,h,.014,shade);
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
  g.box(x-.11,y+h/2,z+.027,.22,.047,.012,"#c0ae8c"); // tape
  g.box(x,y+h/2-.033,z+.036,.036,.036,.019,i%2?"#a74a3e":"#566963"); // pin
 }
 const nodes:V[]=[[.54,2.66,-5.491],[1.12,2.74,-5.487],[2.36,2.61,-5.481],
  [1.70,2.14,-5.483],[.55,1.66,-5.482],[1.71,1.63,-5.477],[2.34,2.13,-5.478]];
 for(const [i,j] of [[0,3],[3,2],[0,4],[4,5],[1,6],[6,2],[5,3]] as const)
  g.tube(nodes[i],nodes[j],.011,"#9b312d");
 // Broad strip of security-camera timeline under the observation notes.
 for(let i=0;i<5;i++)g.box(.77+i*.36,1.42,-5.532,.30,.040,.012,i%2?"#52463b":"#8c513e");
 // Armario, fake lead, beside the wall.
 g.box(-3.75,1.51,-3.65,1.54,2.98,.90,"#414d50");
 g.box(-3.35,1.65,-3.18,.08,.41,.08,"#d1b380");
 for(const y of [.65,1.16,2.15,2.67])g.box(-3.74,y,-3.185,1.28,.035,.06,"#666f73");
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
 // Documents, coffee and evidence prints physically REST ON the new desks.
 g.tube([rx-.48,1.05,rz-.31],[rx-.48,1.25,rz-.31],.09,"#d3bea0");
 g.tube([rx-.48,1.25,rz-.31],[rx-.48,1.267,rz-.31],.082,"#554539");
 g.box(rx+.15,1.000,rz-.41,.31,.015,.19,"#dbc5a6");
 g.box(rx+.15,1.02,rz-.41,.18,.010,.013,"#5d5551");
 for(let i=0;i<4;i++){
  const x=3.17+i%2*.18,z=-2.96+Math.floor(i/2)*.16;
  g.box(x,1.0,z,.16,.015,.12,"#c6b698");
  g.box(x,1.014,z,.096,.009,.071,i%2?"#435252":"#6a6159");
 }
 // Torn witness reports, visually low but clearly resting on the floor.
 for(let i=0;i<12;i++){
  const x=-.6+.33*(i%4),z=-4.5+.21*Math.floor(i/4);
  g.box(x,.032,z,.22+.04*(i%2),.015,.12,"#8e8470");
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
const VS=`attribute vec3 p;attribute vec3 n;attribute vec3 c;
uniform mediump vec3 eye;
uniform vec3 right,up,forward;
uniform float ratio,clockAngle,doorAngle,figureStep,figureMarch,figureAim;
uniform vec2 doorPivot;
uniform float doorGroup,figureGroup,legGroup;
uniform vec2 clockPivot;
varying vec3 vPos,vNorm,vColor;varying float vDistance;
void main(){
 vec3 w=p;
 float ss=sin(clockAngle),cc=cos(clockAngle);
 w.xy=clockPivot+vec2((p.x-clockPivot.x)*cc+(p.y-clockPivot.y)*ss,-(p.x-clockPivot.x)*ss+(p.y-clockPivot.y)*cc);
 if(doorGroup>.5){
  float da=sin(doorAngle),dc=cos(doorAngle);
  w.xz=doorPivot+vec2((p.x-doorPivot.x)*dc+(p.z-doorPivot.y)*da,-(p.x-doorPivot.x)*da+(p.z-doorPivot.y)*dc);
 }
 if(figureGroup>.5){
   float walking=smoothstep(.15,.95,figureStep);
   float phase=figureMarch;
   float leg=step(.33,p.x);
   float stride=sin(phase+leg*3.14159265);
   if(legGroup>.5){
     w.z+=.20*stride*walking;
     w.y+=.056*max(0.,stride)*walking;
   }else{
     w.y+=.025*abs(sin(phase))*walking;
   }
   w.z-=figureStep;
   w.x+=figureAim*walking+.035*sin(phase*.5)*walking;
 }
 vec3 d=w-eye;
 float x=dot(d,right),y=dot(d,up),z=dot(d,forward);
 gl_Position=vec4(x*1.46/ratio,y*1.46,z*1.002-.1201,z);
 vPos=w;vNorm=n;vColor=c;vDistance=z;
}`;
const FS=`precision mediump float;
varying vec3 vPos,vNorm,vColor;varying float vDistance;
uniform float time,emission,threat,bladeFlash,characterRim;
uniform mediump vec3 eye;
void main(){
 vec3 overhead=vec3(0.0,3.05,-1.7),red=vec3(3.45,3.5,-5.1);
 float d=distance(vPos,overhead);
 vec3 toL=normalize(overhead-vPos);
 float lam=max(.0,dot(normalize(vNorm),toL));
 float lamp=(.31+lam*3.05/(1.0+d*.29+d*d*.055))*(.94+.055*sin(time*12.0)+.025*sin(time*27.0));
 float redGlow=(.48+threat*.7*(.5+.5*sin(time*7.0)))/(1.0+length(vPos-red)*.18);
 vec3 outColor=vColor*lamp + vColor*vec3(.19,.06,.05)*redGlow;
 outColor+=vColor*vec3(.02,.04,.055)*max(.0,dot(vNorm,vec3(1.,.2,0.)));
 float fog=clamp((vDistance-5.8)/15.0,0.,.69);
 outColor=mix(outColor,vec3(.028,.037,.050),fog);
 if(emission>.5)outColor+=vColor*vec3(.32,.21,.11);
 // Side/back light separates coat and face from the doorway without revealing
 // the identity of the figure.
 float rim=pow(1.0-abs(dot(normalize(vNorm),normalize(eye-vPos))),2.2);
 // Keep the intruder a shape in darkness: disclose only edges in red/amber
  // light, preventing the low-poly model from becoming a giant visible doll.
  float breathing=.72+.25*sin(time*2.0);
  outColor= mix(outColor,outColor*.22,characterRim*.88);
  outColor+=characterRim*vec3(.14,.09,.07)*(.04+rim*.70)*breathing;
 // A single brief cold highlight on the blade; nothing bright before it enters.
 outColor+=vec3(.72,.86,.96)*bladeFlash;
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
 pick:(x:number,y:number,w:number,h:number)=>Target|null;
 lookAt:(target:Target)=>void;
 project:(position:V)=>{x:number;y:number;visible:boolean;distance:number};
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
 const ue=uniform("eye"),ur=uniform("right"),uu=uniform("up"),uf=uniform("forward"),uq=uniform("ratio"),ut=uniform("time"),um=uniform("emission"),ua=uniform("clockAngle"),upiv=uniform("clockPivot"),ud=uniform("doorAngle"),udp=uniform("doorPivot"),udg=uniform("doorGroup"),ufg=uniform("figureGroup"),ulg=uniform("legGroup"),ufs=uniform("figureStep"),ufmarch=uniform("figureMarch"),ufaim=uniform("figureAim"),uth=uniform("threat"),ublade=uniform("bladeFlash"),urim=uniform("characterRim");
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
 let active=true,raf=0,lastHud=0,lastDraw=0,clockStarted=flags.clockActivated?performance.now()-3100:0,intruderStarted=flags.intruder?performance.now()-1500:0;
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
  return targets().filter(t=>Math.hypot(t.pos[0]-pose.x,t.pos[2]-pose.z)<4.6)
  .sort((a,b)=>Math.hypot(a.pos[0]-pose.x,a.pos[2]-pose.z)-Math.hypot(b.pos[0]-pose.x,b.pos[2]-pose.z));
 }
 // Screen-space hit areas match the actual model dimensions. Taps on a
 // visible object should work even before the player walks within "E" reach.
 // The old picker rejected all taps beyond target.reach, frustrating mobiles.
 function pick(x:number,y:number,w:number,h:number):Target|null{
  if(w<=0||h<=0||x<0||y<0||x>w||y>h)return null;
  const {forward,right,up}=basis(),ratio=w/h;
  const extents:Record<ClueId,[number,number]> = {
   calendar:[1.65,1.94],cassette:[1.1,.62],memo:[1.1,.89],board:[2.65,1.9],
   clock:[1.54,1.55],drawer:[1.6,.95],envelope:[.43,.32],
   phone:[.85,.58],camera:[.62,.40],locker:[1.7,3.05],
   lamp:[.72,.66],pipe:[1.18,1.45]
  };
  let selected:Target|null=null,rank=Infinity;
  for(const target of targets()){
   const v:V=[target.pos[0]-pose.x,target.pos[1]-pose.y,target.pos[2]-pose.z];
   const depth=v[0]*forward[0]+v[1]*forward[1]+v[2]*forward[2];
   if(depth<=.2)continue;
   const projectedX=w/2+(v[0]*right[0]+v[1]*right[1]+v[2]*right[2])*1.46/(ratio*depth)*w/2;
   const projectedY=h/2-(v[0]*up[0]+v[1]*up[1]+v[2]*up[2])*1.46/depth*h/2;
   const [width,height]=extents[target.id];
   // 24px minimum half-size makes narrow controls reachable with a finger.
   const halfW=Math.max(26,width*1.46/depth*h/4+10);
   const halfH=Math.max(26,height*1.46/depth*h/4+10);
   const dx=(x-projectedX)/halfW,dy=(y-projectedY)/halfH;
   if(Math.abs(dx)>1||Math.abs(dy)>1)continue;
   const score=depth+Math.hypot(dx,dy)*1.9;
   if(score<rank){rank=score;selected=target;}
  }
  return selected;
 }
 function project(position:V){
  const {forward,right,up}=basis();
  const v:V=[position[0]-pose.x,position[1]-pose.y,position[2]-pose.z];
  const depth=v[0]*forward[0]+v[1]*forward[1]+v[2]*forward[2];
  const width=canvas.clientWidth,height=canvas.clientHeight,ratio=width/Math.max(1,height);
  if(depth<=.12||!width||!height)return {x:-1000,y:-1000,visible:false,distance:depth};
  const x=width*.5+(v[0]*right[0]+v[1]*right[1]+v[2]*right[2])*1.46/(ratio*depth)*width*.5;
  const y=height*.5-(v[0]*up[0]+v[1]*up[1]+v[2]*up[2])*1.46/depth*height*.5;
  return {x,y,visible:x>60&&x<width-60&&y>170&&y<height-150,distance:depth};
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
 // Contact boundaries are generated from the very same footprints that
 // position the visual models. No invisible table remains at the old position.
 const obstacles=[
  {x:ROOM_LAYOUT.lock.x,z:ROOM_LAYOUT.lock.z,w:3.28,d:1.92},
  {x:ROOM_LAYOUT.locker.x,z:ROOM_LAYOUT.locker.z,w:ROOM_LAYOUT.locker.w+.22,d:ROOM_LAYOUT.locker.d+.23},
  {x:ROOM_LAYOUT.recorder.x,z:ROOM_LAYOUT.recorder.z,w:ROOM_LAYOUT.recorder.w+.04,d:ROOM_LAYOUT.recorder.d+.05},
  {x:ROOM_LAYOUT.surveillance.x,z:ROOM_LAYOUT.surveillance.z,w:ROOM_LAYOUT.surveillance.w+.04,d:ROOM_LAYOUT.surveillance.d+.05},
  {x:ROOM_LAYOUT.chair.x,z:ROOM_LAYOUT.chair.z,w:ROOM_LAYOUT.chair.w,d:ROOM_LAYOUT.chair.d},
  {x:ROOM_LAYOUT.trunk.x,z:ROOM_LAYOUT.trunk.z,w:ROOM_LAYOUT.trunk.w,d:ROOM_LAYOUT.trunk.d}
 ];
 function collides(x:number,z:number){
  if(x< -4.48||x>4.48||z< -5.17||z>4.79)return true;
  return obstacles.some(o=>Math.abs(o.x-x)<o.w/2+.23&&Math.abs(o.z-z)<o.d/2+.23);
 }
 function frame(now:number){
  if(!active)return;raf=requestAnimationFrame(frame);
  // Mobile-friendly frame pacing: preserve CPU time for interactive controls.
  if(now-lastDraw<32)return;lastDraw=now;
  const ratio=Math.min(window.devicePixelRatio||1,1.6),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
  if(w>0&&h>0&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const {forward,right,up}=basis();
  gl.useProgram(program);
  gl.uniform3fv(ue,[pose.x,pose.y,pose.z]);gl.uniform3fv(ur,right);gl.uniform3fv(uu,up);gl.uniform3fv(uf,forward);
  gl.uniform1f(uq,canvas.width/Math.max(canvas.height,1));gl.uniform1f(ut,now*.001);
  const elapsed=current.intruder?Math.max(0,60-(current.remaining??60)):0;
  const progress=intruderStarted?Math.min(1,(now-intruderStarted)/4000):0;
  const smooth=progress*progress*(3-2*progress);
  gl.uniform2f(udp,1.07,5.04);gl.uniform1f(ud,-1.15*smooth);
  // Cross the threshold progressively and stop safely in front of the player.
  const walk=Math.max(0,elapsed-9);
  const advance=walk<=10?walk*.038:walk<=24?.38+(walk-10)*.057:walk<=37?1.178+(walk-24)*.087:2.309+(walk-37)*.09;
  const safeAdvance=Math.max(0,6.28-(pose.z+.95));
  const approach=current.intruder?Math.min(2.85,safeAdvance,advance):0;
  gl.uniform1f(ufs,approach);
  gl.uniform1f(ufmarch,walk*4.9);
  canvas.dataset.intruderApproach=approach.toFixed(2);
  canvas.dataset.intruderVisible=current.intruder&&elapsed>=9?"yes":"no";
  gl.uniform1f(ufaim,Math.max(-.65,Math.min(.65,(pose.x-.32)*.29)));
  gl.uniform1f(uth,intruderStarted?1:0);
  gl.enableVertexAttribArray(ap);gl.enableVertexAttribArray(an);gl.enableVertexAttribArray(ac);
  for(const m of mesh){
   const figurePart=m.id==="figure"||m.id==="figure-leg"||m.id==="knife-blade";
   if(figurePart&&(!intruderStarted||elapsed<9))continue;
   if(m.id==="knife-shadow"&&(!intruderStarted||elapsed<4))continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);
   gl.vertexAttribPointer(ap,3,gl.FLOAT,false,stride*4,0);
   gl.vertexAttribPointer(an,3,gl.FLOAT,false,stride*4,12);
   gl.vertexAttribPointer(ac,3,gl.FLOAT,false,stride*4,24);
   gl.uniform1f(um,m.id==="emissive"?1:0);
   gl.uniform1f(udg,m.id==="door"?1:0);
   gl.uniform1f(ufg,m.id==="figure"||m.id==="figure-leg"||m.id==="knife-blade"?1:0);
   gl.uniform1f(ulg,m.id==="figure-leg"?1:0);
   gl.uniform1f(urim,m.id==="figure"?1:0);
   gl.uniform1f(ublade,m.id==="knife-blade"&&intruderStarted?(Math.max(0,1-Math.abs(elapsed-13)/1.15)*.70+(elapsed>46?.25:0)):0);
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
  pick,project,
  look:(dx:number,dy:number)=>{pose.yaw=(pose.yaw-dx*.0048+Math.PI*4)%(Math.PI*2);pose.pitch=Math.max(-1.05,Math.min(1.05,pose.pitch-dy*.0038));},
  lookAt:(target:Target)=>{
    const dx=target.pos[0]-pose.x,dy=target.pos[1]-pose.y,dz=target.pos[2]-pose.z;
    pose.yaw=Math.atan2(-dx,-dz);pose.pitch=Math.atan2(dy,Math.hypot(dx,dz));
  },
  aim,nearby,getPose:()=>({...pose}),
  setFlags:(next:SceneFlags)=>{if(next.clockActivated&&!current.clockActivated)clockStarted=performance.now();if(next.intruder&&!current.intruder)intruderStarted=performance.now();if(next.unlocked!==current.unlocked)rebuild(next.unlocked);current={...next}},
  dispose:()=>{active=false;cancelAnimationFrame(raf);for(const m of mesh)gl.deleteBuffer(m.buffer);gl.deleteProgram(program);gl.flush()},
 };
}
