/* CASO M — animated masked intruder. Base rig/animations: three.js Soldier.glb
 * (MIT project examples). Original horror customization: masked hood, knife,
 * atmospheric PBR lighting. Does not intercept any game interactions.
 */
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
const mat=(color,roughness=.92,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const object=(geom,color,rough=.92,metal=0)=>new THREE.Mesh(geom,mat(color,rough,metal));
function findBone(root,regex){let found=null;root.traverse(o=>{if(!found&&o.isBone&&regex.test(o.name))found=o;});return found;}
function addHoodAndMask(head){
 const hood=object(new THREE.SphereGeometry(.19,24,18),0x121820);
 hood.scale.set(1.15,1.18,.91);hood.position.set(0,.065,-.015);head.add(hood);
 const face=object(new THREE.SphereGeometry(.123,26,20),0x77736b);
 face.scale.set(.9,1.22,.42);face.position.set(0,.047,.137);head.add(face);
 for(const x of [-.052,.052]){
  const socket=object(new THREE.SphereGeometry(.024,14,12),0x030608);
  socket.scale.set(1.2,.49,.28);socket.position.set(x,.075,.183);head.add(socket);
 }
 const mouth=object(new THREE.BoxGeometry(.051,.007,.006),0x1f2224);
 mouth.position.set(0,-.02,.187);head.add(mouth);
}
function addKnife(hand){
 const grip=object(new THREE.CylinderGeometry(.024,.03,.18,12),0x26211e);
 grip.position.set(0,-.12,.09);hand.add(grip);
 const guard=object(new THREE.BoxGeometry(.17,.027,.06),0x7a8388,.4,.6);
 guard.position.set(0,-.22,.09);hand.add(guard);
 const shape=new THREE.Shape();shape.moveTo(-.046,0);shape.lineTo(.046,0);
 shape.lineTo(.035,-.26);shape.lineTo(-.018,-.36);shape.closePath();
 const blade=object(new THREE.ExtrudeGeometry(shape,{depth:.013,bevelEnabled:true,bevelSize:.004,bevelThickness:.002,bevelSegments:1}),0xa3b0b7,.28,.7);
 blade.position.set(0,-.245,.085);hand.add(blade);
}
let active=null;const attempted=new WeakSet();
function clear(){
 if(!active)return;
 cancelAnimationFrame(active.raf);active.renderer.dispose();active.renderer.domElement.remove();active=null;
}
async function mount(canvas){
 const parent=canvas.parentElement;if(!parent)return;
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:"low-power"});
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
  renderer.domElement.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:0;width:100%;height:100%";
  renderer.domElement.dataset.testid="rescate-cinematic-canvas";
  parent.insertBefore(renderer.domElement,canvas.nextSibling);
 }catch{return;}
 const state={canvas,renderer,raf:0};active=state;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(68.86,1,.1,40);
 scene.add(new THREE.HemisphereLight(0x98a0a7,0x100d0f,.74));
 const red=new THREE.PointLight(0xc52d29,16,6.5,2);red.position.set(-.82,2.92,6.48);scene.add(red);
 const rim=new THREE.SpotLight(0xb9cdd0,12,11,Math.PI/3,.72,2);
 rim.position.set(1.8,3.08,3.82);rim.target.position.set(.32,1.2,5.65);scene.add(rim,rim.target);
 const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
 const context=shadowCanvas.getContext("2d");
 if(context){
  const g=context.createRadialGradient(32,32,1,32,32,32);
  g.addColorStop(0,"rgba(0,0,0,.48)");g.addColorStop(1,"rgba(0,0,0,0)");
  context.fillStyle=g;context.fillRect(0,0,64,64);
 }
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.85,.74),
  new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.014;scene.add(shadow);
 try{
  const gltf=await new GLTFLoader().loadAsync("./models/intruder.glb");
  if(active!==state)return;
  const actor=new THREE.Group(),body=gltf.scene;actor.add(body);scene.add(actor);
  const bbox=new THREE.Box3().setFromObject(body);
  const targetHeight=bbox.getSize(new THREE.Vector3()).y;
  const scale=THREE.MathUtils.clamp(1.93/Math.max(targetHeight,.2),.07,6);
  body.scale.setScalar(scale);body.position.y=-bbox.min.y*scale;
  body.traverse(o=>{
   if(!o.isMesh)return;
   o.frustumCulled=false;
   const alter=m=>{const c=m.clone();if(c.color)c.color.multiply(new THREE.Color(0x576169));
    if("roughness" in c)c.roughness=.91;if("metalness" in c)c.metalness=.07;return c;};
   o.material=Array.isArray(o.material)?o.material.map(alter):alter(o.material);
  });
  const head=findBone(body,/head$/i)||findBone(body,/head/i);
  if(head)addHoodAndMask(head);
  const hand=findBone(body,/(right.*hand|hand.*right|hand_r|r_hand)$/i);
  if(hand)addKnife(hand);
  else{const fallback=new THREE.Group();fallback.position.set(.47,.89,.16);body.add(fallback);addKnife(fallback);}
  const mixer=new THREE.AnimationMixer(body);
  const idleClip=gltf.animations.find(a=>/idle/i.test(a.name));
  const walkClip=gltf.animations.find(a=>/walk/i.test(a.name));
  const idle=idleClip&&mixer.clipAction(idleClip),walk=walkClip&&mixer.clipAction(walkClip);
  idle?.play();
  canvas.dataset.cinematicIntruder="ready";canvas.dataset.cinematicModel="skinned-glb";
  let previous=performance.now(),current="idle";
  function frame(now){
   if(active!==state)return;
   state.raf=requestAnimationFrame(frame);
   if(!canvas.isConnected){clear();return;}
   const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;
   const ratio=Math.min(devicePixelRatio||1,1.15);
   if(renderer.domElement.width!==Math.round(w*ratio)||renderer.domElement.height!==Math.round(h*ratio)){
    renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
   }
   const val=(key,otherwise)=>{const n=Number(canvas.dataset[key]);return Number.isFinite(n)?n:otherwise;};
   const x=val("cameraX",0),y=val("cameraY",1.67),z=val("cameraZ",3.6);
   const yaw=val("cameraYaw",0),pitch=val("cameraPitch",0);
   camera.position.set(x,y,z);
   camera.lookAt(x-Math.sin(yaw)*Math.cos(pitch),y+Math.sin(pitch),z-Math.cos(yaw)*Math.cos(pitch));
   const visible=canvas.dataset.intruderVisible==="yes",remaining=val("missionSeconds",180);
   const approach=val("intruderApproach",0);
   actor.visible=visible;shadow.visible=visible;
   actor.position.set(.32,0,6.28-approach);actor.rotation.y=(x-.32)*-.055;
   shadow.position.set(actor.position.x,.014,actor.position.z);
   const walking=visible&&remaining<=46&&approach>.08;
   if(walking&&current!=="walk"&&walk){idle?.fadeOut(.3);walk.reset().fadeIn(.3).play();current="walk";}
   else if(!walking&&current!=="idle"&&idle){walk?.fadeOut(.35);idle.reset().fadeIn(.35).play();current="idle";}
   canvas.dataset.intruderAnimation=walking?"walk":"idle";
   const dt=Math.min(.05,(now-previous)/1000);previous=now;
   if(visible){mixer.update(dt);red.intensity=remaining<=10?20:16;rim.intensity=remaining<=9?17:12;}
   renderer.render(scene,camera);
  }
  state.raf=requestAnimationFrame(frame);
 }catch(err){
  canvas.dataset.cinematicIntruder="fallback";
  console.warn("CASO M: cinematic model unavailable. Keeping safe original model.",err);
  if(active===state)clear();
 }
}
function observe(){
 const canvas=document.querySelector('[data-testid="rescate-webgl"]');
 if(canvas&&!attempted.has(canvas)){attempted.add(canvas);if(active)clear();void mount(canvas);}
 else if(!canvas&&active)clear();
 requestAnimationFrame(observe);
}
requestAnimationFrame(observe);
