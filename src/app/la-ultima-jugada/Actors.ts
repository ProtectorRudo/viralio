import * as THREE from "three";
import {FOOTBALL_ASSETS,loadFootballModel} from "./AssetLibrary";
import {clone as cloneRig} from "three/examples/jsm/utils/SkeletonUtils.js";

/** Original player rig provided CC0 by Quaternius; fallback keeps roles recognizable offline. */
const CHARACTER_GLB=FOOTBALL_ASSETS.player;
type Actor={group:THREE.Group;update:(t:number)=>void;dispose:()=>void};

function humanFallback(group:THREE.Group,color:number){
 const suit=new THREE.MeshStandardMaterial({color,roughness:.84,metalness:.05});
 const trousers=new THREE.MeshStandardMaterial({color:0x171f2b,roughness:.88});
 const skin=new THREE.MeshStandardMaterial({color:0xb88e74,roughness:.84});
 const dark=new THREE.MeshStandardMaterial({color:0x161921,roughness:.87});
 const shirt=new THREE.MeshStandardMaterial({color:0xdfe7e9,roughness:.73});
 const hair=new THREE.MeshStandardMaterial({color:0x211b18,roughness:.91});
 const local=new THREE.Group();group.add(local);
 const m=(g:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number)=>{
  const s=new THREE.Mesh(g,mat);s.position.set(x,y,z);s.castShadow=true;local.add(s);return s;
 };
 m(new THREE.CapsuleGeometry(.30,.69,8,16),suit,0,1.29,0);
 m(new THREE.BoxGeometry(.19,.39,.11),shirt,0,1.51,-.22);
 const neck=m(new THREE.CylinderGeometry(.11,.11,.18,11),skin,0,1.82,0);neck.castShadow=false;
 m(new THREE.SphereGeometry(.20,16,11),skin,0,2.05,0);
 const cap=m(new THREE.SphereGeometry(.21,16,9),hair,0,2.15,.03);cap.scale.set(1,.45,1);
 for(const dx of [-.17,.17]){
  const leg=m(new THREE.CapsuleGeometry(.118,.71,5,9),trousers,dx,.55,0);leg.rotation.z=dx*1.4;
  m(new THREE.CapsuleGeometry(.095,.22,4,9),dark,dx,.13,-.14);
 }
 const shoulderR=new THREE.Group();shoulderR.position.set(.37,1.63,0);local.add(shoulderR);
 const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.65,5,9),suit);
 arm.position.y=-.34;shoulderR.add(arm);
 m(new THREE.CapsuleGeometry(.105,.62,5,9),suit,-.39,1.30,0).rotation.z=-.13;
 const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),skin);
 hand.position.set(0,-.77,0);shoulderR.add(hand);
 const emblem=m(new THREE.BoxGeometry(.11,.085,.018),new THREE.MeshStandardMaterial({color:0x8fcdf3,roughness:.55}),-.17,1.62,-.32);
 emblem.castShadow=false;
 return {group:local,arm:shoulderR};
}
function attachRig(group:THREE.Group,tint:number,isCoach:boolean,ready:()=>boolean){
 loadFootballModel(CHARACTER_GLB).then(gltf=>{
  if(!ready())return;
  const rig=cloneRig(gltf.scene);
  const box=new THREE.Box3().setFromObject(rig);
  const dimensions=box.getSize(new THREE.Vector3());
  if(dimensions.y<.01)return;
  rig.scale.setScalar(1.94/dimensions.y);
  const bounds=new THREE.Box3().setFromObject(rig);
  const center=bounds.getCenter(new THREE.Vector3());
  rig.position.set(-center.x,-bounds.min.y,-center.z);
  rig.traverse(o=>{
   if(!(o instanceof THREE.Mesh))return;
   o.castShadow=true;
   const original=Array.isArray(o.material)?o.material:[o.material];
   const cloned=original.map(m=>m.clone());
   o.material=Array.isArray(o.material)?cloned:cloned[0];
   cloned.forEach(m=>{
    if(!(m instanceof THREE.MeshStandardMaterial))return;
    const name=m.name.toLowerCase();
    if(name.includes("skin")||name.includes("face")||name.includes("head"))return;
    if(name.includes("shirt")||name.includes("jersey")||name.includes("jacket")||name.includes("cloth")||name.includes("torso")){
     m.color.setHex(tint);m.roughness=isCoach ? .75 : .91;
    }
   });
  });
  group.add(rig);
  const fallback=group.getObjectByName("original-fallback");
  if(fallback)fallback.visible=false;
  const clip=gltf.animations.find(c=>/idle|talk|stand|wave/i.test(c.name))||gltf.animations[0];
  if(clip){
   const mixer=new THREE.AnimationMixer(rig);
   mixer.clipAction(clip).setEffectiveTimeScale(isCoach?.65:.45).play();
   (group.userData.animations as THREE.AnimationMixer[]).push(mixer);
  }
 }).catch(()=>{});
}
export function createCoach(root:THREE.Group,isAlive:()=>boolean):Actor{
 const group=new THREE.Group();
 // Coach waits just outside the right edge of the walkable tunnel entrance.
 group.position.set(.48,.02,-7.75);group.rotation.y=Math.PI-.23;root.add(group);
 group.userData.animations=[] as THREE.AnimationMixer[];
 const fallback=humanFallback(group,0x152e4b);
 fallback.group.name="original-fallback";
 const headset=new THREE.Group();fallback.group.add(headset);
 const wire=new THREE.Mesh(new THREE.TorusGeometry(.23,.023,5,21,Math.PI*1.07),
  new THREE.MeshStandardMaterial({color:0x111a23,metalness:.65,roughness:.27}));
 wire.position.set(0,2.08,0);wire.rotation.x=-.16;headset.add(wire);
 const clip=new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.045),new THREE.MeshStandardMaterial({color:0x232e35,metalness:.54}));
 clip.position.set(.26,2.09,-.08);headset.add(clip);
 const tablet=new THREE.Group();tablet.position.set(-.39,1.15,-.24);tablet.rotation.z=.2;fallback.group.add(tablet);
 const shell=new THREE.Mesh(new THREE.BoxGeometry(.35,.52,.04),new THREE.MeshStandardMaterial({color:0x18212a,metalness:.75,roughness:.25}));
 tablet.add(shell);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(.31,.48),new THREE.MeshBasicMaterial({color:0x73cbe9,toneMapped:false}));
 face.position.z=-.026;face.rotation.y=Math.PI;tablet.add(face);
 attachRig(group,0x1a3554,true,isAlive);
 let lastTick=0;
 return {
  group,
  update(t){
   if(fallback.group.visible)fallback.arm.rotation.x=-.23+Math.sin(t*.82)*.15;
   tablet.rotation.z=.23+Math.sin(t*.6)*.05;
   const dt=Math.max(0,Math.min(.06,t-lastTick));lastTick=t;
   for(const mixer of group.userData.animations as THREE.AnimationMixer[])mixer.update(dt);
  },
  dispose(){root.remove(group);}
 };
}
export function createIntruder(root:THREE.Group,isAlive:()=>boolean):Actor{
 const group=new THREE.Group();
 group.position.set(5.62,0,-3.15);group.rotation.y=Math.PI*.65;root.add(group);
 group.userData.animations=[] as THREE.AnimationMixer[];
 const fallback=humanFallback(group,0x1d2228);
 fallback.group.name="original-fallback";
 // Security operator is visible through a small reinforced glass window.
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(2,2.65),
  new THREE.MeshPhysicalMaterial({color:0x86b1c0,metalness:.08,roughness:.13,transparent:true,opacity:.17,side:THREE.DoubleSide,depthWrite:false}));
 glass.position.set(0,1.43,.88);group.add(glass);
 attachRig(group,0x20242b,false,isAlive);
 let lastTick=0;
 return {
  group,
  update(t){
   // The watcher unexpectedly retreats out of sight after a moment.
   const period=t%19.5;
   group.position.x=period<6?5.62:period<6.65?5.62+(period-6)*2.3:7.14;
   if(fallback.group.visible)fallback.arm.rotation.x=.1+Math.sin(t*.45)*.045;
   for(const mixer of group.userData.animations as THREE.AnimationMixer[])mixer.update(Math.min(t,1/25));
  },
  dispose(){root.remove(group);}
 };
}
