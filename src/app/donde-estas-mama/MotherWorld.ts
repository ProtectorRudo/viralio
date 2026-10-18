import * as THREE from "three";
import { loadViralio3DAsset } from "@/lib/viralio-3d";
import { loadViralioPBR } from "@/lib/viralio-rooms";

export type MotherStage = 0 | 1 | 2;
type Spot = { id: string; mesh: THREE.Object3D; ring: THREE.Mesh; stage: MotherStage };
type AssetSpec = {id:string; stage:MotherStage; x:number; z:number; width:number; depth?:number; rotate?:number};
const centers = [0,-8,-16] as const;
const ink = new THREE.Color(0x121019);

export class MotherWorld {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(66,1,0.06,80);
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private frame = 0;
  private running = true;
  private spots: Spot[] = [];
  private eventLights: THREE.PointLight[] = [];
  private stage: MotherStage = 0;
  private yaw = 0;
  private pitch = -0.04;
  private activePointers = new Map<number, {x:number;y:number}>();
  private gesture: {x:number;y:number; moved:boolean} | null = null;
  private touchDistance = 0;
  private movement = { forward:0, strafe:0 };
  private flickerUntil = 0;
  private celebratory = false;
  private warmLights: THREE.PointLight[] = [];
  private dynamicProps: THREE.Object3D[] = [];
  private sceneSurprise: THREE.Mesh | null = null;
  private fallenFrame: THREE.Mesh | null = null;
  private sceneMoved = new Set<number>();
  onInteract: (id:string)=>void = ()=>{};
  onFocus: (label:string)=>void = ()=>{};
  onNotice: (message:string)=>void = ()=>{};
  private lastFocus = "";
  private resizeObserver: ResizeObserver;
  private readonly surface: HTMLElement;
  private readonly handlePointerDown = (e:PointerEvent)=>{
    this.surface.setPointerCapture(e.pointerId);
    this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.activePointers.size===1)this.gesture={x:e.clientX,y:e.clientY,moved:false};
    if(this.activePointers.size===2){
      const p=[...this.activePointers.values()];
      this.touchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      this.gesture=null;
    }
  };
  private readonly handlePointerMove = (e:PointerEvent)=>{
    const prev=this.activePointers.get(e.pointerId);
    if(!prev)return;
    this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.activePointers.size===2){
      const p=[...this.activePointers.values()];
      const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      if(this.touchDistance) this.camera.fov=THREE.MathUtils.clamp(this.camera.fov+(this.touchDistance-d)*.13,48,78);
      this.camera.updateProjectionMatrix();
      this.touchDistance=d;
      return;
    }
    const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    if(this.gesture&&Math.hypot(e.clientX-this.gesture.x,e.clientY-this.gesture.y)>6)this.gesture.moved=true;
    if(this.gesture?.moved){
      this.yaw-=dx*.0043;
      this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0035,-.66,.65);
      this.setRotation();
    }
  };
  private readonly handlePointerUp = (e:PointerEvent)=>{
    const prev=this.gesture;
    this.activePointers.delete(e.pointerId);
    this.touchDistance=0;
    this.gesture=null;
    if(prev&&!prev.moved)this.tap(e.clientX,e.clientY);
  };

  constructor(surface:HTMLElement){
    this.surface=surface;
    this.scene.background=new THREE.Color(0x121016);
    this.scene.fog=new THREE.FogExp2(0x100d12,.018);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.27;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute("aria-label","Casa tridimensional interactiva. Deslizá para mirar y tocá las pistas brillantes.");
    this.surface.appendChild(this.renderer.domElement);
    this.camera.position.set(0,1.65,2.4);
    this.setRotation();
    this.scene.add(new THREE.HemisphereLight(0xc8d1e7,0x32221b,1.05));
    this.buildRooms();
    this.buildProps();
    this.surface.addEventListener("pointerdown",this.handlePointerDown);
    this.surface.addEventListener("pointermove",this.handlePointerMove);
    this.surface.addEventListener("pointerup",this.handlePointerUp);
    this.surface.addEventListener("pointercancel",this.handlePointerUp);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(surface);
    this.resize();
    this.animate();
  }

  private mat(color:number,metalness=0,roughness=.8){
    return new THREE.MeshStandardMaterial({color,metalness,roughness});
  }
  private addBox(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,shadow=false){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);
    m.receiveShadow=true;
    m.castShadow=shadow;
    this.scene.add(m);
    return m;
  }
  private makeWall(room:number,wall:"back"|"front"|"left"|"right"){
    const z=centers[room],wallMat=this.mat(room===2?0x594b50:0x5c5a58);
    if(wall==="left"||wall==="right"){
      this.addBox(.18,3.5,7.7,wall==="left"?-3.75:3.75,1.74,z,wallMat);
    }else{
      const wz=z+(wall==="back"?3.8:-3.8);
      if(wall==="front"){
        this.addBox(2.55,3.5,.18,-2.45,1.74,wz,wallMat);
        this.addBox(2.55,3.5,.18,2.45,1.74,wz,wallMat);
        this.addBox(2,1,.18,0,3,wz,wallMat);
      }else this.addBox(7.5,3.5,.18,0,1.74,wz,wallMat);
    }
  }
  private buildRooms(){
    const floor=this.mat(0x534033),wallpaper=this.mat(0x6c6560),trim=this.mat(0x2f211b);
    for(let s=0;s<3;s++){
      const z=centers[s];
      this.addBox(7.5,.25,7.6,0,-.16,z,floor);
      this.addBox(7.5,.15,7.6,0,3.55,z,this.mat(0x3f3a38));
      this.makeWall(s,"back");this.makeWall(s,"front");this.makeWall(s,"left");this.makeWall(s,"right");
      // Wall battens and skirting add architectural depth without fake 2D backdrops.
      for(const x of [-3.62,3.62]){
        this.addBox(.14,.18,7.3,x,.14,z,trim);
        for(let i=0;i<4;i++)this.addBox(.08,2.5,.09,x+(.0),1.58,z-3+i*2,wallpaper);
      }
      for(const zz of [z-3.66,z+3.66])this.addBox(7.2,.17,.1,0,.14,zz,trim);
      const area=new THREE.PointLight(s===2?0xffc6a7:0xffe0b7,s===0?33:27,10,1.65);
      area.position.set(s===0?-1.7:1.2,2.85,z+.35);
      area.castShadow=s===1;
      if(area.castShadow)area.shadow.mapSize.set(512,512);
      this.scene.add(area);this.eventLights.push(area);
      const fill=new THREE.PointLight(0x9cb5cf,8,9,2);
      fill.position.set(-2.9,2.4,z-2.5);this.scene.add(fill);
      this.warmLights.push(fill);
      this.addBox(1.7,.025,2.7,0,.012,z+.8,this.mat(s===2?0x655058:0x58504a));
    }
    // PBR maps sourced from documented local CC0 material index.
    Promise.all([loadViralioPBR("wood_floor",3,3),loadViralioPBR("plastered_wall",3,2)]).then(([wood,wall])=>{
      if(!this.running){wood.dispose();wall.dispose();return;}
      this.scene.traverse(o=>{
        if(!(o instanceof THREE.Mesh))return;
        if(!(o.material instanceof THREE.MeshStandardMaterial))return;
        const m=o.material;
        if(m.color.getHex()===0x534033){o.material=wood;o.receiveShadow=true;}
        if(m.color.getHex()===0x5c5a58||m.color.getHex()===0x594b50){o.material=wall;}
      });
    }).catch(()=>this.onNotice("Se utilizaron materiales de respaldo para la casa."));
  }
  private async asset(a:AssetSpec){
    try{
      const {scene}=await loadViralio3DAsset(a.id);
      if(!this.running)return;
      const box=new THREE.Box3().setFromObject(scene);
      const size=new THREE.Vector3(),center=new THREE.Vector3();
      box.getSize(size);box.getCenter(center);
      if(size.x<.001||size.y<.001||size.z<.001)return;
      const k=Math.min(a.width/Math.max(size.x,size.z),a.depth? a.depth/Math.max(size.x,size.z):6,2.2/size.y);
      scene.scale.setScalar(k);
      const lift = a.id==="desk-call-office-phone" ? .62 : a.id==="mantel-clock" ? .73 : a.id==="crime-photo-frame" ? 1.45 : 0;
      scene.position.set(a.x-center.x*k,-box.min.y*k+.012+lift,centers[a.stage]+a.z-center.z*k);
      scene.rotation.y=a.rotate||0;
      scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      this.scene.add(scene);
      scene.userData.assetId=a.id;
      this.dynamicProps.push(scene);
    }catch(e){console.warn("Asset CC0 no disponible",a.id,e);}
  }
  private buildProps(){
    const assets:AssetSpec[]=[
      {id:"universal-ph-worn-coffee-table",stage:0,x:-2.05,z:.8,width:1.45},
      {id:"desk-call-office-phone",stage:0,x:-2.05,z:.8,width:.42},
      {id:"flush-flush-interior-door",stage:0,x:0,z:-3.64,width:1.48,depth:.3},
      {id:"football-coat-stand",stage:0,x:2.35,z:-1.45,width:.9},
      {id:"universal-ph-wooden-crate",stage:0,x:1.9,z:.65,width:.9},
      {id:"oak-side-table",stage:0,x:-2.2,z:-2.3,width:.88},
      {id:"mantel-clock",stage:0,x:-2.2,z:-2.3,width:.65},
      {id:"universal-modular-sofa-set",stage:1,x:-2,z:0,width:2.2,rotate:Math.PI/2},
      {id:"universal-ph-stone-coffee-table",stage:1,x:0,z:.9,width:1.1},
      {id:"filled-bookshelf-small-original-interior-furnishing",stage:1,x:2.5,z:-1.3,width:1.15},
      {id:"crime-photo-frame",stage:1,x:-2.35,z:-3.58,width:.7},
      {id:"flush-flush-interior-door",stage:1,x:0,z:-3.64,width:1.48,depth:.3},
      {id:"wingback-armchair",stage:1,x:2,z:1.5,width:1.05,rotate:-.5},
      {id:"gilt-landscape-picture-frame",stage:1,x:-3,z:1,width:.6},
      {id:"two-door-wardrobe-original-interior-furnishing",stage:2,x:0,z:-2.6,width:2.6},
      {id:"universal-ph-wooden-crate",stage:2,x:-2.5,z:-1.4,width:1.2},
      {id:"slit-bedside-cabinet",stage:2,x:-2.5,z:1.4,width:.85},
      {id:"bookshelf-with-bins-original-interior-furnishing",stage:2,x:2.4,z:-1.1,width:1.15},
      {id:"universal-ph-round-wood-table",stage:2,x:1.5,z:1.4,width:1.1}
    ];
    for(const a of assets)void this.asset(a);
    this.spot("telefono",0,-2.05,1.1,.8,1.35,"Teléfono");
    this.spot("caja",0,1.9,.9,.65,1.1,"Caja escolar");
    this.spot("perchero",0,2.35,1.5,-1.45,1.1,"Perchero");
    this.spot("puerta",0,0,1.5,-3.67,1.25,"Puerta de la sala");
    this.spot("foto",1,-2.35,1.65,-3.5,.88,"Fotografía familiar");
    this.spot("libros",1,2.4,1.5,-1.3,1.2,"Biblioteca");
    this.spot("puerta",1,0,1.5,-3.67,1.25,"Puerta del dormitorio");
    this.spot("juguetes",2,-2.5,1,-1.4,1.1,"Caja de juguetes");
    this.spot("cajon",2,-2.5,1,1.4,.95,"Mesa de luz");
    this.spot("estante",2,2.4,1.45,-1.1,1,"Estante");
    this.spot("cajamusical",2,1.5,1.05,1.35,1.1,"Caja musical");
    this.spot("armario",2,0,1.5,-2.69,1.4,"Armario cerrado");
    // A physical frame falls when the child is heard, and a tangible warning materializes on the wall.
    this.fallenFrame = this.addBox(.68,.88,.075,-3.57,1.77,-.9,this.mat(0x9e7453,.1,.6),true);
    this.fallenFrame.rotation.y=-.15;
    const warningCanvas=document.createElement("canvas");warningCanvas.width=512;warningCanvas.height=192;
    const ctx=warningCanvas.getContext("2d");
    if(ctx){ctx.clearRect(0,0,512,192);ctx.font="bold 48px Georgia";ctx.textAlign="center";ctx.fillStyle="#ad2e36";ctx.shadowBlur=10;ctx.shadowColor="#7c131e";ctx.fillText("TE ESTÁ",256,73);ctx.fillText("ESPERANDO",256,138);}
    this.sceneSurprise=new THREE.Mesh(new THREE.PlaneGeometry(2.45,.95),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(warningCanvas),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    this.sceneSurprise.visible=false;this.scene.add(this.sceneSurprise);
    // Decoration: pendant light, floor grilles, floating dust; physical meshes only.
    for(let s=0;s<3;s++){
      const z=centers[s];
      const light=this.addBox(.65,.09,.65,0,3.22,z,this.mat(0xba946e,.35,.28));
      light.castShadow=false;
      for(let i=0;i<6;i++){
        const alpha=i*Math.PI/3;
        const p=new THREE.Mesh(new THREE.SphereGeometry(.018,5,5),new THREE.MeshBasicMaterial({color:0xffe5bd,transparent:true,opacity:.25}));
        p.position.set(1.2*Math.cos(alpha),1.3+(i%3)*.34,z+1.3*Math.sin(alpha));
        this.scene.add(p);this.dynamicProps.push(p);
      }
    }
  }
  private spot(id:string,stage:MotherStage,x:number,y:number,z:number,radius:number,label:string){
    const hit=new THREE.Mesh(new THREE.SphereGeometry(radius,10,9),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.position.set(x,y,centers[stage]+z);
    hit.userData.spot=id;hit.userData.label=label;
    this.scene.add(hit);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.013,8,24),new THREE.MeshBasicMaterial({color:0xffd5a0,transparent:true,opacity:.79,depthTest:false}));
    ring.position.set(x,y+.31,centers[stage]+z);
    ring.renderOrder=5;
    this.scene.add(ring);
    this.spots.push({id,mesh:hit,ring,stage});
  }
  private setRotation(){
    this.camera.rotation.order="YXZ";
    this.camera.rotation.set(this.pitch,this.yaw,0);
  }
  private ray(x:number,y:number){
    const rect=this.renderer.domElement.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    const pointer=new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
    const caster=new THREE.Raycaster();
    caster.setFromCamera(pointer,this.camera);
    const hits=caster.intersectObjects(this.spots.filter(s=>s.stage===this.stage).map(s=>s.mesh),false);
    const valid=hits.find(h=>h.distance<5);
    return valid?.object as THREE.Object3D|undefined;
  }
  private tap(x:number,y:number){
    const target=this.ray(x,y);
    if(target?.userData.spot)this.onInteract(target.userData.spot);
  }
  interactFocus(){
    const rect=this.renderer.domElement.getBoundingClientRect();
    const target=this.ray(rect.left+rect.width/2,rect.top+rect.height/2);
    if(target?.userData.spot)this.onInteract(target.userData.spot);
  }
  setMotion(forward:number,strafe:number){this.movement.forward=forward;this.movement.strafe=strafe;}
  setStage(stage:MotherStage){
    this.stage=stage;this.camera.position.set(0,1.65,centers[stage]+2.25);
    if(this.sceneSurprise?.visible)this.sceneSurprise.position.z=centers[stage]-3.59;
    this.yaw=0;this.pitch=-.04;this.setRotation();this.onFocus("");
  }
  setSuspense(elapsed:number){
    if(elapsed>=12&&!this.sceneMoved.has(12)&&this.fallenFrame){
      this.sceneMoved.add(12);this.fallenFrame.rotation.z=-.64;this.fallenFrame.position.y=.66;
    }
    if(elapsed>=105&&!this.sceneMoved.has(105)){
      this.sceneMoved.add(105);
      const moved=this.dynamicProps.find(o=>o.userData.assetId==="universal-ph-stone-coffee-table");
      if(moved){moved.position.x+=.7;moved.rotation.y+=.24;}
    }
    if(elapsed>=170&&!this.sceneMoved.has(170)&&this.sceneSurprise){
      this.sceneMoved.add(170);
      this.sceneSurprise.position.set(0,1.88,centers[this.stage]-3.59);
      this.sceneSurprise.visible=true;
    }
    if(elapsed>=170&&elapsed<174)this.flickerUntil=performance.now()+300;
    if(elapsed>=280&&elapsed<283)this.flickerUntil=performance.now()+650;
  }
  win(){
    this.celebratory=true;
    this.eventLights.forEach(light=>{light.color.setHex(0xffc58c);light.intensity=49;});
    this.scene.background=new THREE.Color(0x382622);
    this.renderer.toneMappingExposure=1.63;
    for(let i=0;i<32;i++){
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(.036+Math.random()*.045,6,6),new THREE.MeshBasicMaterial({color:i%2?0xffdca1:0xf6aeb9}));
      mesh.position.set((Math.random()-.5)*4,.6+Math.random()*2.3,centers[2]-1+(Math.random()-.5)*2);
      this.scene.add(mesh);this.dynamicProps.push(mesh);
    }
  }
  private resize(){
    const w=Math.max(1,this.surface.clientWidth),h=Math.max(1,this.surface.clientHeight);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }
  private animate=()=>{
    if(!this.running)return;
    this.frame=requestAnimationFrame(this.animate);
    const dt=Math.min(this.clock.getDelta(),.045);
    if(this.movement.forward||this.movement.strafe){
      const speed=2.3*dt;
      const sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);
      this.camera.position.x+=(-sin*this.movement.forward+cos*this.movement.strafe)*speed;
      this.camera.position.z+=(-cos*this.movement.forward-sin*this.movement.strafe)*speed;
      this.camera.position.x=THREE.MathUtils.clamp(this.camera.position.x,-3,3);
      this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z,centers[this.stage]-2.95,centers[this.stage]+3);
    }
    const rect=this.renderer.domElement.getBoundingClientRect();
    const focus=this.ray(rect.left+rect.width/2,rect.top+rect.height/2);
    const label=focus?.userData.label||"";
    if(label!==this.lastFocus){this.lastFocus=label;this.onFocus(label);}
    const t=this.clock.elapsedTime;
    for(const s of this.spots){
      s.ring.visible=s.stage===this.stage&&!this.celebratory;
      if(s.ring.visible){s.ring.quaternion.copy(this.camera.quaternion);s.ring.scale.setScalar(1+.14*Math.sin(t*3));}
    }
    const dark=performance.now()<this.flickerUntil;
    this.eventLights.forEach((light,i)=>{if(!this.celebratory)light.intensity=dark?(Math.random()>.65?1:0):i===0?33:27;});
    this.renderer.render(this.scene,this.camera);
  };
  dispose(){
    this.running=false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.surface.removeEventListener("pointerdown",this.handlePointerDown);
    this.surface.removeEventListener("pointermove",this.handlePointerMove);
    this.surface.removeEventListener("pointerup",this.handlePointerUp);
    this.surface.removeEventListener("pointercancel",this.handlePointerUp);
    this.scene.traverse(o=>{
      if(o instanceof THREE.Mesh){
        // Shared GLB geometries and materials remain in the library cache.
        if(!this.dynamicProps.includes(o) && !o.userData.viralioAssetId) { /* Reused assets handled by loader cache */ }
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
