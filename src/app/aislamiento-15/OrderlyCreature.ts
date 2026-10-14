/**
 * "EL CELADOR" — original three-dimensional creature identity.
 *
 * The moving base is a studio-owned rigged GLB and AnimationMixer. This layer
 * adds an original porcelain medical restraint mask, respirator hardware, a
 * tarnished head harness, sutures and signal LEDs. It is placed onto the rig
 * after scale normalization. It does not repaint professional body textures.
 */
import * as THREE from "three";
type CreaturePart={root:THREE.Group; animate:(seconds:number,chasing:boolean,distance:number)=>void; dispose:()=>void};
const bone = new THREE.MeshStandardMaterial({color:0xc1c1ad,roughness:.57,metalness:.04});
const enamel = new THREE.MeshStandardMaterial({color:0x405b57,metalness:.37,roughness:.49});
const leather = new THREE.MeshStandardMaterial({color:0x131a1b,roughness:.94});
const iron = new THREE.MeshStandardMaterial({color:0x65736e,metalness:.84,roughness:.4});
const rust = new THREE.MeshStandardMaterial({color:0x6f3b31,metalness:.43,roughness:.88});
const black = new THREE.MeshStandardMaterial({color:0x070b0d,roughness:.91});
const red = new THREE.MeshStandardMaterial({color:0xb62e24,emissive:0xe12b15,emissiveIntensity:1.2,roughness:.4});
const parts=[bone,enamel,leather,iron,rust,black,red];
function ellipsoid(parent:THREE.Group,name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material) {
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,22,16),material);
  m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;parent.add(m);return m;
}
function pipe(parent:THREE.Group,points:THREE.Vector3[],radius:number,material:THREE.Material) {
  const curve=new THREE.CatmullRomCurve3(points);
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(14,points.length*7),radius,7,false),material);
  m.castShadow=false;parent.add(m);return m;
}
function buckle(parent:THREE.Group,x:number,y:number,z:number){
  const base=new THREE.Mesh(new THREE.BoxGeometry(.09,.07,.055),iron);base.position.set(x,y,z);parent.add(base);
  const slot=new THREE.Mesh(new THREE.BoxGeometry(.058,.041,.012),black);slot.position.set(x,y,z-.032);parent.add(slot);
}
export function constructOrderlyIdentity():CreaturePart {
  const root=new THREE.Group();root.name="El Celador — máscara médica HÉLIX 015";
  // The blue-black scalp cover doubles as a fabric protector around the skull.
  ellipsoid(root,"Capucha de bioseguridad",0,.27,.08,.286,.405,.288,leather);
  // Stretched pale ceramic has a purposefully asymmetric shape and depth.
  const face=ellipsoid(root,"Máscara facial de porcelana",0,.24,-.151,.228,.309,.112,bone);
  face.rotation.z=-.027;
  ellipsoid(root,"Órbita izquierda",-.088,.30,-.246,.075,.07,.021,black);
  ellipsoid(root,"Órbita derecha",.092,.303,-.246,.077,.065,.024,black);
  ellipsoid(root,"Lente óptica descompuesta",.093,.305,-.274,.034,.033,.014,red);
  const gasket=ellipsoid(root,"Respirador militar",0,.122,-.249,.120,.088,.08,enamel);
  ellipsoid(root,"Filtro estriado",0,.113,-.315,.076,.065,.05,black);
  for(let i=0;i<5;i++){
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.103,.013,.019),iron);
    plate.position.set(0,.083+i*.017,-.358+i*.008);
    root.add(plate);
  }
  // A dark vertical seam and fracture pattern are real raised geometry.
  pipe(root,[new THREE.Vector3(.001,.514,-.225),new THREE.Vector3(.022,.451,-.251),new THREE.Vector3(-.018,.392,-.266),new THREE.Vector3(.025,.341,-.267)],.005,rust);
  pipe(root,[new THREE.Vector3(-.01,.392,-.266),new THREE.Vector3(-.036,.365,-.278),new THREE.Vector3(-.051,.302,-.261)],.003,iron);
  pipe(root,[new THREE.Vector3(.022,.451,-.251),new THREE.Vector3(.07,.47,-.223),new THREE.Vector3(.121,.439,-.206)],.0035,rust);
  // Anatomically anchored stainless collar ring and rivets.
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.228,.039,12,32),iron);
  collar.rotation.x=Math.PI/2;
  collar.position.set(0,-.087,-.003);root.add(collar);
  const strap1=new THREE.Mesh(new THREE.TorusGeometry(.266,.026,10,42),leather);
  strap1.rotation.x=Math.PI/2;strap1.position.set(0,.294,.064);root.add(strap1);
  buckle(root,-.249,.265,-.042);buckle(root,.249,.265,-.042);
  for(const x of [-.203,.203]){
    const pin=ellipsoid(root,"Perno de máscara",x,.14,-.210,.028,.027,.027,iron);
    pin.castShadow=false;
  }
  // Asymmetric breathing tubes convey life and supply readable moving detail.
  pipe(root,[new THREE.Vector3(.11,.102,-.25),new THREE.Vector3(.245,.015,-.16),new THREE.Vector3(.26,-.17,-.034)],.034,leather);
  pipe(root,[new THREE.Vector3(-.11,.104,-.25),new THREE.Vector3(-.215,.035,-.14),new THREE.Vector3(-.253,-.17,-.014)],.027,leather);
  for(const x of [-.125,.125]) {
    pipe(root,[new THREE.Vector3(x,-.124,-.054),new THREE.Vector3(x*1.2,-.21,.04),new THREE.Vector3(x*1.1,-.288,.086)],.014,iron);
  }
  const leftEye=ellipsoid(root,"Ojo sin luz",-.086,.302,-.276,.019,.018,.012,iron);
  const badge=ellipsoid(root,"Testigo de pulso",.203,.14,-.205,.017,.017,.01,red);
  const rest=face.scale.z;
  return {
    root,
    animate(seconds,chasing,distance){
      const inhale=(Math.sin(seconds*(chasing?3.9:1.9))+1)*.5;
      gasket.scale.z=.075+inhale*.012;
      face.scale.z=rest+inhale*.003;
      red.emissiveIntensity=distance<3.1?2.2+Math.sin(seconds*10)*.55:1.15+inhale*.3;
      badge.visible=chasing || distance<5;
      leftEye.visible=seconds%7>1;
      root.rotation.z=Math.sin(seconds*1.9)*.018;
    },
    dispose(){
      root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
      for(const p of parts)p.dispose();
    }
  };
}
