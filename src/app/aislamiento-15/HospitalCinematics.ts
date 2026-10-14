/**
 * AISLAMIENTO 15 — cinematic art director.
 * Entirely real Three.js world geometry and emissive surfaces. No flat photo
 * background or simulated 3D; 3D masks, railings, screens, cables and lights.
 * Each chamber is independently culled by the existing game world.
 */
import * as THREE from "three";

type Room = 0 | 1 | 2;
type UpdateInput = { elapsed: number; danger: number; room: Room; threat: number };
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1);
const TUBE = new THREE.TorusGeometry(1, .055, 7, 28);
const PANEL = new THREE.PlaneGeometry(1, 1);
const steel = new THREE.MeshStandardMaterial({ color: 0x506361, metalness: .78, roughness: .36 });
const titanium = new THREE.MeshStandardMaterial({ color: 0x81918a, metalness: .76, roughness: .29 });
const gasket = new THREE.MeshStandardMaterial({ color: 0x131c1c, roughness: .84 });
const porcelain = new THREE.MeshStandardMaterial({ color: 0x8eada4, roughness: .45, metalness: .08 });
const bloody = new THREE.MeshStandardMaterial({ color: 0x512520, roughness: .94, transparent: true, opacity: .75 });
const crimson = new THREE.MeshStandardMaterial({ color: 0xd55242, emissive: 0xb6201a, emissiveIntensity: 1.35, metalness: .22, roughness: .35 });
const cyan = new THREE.MeshStandardMaterial({ color: 0x8be8d7, emissive: 0x1b8e8e, emissiveIntensity: 1.35, roughness: .35 });
const gold = new THREE.MeshStandardMaterial({ color: 0xffc68f, emissive: 0xc06a27, emissiveIntensity: 1.2, roughness: .35 });
const insulated = new THREE.MeshStandardMaterial({ color: 0x242b2b, roughness: .91 });
const dust = new THREE.MeshStandardMaterial({ color: 0x1d3333, roughness: .96 });
const shared = [BOX, CYL, TUBE, PANEL];
const mats = [steel, titanium, gasket, porcelain, bloody, crimson, cyan, gold, insulated, dust];

function b(parent: THREE.Group, name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material = steel) {
  const m = new THREE.Mesh(BOX, mat);
  m.name = name; m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = sx > .22 && sx < 2.5 && sy < 2.8; m.receiveShadow = true;
  parent.add(m); return m;
}
function cylinder(parent: THREE.Group, name: string, x: number, y: number, z: number, radius: number, h: number, mat: THREE.Material, horiz = false) {
  const m = new THREE.Mesh(CYL, mat);
  m.name = name; m.position.set(x, y, z); m.scale.set(radius, h, radius);
  if (horiz) m.rotation.x = Math.PI/2;
  m.castShadow = radius > .18; parent.add(m); return m;
}
function loop(parent: THREE.Group, x: number, y: number, z: number, radius: number, mat: THREE.Material, horizontal = false) {
  const m = new THREE.Mesh(TUBE, mat);
  m.position.set(x, y, z); m.scale.setScalar(radius);
  if (horizontal) m.rotation.x = Math.PI/2;
  parent.add(m); return m;
}
function plate(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, label: string, mode: "dark" | "red" | "green" = "dark") {
  const c = document.createElement("canvas");
  c.width = 768; c.height = 250;
  const g = c.getContext("2d");
  if (!g) return;
  g.fillStyle = mode === "red" ? "#431f1a" : mode === "green" ? "#103b33" : "#142c2c";
  g.fillRect(0,0,768,250);
  g.strokeStyle = mode === "red" ? "#b54f43" : "#598b80";
  g.lineWidth = 12; g.strokeRect(13,13,742,224);
  g.fillStyle = mode === "red" ? "#f2c0b0" : "#d6ede3";
  g.font = "bold 60px Arial, sans-serif"; g.textAlign = "center";
  g.fillText(label,384,127,720);
  g.fillStyle = "#85a89e";
  g.font = "25px monospace";
  g.fillText("HÉLIX //  UNIDAD 015  //  RESTRINGIDO",384,192,725);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));
  m.position.set(x,y,z);
  parent.add(m); return t;
}
function warningStrips(group: THREE.Group, x: number, z: number, length: number) {
  // Thin raised hazard marking. Avoid filling the middle of the walkway.
  for (let i=0;i<9;i++) {
    const strip = b(group,"Franja señalización",x, .027, z-length*.5+i*length/8, .11,.016,.27,gold);
    strip.rotation.y = i%2 ? .48 : -.48;
  }
}
function buildRoom0(root: THREE.Group, textures: THREE.Texture[]) {
  // Clear player centerline while making both lateral walls feel lived-in.
  for(const t of [
    plate(root, -3.42, 2.82, -6.24, 2.15,.68,"ARCHIVO SANITARIO"),
    plate(root, 3.45, 2.83,-6.24, 2.08,.68,"SECTOR 015", "red")
  ]) if(t) textures.push(t);
  b(root,"Pantalla de fisiología",4.82,2.0,-3.8,.25,.81,1.15,gasket);
  b(root,"Chasis de pantalla",4.70,2.0,-3.8,.03,.62,.92,steel);
  // Subtle luminous monitor stripes.
  for (let i=0;i<17;i++) {
    const z=-4.19+i*.047;
    const h=.055+(Math.sin(i*.88)+Math.sin(i*1.31))*.026;
    b(root,"Electrocardiograma",4.675,2.02+h,z,.016,.019,.025,i%4===0?crimson:cyan);
  }
  const brackets=[-4.72,-3.56];
  for (const z of brackets) {
    const frame=b(root,"Lámpara de pared",4.83,2.80,z,.32,.15,.62,titanium);
    b(root,"Fósforo señalética",4.665,2.79,z,.012,.095,.44,cyan);
    frame.castShadow=false;
  }
  // Physical examination tray and used surgical accessories.
  const tray=b(root,"Bandeja quirúrgica",-3.98,1.13,-3.24,.74,.032,.45,titanium);
  tray.rotation.y=.24;
  for(let i=0;i<4;i++) {
    const instrument=b(root,"Pinza de acero",-4.23+i*.13,1.16,-3.19,.032,.015,.35,steel);
    instrument.rotation.y=.14;
  }
  // Ceiling sprinkler and lab numbers give believable manufacturing detail.
  for (let i=0;i<6;i++) {
    const zz=3.2-i*1.38;
    cylinder(root,"Rociador emergencia",-2.13,3.68,zz,.09,.17,titanium);
    loop(root,-2.13,3.59,zz,.14,steel,true);
  }
  // Narrative smears are localized to the corner with the abandoned patient.
  for(let i=0;i<5;i++) {
    const x=3.88+(i*.151), z=-3.32+i*.23;
    const smudge=b(root,"Rastro antiguo",x,.02,z,.09+i*.028,.006,.18,bloody);
    smudge.rotation.y=(i-.8)*.34;smudge.castShadow=false;
  }
  warningStrips(root, 3.98, -3.48, 2.6);
}
function buildRoom1(root: THREE.Group,textures: THREE.Texture[]) {
  for(const t of [
    plate(root,-3.35,2.76,-19.24,2.15,.62,"PELIGRO BIOLÓGICO","red"),
    plate(root,3.52,2.75,-19.24,2.15,.62,"OXÍGENO CRÍTICO","red")
  ]) if(t) textures.push(t);
  // Three real chamber glass enclosures rather than a glowing flat photo.
  const podPositions=[[-4.04,-10.8],[4.04,-12.8],[-4.04,-13.55]] as const;
  for(let i=0;i<3;i++) {
    const [x,z]=podPositions[i];
    b(root,"Jaula cristal biológico",x,1.9,z+.50,2.27,1.7,.055,gasket);
    const window=b(root,"Cristal de contención",x,1.88,z+.54,1.98,1.46,.035,
      new THREE.MeshPhysicalMaterial({color:0x7faaa1,metalness:.13,roughness:.19,transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide}));
    window.castShadow=false;
    for(const sx of [-.95,.95]) {
      b(root,"Fijación del vidrio",x+sx,1.89,z+.57,.053,1.55,.055,titanium);
      for (let j=0;j<5;j++) {
        b(root,"Remache",x+sx,1.18+j*.32,z+.61,.08,.055,.03,steel);
      }
    }
    b(root,"Junta inferior",x,1.07,z+.59,2.03,.09,.065,steel);
    b(root,"Umbral superior",x,2.67,z+.59,2.03,.11,.065,steel);
    // LED rail with intermittent single fault per pod.
    b(root,"Aro de seguridad",x,2.72,z+.59,1.69,.025,.03,i===1?crimson:cyan);
  }
  // Figure stays in an enclosed chamber, not a fake interactive enemy.
  const body = new THREE.Group();body.name="Paciente detrás del vidrio";
  body.position.set(4.04,.1,-12.80);root.add(body);
  const shadow=new THREE.MeshStandardMaterial({color:0x121a1b,roughness:.97});
  b(body,"Torso paciente",0,1.24,0,.36,.93,.27,shadow);
  cylinder(body,"Cabeza paciente",0,1.94,0,.16,.34,shadow);
  for (const side of [-1,1]) {
    b(body,"Brazo paciente",side*.25,1.22,.03,.12,.84,.16,shadow);
    b(body,"Pierna paciente",side*.12,.56,.04,.13,.82,.18,shadow);
  }
  // Controlled fog drift is volumetric-impression geometry only, not expensive fluid particles.
  const cloud = new THREE.Group();root.add(cloud);
  const mistMaterial=new THREE.MeshBasicMaterial({color:0x9dc8c1,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide});
  for(let n=0;n<5;n++){
    const p=new THREE.Mesh(new THREE.PlaneGeometry(.45+n*.12,1.07),mistMaterial);
    p.position.set(-4.2+n*.26,1.2,-13.2-n*.88);
    p.rotation.y=Math.PI/2;cloud.add(p);
  }
  warningStrips(root,4.25,-17.2,2.8);
  return {body,cloud};
}
function buildRoom2(root: THREE.Group, textures: THREE.Texture[]) {
  for(const t of [
    plate(root,-3.4,2.8,-32.25,2.21,.7,"REACTOR HÉLIX","red"),
    plate(root,3.34,2.8,-32.25,2.1,.7,"CIERRE AUTOMÁTICO","red")
  ]) if(t) textures.push(t);
  const reactor=new THREE.Group();
  reactor.position.set(-4.10,0,-26.95);root.add(reactor);
  // Detailed grounded cylinder with rotating solenoid and dark frame.
  cylinder(reactor,"Base reactor",0,.17,0,.78,.34,steel);
  cylinder(reactor,"Doble camisa",0,1.42,0,.63,2.18,gasket);
  cylinder(reactor,"Núcleo termoiónico",0,1.44,0,.45,1.95,new THREE.MeshPhysicalMaterial({
    color:0x267872,transmission:0,transparent:true,opacity:.77,roughness:.12,metalness:.28,emissive:0x0a5c54,emissiveIntensity:.66
  }));
  for(const y of [.47,.85,1.25,1.66,2.04,2.48]) {
    loop(reactor,0,y,0,.61, y===1.25 || y===2.04?crimson:titanium,true);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const x=Math.cos(a)*.64,z=Math.sin(a)*.64;
    b(reactor,"Varilla reactora",x,1.48,z,.07,2.27,.07,titanium);
    b(reactor,"Tornillo base",x,.26,z,.13,.1,.13,steel);
  }
  cylinder(reactor,"Cámara superior",0,2.65,0,.8,.28,steel);
  b(reactor,"Cableado trasero",.25,1.65,.8,.13,1.56,.12,insulated);
  const core=new THREE.Group();reactor.add(core);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    const slice=b(core,"Condensador iluminado",Math.cos(a)*.47,1.46,Math.sin(a)*.47,.09,.8,.15,i%2?cyan:crimson);
    slice.rotation.y=a;
  }
  // Gauge desk: shape and emissive LEDs are actual meshes.
  const instrument=new THREE.Group();instrument.position.set(4.55,0,-28.9);root.add(instrument);
  b(instrument,"Caja instrumental",0,1.1,0,.54,1.06,1.75,gasket);
  for(let i=0;i<5;i++) {
    b(instrument,"Módulo medidor",- .29,1.36,-.66+i*.32,.055,.31,.24,steel);
    cylinder(instrument,"Indicador",-.335,1.40,-.66+i*.32,.055,.014,i===4?crimson:cyan,true);
  }
  for(let i=0;i<4;i++) {
    const strip=b(root,"Cinta roja aislamiento",3.7,.027,-29.3-i*.49,.47,.019,.12,crimson);
    strip.rotation.y=.15;
  }
  return {core};
}
export function installHospitalCinematics(scene:THREE.Scene){
  const roots:THREE.Group[]=[];
  const textures:THREE.Texture[]=[];
  const roomZ=[0,-13,-26] as const;
  for(let room=0;room<3;room++){
    const root=new THREE.Group();
    root.name=["HÉLIX :: URGENCIAS","HÉLIX :: AISLAMIENTO","HÉLIX :: CONTENCIÓN"][room];
    root.userData.chamber=room;scene.add(root);roots.push(root);
  }
  buildRoom0(roots[0],textures);
  const isolation = buildRoom1(roots[1],textures);
  const containment=buildRoom2(roots[2],textures);
  const strobeLights:THREE.PointLight[]=[];
  const colors=[0xde755c,0x78c5ae,0xf05d4d];
  for(let i=0;i<3;i++){
    const z=roomZ[i]-4.7;
    const lx=i===2?2.8:4.55;
    const lamp=new THREE.PointLight(colors[i],0,4.8,2);
    lamp.position.set(lx,2.78,z);
    lamp.userData.chamber=i;
    lamp.castShadow=false;scene.add(lamp);strobeLights.push(lamp);
    const lens=b(roots[i],"Balcón de alarma",lx,2.92,z,.22,.17,.22,gasket);
    lens.castShadow=false;
    b(roots[i],"Lente emergencia",lx,2.8,z+.11,.16,.08,.035,i===1?cyan:crimson).castShadow=false;
  }
  let cueKind: "glass"|"lights"|"reactor"|"knock"|null=null;
  let cueUntil=-100;
  return {
    cue(kind:"glass"|"lights"|"reactor"|"knock",seconds:number){
      cueKind=kind;
      cueUntil=seconds+(kind==="reactor"?6.5:kind==="glass"?5:2.0);
    },
    update({elapsed,danger,room,threat}:UpdateInput){
      const cueActive=elapsed<cueUntil;
      const podActive=room===1 && ((elapsed%94>21 && elapsed%94<26)||(cueActive && cueKind==="glass"));
      isolation.body.visible=podActive;
      if(podActive) isolation.body.rotation.y=Math.sin(elapsed*1.4)*.065;
      isolation.cloud.position.z=Math.sin(elapsed*.14)*.12;
      containment.core.rotation.y=elapsed*(cueActive&&cueKind==="reactor"?.69:.15);
      containment.core.position.y=Math.sin(elapsed*(cueActive&&cueKind==="reactor"?7.2:1.7))*(cueActive?.072:.045);
      for(let i=0;i<3;i++){
        const active=room===i && (danger>.7 || (i===1 && podActive) || (i===2 && threat>.7) || cueActive);
        const flash= i===1 ? .28+.2*Math.sin(elapsed*3.6) : Math.sin(elapsed*(danger>.8?11:4))>.52?1:0;
        strobeLights[i].intensity=active ? (cueActive ? Math.max(0,.7+Math.sin(elapsed*11)*1.4) : (i===1? .45+Math.max(0,flash)*.65 : Math.max(0,flash)*2.1)) : 0;
      }
      crimson.emissiveIntensity=1.1+(danger>.85?Math.max(0,Math.sin(elapsed*5))*.7:0);
      cyan.emissiveIntensity=1.1+.14*Math.sin(elapsed*2.1);
    },
    dispose(){
      for(const t of textures)t.dispose();
      for(const m of mats)m.dispose();
      for(const geo of shared)geo.dispose();
      for(const root of roots){
        root.traverse(o=>{
          if(o instanceof THREE.Mesh && !shared.includes(o.geometry))o.geometry.dispose();
          if(o instanceof THREE.Mesh){
            const a=Array.isArray(o.material)?o.material:[o.material];
            for(const mat of a)if(!mats.includes(mat))mat.dispose();
          }
        });
      }
    }
  };
}
