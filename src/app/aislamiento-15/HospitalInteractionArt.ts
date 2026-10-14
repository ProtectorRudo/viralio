/**
 * HÉLIX / 015 — detailed physical puzzle instrumentation.
 * All pieces are world-space 3D with shared PBR materials/meshes and no separate
 * interaction hit targets; original touch, distance and puzzle logic remain.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type Room = 0|1|2;
const box = new RoundedBoxGeometry(1,1,1,2,.045);
const cylinder = new THREE.CylinderGeometry(1,1,1,16);
const torusGeo = new THREE.TorusGeometry(1,.08,8,22);
const dark = new THREE.MeshStandardMaterial({color:0x182729,metalness:.5,roughness:.63});
const brushed = new THREE.MeshStandardMaterial({color:0x71827c,metalness:.73,roughness:.38});
const ceramic = new THREE.MeshStandardMaterial({color:0xa3b7ae,metalness:.1,roughness:.55});
const rubber = new THREE.MeshStandardMaterial({color:0x0a1112,metalness:.05,roughness:.9});
const signal = new THREE.MeshStandardMaterial({color:0x2ebc9d,emissive:0x137e74,emissiveIntensity:1.4,roughness:.35});
const warning = new THREE.MeshStandardMaterial({color:0xc45642,emissive:0x7e261a,emissiveIntensity:1.2,roughness:.5});
const amber = new THREE.MeshStandardMaterial({color:0xd7a068,emissive:0x884421,emissiveIntensity:.65,roughness:.36});
const surface = new THREE.MeshStandardMaterial({color:0x20363a,emissive:0x082522,emissiveIntensity:.45,metalness:.15,roughness:.33});
const mats=[dark,brushed,ceramic,rubber,signal,warning,amber,surface];
function part(p:THREE.Group,name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material=brushed){
  const m=new THREE.Mesh(box,mat);
  m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);
  m.castShadow=false;m.receiveShadow=true;p.add(m);return m;
}
function knob(p:THREE.Group,name:string,x:number,y:number,z:number,r:number,mat:THREE.Material,axis:"x"|"z"="x"){
  const m=new THREE.Mesh(cylinder,mat);
  m.name=name;m.position.set(x,y,z);m.scale.set(r,.07,r);
  m.rotation[axis]=Math.PI/2;p.add(m);return m;
}
function torus(p:THREE.Group,x:number,y:number,z:number,r:number,mat:THREE.Material){
  const m=new THREE.Mesh(torusGeo,mat);m.position.set(x,y,z);m.scale.setScalar(r);
  p.add(m);return m;
}
function at(scene:THREE.Scene,room:Room,name:string,x:number,y:number,z:number){
  const p=new THREE.Group();p.name=name;p.userData.chamber=room;
  p.position.set(x,y,z);scene.add(p);return p;
}
function label(p:THREE.Group,x:number,y:number,z:number,word:string,red=false,w=.75,h=.23){
  const c=document.createElement("canvas");c.width=512;c.height=128;
  const g=c.getContext("2d");if(!g)return undefined;
  g.fillStyle="#122426";g.fillRect(0,0,512,128);
  g.fillStyle=red?"#F3A98D":"#D7ECE1";
  g.font="bold 45px sans-serif";g.textAlign="center";
  g.fillText(word,256,75,490);
  g.strokeStyle="#4e827a";g.lineWidth=5;g.strokeRect(3,3,506,122);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));
  plane.position.set(x,y,z);p.add(plane);return map;
}
function bolts(p:THREE.Group,cx:number,cy:number,cz:number,w:number,h:number){
  const dummy=new THREE.Object3D(),inst=new THREE.InstancedMesh(cylinder,brushed,4);
  let idx=0;
  for(const dx of [-w/2+.07,w/2-.07])for(const dy of [-h/2+.07,h/2-.07]){
    dummy.position.set(cx+dx,cy+dy,cz);
    dummy.rotation.x=Math.PI/2;dummy.scale.set(.027,.019,.027);
    dummy.updateMatrix();inst.setMatrixAt(idx++,dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;p.add(inst);
}
function consoleArt(scene:THREE.Scene,t:THREE.Texture[]){
  const p=at(scene,0,"Terminal HÉLIX", -2.82,1.4,2.48);
  part(p,"Chasis electrónico",0,0,-.022,.64,.72,.18,dark);
  part(p,"Bisel pulido",0,0,.082,.60,.66,.035,brushed);
  part(p,"Goma del monitor",0,.06,.105,.52,.45,.018,rubber);
  part(p,"Cristal LCD",0,.06,.117,.48,.40,.015,surface);
  for(let i=0;i<5;i++)part(p,"Texto visor",-.13,.19-i*.055,.131,.18-i*.023,.012,.003,i===3?amber:signal);
  knob(p,"Luz de alerta",.23,-.23,.131,.027,signal);
  const k=at(scene,0,"Teclado de membrana", -2.82,1.13,2.78);
  part(k,"Base numérica",0,0,0,.68,.04,.43,dark);
  for(let j=0;j<3;j++)for(let i=0;i<4;i++)
    part(k,"Tecla física",-.24+j*.24,.028,-.14+i*.09,.17,.022,.063,i===3&&j===2?amber:ceramic);
  const map=label(p,0,-.31,.13,"SEC / P1 P2 P3",false,.55,.115);if(map)t.push(map);
}
function electrical(scene:THREE.Scene,room:Room,x:number,z:number,i:number,t:THREE.Texture[]){
  const p=at(scene,room,"Módulo de energía HÉLIX "+i,x,1.56,z+.36);
  part(p,"Caja de seguridad",0,0,.028,1.35,1.58,.085,dark);
  part(p,"Frontal aluminio",0,0,.085,1.27,1.51,.04,brushed);
  part(p,"Receso electrónico",0,-.05,.11,1.19,1.38,.035,dark);
  part(p,"Marco display",0,.38,.132,.77,.37,.022,rubber);
  part(p,"Vidrio display",0,.38,.15,.69,.29,.014,surface);
  for(let n=0;n<4;n++)part(p,"Medidor LED",-.22+n*.148,.42,.17,.075,.021,.004,n===3?warning:signal);
  for(let n=0;n<3;n++){
    const px=-.39+n*.39;
    knob(p,"Transformador",px,-.21,.17,.115,rubber);
    knob(p,"Bisel transformador",px,-.21,.21,.058,n===i?amber:brushed);
  }
  for(let n=0;n<8;n++)
    part(p,"Rejilla de alivio",-.38+(n%4)*.25,-.54+Math.floor(n/4)*.13,.15,.13,.025,.01,rubber);
  bolts(p,0,0,.17,1.28,1.5);
  const map=label(p,0,.66,.145,"CONTROL "+(i+1),true,.99,.16);if(map)t.push(map);
}
function oxygen(scene:THREE.Scene,t:THREE.Texture[]){
  const p=at(scene,1,"Regulador bipuerto",-.12,1.34,-18.37);
  part(p,"Cuerpo del regulador",0,0,.04,1.04,.87,.35,dark);
  part(p,"Borde sellado",0,0,.23,.94,.77,.035,brushed);
  part(p,"Placa de gas",0,0,.254,.83,.65,.02,dark);
  for(let n=0;n<2;n++){
    const x=n===0?-.29:.29;
    knob(p,"Portacelda",x,.07,.29,.145,rubber);
    knob(p,"Rosca",x,.07,.327,.082,brushed);
    torus(p,x,.07,.34,.11,n===0?signal:amber);
    part(p,"Semáforo de gas",x,-.19,.29,.20,.052,.035,n===0?signal:amber);
  }
  for(let i=0;i<5;i++)part(p,"Aleta refrigeración",-.37+i*.185,-.34,.295,.063,.029,.025,rubber);
  const map=label(p,0,.31,.28,"PRESIÓN NEGATIVA",false,.77,.12);if(map)t.push(map);
}
function fuse(scene:THREE.Scene,t:THREE.Texture[]){
  const p=at(scene,0,"Control de fusibles HÉLIX",-5.03,1.42,-1.5);
  p.rotation.y=Math.PI/2;
  part(p,"Caja de fusibles",-.025,0,0,.38,1.13,.93,dark);
  part(p,"Bisel empotrado",-.02,0,.48,.34,1.05,.034,brushed);
  part(p,"Carcasa sellada",-.025,.15,.50,.27,.65,.02,rubber);
  for(let i=0;i<4;i++){
    const y=.39-i*.2;
    part(p,"Cuchilla de alimentación",-.025,y,.523,.22,.125,.055,ceramic);
    part(p,"Diodo fusible",-.025,y,.557,.11,.04,.008,i===3?warning:signal);
  }
  bolts(p,0,0,.52,.31,1.0);
  const map=label(p,0,-.44,.53,"F-08",true,.26,.14);if(map)t.push(map);
}
function recording(scene:THREE.Scene,t:THREE.Texture[]){
  const p=at(scene,2,"Grabadora analógica y cinta",-4.28,1.28,-28.8);
  part(p,"Grabadora sellada",0,0,.04,.81,.23,.61,dark);
  part(p,"Carátula",0,.07,.38,.69,.11,.036,brushed);
  part(p,"Vidrio de cinta",0,.07,.405,.53,.075,.021,rubber);
  for(let n=0;n<2;n++)knob(p,"Carrete magnético",n===0?-.16:.16,.07,.42,.039,ceramic);
  for(let i=0;i<5;i++)part(p,"Tecla reproductora",-.29+i*.145,-.065,.405,.09,.04,.034,i===4?warning:brushed);
  const map=label(p,0,.185,.30,"ARCHIVO 015",true,.66,.10);if(map)t.push(map);
}
function relay(scene:THREE.Scene,n:number,t:THREE.Texture[]){
  const z=-3.6+n*1.3;
  const p=at(scene,0,"Relé de aislamiento "+(n+1),5.02,1.47,z);
  p.rotation.y=-Math.PI/2;
  part(p,"Chasis del relé",0,0,.02,.29,.74,.58,dark);
  part(p,"Bisel relé",-.08,0,.325,.11,.58,.43,brushed);
  for(let i=0;i<3;i++)part(p,"Indicador circuito",-.09,.15-i*.13,.37,.04,.031,.23,i===n?warning:signal);
  const map=label(p,-.105,-.265,.35,"R"+(n+1),false,.15,.10);if(map)t.push(map);
}
export function installHospitalInteractionArt(scene:THREE.Scene){
  const textures:THREE.Texture[]=[];
  consoleArt(scene,textures);
  oxygen(scene,textures);
  fuse(scene,textures);
  recording(scene,textures);
  for(let i=0;i<3;i++)relay(scene,i,textures);
  for(let i=0;i<3;i++)electrical(scene,2,[-3.7,3.7,3.7][i],-26+[1.4,1.4,-1.35][i],i,textures);
  return {dispose(){
    for(const tex of textures)tex.dispose();
    for(const m of mats)m.dispose();
    box.dispose();cylinder.dispose();torusGeo.dispose();
  }};
}
