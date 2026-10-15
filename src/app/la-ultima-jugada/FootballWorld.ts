import * as THREE from "three";
import {FOOTBALL_ASSETS,FOOTBALL_PREMIUM,loadFootballModel} from "./AssetLibrary";
import { clone as cloneRig } from "three/examples/jsm/utils/SkeletonUtils.js";
import {paintTacticalFeed,type ReplayCamera} from "./TacticSimulation";
import {FinaleDirector} from "./FinaleDirector";
import {buildStadiumSet} from "./StadiumSet";
import {createCoach,createIntruder} from "./Actors";
import {proceduralSurface} from "./MaterialLibrary";
import {CrisisDirector} from "./CrisisDirector";

export type Chapter = 0 | 1 | 2;
type FloorPbr="old_linoleum_flooring_01"|"rubber_tiles"|"concrete_tiles";
const textureLoader=new THREE.TextureLoader();
const textureCache=new Map<string,Promise<THREE.Texture>>();
function sharedTexture(path:string):Promise<THREE.Texture>{
 let t=textureCache.get(path);
 if(!t){t=textureLoader.loadAsync(path).catch(error=>{textureCache.delete(path);throw error;});textureCache.set(path,t);}
 return t;
}
export type GameAction = "monitores" | "pizarra" | "informe" | "pieza1" | "pieza2" | "pieza3" | "pieza4" | "salida1" | "casillero" | "relay" | "cctv" | "salida2" | "prueba" | "entrega";
type Handlers = { action:(id:GameAction)=>void; focus:(label:string)=>void; position?:(x:number,y:number,z:number,yaw:number)=>void; failure:()=>void };
type Target = THREE.Object3D & {userData:{action?:GameAction,label?:string}};

const palette = {
 floor:0x566477, wall:0x667687, metal:0x8798a4, blue:0x38bdf8,
 gold:0xf3c777, deep:0x0c1823, red:0xe44c4e, cream:0xeee4ce
};
const names:Record<GameAction,string>={
 monitores:"Examinar las tres cámaras",pizarra:"Reconstruir la pizarra",informe:"Ordenar los cuatro fragmentos",
 pieza1:"Recoger fragmento 1",pieza2:"Recoger fragmento 2",pieza3:"Recoger fragmento 3",pieza4:"Recoger fragmento 4",
 salida1:"Acceder al corredor",casillero:"Examinar casilleros de mantenimiento",relay:"Restaurar el enlace",cctv:"Examinar seguridad",
 salida2:"Entrar al túnel",prueba:"Verificar la jugada",entrega:"Entregar al entrenador"
};
function mat(color:number,metalness=.25,roughness=.6,emissive=0,emissiveIntensity=0) {
 return new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity});
}
function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,scene:THREE.Group) {
 const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;scene.add(a);return a;
}
function tube(r:number,h:number,x:number,y:number,z:number,m:THREE.Material,scene:THREE.Group,seg=14) {
 const a=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m);a.position.set(x,y,z);a.castShadow=true;scene.add(a);return a;
}
function plane(w:number,h:number,x:number,y:number,z:number,m:THREE.Material,scene:THREE.Group) {
 const a=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);a.position.set(x,y,z);scene.add(a);return a;
}
function makeTexture(title:string,rows:string[],tone:"#52c8f5"|"#f8c57e"|"#ed7779"="#52c8f5") {
 const c=document.createElement("canvas");c.width=1024;c.height=640;
 const g=c.getContext("2d")!;g.fillStyle="#071520";g.fillRect(0,0,1024,640);
 const grd=g.createLinearGradient(0,0,1024,640);grd.addColorStop(0,"rgba(45,122,168,.25)");grd.addColorStop(1,"rgba(4,14,25,.3)");g.fillStyle=grd;g.fillRect(0,0,1024,640);
 g.strokeStyle="#35566e";g.lineWidth=2;
 for(let i=0;i<1024;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,640);g.stroke();}
 for(let i=0;i<640;i+=64){g.beginPath();g.moveTo(0,i);g.lineTo(1024,i);g.stroke();}
 g.fillStyle=tone;g.font="bold 43px Arial";g.fillText(title,54,91);
 g.font="25px Arial";rows.forEach((r,i)=>{g.fillStyle=i%2?tone:"#dce6ef";g.fillText(r,56,184+i*72)});
 g.fillStyle="#a1c2d4";g.font="18px monospace";g.fillText("SISTEMA DE ANÁLISIS / FINAL 2030",56,596);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export class FootballWorld {
 private renderer:THREE.WebGLRenderer;
 private camera:THREE.PerspectiveCamera;
 private scene=new THREE.Scene();
 private root=new THREE.Group();
 private ray=new THREE.Raycaster();
 private targets:THREE.Object3D[]=[];
 private obstacles:Array<{minX:number;maxX:number;minZ:number;maxZ:number}>=[];
 private gameplayActive=true;
 private walkingPhase=0;
 private headSway=0;
 private active:GameAction|null=null;
 private handlers:Handlers;
 private keys=new Set<string>();
 private touchMove={x:0,z:0};
 private dragging=false;
 private pointerPositions=new Map<number,{x:number;y:number}>();
 private pinching=false;
 private pinchStartDistance=1;
 private pinchStartFov=69;
 private start={x:0,y:0};
 private previous={x:0,y:0};
 private pointerTravel=0;
 private focusElapsed=0;
 private yaw=0;private pitch=0;
 private last=0;private frame=0;
 private mobile=false;
 private fpsTime=0;private fpsFrames=0;
 private dpr=1;
 private boundResize=()=>this.resize();
 private chapter:Chapter;
 private tempVec=new THREE.Vector3();
 private disposableTextures:THREE.Texture[]=[];
 private replayDisplays:Array<{canvas:HTMLCanvasElement;texture:THREE.CanvasTexture;camera:ReplayCamera}>=[];
 private replayElapsed=0;private replayClock=0;
 private mixers:THREE.AnimationMixer[]=[];
 private destroyed=false;
 private finale:FinaleDirector|null=null;
 private crisis:CrisisDirector|null=null;
 private actors:Array<{update:(dt:number)=>void;dispose:()=>void}>=[];
 private stadiumAnimations:Array<(t:number)=>void>=[];
 private stadiumClock:((remaining:number)=>void)|null=null;
 private stadiumGoal:(()=>void)|null=null;
 private lifetime=0;
 private stadiumPlayers:Array<{actor:THREE.Object3D;index:number}>=[];
 private evidenceMeshes=new Map<GameAction,THREE.Group>();
 collectEvidence(id:GameAction){
  const model=this.evidenceMeshes.get(id);
  if(model)model.visible=false;
  const target=this.targets.find(t=>t.userData.action===id);
  if(target)target.visible=false;
 }
 private onKeyDown=(e:KeyboardEvent)=>{if(!this.gameplayActive)return;if(e.code==="KeyE"){e.preventDefault();this.interactCenter();return;}if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){this.keys.add(e.code);e.preventDefault();}};
 private onKeyUp=(e:KeyboardEvent)=>this.keys.delete(e.code);
 private onDown=(e:PointerEvent)=>{
  if(!this.gameplayActive)return;
  this.pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});
  this.renderer.domElement.setPointerCapture(e.pointerId);
  if(this.pointerPositions.size>=2){
   const [p,q]=Array.from(this.pointerPositions.values());
   this.pinching=true;this.dragging=false;
   this.pinchStartDistance=Math.max(10,Math.hypot(p.x-q.x,p.y-q.y));
   this.pinchStartFov=this.camera.fov;
   return;
  }
  this.dragging=true;
  this.start={x:e.clientX,y:e.clientY};
  this.previous={...this.start};this.pointerTravel=0;
 };
 private onMove=(e:PointerEvent)=>{
  if(!this.gameplayActive)return;
  if(this.pointerPositions.has(e.pointerId))
   this.pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(this.pinching&&this.pointerPositions.size>=2){
   const [p,q]=Array.from(this.pointerPositions.values());
   const distance=Math.max(10,Math.hypot(p.x-q.x,p.y-q.y));
   this.camera.fov=THREE.MathUtils.clamp(this.pinchStartFov*this.pinchStartDistance/distance,43,80);
   this.camera.updateProjectionMatrix();
   return;
  }
  if(!this.dragging||this.pinching)return;
  const dx=e.clientX-this.previous.x,dy=e.clientY-this.previous.y;
  this.pointerTravel+=Math.abs(dx)+Math.abs(dy);
  if(this.pointerTravel>7)this.look(dx,dy);
  this.previous={x:e.clientX,y:e.clientY};
 };
 private onUp=(e:PointerEvent)=>{
  this.pointerPositions.delete(e.pointerId);
  if(this.pinching){
   if(!this.pointerPositions.size)this.pinching=false;
   this.dragging=false;return;
  }
  if(!this.dragging||!this.gameplayActive)return;
  this.dragging=false;
  if(this.pointerTravel<12)this.tap(e.clientX,e.clientY);
 };
 private onWheel=(e:WheelEvent)=>{
  if(!this.gameplayActive)return;
  e.preventDefault();
  this.camera.fov=THREE.MathUtils.clamp(this.camera.fov+Math.sign(e.deltaY)*2.4,43,80);
  this.camera.updateProjectionMatrix();
 };
 constructor(canvas:HTMLCanvasElement, chapter:Chapter, handlers:Handlers){
  this.chapter=chapter;this.handlers=handlers;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance",alpha:false});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.6;
  this.mobile=window.innerWidth<=850;
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.dpr=Math.min(window.devicePixelRatio||1,this.mobile?1.3:1.65);
  this.renderer.setPixelRatio(this.dpr);
  this.scene.background=new THREE.Color(chapter===2?0x122533:0x0b1723);
  this.scene.fog=new THREE.FogExp2(chapter===2?0x192e40:0x131f2b,chapter===2?.009:.032);
  this.camera=new THREE.PerspectiveCamera(69,1,.08,220);
  this.camera.position.set(0,1.68,4.2);
  this.scene.add(this.root);
  const hemisphere=new THREE.HemisphereLight(0xbce4ff,0x48505e,2.25);
  const ambient=new THREE.AmbientLight(0xcce8ff,.87);
  this.scene.add(hemisphere,ambient);
  const key=new THREE.DirectionalLight(0xffe3b8,chapter===2?2.1:1.2);
  key.position.set(-3,8,-2);key.castShadow=true;key.shadow.mapSize.set(this.mobile?512:1024,this.mobile?512:1024);
  key.shadow.camera.left=-14;key.shadow.camera.right=14;key.shadow.camera.top=14;key.shadow.camera.bottom=-14;
  key.shadow.bias=-.0005;this.scene.add(key);
  this.makeRoom(chapter);
  this.renderer.domElement.dataset.gameplayActive="true";
  this.crisis=new CrisisDirector(this.root,hemisphere,ambient,key);
  this.resize();
  window.addEventListener("resize",this.boundResize);
  window.addEventListener("keydown",this.onKeyDown);
  window.addEventListener("keyup",this.onKeyUp);
  canvas.addEventListener("pointerdown",this.onDown);
  canvas.addEventListener("pointermove",this.onMove);
  canvas.addEventListener("pointerup",this.onUp);
  canvas.addEventListener("pointercancel",this.onUp);
  canvas.addEventListener("wheel",this.onWheel,{passive:false});
  this.last=performance.now();this.loop(this.last);
 }
 private glow(x:number,y:number,z:number,color:number,intensity:number,dist:number) {
  const a=new THREE.PointLight(color,intensity,dist,2);a.position.set(x,y,z);this.root.add(a);
 }
 private label(title:string,lines:string[],x:number,y:number,z:number,w:number,h:number,accent:"#52c8f5"|"#f8c57e"|"#ed7779"="#52c8f5") {
  const tex=makeTexture(title,lines,accent);this.disposableTextures.push(tex);
  const border=box(w+.11,h+.11,.13,x,y,z-.04,mat(0x070d15,.7,.35),this.root);
  border.castShadow=false;
  const p=plane(w,h,x,y,z+.03,new THREE.MeshBasicMaterial({map:tex,toneMapped:false}),this.root);return p;
 }
 private interactive(id:GameAction,x:number,y:number,z:number,w:number,h:number,depth=.36) {
  const hit=box(w,h,depth,x,y,z,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),this.root) as Target;
  hit.userData.action=id;hit.userData.label=names[id];this.targets.push(hit);
  const trim=mat(palette.gold,.75,.28,0x6a3b10,.12);
  box(w+.04,.04,.08,x,y+h/2,z+depth/2,trim,this.root);
  box(w+.04,.04,.08,x,y-h/2,z+depth/2,trim,this.root);
 }
 /** From the shared Viralio CC0 library. Keep procedural surfaces until all
      three PBR maps load successfully; never block the WebGL first frame. */
 private upgradePbr(surfaces:THREE.Mesh[],kind:FloorPbr,repeat:number,color:number){
  const base="/viralio-3d/materials/"+kind+"-";
  Promise.all(["color","normal","arm"].map(x=>sharedTexture(base+x+".webp"))).then(([albedo,normal,arm])=>{
   if(this.destroyed)return;
   // Repeat is fixed per material ID; loaded texture instances remain shared
   // between the three rooms without repeatedly uploading huge maps.
   for(const tex of [albedo,normal,arm]){
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    tex.repeat.set(repeat,repeat);
    tex.anisotropy=this.mobile?2:4;
   }
   albedo.colorSpace=THREE.SRGBColorSpace;
   const newMaterial=new THREE.MeshStandardMaterial({
    color,metalness:.1,roughness:.88,
    map:albedo,normalMap:normal,normalScale:new THREE.Vector2(.37,.37),
    roughnessMap:arm,metalnessMap:arm
   });
   for(const surface of surfaces)surface.material=newMaterial;
  }).catch(()=>{/* existing procedural PBR is a functional offline fallback */});
 }
 /** Positions authored in room coordinates, bounds-normalized. All hero
     objects are scenery: interactive targets retain their own colliders. */
 private premiumProp(url:string,x:number,y:number,z:number,w:number,h:number,d:number,rotation=0,fallback?:THREE.Group){
  const pivot=new THREE.Group();pivot.position.set(x,y,z);pivot.rotation.y=rotation;this.root.add(pivot);
  loadFootballModel(url).then(gltf=>{
   if(this.destroyed)return;
   const glb=gltf.scene.clone(true);
   const b=new THREE.Box3().setFromObject(glb),sz=b.getSize(new THREE.Vector3());
   if(sz.x<.01||sz.y<.01||sz.z<.01)return;
   glb.scale.setScalar(Math.min(w/sz.x,h/sz.y,d/sz.z));
   const real=new THREE.Box3().setFromObject(glb);
   const center=real.getCenter(new THREE.Vector3());
   glb.position.set(-center.x,-real.min.y,-center.z);
   glb.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=!this.mobile;}});
   pivot.add(glb);
   if(fallback)fallback.visible=false;
  }).catch(()=>{/* retain existing real-geometry fallback */});
 }
 private shell(chapter:Chapter) {
  const concreteTexture=proceduralSurface("concrete",this.mobile);
  const flooringTexture=proceduralSurface("rubber",this.mobile);
  const ceilingTexture=proceduralSurface("ceiling",this.mobile);
  this.disposableTextures.push(...concreteTexture.textures,...flooringTexture.textures,...ceilingTexture.textures);
  const concrete=concreteTexture.material;
  const floorMat=flooringTexture.material;
  const deep=ceilingTexture.material;
  const steel=mat(0x53616b,.83,.35);
  const ground=box(13,.25,14,0,-.16,0,floorMat,this.root);
  box(13,.25,14,0,4.24,0,deep,this.root);
  const walls=[
   box(.28,4.35,14,-6.4,2.05,0,concrete,this.root),
   box(.28,4.35,14,6.4,2.05,0,concrete,this.root)
  ];
  if(chapter!==2)walls.push(box(13,4.35,.28,0,2.05,-6.7,concrete,this.root));
  walls.push(box(13,4.35,.28,0,2.05,6.7,concrete,this.root));
  // Two actual scanned-material finishes instead of flat generated tiles.
  this.upgradePbr([ground],chapter===0?"old_linoleum_flooring_01":"rubber_tiles",4,chapter===0?0x879bb1:0x929ca5);
  this.upgradePbr(walls,"concrete_tiles",3,0x728da4);
  // Six large studio luminaires instead of sixteen white floating plates.
  // The visible luminous panels sit inside a dark anodized recessed bezel.
  const fixtureFrame=mat(0x273946,.63,.38),diffuser=mat(0xd0e4e8,.04,.66,0x93c5e2,.53);
  for(const x of [-3.6,0,3.6]){
   for(const z of [-3.55,2.15]){
    box(1.22,.055,1.96,x,4.065,z,fixtureFrame,this.root);
    box(1.08,.012,1.81,x,4.027,z,diffuser,this.root).castShadow=false;
   }
  }
  for(let z=-5.6;z<=5.8;z+=2.1)box(.08,4.1,.12,-6.23,1.98,z,steel,this.root);
  // Thin flush floor joints, not twelve heavy black lines.
  for(let i=0;i<5;i++)box(.012,.005,12,-5+i*2.45,.012,0,steel,this.root);
  this.glow(-3.5,2.9,1.8,0xa6dfff,18,13);
  this.glow(4.5,2.8,-1.4,chapter===1?0xf7b8a2:0xffe3b6,13,12);
  this.glow(0,3.5,-3,0xeaf7ff,11,10);
 }
 private door(x:number,z:number,id:GameAction,code:string){
  const dark=mat(0x202b32,.9,.38);const edge=mat(0x9eacb2,.7,.26);
  box(2.15,3.2,.22,x,1.54,z,dark,this.root);
  box(2.33,.13,.3,x,3.16,z,edge,this.root);
  box(.11,3.2,.3,x-1.12,1.55,z,edge,this.root);
  box(.11,3.2,.3,x+1.12,1.55,z,edge,this.root);
  box(.05,1.23,.13,x+.57,1.55,z+.17,edge,this.root);
  this.label(code,["ACCESO RESTRINGIDO"],x,2.58,z+.18,1.52,.66,"#ed7779");
  this.interactive(id,x,1.6,z+.18,2.03,2.9,.25);
 }
 private desk(x:number,z:number,w=3.15){
  const local=new THREE.Group();this.root.add(local);
  const wood=mat(0x4a4846,.35,.52);
  box(w,.14,1.26,x,.89,z,wood,local);
  for(const dx of [-w/2+.18,w/2-.18])for(const dz of [-.47,.47])box(.08,.9,.08,x+dx,.4,z+dz,mat(0x778690,.8,.38),local);
  box(w-.35,.07,.95,x,.47,z,mat(0x1d262d,.55,.6),local);
  this.loadFurniture("desk",x,z,w,1.1,1.23,local);
  this.obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-.67,maxZ:z+.67});
 }
 private panel(x:number,y:number,z:number,w:number,h:number,title:string,lines:string[],id?:GameAction){
  box(w+.15,h+.15,.2,x,y,z,mat(0x0c111a,.79,.25),this.root);
  this.label(title,lines,x,y,z+.15,w,h);
  if(id)this.interactive(id,x,y,z+.18,w,h,.3);
 }
 private chair(x:number,z:number){
  const local=new THREE.Group();this.root.add(local);
  tube(.36,.10,x,.55,z,mat(0x253039,.18,.7),local);
  box(.7,.78,.11,x,1.04,z+.31,mat(0x253039,.18,.7),local);
  tube(.055,.58,x,.23,z,mat(0x98a2a9,.85,.28),local);
  for(let i=0;i<5;i++){const ang=i*Math.PI*2/5;const leg=box(.1,.06,.58,x+Math.sin(ang)*.26,.085,z+Math.cos(ang)*.26,mat(0x65747e,.81,.33),local);leg.rotation.y=ang;}
  this.loadFurniture("chair",x,z,.85,1.2,.85,local);
  this.obstacles.push({minX:x-.34,maxX:x+.34,minZ:z-.34,maxZ:z+.34});
 }
 private stadium(){
  const turf=mat(0x315b42,.13,.9);
  box(83,.45,78,0,-.6,-68,turf,this.root);
  for(let n=0;n<9;n++){box(7.4,.015,78,-34+n*8.4,-.35,-68,mat(n%2?0x3d6c49:0x315b42,.05,1),this.root);}
  const line=mat(0xe1f4ed,.15,.67);box(64,.03,.15,0,-.31,-32,line,this.root);box(64,.03,.15,0,-.31,-100,line,this.root);
  for(const x of [-32,32])box(.13,.03,68,x,-.31,-66,line,this.root);
  const grand=mat(0x162c3c,.25,.9);const crowdColors=[0xc5e8f1,0x55a4d4,0xf0ede1,0xc3b79c,0x465e77,0x8ba9c3];
  // One stand per tier. Earlier versions unknowingly tripled identical rings.
  const stand=new THREE.Group();this.root.add(stand);
  for(let tier=0;tier<12;tier++){
   const r=57+tier*1.9,y=1.5+tier*.75;
   const geo=new THREE.TorusGeometry(r,.48,5,110,Math.PI*1.5);
   const arc=new THREE.Mesh(geo,grand);arc.position.set(0,y,-68);arc.rotation.x=Math.PI/2;stand.add(arc);
  }
  // Stadium audiences use instanced silhouettes: two meshes for the whole
  // crowd, rather than thousands of individual draw calls. Heads and torsos
  // are proportionate at stand distance and do not look like pixels.
  const count=this.mobile?2200:4600;
  const dummy=new THREE.Object3D(),col=new THREE.Color();
  const chest=new THREE.InstancedMesh(
   new THREE.CapsuleGeometry(.23,.43,3,6),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96,metalness:0}),
   count
  );
  const heads=new THREE.InstancedMesh(
   new THREE.SphereGeometry(.16,5,4),
   new THREE.MeshStandardMaterial({color:0xc3b5a5,roughness:1,metalness:0}),
   count
  );
  chest.frustumCulled=false;heads.frustumCulled=false;
  const skinShades=[0xd7bd9b,0xb88c70,0x946b59,0xe1cab0,0x795948];
  const seeded=(i:number)=>((i*1664525+1013904223)>>>0)/4294967296;
  for(let i=0;i<count;i++){
   const tier=i%15,ringPos=Math.floor(i/15);
   const a=ringPos/(Math.ceil(count/15))*Math.PI*1.84+Math.PI*.58;
   const radius=55.5+tier*1.34;
   const x=Math.cos(a)*radius,z=-68+Math.sin(a)*radius;
   const baseY=2+tier*.71;
   dummy.position.set(x,baseY+.55,z);
   dummy.rotation.y=-a+Math.PI*.5;
   dummy.scale.set(1,.85+seeded(i)*.4,1);dummy.updateMatrix();
   chest.setMatrixAt(i,dummy.matrix);
   const fanSector=Math.floor((a+Math.PI)*4.2);
   const color=crowdColors[(i*17+fanSector*11+Math.floor(tier/3))%crowdColors.length];
   col.setHex(color);chest.setColorAt(i,col);
   dummy.position.y=baseY+1.0;dummy.scale.setScalar(.83+seeded(i+71)*.32);dummy.updateMatrix();
   heads.setMatrixAt(i,dummy.matrix);
   col.setHex(skinShades[(i*11+fanSector)%skinShades.length]);heads.setColorAt(i,col);
  }
  chest.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
  this.root.add(chest,heads);
  // Low-cost illuminated fascia along the lower spectator ring.
  const fascia=new THREE.Mesh(
   new THREE.TorusGeometry(54.3,.055,5,160,Math.PI*1.83),
   new THREE.MeshBasicMaterial({color:0x94d6f7,toneMapped:false})
  );
  fascia.position.set(0,1.8,-68);fascia.rotation.x=Math.PI/2;
  this.root.add(fascia);
  for(let i=0;i<7;i++){
   const x=-41+i*14;
   // Visible light bars are emissive; only a few emit actual GPU lights.
   if(i%3===0&&!this.mobile){
    const lt=new THREE.PointLight(0xe2f5ff,14,85,2);lt.position.set(x,25,-37);this.root.add(lt);
   }
   box(3.3,.4,.5,x,25,-37,mat(0xf3faff,.14,.6,0xccefff,1.8),this.root);
  }
  const goal=mat(0xf5fbff,.57,.3);
  box(.1,2.9,.12,-3.7,1.14,-101,goal,this.root);box(.1,2.9,.12,3.7,1.14,-101,goal,this.root);box(7.5,.1,.12,0,2.57,-101,goal,this.root);
  const lineUp:{x:number,z:number,proxy:THREE.Group,blue:boolean}[]=[];
  for(let i=0;i<12;i++){
   const blue=i%2===0,x=-18+i*3.3,z=-49-(i%3)*8;
   const proxy=new THREE.Group();proxy.position.set(x,0,z);this.root.add(proxy);
   tube(.38,.91,0,.85,0,mat(blue?0x8fcff5:0xf0f1f0,.15,.73),proxy,10);
   tube(.19,.21,0,1.42,0,mat(0xc1a58d),proxy);
   for(const dx of [-.2,.2])tube(.095,.66,dx,.19,0,mat(0x2d3b51),proxy);
   lineUp.push({x,z,proxy,blue});
   this.stadiumPlayers.push({actor:proxy,index:i});
  }
  // CC0 rigged football-appropriate background characters, loaded progressively.
  // A cheap geometry fallback remains visible if the GLB cannot be downloaded.
  loadFootballModel(FOOTBALL_ASSETS.player).then(gltf=>{
    if(this.destroyed)return;
    lineUp.forEach(({x,z,proxy,blue},index)=>{
     const character=cloneRig(gltf.scene);
     const modelSize=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
     character.scale.setScalar(modelSize.y>0.05?1.85/modelSize.y:.95);
     const extents=new THREE.Box3().setFromObject(character);
     character.position.set(x,-extents.min.y,z);
     character.rotation.y=(index%3-1)*.4;
     character.traverse(obj=>{
      if(obj instanceof THREE.Mesh){
       obj.castShadow=false;
       if(Array.isArray(obj.material))obj.material=obj.material.map(m=>m.clone());
       else obj.material=obj.material.clone();
       const materials=Array.isArray(obj.material)?obj.material:[obj.material];
       materials.forEach(m=>{
        if(m instanceof THREE.MeshStandardMaterial&&/shirt|jersey|uniform|top|chest|torso|sweater/i.test(m.name+" "+obj.name)){
         m.color.setHex(blue?0xa6ddf5:0xf1efec);
        }
       });
      }
     });
     this.root.add(character);proxy.visible=false;
     this.stadiumPlayers.push({actor:character,index});
     const mixer=new THREE.AnimationMixer(character);
     const clip=gltf.animations.find(a=>/idle|jog|run|walk/i.test(a.name))||gltf.animations[0];
     if(clip){mixer.clipAction(clip).play();this.mixers.push(mixer);}
    });
   }).catch(()=>{});
  const set=buildStadiumSet(this.root,this.mobile);
  this.disposableTextures.push(...set.textures);
  this.stadiumAnimations.push(...set.animated);
  this.stadiumClock=set.setClock;
  this.stadiumGoal=set.goal;
 }
 private makeRoom(chapter:Chapter){
  this.shell(chapter);
  if(chapter===0){
   this.desk(-1,0.5,4.5);this.chair(-2,1.9);this.chair(1,1.85);
   this.panel(-2,2.1,-6.38,3.55,1.85,"ANÁLISIS MULTICÁMARA",["CÁMARAS 01 / 02 / 03","FEED ALTERADO - REVISAR"],"monitores");
   this.createReplayWall();
   this.panel(2.2,2.1,-6.36,3.15,1.85,"ROMPECABEZAS TÁCTICO",["ORDENAR FICHAS","7 / 10 / 9"],"pizarra");
   box(.97,.11,.65,-2.15,1,0.5,mat(0xb1ac9f,.16,.81),this.root);
   this.label("EXPEDIENTE 2030",["4 HOJAS / ORDENAR"],-2.15,1.09,1.12,1.45,.78,"#f8c57e");
   this.interactive("informe",-2.15,1.04,.78,1.65,.32,.85);
   this.evidenceFragments();
   for(let i=0;i<4;i++){const x=-4+i*1.05;box(.8,.62,.46,x,1.2,-1.7,mat(0x182a37,.62,.4),this.root);box(.65,.36,.03,x,1.25,-1.46,mat(0x57b5cf,.32,.51,0x1c7190,.5),this.root);}
   this.door(4.9,-6.48,"salida1","SECTOR INTERNO");
   this.detailAnalysisRoom();
   this.label("ARG 1 - 1 ENG",["MINUTO 87 · FINAL"],0,3.64,-6.39,3.25,.78);
  }else if(chapter===1){
   this.panel(2.2,1.74,-6.36,2.75,2.12,"CENTRAL DE ENLACE",["CONTEO DE SÍMBOLOS","2 / 4 / 3"],"relay");
   this.maintenanceLockers();
   this.panel(-2.5,1.72,-6.36,2.6,2.1,"CIRCUITO CERRADO",["REGISTRO ACCESOS","CÁMARA 09"],"cctv");
   // Service trays are anchored to the wall instead of floating across
   // the player's field of view as they did in the earlier prototype.
   const tray=mat(0x617686,.78,.44);
   for(let i=0;i<3;i++){
    const y=3.55-i*.19;
    box(.27,.07,11.2,-5.79,y,-.12,tray,this.root);
    for(let j=0;j<8;j++)box(.44,.035,.07,-5.79,y-.035,-5.3+j*1.4,tray,this.root);
   }
   // Electrical lockers are distributed down the left wall to leave a
   // physically walkable and visibly uninterrupted escape route.
   for(let i=0;i<4;i++){
    const z=2.45-i*1.65;
    const x=-5.37;
    box(.85,1.79,1.28,x,.92,z,mat(0x3b4d5b,.63,.53),this.root);
    box(.075,1.58,1.08,x+.44,.94,z,mat(0x788b96,.76,.36),this.root);
    box(.045,.16,.20,x+.49,1.16,z-.28,mat(0xc8b487,.62,.35),this.root);
    this.obstacles.push({minX:x-.45,maxX:x+.45,minZ:z-.64,maxZ:z+.64});
   }
   this.door(0,-6.48,"salida2","TÚNEL DE CAMPO");
   this.detailServiceRoom();
   this.actors.push(createIntruder(this.root,()=>!this.destroyed));
   this.glow(0,3,-6,0xfd7459,9,7);
   this.label("AUTORIZACIÓN",["CREDENCIAL REVOCADA"],-4.2,2.0,-6.32,2.1,1.2,"#ed7779");
   for(const side of [-1,1]){
    for(let i=0;i<4;i++){const p=tube(.045,12.5,side*5.85,3.7-i*.21,0,mat(i%2?0x7192a4:0xb7a25d,.84,.3),this.root,8);p.rotation.x=Math.PI/2;}
   }
  }else{
   this.stadium();
   const flood=new THREE.SpotLight(0xb9e5ff,25,64,Math.PI/5,.74,1.65);
   flood.position.set(0,7.8,-11);flood.target.position.set(0,.1,-28);
   this.root.add(flood,flood.target);
   // Open field portal: a high lintel rather than an opaque wall covering the pitch.
   box(11,.35,.3,0,3.93,-6.55,mat(0x17212a,.65,.58),this.root);
   box(3.35,.085,.29,0,3.24,-6.41,mat(0xc6d2d7,.75,.36,0x9ee1f5,.23),this.root);
   box(4.6,3.0,.32,-3.95,1.6,-6.52,mat(0x1c2933,.68,.42),this.root);
   box(4.6,3.0,.32,3.95,1.6,-6.52,mat(0x1c2933,.68,.42),this.root);
   this.desk(-2.3,.65,2.9);
   this.panel(-2.25,1.87,1.43,2.32,1.36,"INFORME FINAL",["VERIFICAR LA PRUEBA","FUENTE ORIGINAL"],"prueba");
   this.premiumProp(FOOTBALL_PREMIUM.duffel,4.2,.02,1.83,.76,.48,.5);
   this.premiumProp(FOOTBALL_PREMIUM.scoreboard,-3.96,2.85,-6.21,1.4,.72,.34);
   this.actors.push(createCoach(this.root,()=>!this.destroyed));
   // Treat the coach as a physical human. Before this collider was added,
   // players could push the first-person camera inside his low-poly face and
   // hair during the final handoff. Keep roughly one metre of separation.
   this.obstacles.push({minX:-.08,maxX:1.04,minZ:-5.45,maxZ:-4.30});
   // Coach is fully INSIDE the safe tunnel: the stadium stands cannot pass
   // through his head. No character geometry overlaps the grandstand rings.
   this.label("CUERPO TÉCNICO",["ENTREGÁ EL INFORME"],.67,2.89,-5.71,2.2,.57,"#f8c57e");
   this.interactive("entrega",.48,1.48,-5.06,1.22,2.36,.38);
   for(let i=0;i<6;i++){const z=4.5-i*1.45;box(.075,.03,9,0,.025,z,mat(0xe4bd79,.41,.55,0xa27622,.14),this.root);}
   this.glow(0,2.7,-7,0xd5f3ff,19,16);
  }
  // Decorative rivets and practical wall fixtures; real meshes and PBR materials.
  const nickel=mat(0x84949f,.88,.24);
  for(let i=0;i<14;i++)for(const side of [-1,1]){
   tube(.044,.034,side*6.19,2.65,-6+i*.9,nickel,this.root,8).rotation.z=Math.PI/2;
  }
 }
 private loadFurniture(kind:"desk"|"chair"|"shelf"|"lamp", x:number,z:number,w:number,h:number,d:number,fallback:THREE.Group,baseY=0) {
  const url=FOOTBALL_ASSETS[kind];
  loadFootballModel(url).then(gltf=>{
   if(this.destroyed)return;
   const obj=gltf.scene.clone(true);
   const bounds=new THREE.Box3().setFromObject(obj);
   const dimensions=bounds.getSize(new THREE.Vector3());
   if(dimensions.x<.01||dimensions.y<.01||dimensions.z<.01)return;
   obj.scale.multiplyScalar(Math.min(w/dimensions.x,h/dimensions.y,d/dimensions.z));
   const b=new THREE.Box3().setFromObject(obj),center=b.getCenter(new THREE.Vector3());
   obj.position.set(x-center.x,baseY-b.min.y,z-center.z);
   obj.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
   this.root.add(obj);fallback.visible=false;
  }).catch(()=>{});
 }
 private evidenceFragments(){
  const paper=mat(0xe5d6aa,.02,.94),ink=mat(0x384c5a,.17,.71),clip=mat(0xbe9957,.81,.31);
  const locations:[GameAction,number,number,number,number][]=[
   ["pieza1",-4.65,1.27,1.78,0],
   ["pieza2",4.56,1.46,.65,0],
   ["pieza3",-4.55,1.45,-2.15,0],
   ["pieza4",3.68,1.56,-3.88,0]
  ];
  locations.forEach(([id,x,y,z,r],index)=>{
   const holder=new THREE.Group();holder.position.set(x,y,z);holder.rotation.y=r;this.root.add(holder);
   const sheet=box(.49,.04,.33,0,0,0,paper,holder);
   sheet.rotation.z=(index-1.5)*.075;
   box(.36,.014,.025,0,.028,-.09,ink,holder);
   box(.3,.014,.021,-.03,.028,-.02,ink,holder);
   box(.18,.014,.018,-.08,.028,.05,ink,holder);
   box(.075,.035,.08,.17,.04,-.11,clip,holder);
   this.interactive(id,x,y+.04,z,.67,.42,.58);
   this.evidenceMeshes.set(id,holder);
  });
 }
 private maintenanceLockers(){
  const steel=mat(0x253645,.74,.4),edge=mat(0x8a9ba2,.83,.29),blue=mat(0x527993,.5,.52),gold=mat(0xe8be70,.42,.41);
  const puzzleLockersFallback=new THREE.Group();this.root.add(puzzleLockersFallback);
  for(let i=0;i<4;i++){
   const x=-4.34+i*1.03,z=3.74;
   box(.91,1.65,.56,x,.85,z,steel,puzzleLockersFallback);
   box(.83,1.46,.045,x,.89,z+.293,i===3?blue:steel,puzzleLockersFallback);
   box(.07,.30,.08,x+.28,1.06,z+.34,edge,puzzleLockersFallback);
   box(.53,.115,.04,x,1.5,z+.331,gold,puzzleLockersFallback);
   this.label("0"+(i+1),["ALMACÉN"],x,1.47,z+.363,.48,.33);
   for(let k=0;k<4;k++)box(.31,.018,.05,x,.48+k*.07,z+.34,edge,puzzleLockersFallback);
   this.obstacles.push({minX:x-.47,maxX:x+.47,minZ:z-.30,maxZ:z+.33});
  }
  this.interactive("casillero",-2.8,1.15,4.11,4.0,1.85,.20);
  this.premiumProp(FOOTBALL_PREMIUM.fourLocker,-2.79,.01,3.74,3.9,1.77,.7,0,puzzleLockersFallback);
  this.premiumProp(FOOTBALL_PREMIUM.keypad,-.8,1.31,-6.23,.3,.47,.19);
  this.premiumProp(FOOTBALL_PREMIUM.locker,5.0,.03,2.7,1.04,1.92,.72,Math.PI/2);
  this.premiumProp(FOOTBALL_PREMIUM.camera,-5.6,3.34,-5.22,.52,.4,.7,Math.PI/2);
  this.glow(-2.7,2.2,2.72,0xffbb76,7,5);
 }
 private detailAnalysisRoom() {
  const trim=mat(0x99aab5,.78,.3),slate=mat(0x243946,.66,.51),
  copper=mat(0xb3a18d,.6,.4),plastic=mat(0x3a4e5b,.34,.72),
  glass=mat(0xaed8ec,.15,.17);
  // Wide composite acoustic panels with discreet seams and inlaid edges.
  // The old prototype had nine repeated black pillars on every wall.
  const panelMaterial=mat(0x3b5769,.28,.79);
  const bronze=mat(0xb29a6f,.74,.36);
  for(const wall of [-1,1]){
   for(let bay=0;bay<4;bay++){
    const z=-4.65+bay*2.9;
    box(.042,2.52,2.53,wall*6.11,1.86,z,panelMaterial,this.root);
    box(.072,2.68,.028,wall*6.04,1.86,z-1.28,bronze,this.root);
    box(.075,.034,2.51,wall*6.04,.57,z,bronze,this.root);
    box(.062,.036,2.51,wall*6.04,3.13,z,bronze,this.root);
   }
  }
  // Suspended fixture frames, broadcast tally indicators and colored cable trays.
  const glowBlue=mat(0x7de0f2,.1,.19,0x42b7de,2.1);
  for(let i=0;i<4;i++){
   const x=-4.45+i*2.9;
   box(1.2,.065,.06,x,3.91,-4.65,glowBlue,this.root);
   box(.035,.12,.07,x,3.84,-4.65,bronze,this.root);
  }
  // Framed scouting prints, equipment cabinets and labelled document racks.
  for(const dx of [-4.9,-3.2]){
   box(1.26,1.06,.10,dx,2.16,6.48,trim,this.root);
   box(1.13,.93,.03,dx,2.16,6.57,slate,this.root);
   this.label("DOSSIER / ENG",["PRESIÓN ALTA","BANDA DERECHA"],dx,2.16,6.62,1.07,.82);
  }
  const rackFallback=new THREE.Group();this.root.add(rackFallback);
  for(let i=0;i<4;i++){
   const z=-2.8+i*.94;
   box(.58,2.18,.83,5.3,1.12,z,plastic,rackFallback);
   box(.56,.04,.78,5.3,1.83,z,trim,rackFallback);
   box(.41,.06,.05,5.25,1.02,z+.44,copper,rackFallback);
   for(let t=0;t<3;t++){
    box(.38,.28,.06,5.25,1.35-t*.35,z+.45,mat(t===0?0x96b9c4:t===1?0xc9b996:0x5a6f83,.19,.65),rackFallback);
   }
  }
  this.loadFurniture("shelf",5.24,-1.4,1.4,2.2,2.4,rackFallback);
  // Task light with warm practical glow over the source documents. GLB
  // detail replaces a functional fallback once assets have loaded.
  const lampFallback=new THREE.Group();this.root.add(lampFallback);
  tube(.17,.035,.75,1.05,.65,trim,lampFallback);
  tube(.035,.31,.75,1.28,.65,trim,lampFallback);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.13,.24,.19,18),copper);
  shade.position.set(.75,1.49,.65);lampFallback.add(shade);
  this.loadFurniture("lamp",.75,.65,.54,.64,.54,lampFallback,.96);
  this.glow(.75,1.64,.65,0xffcc89,3.8,2.1);
  // Monitor desk peripherals: keyboard keys, articulated lamps, cable loops.
  // The operator's equipment is real glTF/PBR, with natural silhouettes.
  this.premiumProp(FOOTBALL_PREMIUM.keyboard,.32,1,.83,.65,.085,.27);
  this.premiumProp(FOOTBALL_PREMIUM.monitor,.33,.99,.12,.72,.78,.41);
  this.premiumProp(FOOTBALL_PREMIUM.camera,-5.61,3.1,-4.45,.5,.45,.8,Math.PI/2);
  this.premiumProp(FOOTBALL_PREMIUM.duffel,4.65,.03,2.65,.83,.54,.57,Math.PI/2);
  this.premiumProp(FOOTBALL_PREMIUM.backpack,5.1,.03,4.5,.53,.8,.41,-Math.PI/2);
  this.premiumProp(FOOTBALL_PREMIUM.football,4.75,.02,1.65,.32,.32,.32);
  // Floor tactile strips and a bright path indicating the required exit.
  for(let z=1;z>-5.8;z-=.6)box(.05,.012,.37,4.15,.018,z,copper,this.root);
  box(2.15,.03,.2,4.83,.018,-5.46,copper,this.root);
  this.glow(4.5,2.8,-5.4,0xffdb8e,13,7);
 }
 private detailServiceRoom(){
  const pipe=mat(0xa5aeb4,.77,.37),rust=mat(0x6a493b,.65,.61),paint=mat(0x7d8a8c,.31,.67);
  for(let side of [-1,1])for(let i=0;i<9;i++){
   const z=-5.5+i*1.35;
   const a=tube(.065,2.7,side*6.1,2.1,z,pipe,this.root,10);
   a.rotation.z=Math.PI/2;
   box(.18,.17,.16,side*6.0,3.43,z,rust,this.root);
  }
  for(let i=0;i<5;i++){
   const z=-4+i*2.05;
   box(.76,.95,.28,-5.98,1.9,z,paint,this.root);
   box(.31,.07,.07,-5.78,2.25,z+.24,rust,this.root);
   tube(.09,.14,-5.76,1.91,z+.24,pipe,this.root,12).rotation.x=Math.PI/2;
  }
  for(let i=0;i<6;i++){
   const z=-5.8+i*1.25;
   box(1.4,.04,.11,0,.01,z,mat(0xe5c78c,.27,.55),this.root);
  }
  this.glow(0,2.1,-4,0xf9c9aa,12,8);
 }

 private createReplayWall(){
  const cams=["C1","C2","C3"] as const;
  for(let i=0;i<3;i++){
   const canvas=document.createElement("canvas");canvas.width=512;canvas.height=324;
   const ctx=canvas.getContext("2d");
   if(!ctx)continue;
   const camera=cams[i];paintTacticalFeed(ctx,camera,.2,canvas.width,canvas.height);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
   this.disposableTextures.push(texture);
   const x=-3.21+i*1.21;
   box(1.19,1.16,.08,x,2.12,-6.05,mat(0x0b151b,.74,.33),this.root);
   const screen=plane(1.12,.99,x,2.12,-5.99,new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),this.root);
   screen.renderOrder=2;
   this.replayDisplays.push({canvas,texture,camera});
  }
 }
 private animateReplay(dt:number){
  if(!this.replayDisplays.length)return;
  this.replayElapsed+=dt;this.replayClock=(this.replayClock+dt*.175)%1;
  if(this.replayElapsed<.115)return;this.replayElapsed=0;
  for(const display of this.replayDisplays){
   const ctx=display.canvas.getContext("2d");
   if(!ctx)continue;
   paintTacticalFeed(ctx,display.camera,this.replayClock,display.canvas.width,display.canvas.height);
   display.texture.needsUpdate=true;
  }
 }

 private canWalk(x:number,z:number){
  const r=.31;
  if(x<-5.62||x>5.62||z<-5.8||z>5.8)return false;
  for(const obstacle of this.obstacles){
   const cx=THREE.MathUtils.clamp(x,obstacle.minX,obstacle.maxX);
   const cz=THREE.MathUtils.clamp(z,obstacle.minZ,obstacle.maxZ);
   if((x-cx)*(x-cx)+(z-cz)*(z-cz)<r*r)return false;
  }
  return true;
 }
 setGameplayActive(value:boolean){
  this.gameplayActive=value;
  this.renderer.domElement.dataset.gameplayActive=String(value);
  if(!value){
   this.keys.clear();
   this.touchMove={x:0,z:0};
   this.dragging=false;
   this.pointerPositions.clear();
   this.pinching=false;
  }
 }

 private actionAt(nx:number,ny:number){
  this.ray.setFromCamera(new THREE.Vector2(nx,ny),this.camera);
  const hits=this.ray.intersectObjects(this.targets,false);
  for(const hit of hits){
   if(hit.distance<=3.5){
    const target=hit.object as Target;
    if(target.userData.action)return target.userData.action;
   }
  }
  // The coach stands slightly outside the tunnel threshold. An invisible
  // interaction collider is easy for raycasting to miss through a narrow
  // moving opening on portrait phones. Permit the same physical 3.5 m
  // interaction distance when the player faces the coach directly.
  // This is NOT a distant hotspot: the player must walk over to the exit.
  if(this.chapter===2&&Math.abs(nx)<.12&&Math.abs(ny)<.12){
   const coach=this.targets.find(t=>t.userData.action==="entrega");
   if(coach){
    const toward=coach.getWorldPosition(new THREE.Vector3()).sub(this.camera.position);
    const meters=toward.length();
    if(meters<=3.5&&meters>.01){
     const forward=this.camera.getWorldDirection(new THREE.Vector3());
     if(forward.dot(toward.multiplyScalar(1/meters))>.77)return "entrega";
    }
   }
  }
  return null;
 }
 tap(clientX:number,clientY:number){
  if(!this.gameplayActive)return;
  const rect=this.renderer.domElement.getBoundingClientRect();
  const x=(clientX-rect.left)/rect.width*2-1;
  const y=-(clientY-rect.top)/rect.height*2+1;
  const action=this.actionAt(x,y);
  if(action)this.handlers.action(action);else this.interactCenter();
 }
 interactCenter(){
  if(!this.gameplayActive)return;
  // Raycasts must see the current aiming angle immediately, not the angle
  // from the previous rendered frame (critical on low-FPS mobile hardware).
  this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");
  this.camera.updateMatrixWorld(true);
  const action=this.actionAt(0,0);if(action)this.handlers.action(action);
 }
 look(dx:number,dy:number){
  if(!this.gameplayActive)return;
  this.yaw-=dx*.0031;this.pitch=Math.max(-1.12,Math.min(1.12,this.pitch-dy*.00265));
 }
 movement(x:number,z:number){this.touchMove=this.gameplayActive?{x,z}:{x:0,z:0};}
 orientToward(id:GameAction):boolean{
  const target=this.targets.find(t=>(t as Target).userData.action===id);
  if(!target)return false;
  // Look at the objective without teleportation or opening its puzzle.
  // This accessibility aid is available only from the player's requested hint.
  const dx=target.position.x-this.camera.position.x;
  const dy=target.position.y-this.camera.position.y;
  const dz=target.position.z-this.camera.position.z;
  this.yaw=Math.atan2(-dx,-dz);
  this.renderer.domElement.dataset.aimTarget=id;
  this.pitch=THREE.MathUtils.clamp(Math.atan2(dy,Math.hypot(dx,dz)),-1.12,1.12);
  this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");
  this.camera.updateMatrixWorld(true);
  return true;
 }
 private loop=(time:number)=>{
  this.frame=requestAnimationFrame(this.loop);
  const dt=Math.min(.5,(time-this.last)/1000||.016);this.last=time;
  this.update(dt);
  this.animateReplay(dt);
  this.lifetime+=dt;
  this.stadiumAnimations.forEach(a=>a(this.lifetime));
  this.actors.forEach(a=>a.update(this.lifetime));
  this.finale?.update(dt);
  this.crisis?.update(dt);
  this.fpsTime+=dt;this.fpsFrames++;
  if(this.fpsTime>4.5){
   const fps=this.fpsFrames/this.fpsTime;
   const max=Math.min(window.devicePixelRatio||1,this.mobile?1.3:1.65);
   const newDpr=fps<28?Math.max(.7,this.dpr-.17):fps>54?Math.min(max,this.dpr+.07):this.dpr;
   if(Math.abs(newDpr-this.dpr)>.02){this.dpr=newDpr;this.renderer.setPixelRatio(this.dpr);this.resize();}
   this.fpsTime=0;this.fpsFrames=0;
  }
  this.mixers.forEach(m=>m.update(dt));
  this.renderer.render(this.scene,this.camera);
 };
 private update(dt:number){
  const inputX=Number(this.keys.has("KeyD")||this.keys.has("ArrowRight"))-Number(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))+this.touchMove.x;
  const inputZ=Number(this.keys.has("KeyS")||this.keys.has("ArrowDown"))-Number(this.keys.has("KeyW")||this.keys.has("ArrowUp"))+this.touchMove.z;
  const length=Math.hypot(inputX,inputZ);
  if(length>0&&this.gameplayActive){
   // Stable walk speed even below 20 FPS; substep collision so slow phones
   // cannot tunnel through furniture during a long render frame.
   const steps=Math.max(1,Math.ceil(dt/.025));
   const speed=2.65*(dt/steps)/Math.max(1,length);
   const dx=(Math.cos(this.yaw)*inputX+Math.sin(this.yaw)*inputZ)*speed;
   const dz=(-Math.sin(this.yaw)*inputX+Math.cos(this.yaw)*inputZ)*speed;
   for(let i=0;i<steps;i++){
    const x=this.camera.position.x,z=this.camera.position.z;
    if(this.canWalk(x+dx,z))this.camera.position.x=x+dx;
    if(this.canWalk(this.camera.position.x,z+dz))this.camera.position.z=z+dz;
   }
   this.walkingPhase+=dt*11;
   this.headSway=Math.sin(this.walkingPhase)*.018;
  }else this.headSway=THREE.MathUtils.lerp(this.headSway,0,Math.min(1,dt*6));
  this.camera.position.y=1.68+this.headSway;
  this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");
  this.renderer.domElement.dataset.cameraFov=this.camera.fov.toFixed(1);
  this.focusElapsed+=dt;
  if(this.focusElapsed>0.14){this.focusElapsed=0;
   this.renderer.domElement.dataset.playerPosition=this.camera.position.x.toFixed(2)+","+this.camera.position.z.toFixed(2);
   this.renderer.domElement.dataset.playerYaw=this.yaw.toFixed(2);
   this.renderer.domElement.dataset.focusTarget=this.active||"";
   this.handlers.position?.(this.camera.position.x,this.camera.position.y,this.camera.position.z,this.yaw);const next=this.actionAt(0,0);if(next!==this.active){this.active=next;this.handlers.focus(next?names[next]:"");}}
 }
 resize(){
  const canvas=this.renderer.domElement;const parent=canvas.parentElement;
  const w=parent?.clientWidth||window.innerWidth,h=parent?.clientHeight||window.innerHeight;
  this.camera.aspect=w/Math.max(1,h);this.camera.updateProjectionMatrix();
  this.renderer.setSize(w,h,false);
 }
 setMatchTime(remaining:number){
  this.stadiumClock?.(remaining);
  this.crisis?.setPressure(remaining);
 }
 triggerCrisis(){this.crisis?.trigger();}
 startFinale(cue:(name:"apertura"|"pase"|"centro"|"gol")=>void,complete:()=>void){
  this.setGameplayActive(false);
  if(this.finale)this.finale.dispose();
  this.finale=new FinaleDirector(this.root,this.camera,{cue:(event)=>{if(event==="gol")this.stadiumGoal?.();cue(event);},complete},this.stadiumPlayers);
 }
 dispose(){
  this.crisis?.dispose();this.crisis=null;
  this.finale?.dispose();this.finale=null;
  this.actors.forEach(a=>a.dispose());this.actors=[];
  this.destroyed=true;
  cancelAnimationFrame(this.frame);
  window.removeEventListener("resize",this.boundResize);
  window.removeEventListener("keydown",this.onKeyDown);
  window.removeEventListener("keyup",this.onKeyUp);
  const c=this.renderer.domElement;
  c.removeEventListener("pointerdown",this.onDown);c.removeEventListener("pointermove",this.onMove);
  c.removeEventListener("pointerup",this.onUp);c.removeEventListener("pointercancel",this.onUp);
  c.removeEventListener("wheel",this.onWheel);
  this.root.traverse(obj=>{
   if(obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh){
    obj.geometry.dispose();
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const m of mats){m.dispose();}
   }
  });
  this.disposableTextures.forEach(t=>t.dispose());
  this.renderer.dispose();
 }
}
