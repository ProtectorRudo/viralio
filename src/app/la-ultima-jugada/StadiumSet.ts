import * as THREE from "three";

/**
 * Premium stadium set dressing in actual WebGL meshes. No 2D room backdrop.
 * Shared PBR materials, instanced furniture, low-draw-call line net and
 * in-world emissive sports signage keep the set useful on midrange phones.
 */
type SceneAssets={textures:THREE.Texture[];animated:Array<(t:number)=>void>};
const make=(color:number,metalness=.2,roughness=.65,emissive=0,intensity=0)=>
 new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
function mesh(root:THREE.Group,geom:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number) {
 const m=new THREE.Mesh(geom,material);m.position.set(x,y,z);root.add(m);return m;
}
function box(root:THREE.Group,ma:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number){
 const m=mesh(root,new THREE.BoxGeometry(w,h,d),ma,x,y,z);m.receiveShadow=true;return m;
}
function textPanel(title:string,sub:string,foot:string){
 const c=document.createElement("canvas");c.width=1024;c.height=384;const ctx=c.getContext("2d")!;
 ctx.fillStyle="#07131e";ctx.fillRect(0,0,1024,384);
 const glow=ctx.createLinearGradient(0,0,1024,384);
 glow.addColorStop(0,"#1c4763");glow.addColorStop(.51,"#0a2030");glow.addColorStop(1,"#2b3245");
 ctx.fillStyle=glow;ctx.globalAlpha=.77;ctx.fillRect(0,0,1024,384);ctx.globalAlpha=1;
 ctx.fillStyle="#91d8f1";ctx.fillRect(0,0,1024,9);
 ctx.fillStyle="#e8cd96";ctx.font="700 29px Arial";ctx.letterSpacing="3px";ctx.textAlign="center";
 ctx.fillText(title,512,74);
 ctx.fillStyle="#f0f5fa";ctx.font="900 91px Arial";ctx.letterSpacing="0px";ctx.fillText(sub,512,213);
 ctx.fillStyle="#a4cadd";ctx.font="700 26px Arial";ctx.letterSpacing="2px";ctx.fillText(foot,512,313);
 ctx.fillStyle="#e8cd96";ctx.fillRect(0,375,1024,9);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
function board(root:THREE.Group,tex:THREE.Texture,x:number,y:number,z:number,w:number,h:number,rotationY=0){
 const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotationY;root.add(group);
 const bezel=make(0x101b26,.62,.37),support=make(0x8797a2,.75,.38);
 box(group,bezel,w+.22,h+.2,.11,0,0,-.085);
 const m=mesh(group,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}),0,0,0);
 m.renderOrder=3;
 for(const dx of [-w/2,w/2])box(group,support,.065,h+.2,.15,dx,0,-.11);
 return group;
}
function goalNet(root:THREE.Group) {
 // Actual net in three dimensions, including a roof and sloping back.
 const lines:number[]=[];
 const z=-101,depth=3.6,width=7.5,height=2.56;
 const segment=(ax:number,ay:number,az:number,bx:number,by:number,bz:number)=>{
  lines.push(ax,ay,az,bx,by,bz);
 };
 for(let x=-width/2;x<=width/2+.001;x+=.30){
  segment(x,.02,z,x,.02,z-depth);
  segment(x,height,z,x,height-.28,z-depth);
  segment(x,.02,z-depth,x,height-.28,z-depth);
 }
 for(let y=0;y<height;y+=.29){
  segment(-width/2,y,z-depth,width/2,y,z-depth);
  segment(-width/2,y,z,-width/2,y,z-depth);
  segment(width/2,y,z,width/2,y,z-depth);
 }
 for(let d=0;d<depth;d+=.3){
  segment(-width/2,height-d*.08,z-d,width/2,height-d*.08,z-d);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(lines,3));
 const m=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xd4e8eb,transparent:true,opacity:.67,depthWrite:false}));
 root.add(m);
}
function bench(root:THREE.Group,x:number,z:number,facingRight:boolean){
 const metal=make(0xa2b1b6,.8,.31),padded=make(0x23415c,.25,.77),
 frame=make(0x536774,.61,.46),glass=make(0xa6d5e9,.08,.08);
 const sub=new THREE.Group();sub.position.set(x,0,z);sub.rotation.y=facingRight?-Math.PI/2:Math.PI/2;root.add(sub);
 // Aluminum canopy with curved roof rails and glazed walls.
 const curve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.4,.05,-.6),new THREE.Vector3(-2.7,1.55,-.76),
  new THREE.Vector3(-2.45,2.4,-.45),new THREE.Vector3(0,2.64,-.55),
  new THREE.Vector3(2.45,2.4,-.45),new THREE.Vector3(2.7,1.55,-.76),
  new THREE.Vector3(2.4,.05,-.6)
 ]);
 const arch=new THREE.Mesh(new THREE.TubeGeometry(curve,30,.055,7,false),metal);sub.add(arch);
 for(const dz of [-.57,.56]){const v=arch.clone();v.position.z+=dz;sub.add(v);}
 const roof=box(sub,glass,5, .09,1.44,0,2.48,-.08);
 roof.material=new THREE.MeshStandardMaterial({color:0xb7ddea,metalness:.18,roughness:.19,transparent:true,opacity:.72,side:THREE.DoubleSide});
 for(const side of [-1,1]){
  box(sub,frame,.07,1.95,1.3,side*2.41,1.21,0);
  box(sub,metal,.09,.09,1.3,side*2.41,.4,0);
 }
 for(let i=0;i<5;i++){
  const px=-1.93+i*.97;
  // Ergonomic fitted seat: separate cushion, lumbar and two aluminum legs.
  const seat=mesh(sub,new THREE.CapsuleGeometry(.31,.24,5,12),padded,px,.60,.09);seat.rotation.z=Math.PI/2;seat.scale.set(.88,.55,1.15);
  const back=mesh(sub,new THREE.CapsuleGeometry(.31,.42,5,12),padded,px,1.13,-.33);back.rotation.x=-.17;back.scale.set(.92,.95,.64);
  for(const k of [-.26,.26])box(sub,metal,.045,.52,.08,px+k,.27,.02);
  const head=mesh(sub,new THREE.SphereGeometry(.12,8,8),metal,px,1.47,-.4);head.scale.set(1,.52,.38);
 }
 box(sub,metal,5.1,.07,.08,0,.3,-.62);
}
function cameraRig(root:THREE.Group,x:number,z:number) {
 const tripod=make(0x354654,.8,.3),body=make(0x1a242d,.72,.39),glass=make(0x6cb1d4,.2,.17,0x134c70,.4);
 const sub=new THREE.Group();sub.position.set(x,0,z);root.add(sub);
 for(let i=0;i<3;i++){
  const a=i*Math.PI*2/3,post=mesh(sub,new THREE.CylinderGeometry(.035,.055,2.6,7),tripod,Math.cos(a)*.33,1.18,Math.sin(a)*.33);
  post.rotation.z=Math.sin(a)*-.19;post.rotation.x=Math.cos(a)*.19;
 }
 box(sub,body,.62,.36,.86,0,2.55,0);
 const lens=mesh(sub,new THREE.CylinderGeometry(.15,.15,.42,18),body,0,2.55,-.56);
 lens.rotation.x=Math.PI/2;
 const face=mesh(sub,new THREE.CylinderGeometry(.132,.132,.04,16),glass,0,2.55,-.79);face.rotation.x=Math.PI/2;
 box(sub,tripod,.77,.055,.32,0,2.79,-.05);
}
export function buildStadiumSet(root:THREE.Group,mobile:boolean):SceneAssets{
 const textures:THREE.Texture[]=[];
 const animated:Array<(t:number)=>void>=[];
 const score=textPanel("FINAL DEL MUNDO 2030","ARG  1 — 1  ENG","89:54  ·  TIEMPO REGLAMENTARIO");
 const walk=textPanel("ACCESO EXCLUSIVO", "BANCO ARGENTINO","AUTORIZACIÓN / INFORME VALIDADO");
 const banner=textPanel("VIRALIO ORIGINALS","LA ÚLTIMA JUGADA","LLEVÁ LA INFORMACIÓN · CAMBIÁ LA FINAL");
 textures.push(score,walk,banner);
 // Tunnel scoreboard overhead, and a distant stadium jumbotron.
 board(root,walk,0,3.56,-5.15,3.55,.94);
 board(root,score,0,17,-42,22,7.1);
 const jumbotron=board(root,banner,0,17,-101,19,6.8);
 animated.push(t=>{jumbotron.position.y=17+Math.sin(t*.46)*.12;});
 // Technical benches and field-facing broadcast cameras, all real 3D.
 bench(root,-11,-20,false);bench(root,11,-20,true);
 cameraRig(root,-7.4,-13.5);cameraRig(root,7.4,-13.5);
 const runner=make(0x273842,.16,.85),line=make(0xd7ded0,.12,.76),
 ribbon=make(0x7cc5e5,.19,.28,0x2b89ac,.75),metal=make(0x6f8794,.73,.41);
 // Team technical area floor is physically distinct from the pitch.
 box(root,runner,23,.08,15,0,-.08,-14.5);
 for(const side of [-1,1]){
  box(root,line,.11,.024,13,side*10.9,-.035,-14.3);
  for(let i=0;i<7;i++){
   const z=-9.4-i*1.7;
   const post=mesh(root,new THREE.CylinderGeometry(.05,.07,1.1,9),metal,side*5.4,.56,z);
   post.castShadow=false;
  }
  box(root,ribbon,.12,.15,13,side*5.4,1.15,-14.45);
 }
 // Branding is part of the tunnel facade, not an external floating menu.
 for(const dx of [-4.5,4.5]){
  const screen=board(root,banner,dx,2.3,-6.34,2.3,.75);
  screen.scale.set(.94,1,1);
 }
 goalNet(root);
 // Recessed LED field advertising, purely emissive strips (no point lights).
 for(let i=0;i<22;i++){
  const x=-36+i*3.45;
  box(root,ribbon,3.36,.35,.08,x,.25,-32.2);
  box(root,metal,3.43,.09,.08,x,.02,-32.2);
 }
 if(!mobile){
  const photographer=make(0x344958,.23,.75);
  for(let i=0;i<6;i++){
   const x=-20+i*7;
   const t=mesh(root,new THREE.CapsuleGeometry(.29,.75,4,9),photographer,x,.84,-28.5);
   t.rotation.y=(i-2.5)*.25;
   box(root,metal,.44,.25,.45,x,1.43,-28.1);
  }
 }
 return {textures,animated};
}
