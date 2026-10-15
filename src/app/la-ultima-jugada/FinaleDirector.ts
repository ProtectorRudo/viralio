import * as THREE from "three";

type FinaleCue="apertura"|"pase"|"centro"|"gol";
type Hook={cue:(cue:FinaleCue)=>void;complete:()=>void};

/** Unskippable 10-second in-world climax, separate from interaction systems. */
export class FinaleDirector {
 private elapsed=0;
 private emitted=new Set<FinaleCue>();
 private ball:THREE.Group;
 private confetti:THREE.InstancedMesh;
 private confettiDummy=new THREE.Object3D();
 private confettiXYZ:Array<{x:number;y:number;z:number;speed:number;spin:number}>=[];
 private finished=false;
 private startPosition=new THREE.Vector3();
 private fov:number;
 constructor(private world:THREE.Group, private camera:THREE.PerspectiveCamera,private hook:Hook){
  this.startPosition.copy(camera.position);
  this.fov=camera.fov;
  this.ball=new THREE.Group();
  const white=new THREE.MeshStandardMaterial({color:0xf5f2e8,roughness:.68,metalness:.0});
  const ink=new THREE.MeshStandardMaterial({color:0x15232c,roughness:.8});
  const main=new THREE.Mesh(new THREE.SphereGeometry(.39,24,16),white);
  main.castShadow=true;this.ball.add(main);
  for(let i=0;i<10;i++){
   const a=i*Math.PI*2/10,b=i%2===0?.38:-.28;
   const pentagon=new THREE.Mesh(new THREE.CircleGeometry(.115,5),ink);
   pentagon.position.set(.387*Math.cos(a)*Math.cos(b),.387*Math.sin(b),.387*Math.sin(a)*Math.cos(b));
   pentagon.lookAt(0,0,0);pentagon.rotateY(Math.PI);this.ball.add(pentagon);
  }
  this.world.add(this.ball);
  const geo=new THREE.PlaneGeometry(.14,.075);
  const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,color:0xffffff,depthWrite:false,transparent:true,opacity:.88});
  this.confetti=new THREE.InstancedMesh(geo,mat,380);
  const colors=[0xa4e5fc,0xffffff,0xe9b65b,0x8bccf4];
  let seed=492171;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<380;i++){
   this.confettiXYZ.push({x:(random()-.5)*26,y:10+random()*13,z:-27-random()*16,speed:.55+random()*2.4,spin:random()*9});
   this.confetti.setColorAt(i,new THREE.Color(colors[i%4]));
  }
  this.confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.confetti.visible=false;this.world.add(this.confetti);
 }
 private cue(name:FinaleCue,after:number){
  if(this.elapsed<after||this.emitted.has(name))return;
  this.emitted.add(name);this.hook.cue(name);
 }
 update(dt:number){
  if(this.finished)return;
  this.elapsed+=dt;
  const t=this.elapsed;
  this.cue("apertura",.3);this.cue("pase",2.65);this.cue("centro",5.1);this.cue("gol",7.6);
  const approach=THREE.MathUtils.smoothstep(t,0,2.5);
  let cx=THREE.MathUtils.lerp(this.startPosition.x,6,approach);
  let cy=THREE.MathUtils.lerp(this.startPosition.y,6,approach);
  let cz=THREE.MathUtils.lerp(this.startPosition.z,-33,approach);
  const shot=THREE.MathUtils.smoothstep(t,2.5,7.6);
  cx=THREE.MathUtils.lerp(cx,11,shot);
  cy=THREE.MathUtils.lerp(cy,5,shot);
  cz=THREE.MathUtils.lerp(cz,-78,shot);
  if(t>=7.6){
   const celebration=THREE.MathUtils.smoothstep(t,7.6,10);
   cy+=celebration*7;cz-=celebration*4;cx+=celebration*2;
   this.confetti.visible=true;
   for(let i=0;i<this.confettiXYZ.length;i++){
    const c=this.confettiXYZ[i];
    this.confettiDummy.position.set(c.x,c.y-(t-7.6)*c.speed,c.z);
    this.confettiDummy.rotation.set(t*c.spin*.32,i*.61,t*c.spin*.67);
    this.confettiDummy.updateMatrix();this.confetti.setMatrixAt(i,this.confettiDummy.matrix);
   }
   this.confetti.instanceMatrix.needsUpdate=true;
  }
  this.camera.position.set(cx,cy,cz);
  this.camera.fov=THREE.MathUtils.lerp(this.fov,52,approach);
  this.camera.updateProjectionMatrix();
  const p=THREE.MathUtils.clamp((t-1.5)/6,0,1);
  let bx=-22+39*THREE.MathUtils.smoothstep(p,0,.72);
  let bz=-51-43*p;let by=.10;
  if(t>=6.5){const q=THREE.MathUtils.clamp((t-6.5)/1.1,0,1);bx=THREE.MathUtils.lerp(bx,0,q);bz=THREE.MathUtils.lerp(bz,-102,q);by=.1+2.5*Math.sin(q*Math.PI);}
  this.ball.position.set(bx,by,bz);
  this.ball.rotation.x+=dt*9;this.ball.rotation.z+=dt*3;
  const look=this.ball.position.clone();
  if(t<2.5)look.set(-4,.2,-72);
  if(t>=7.6)look.set(0,1.6,-100);
  this.camera.lookAt(look);
  if(t>=10.8){this.finished=true;this.hook.complete();}
 }
 dispose(){
  this.world.remove(this.ball);this.world.remove(this.confetti);
  this.ball.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});
  this.confetti.geometry.dispose();(this.confetti.material as THREE.Material).dispose();
 }
}