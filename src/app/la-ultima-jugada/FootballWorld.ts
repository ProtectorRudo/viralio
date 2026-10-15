import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneRig } from "three/examples/jsm/utils/SkeletonUtils.js";

export type Chapter = 0 | 1 | 2;
export type GameAction = "monitores" | "pizarra" | "informe" | "salida1" | "relay" | "cctv" | "salida2" | "prueba" | "entrega";
type Handlers = { action:(id:GameAction)=>void; focus:(label:string)=>void; position?:(x:number,y:number,z:number,yaw:number)=>void; failure:()=>void };
type Target = THREE.Object3D & {userData:{action?:GameAction,label?:string}};

const palette = {
 floor:0x222b34, wall:0x26323e, metal:0x65727c, blue:0x38bdf8,
 gold:0xf3c777, deep:0x0c1823, red:0xe44c4e, cream:0xeee4ce
};
const names:Record<GameAction,string>={
 monitores:"Examinar las tres cámaras",pizarra:"Reconstruir la pizarra",informe:"Recuperar el informe",
 salida1:"Acceder al corredor",relay:"Restaurar el enlace",cctv:"Examinar seguridad",
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
 private active:GameAction|null=null;
 private handlers:Handlers;
 private keys=new Set<string>();
 private touchMove={x:0,z:0};
 private dragging=false;
 private start={x:0,y:0};
 private previous={x:0,y:0};
 private pointerTravel=0;
 private focusElapsed=0;
 private yaw=0;private pitch=0;
 private last=0;private frame=0;
 private boundResize=()=>this.resize();
 private chapter:Chapter;
 private tempVec=new THREE.Vector3();
 private disposableTextures:THREE.Texture[]=[];
 private mixers:THREE.AnimationMixer[]=[];
 private destroyed=false;
 private onKeyDown=(e:KeyboardEvent)=>{if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){this.keys.add(e.code);e.preventDefault();}};
 private onKeyUp=(e:KeyboardEvent)=>this.keys.delete(e.code);
 private onDown=(e:PointerEvent)=>{this.dragging=true;this.start={x:e.clientX,y:e.clientY};this.previous={...this.start};this.pointerTravel=0;this.renderer.domElement.setPointerCapture(e.pointerId);};
 private onMove=(e:PointerEvent)=>{
  if(!this.dragging)return;
  const dx=e.clientX-this.previous.x,dy=e.clientY-this.previous.y;
  this.pointerTravel+=Math.abs(dx)+Math.abs(dy);
  if(this.pointerTravel>7)this.look(dx,dy);
  this.previous={x:e.clientX,y:e.clientY};
 };
 private onUp=(e:PointerEvent)=>{if(!this.dragging)return;this.dragging=false;if(this.pointerTravel<12)this.tap(e.clientX,e.clientY);};
 constructor(canvas:HTMLCanvasElement, chapter:Chapter, handlers:Handlers){
  this.chapter=chapter;this.handlers=handlers;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance",alpha:false});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.25;
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
  this.scene.background=new THREE.Color(chapter===2?0x122533:0x0b1723);
  this.scene.fog=new THREE.FogExp2(chapter===2?0x192e40:0x131f2b,chapter===2?.009:.032);
  this.camera=new THREE.PerspectiveCamera(69,1,.08,220);
  this.camera.position.set(0,1.68,4.2);
  this.scene.add(this.root);
  this.scene.add(new THREE.HemisphereLight(0x8ab5d7,0x16181b,1.65));
  const key=new THREE.DirectionalLight(0xffe3b8,chapter===2?2.1:1.2);
  key.position.set(-3,8,-2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-14;key.shadow.camera.right=14;key.shadow.camera.top=14;key.shadow.camera.bottom=-14;
  key.shadow.bias=-.0005;this.scene.add(key);
  this.makeRoom(chapter);
  this.resize();
  window.addEventListener("resize",this.boundResize);
  window.addEventListener("keydown",this.onKeyDown);
  window.addEventListener("keyup",this.onKeyUp);
  canvas.addEventListener("pointerdown",this.onDown);
  canvas.addEventListener("pointermove",this.onMove);
  canvas.addEventListener("pointerup",this.onUp);
  canvas.addEventListener("pointercancel",this.onUp);
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
 private shell(chapter:Chapter) {
  const concrete=mat(chapter===0?0x303c47:0x283139,.16,.89);
  const deep=mat(palette.deep,.3,.62);
  const steel=mat(0x53616b,.83,.35);
  box(13,.25,14,0,-.16,0,mat(palette.floor,.24,.71),this.root);
  box(13,.25,14,0,4.24,0,deep,this.root);
  box(.28,4.35,14,-6.4,2.05,0,concrete,this.root);
  box(.28,4.35,14,6.4,2.05,0,concrete,this.root);
  if(chapter!==2)box(13,4.35,.28,0,2.05,-6.7,concrete,this.root);
  box(13,4.35,.28,0,2.05,6.7,concrete,this.root);
  for(let x=-5.5;x<6;x+=2.15){
   box(.1,.05,13,x,4.1,0,steel,this.root);
   for(let z=-5.5;z<6;z+=2.3)box(.77,.026,1.26,x,4.06,z,mat(0xdceef6,.25,.5,0x7bcaff,.65),this.root);
  }
  for(let z=-5.6;z<=5.8;z+=2.1)box(.08,4.1,.12,-6.23,1.98,z,steel,this.root);
  for(let i=0;i<12;i++)box(.03,.02,13,-5.9+i*1.07,.018,0,steel,this.root);
  this.glow(-4,3,1,0x4fa8e2,8,12);
  this.glow(4,3,-2,chapter===1?0xf65e4b:0xf3ca83,6,11);
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
  const wood=mat(0x4a4846,.35,.52);
  box(w,.14,1.26,x,.89,z,wood,this.root);
  for(const dx of [-w/2+.18,w/2-.18])for(const dz of [-.47,.47])box(.08,.9,.08,x+dx,.4,z+dz,mat(0x778690,.8,.38),this.root);
  box(w-.35,.07,.95,x,.47,z,mat(0x1d262d,.55,.6),this.root);
 }
 private panel(x:number,y:number,z:number,w:number,h:number,title:string,lines:string[],id?:GameAction){
  box(w+.15,h+.15,.2,x,y,z,mat(0x0c111a,.79,.25),this.root);
  this.label(title,lines,x,y,z+.15,w,h);
  if(id)this.interactive(id,x,y,z+.18,w,h,.3);
 }
 private chair(x:number,z:number){
  tube(.36,.10,x,.55,z,mat(0x253039,.18,.7),this.root);
  box(.7,.78,.11,x,1.04,z+.31,mat(0x253039,.18,.7),this.root);
  tube(.055,.58,x,.23,z,mat(0x98a2a9,.85,.28),this.root);
  for(let i=0;i<5;i++){const ang=i*Math.PI*2/5;const leg=box(.1,.06,.58,x+Math.sin(ang)*.26,.085,z+Math.cos(ang)*.26,mat(0x65747e,.81,.33),this.root);leg.rotation.y=ang;}
 }
 private stadium(){
  const turf=mat(0x315b42,.13,.9);
  box(83,.45,78,0,-.6,-68,turf,this.root);
  for(let n=0;n<9;n++){box(7.4,.015,78,-34+n*8.4,-.35,-68,mat(n%2?0x3d6c49:0x315b42,.05,1),this.root);}
  const line=mat(0xe1f4ed,.15,.67);box(64,.03,.15,0,-.31,-32,line,this.root);box(64,.03,.15,0,-.31,-100,line,this.root);
  for(const x of [-32,32])box(.13,.03,68,x,-.31,-66,line,this.root);
  const grand=mat(0x162c3c,.25,.9);const crowdColors=[0xc5e8f1,0x55a4d4,0xf0ede1,0xc3b79c,0x465e77,0x8ba9c3];
  for(let side=0;side<3;side++){
   const grp=new THREE.Group();this.root.add(grp);
   for(let tier=0;tier<12;tier++){
    const r=57+tier*1.9,y=1.5+tier*.75;
    const geo=new THREE.TorusGeometry(r,.48,5,110,Math.PI*1.5);
    const arc=new THREE.Mesh(geo,grand);arc.position.set(0,y,-68);arc.rotation.x=Math.PI/2;grp.add(arc);
   }
  }
  const count=3000;const g=new THREE.BoxGeometry(.22,.18,.12);const inst=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({vertexColors:false,color:0xffffff}),count);
  const dummy=new THREE.Object3D();const col=new THREE.Color();
  for(let i=0;i<count;i++){
   const a=(i/count)*Math.PI*1.75+Math.PI*.62;const r=56+(i%15)*1.32;
   dummy.position.set(Math.cos(a)*r,2+(i%15)*.7,-68+Math.sin(a)*r);
   dummy.rotation.y=-a;dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
   const color=crowdColors[(i*37+Math.floor(i/7))%crowdColors.length];col.setHex(color);inst.setColorAt(i,col);
  }
  inst.instanceMatrix.needsUpdate=true;this.root.add(inst);
  for(let i=0;i<7;i++){
   const x=-41+i*14;
   const lt=new THREE.PointLight(0xe2f5ff,38,100,1);lt.position.set(x,25,-37);this.root.add(lt);
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
  }
  // CC0 rigged football-appropriate background characters, loaded progressively.
  // A cheap geometry fallback remains visible if the GLB cannot be downloaded.
  new GLTFLoader().load(
   "https://raw.githubusercontent.com/kendrekaran/striker-3d/main/assets/player.glb",
   gltf=>{
    if(this.destroyed)return;
    lineUp.filter((_,i)=>i%2===0).forEach(({x,z,proxy,blue},index)=>{
     const character=cloneRig(gltf.scene);
     character.position.set(x,0,z);character.scale.setScalar(.95);
     character.rotation.y=(index%3-1)*.4;
     character.traverse(obj=>{
      if(obj instanceof THREE.Mesh){
       obj.castShadow=false;
       if(Array.isArray(obj.material))obj.material=obj.material.map(m=>m.clone());
       else obj.material=obj.material.clone();
       const materials=Array.isArray(obj.material)?obj.material:[obj.material];
       materials.forEach(m=>{
        if(m instanceof THREE.MeshStandardMaterial&&/shirt|jersey|uniform|top/i.test(m.name)){
         m.color.setHex(blue?0xa6ddf5:0xf0eeee);
        }
       });
      }
     });
     this.root.add(character);proxy.visible=false;
     const mixer=new THREE.AnimationMixer(character);
     const clip=gltf.animations.find(a=>/idle|jog|run|walk/i.test(a.name))||gltf.animations[0];
     if(clip){mixer.clipAction(clip).play();this.mixers.push(mixer);}
    });
   },undefined,()=>{}
  );
 }
 private makeRoom(chapter:Chapter){
  this.shell(chapter);
  if(chapter===0){
   this.desk(-1,0.5,4.5);this.chair(-2,1.9);this.chair(1,1.85);
   this.panel(-2,2.1,-6.38,3.55,1.85,"ANÁLISIS MULTICÁMARA",["CÁMARAS 01 / 02 / 03","FEED ALTERADO - REVISAR"],"monitores");
   this.panel(2.2,2.1,-6.36,3.15,1.85,"PIZARRA TÁCTICA",["MOVIMIENTO DE ATAQUE","7 / 10 / 9"],"pizarra");
   box(.97,.11,.65,-2.15,1,0.5,mat(0xb1ac9f,.16,.81),this.root);
   this.label("EXPEDIENTE 2030",["DOCUMENTO ORIGINAL"],-2.15,1.09,1.12,1.45,.78,"#f8c57e");
   this.interactive("informe",-2.15,1.04,.78,1.65,.32,.85);
   for(let i=0;i<4;i++){const x=-4+i*1.05;box(.8,.62,.46,x,1.2,-1.7,mat(0x182a37,.62,.4),this.root);box(.65,.36,.03,x,1.25,-1.46,mat(0x57b5cf,.32,.51,0x1c7190,.5),this.root);}
   this.door(4.9,-6.48,"salida1","SECTOR INTERNO");
   this.label("ARG 1 - 1 ENG",["MINUTO 87 · FINAL"],0,3.64,-6.39,3.25,.78);
  }else if(chapter===1){
   this.panel(2.2,1.74,-6.36,2.75,2.12,"CENTRAL DE ENLACE",["TERMINALES A / B / C","PROTOCOLO 031"],"relay");
   this.panel(-2.5,1.72,-6.36,2.6,2.1,"CIRCUITO CERRADO",["REGISTRO ACCESOS","CÁMARA 09"],"cctv");
   for(let i=0;i<6;i++){
    const a=box(4,.12,.1,-3.6+i*.05,3.48-i*.28,0,mat(i%2?0x727e86:0x4b5961,.8,.4),this.root);
    a.rotation.z=0;
   }
   for(let i=0;i<4;i++)box(1.2,1.7,.7,-4.5+i*1.35,.85,2.4,mat(0x596269,.68,.45),this.root);
   this.door(0,-6.48,"salida2","TÚNEL DE CAMPO");
   this.glow(0,3,-6,0xfd7459,9,7);
   this.label("AUTORIZACIÓN",["CREDENCIAL REVOCADA"],-4.2,2.0,-6.32,2.1,1.2,"#ed7779");
   for(const side of [-1,1]){
    for(let i=0;i<4;i++){const p=tube(.045,12.5,side*5.85,3.7-i*.21,0,mat(i%2?0x7192a4:0xb7a25d,.84,.3),this.root,8);p.rotation.x=Math.PI/2;}
   }
  }else{
   this.stadium();
   box(11,3.3,.3,0,2.2,-6.55,mat(0x17212a,.65,.58),this.root);
   box(4.6,3.0,.32,-3.95,1.6,-6.52,mat(0x1c2933,.68,.42),this.root);
   box(4.6,3.0,.32,3.95,1.6,-6.52,mat(0x1c2933,.68,.42),this.root);
   this.desk(-2.3,.65,2.9);
   this.panel(-2.25,1.87,1.43,2.32,1.36,"INFORME FINAL",["VERIFICAR LA PRUEBA","FUENTE ORIGINAL"],"prueba");
   this.label("SALIDA AL BANCO",["ENTRENADOR / CAMPO"],.05,2.43,-6.29,3.43,.86,"#f8c57e");
   this.interactive("entrega",.12,1.6,-6.28,2.4,2.28,.42);
   for(let i=0;i<6;i++){const z=4.5-i*1.45;box(.075,.03,9,0,.025,z,mat(0xe4bd79,.41,.55,0xa27622,.14),this.root);}
   this.glow(0,2,-5,0xa3dffd,9,12);
  }
  // Decorative rivets and practical wall fixtures; real meshes and PBR materials.
  const nickel=mat(0x84949f,.88,.24);
  for(let i=0;i<14;i++)for(const side of [-1,1]){
   tube(.044,.034,side*6.19,2.65,-6+i*.9,nickel,this.root,8).rotation.z=Math.PI/2;
  }
 }
 private actionAt(nx:number,ny:number){
  this.ray.setFromCamera(new THREE.Vector2(nx,ny),this.camera);
  const hits=this.ray.intersectObjects(this.targets,false);
  for(const hit of hits){
   if(hit.distance<=7.2){
    const target=hit.object as Target;
    if(target.userData.action)return target.userData.action;
   }
  }return null;
 }
 tap(clientX:number,clientY:number){
  const rect=this.renderer.domElement.getBoundingClientRect();
  const x=(clientX-rect.left)/rect.width*2-1;
  const y=-(clientY-rect.top)/rect.height*2+1;
  const action=this.actionAt(x,y);
  if(action)this.handlers.action(action);else this.interactCenter();
 }
 interactCenter(){
  const action=this.actionAt(0,0);if(action)this.handlers.action(action);
 }
 look(dx:number,dy:number){
  this.yaw-=dx*.0031;this.pitch=Math.max(-1.12,Math.min(1.12,this.pitch-dy*.00265));
 }
 movement(x:number,z:number){this.touchMove={x,z};}
 private loop=(time:number)=>{
  this.frame=requestAnimationFrame(this.loop);
  const dt=Math.min(.05,(time-this.last)/1000||.016);this.last=time;
  this.update(dt);
  this.mixers.forEach(m=>m.update(dt));
  this.renderer.render(this.scene,this.camera);
 };
 private update(dt:number){
  const inputX=Number(this.keys.has("KeyD")||this.keys.has("ArrowRight"))-Number(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))+this.touchMove.x;
  const inputZ=Number(this.keys.has("KeyS")||this.keys.has("ArrowDown"))-Number(this.keys.has("KeyW")||this.keys.has("ArrowUp"))+this.touchMove.z;
  const length=Math.hypot(inputX,inputZ);
  if(length>0){
   const speed=2.75*dt/Math.max(1,length);
   this.camera.position.x+= (Math.cos(this.yaw)*inputX+Math.sin(this.yaw)*inputZ)*speed;
   this.camera.position.z+= (-Math.sin(this.yaw)*inputX+Math.cos(this.yaw)*inputZ)*speed;
   this.camera.position.x=THREE.MathUtils.clamp(this.camera.position.x,-5.55,5.55);
   this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z,-5.55,5.8);
  }
  this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");
  this.focusElapsed+=dt;
  if(this.focusElapsed>0.14){this.focusElapsed=0;this.handlers.position?.(this.camera.position.x,this.camera.position.y,this.camera.position.z,this.yaw);const next=this.actionAt(0,0);if(next!==this.active){this.active=next;this.handlers.focus(next?names[next]:"");}}
 }
 resize(){
  const canvas=this.renderer.domElement;const parent=canvas.parentElement;
  const w=parent?.clientWidth||window.innerWidth,h=parent?.clientHeight||window.innerHeight;
  this.camera.aspect=w/Math.max(1,h);this.camera.updateProjectionMatrix();
  this.renderer.setSize(w,h,false);
 }
 dispose(){
  this.destroyed=true;
  cancelAnimationFrame(this.frame);
  window.removeEventListener("resize",this.boundResize);
  window.removeEventListener("keydown",this.onKeyDown);
  window.removeEventListener("keyup",this.onKeyUp);
  const c=this.renderer.domElement;
  c.removeEventListener("pointerdown",this.onDown);c.removeEventListener("pointermove",this.onMove);
  c.removeEventListener("pointerup",this.onUp);c.removeEventListener("pointercancel",this.onUp);
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
