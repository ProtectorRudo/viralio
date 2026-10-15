import * as THREE from "three";

/**
 * Story-paced in-world sabotage without strobing or forcing a flashlight.
 * One brief power drop (65%, under a second), permanent diegetic wall
 * warnings and a low-cost emergency lamp. Light levels recover fully.
 */
export class CrisisDirector {
 private time=-1;
 private warningLeft:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
 private warningRight:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
 private emergency:THREE.PointLight;
 private originalHemi:number;
 private originalKey:number;
 private originalAmbient:number;
 private texture:THREE.CanvasTexture;
 private texturesDisposed=false;
 private emergencyIntensity=0;
 private pressure=0;
 constructor(
  private root:THREE.Group,
  private hemi:THREE.HemisphereLight,
  private ambient:THREE.AmbientLight,
  private key:THREE.DirectionalLight
 ){
  this.originalHemi=hemi.intensity;
  this.originalKey=key.intensity;
  this.originalAmbient=ambient.intensity;
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=350;
  const ctx=canvas.getContext("2d")!;
  ctx.clearRect(0,0,1024,350);
  ctx.fillStyle="#1a0609c9";ctx.fillRect(0,0,1024,350);
  ctx.strokeStyle="#fc5459";ctx.lineWidth=9;ctx.strokeRect(8,8,1008,334);
  ctx.fillStyle="#ff9591";ctx.font="800 34px Arial";ctx.textAlign="center";
  ctx.fillText("TRANSMISIÓN INTERVENIDA / CANAL PRIVADO",512,71);
  ctx.shadowBlur=24;ctx.shadowColor="#ff1717";ctx.fillStyle="#ff4447";
  ctx.font="900 96px Arial";ctx.fillText("TE ESTAMOS VIENDO",512,195);
  ctx.shadowBlur=0;ctx.fillStyle="#f4b4a8";ctx.font="bold 27px Arial";
  ctx.fillText("NO CONFÍES EN EL OPERADOR · EL TIEMPO SE TERMINA",512,281);
  this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({
   map:this.texture,toneMapped:false,transparent:true,opacity:0,
   depthWrite:false,side:THREE.DoubleSide
  });
  const geometry=new THREE.PlaneGeometry(3.5,1.19);
  this.warningLeft=new THREE.Mesh(geometry,material);
  this.warningLeft.position.set(-6.14,2.13,-.5);
  this.warningLeft.rotation.y=Math.PI/2;
  this.warningRight=new THREE.Mesh(geometry.clone(),material.clone());
  this.warningRight.position.set(6.14,2.13,-.5);
  this.warningRight.rotation.y=-Math.PI/2;
  this.root.add(this.warningLeft,this.warningRight);
  this.emergency=new THREE.PointLight(0xff4b3a,0,9,2);
  this.emergency.position.set(0,3,-2);
  this.root.add(this.emergency);
 }
 trigger(){
  if(this.time<0||this.time>16)this.time=0;
 }
 setPressure(remaining:number){this.pressure=remaining<=120?Math.min(1,(120-remaining)/120):0;}
 update(dt:number){
  if(this.time<0){
   this.emergency.intensity=this.pressure*.75;
   return;
  }
  this.time+=dt;
  // Exactly one dimmed 0.7 s power interruption, no flashing cycles.
  const dip=this.time<.75?Math.sin(Math.PI*this.time/.75)*.64:0;
  const factor=1-dip;
  this.hemi.intensity=this.originalHemi*factor;
  this.key.intensity=this.originalKey*factor;
  this.ambient.intensity=this.originalAmbient*(1-dip*.5);
  const reveal=Math.min(1,Math.max(0,(this.time-.35)/1.2));
  const accent=this.time<9?1:Math.max(.32,1-(this.time-9)*.09);
  (this.warningLeft.material as THREE.MeshBasicMaterial).opacity=reveal*accent*.93;
  (this.warningRight.material as THREE.MeshBasicMaterial).opacity=reveal*accent*.93;
  this.emergencyIntensity=2.8*reveal*Math.exp(-Math.max(0,this.time-1.4)*.27);
  this.emergency.intensity=this.emergencyIntensity+this.pressure*.75;
 }
 dispose(){
  this.hemi.intensity=this.originalHemi;
  this.key.intensity=this.originalKey;
  this.ambient.intensity=this.originalAmbient;
  this.root.remove(this.warningLeft,this.warningRight,this.emergency);
  this.warningLeft.geometry.dispose();this.warningRight.geometry.dispose();
  this.warningLeft.material.dispose();this.warningRight.material.dispose();
  this.texture.dispose();
  this.emergency.dispose();
  this.texturesDisposed=true;
 }
}
