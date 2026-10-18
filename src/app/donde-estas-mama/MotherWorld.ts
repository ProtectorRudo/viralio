import * as THREE from "three";
import { loadViralio3DAsset } from "@/lib/viralio-3d";
import { loadViralioPBR } from "@/lib/viralio-rooms";

export type MotherStage = 0 | 1 | 2;
type Spot = { id: string; mesh: THREE.Object3D; ring: THREE.Mesh; stage: MotherStage; radius: number };
type AssetSpec = {id:string; stage:MotherStage; x:number; z:number; width:number; depth?:number; rotate?:number; supportId?:string};
const centers = [0,-8,-16] as const;

export class MotherWorld {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(66,1,0.06,80);
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private frame = 0;
  private dpr=1;
  private readonly maxDpr=Math.min(typeof window==="undefined"?1:window.devicePixelRatio||1,1.6);
  private frameSample=0;
  private frameCount=0;
  private frameQualityHigh=0;
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
  private frameFallAt = -1;
  private sceneMoved = new Set<number>();
  private pickableItems = new Map<string,THREE.Group>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private shadowFigure: THREE.Group | null = null;
  private apparitionUntil = 0;
  private finalDecorations: THREE.Group | null = null;
  private revealStartedAt = 0;
  private wardrobeOriginX = 0;
  private readonly ownedTextures: THREE.Texture[] = [];
  private assetSpecs: AssetSpec[] = [];
  private requestedStages = new Set<MotherStage>();
  private assetLoads = new Map<string,Promise<THREE.Group|null>>();
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
    this.dpr=this.maxDpr;
    this.renderer.setPixelRatio(this.dpr);
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
  private loadStageAssets(stage:MotherStage){
    if(this.requestedStages.has(stage))return;
    this.requestedStages.add(stage);
    const local=this.assetSpecs.filter(a=>a.stage===stage);
    // Start support furniture first, then ornaments whose vertical position depends on it.
    for(const spec of [...local.filter(a=>!a.supportId),...local.filter(a=>a.supportId)]){
      this.assetLoads.set(stage+":"+spec.id,this.asset(spec));
    }
  }
  private async asset(a:AssetSpec):Promise<THREE.Group|null>{
    try{
      const {scene}=await loadViralio3DAsset(a.id);
      if(!this.running)return null;
      const box=new THREE.Box3().setFromObject(scene);
      const size=new THREE.Vector3(),center=new THREE.Vector3();
      box.getSize(size);box.getCenter(center);
      if(size.x<.001||size.y<.001||size.z<.001)return null;
      const k=Math.min(a.width/Math.max(size.x,size.z),2.2/size.y);
      scene.scale.setScalar(k);
      let lift=a.id==="crime-photo-frame"?1.45:0;
      if(a.supportId){
        const support=await this.assetLoads.get(a.stage+":"+a.supportId);
        if(!this.running)return null;
        if(support){
          support.updateMatrixWorld(true);
          lift=Math.max(0,new THREE.Box3().setFromObject(support).max.y)+.008;
        }else{
          console.warn("Missing support for decoration",a.id,a.supportId);
        }
      }
      // Correct the pivot in the model's rotated coordinates, not the original AABB.
      const angle=a.rotate||0;
      const horizontalCenter=new THREE.Vector3(center.x*k,0,center.z*k).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
      scene.position.set(a.x-horizontalCenter.x,-box.min.y*k+.012+lift,centers[a.stage]+a.z-horizontalCenter.z);
      scene.rotation.y=angle;
      scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      this.scene.add(scene);
      scene.userData.assetId=a.id;
      this.dynamicProps.push(scene);
      return scene;
    }catch(e){console.warn("Asset CC0 no disponible",a.id,e);return null;}
  }
  private buildProps(){
    const assets:AssetSpec[]=[
      {id:"universal-ph-worn-coffee-table",stage:0,x:-2.05,z:.8,width:1.45},
      {id:"desk-call-office-phone",stage:0,x:-2.05,z:.8,width:.42,supportId:"universal-ph-worn-coffee-table"},
      {id:"flush-flush-interior-door",stage:0,x:0,z:-3.64,width:1.48,depth:.3},
      {id:"football-coat-stand",stage:0,x:2.35,z:-1.45,width:.9},
      {id:"football-backpack",stage:0,x:1.9,z:.65,width:.77},
      {id:"oak-side-table",stage:0,x:-2.2,z:-2.3,width:.88},
      {id:"mantel-clock",stage:0,x:-2.2,z:-2.3,width:.65,supportId:"oak-side-table"},
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
    this.assetSpecs=assets;
    // Stage-aware streaming: load only the entrance immediately.
    this.loadStageAssets(0);
    this.spot("telefono",0,-2.05,1.1,.8,1.35,"Teléfono");
    this.spot("caja",0,1.9,.8,.65,1.1,"Mochila");
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
    // Puzzle pieces are physical metal artifacts in the scene, not screen-only icons.
    this.addKey("key1",2.35,1.17,centers[0]-1.43);
    this.addGear("juguetes",-2.3,.84,centers[2]-1.4,.13);
    this.addGear("cajon",-2.5,.92,centers[2]+1.4,.10);
    this.addGear("estante",2.4,1.48,centers[2]-1.1,.075);
    // A physical frame falls when the child is heard, and a tangible warning materializes on the wall.
    this.fallenFrame = this.addBox(.075,.88,.68,3.57,1.77,-.9,this.mat(0x9e7453,.1,.6),true);
    this.fallenFrame.rotation.y=-.15;
    const warningCanvas=document.createElement("canvas");warningCanvas.width=512;warningCanvas.height=192;
    const ctx=warningCanvas.getContext("2d");
    if(ctx){ctx.clearRect(0,0,512,192);ctx.font="bold 48px Georgia";ctx.textAlign="center";ctx.fillStyle="#ad2e36";ctx.shadowBlur=10;ctx.shadowColor="#7c131e";ctx.fillText("TE ESTÁ",256,73);ctx.fillText("ESPERANDO",256,138);}
    const warningTexture=new THREE.CanvasTexture(warningCanvas);this.ownedTextures.push(warningTexture);
    this.sceneSurprise=new THREE.Mesh(new THREE.PlaneGeometry(2.45,.95),new THREE.MeshBasicMaterial({map:warningTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    this.sceneSurprise.visible=false;this.scene.add(this.sceneSurprise);
    this.buildApparition();
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
  /** Ghostly hallway silhouette uses geometry and transparency, without an uncanny human stock model. */
  private buildApparition(){
    const figure=new THREE.Group();
    const shadow=new THREE.MeshBasicMaterial({color:0x07090d,transparent:true,opacity:.82,depthWrite:false,side:THREE.DoubleSide});
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.78,7,12),shadow);
    torso.position.y=1.15;torso.scale.z=.56;figure.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),shadow);
    head.position.y=1.99;head.scale.z=.65;figure.add(head);
    for(const x of [-.16,.16]){
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.55,5,9),shadow);
      arm.position.set(x*1.8,1.14,0);arm.rotation.z=x<0?-.19:.19;figure.add(arm);
    }
    figure.position.set(2.18,0,centers[1]-.92);
    figure.visible=false;
    figure.name="aparicion-pasillo";
    this.scene.add(figure);
    this.shadowFigure=figure;
  }
  private revealCelebration(){
    if(this.finalDecorations)return;
    this.revealStartedAt=this.clock.elapsedTime;
    const wardrobe=this.dynamicProps.find(o=>o.userData.assetId==="two-door-wardrobe-original-interior-furnishing");
    this.wardrobeOriginX=wardrobe?.position.x||0;
    const group=new THREE.Group();
    const stageZ=centers[2];
    const colors=[0xf2b0c4,0xf5d998,0xd3b0df,0xd1e6ce];
    const cord=new THREE.MeshBasicMaterial({color:0xf5deb8});
    for(let i=0;i<11;i++){
      const x=-2.8+i*.56;
      const color=colors[i%colors.length];
      const balloon=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),new THREE.MeshStandardMaterial({color,roughness:.29,metalness:.08}));
      balloon.scale.set(1,1.35,.86);
      balloon.position.set(x,2.38+Math.sin(i*1.9)*.20,stageZ-2.37+(i%3)*.08);
      group.add(balloon);
      const stringPoints=[
        new THREE.Vector3(x,balloon.position.y-.26,balloon.position.z),
        new THREE.Vector3(x+.06,balloon.position.y-.55,balloon.position.z+.03),
        new THREE.Vector3(x-.05,balloon.position.y-.88,balloon.position.z)
      ];
      const string=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stringPoints),9,.004,4),cord);
      group.add(string);
    }
    const wood=this.mat(0xa77b60,.06,.64);
    const table=new THREE.Mesh(new THREE.CylinderGeometry(.64,.68,.07,24),wood);
    table.position.set(0,.75,stageZ-1.94);group.add(table);
    for(const x of [-.45,.45]){
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.04,.046,.72,9),wood);
      leg.position.set(x,.38,stageZ-1.94);group.add(leg);
    }
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(.33,.34,.045,28),this.mat(0xefe7d9,.08,.4));
    plate.position.set(0,.82,stageZ-1.94);group.add(plate);
    const cake=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.22,32),this.mat(0xf0d3b5,0,.57));
    cake.position.set(0,.95,stageZ-1.94);group.add(cake);
    const icing=new THREE.Mesh(new THREE.CylinderGeometry(.285,.285,.065,32),this.mat(0xffe7ec,.03,.4));
    icing.position.set(0,1.08,stageZ-1.94);group.add(icing);
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.12,9),this.mat(0xd8a4bf,.2,.3));
    candle.position.set(0,1.17,stageZ-1.94);group.add(candle);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.029,9,9),new THREE.MeshBasicMaterial({color:0xffcf6a}));
    flame.position.set(0,1.255,stageZ-1.94);group.add(flame);
    const light=new THREE.PointLight(0xffb77e,17,4,2);
    light.position.set(0,1.34,stageZ-1.94);group.add(light);
    const bannerCanvas=document.createElement("canvas");bannerCanvas.width=1024;bannerCanvas.height=200;
    const ctx=bannerCanvas.getContext("2d");
    if(ctx){
      ctx.fillStyle="#f8e8d9";ctx.fillRect(0,0,1024,200);
      ctx.strokeStyle="#b48479";ctx.lineWidth=10;ctx.strokeRect(7,7,1010,186);
      ctx.textAlign="center";ctx.font="bold 75px Georgia";ctx.fillStyle="#7f4755";
      ctx.fillText("¡FELIZ DÍA, MAMÁ!",512,128);
    }
    const paper=new THREE.CanvasTexture(bannerCanvas);paper.colorSpace=THREE.SRGBColorSpace;this.ownedTextures.push(paper);
    const banner=new THREE.Mesh(new THREE.PlaneGeometry(3.65,.72),new THREE.MeshBasicMaterial({map:paper,side:THREE.DoubleSide}));
    banner.position.set(0,2.54,stageZ-3.30);group.add(banner);
    group.visible=true;this.scene.add(group);this.finalDecorations=group;
    // The surprise remains physically in the room and is visible during the reveal.
  }
  private addKey(id:string,x:number,y:number,z:number){
    const group=new THREE.Group(),metal=this.mat(0xd4ae66,.85,.27);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.105,.03,12,24),metal);
    handle.position.y=.14;group.add(handle);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.27,12),metal);
    shaft.position.y=-.07;group.add(shaft);
    for(const [dx,dy] of [[.05,-.18],[.06,-.26]]){
      const tooth=new THREE.Mesh(new THREE.BoxGeometry(.12,.045,.045),metal);
      tooth.position.set(dx,dy,0);group.add(tooth);
    }
    group.position.set(x,y,z);group.rotation.z=.3;
    this.scene.add(group);this.pickableItems.set(id,group);
  }
  private addGear(id:string,x:number,y:number,z:number,r:number){
    const group=new THREE.Group(),steel=this.mat(0xa49d8e,.8,.32);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.027,10,24),steel);
    group.add(rim);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const tooth=new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.048),steel);
      tooth.position.set(Math.cos(a)*r,Math.sin(a)*r,0);
      tooth.rotation.z=a-Math.PI/2;group.add(tooth);
    }
    const spindle=new THREE.Mesh(new THREE.TorusGeometry(r*.35,.017,8,16),steel);
    group.add(spindle);
    group.position.set(x,y,z);
    this.scene.add(group);this.pickableItems.set(id,group);
  }
  collect(id:string){
    const piece=this.pickableItems.get(id);
    if(piece){piece.visible=false;this.pickableItems.delete(id);}
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
    this.spots.push({id,mesh:hit,ring,stage,radius});
  }
  private setRotation(){
    this.camera.rotation.order="YXZ";
    this.camera.rotation.set(this.pitch,this.yaw,0);
  }
  private ray(x:number,y:number){
    const rect=this.renderer.domElement.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    this.pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    // Invisible overlapping spheres made nearby objects steal touches from distant,
    // perfectly centered puzzle props. Rank by aiming accuracy, not the first ray hit.
    let best:THREE.Object3D|undefined;
    let bestScore=Infinity;
    for(const spot of this.spots){
      if(spot.stage!==this.stage)continue;
      const direction=spot.mesh.position.clone().sub(this.camera.position);
      const distance=direction.length();
      if(distance<.01||distance>6.4)continue;
      const angle=this.raycaster.ray.direction.angleTo(direction.normalize());
      const aimTolerance=Math.atan2(Math.min(.63,spot.radius*.68),distance);
      if(angle>aimTolerance)continue;
      const score=angle/aimTolerance+distance*.0005;
      if(score<bestScore){bestScore=score;best=spot.mesh;}
    }
    return best;
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
    this.loadStageAssets(stage);
    if(stage<2)this.loadStageAssets((stage+1) as MotherStage);
    this.stage=stage;this.camera.position.set(0,1.65,centers[stage]+2.25);
    if(stage===1){
      this.apparitionUntil=performance.now()+1900;
      this.flickerUntil=performance.now()+470;
    }
    if(stage===2)this.flickerUntil=performance.now()+650;
    if(this.sceneSurprise?.visible)this.sceneSurprise.position.z=centers[stage]-3.59;
    this.yaw=0;this.pitch=-.04;this.setRotation();this.onFocus("");
  }
  triggerFrameDrop(){
    if(this.sceneMoved.has(12)||!this.fallenFrame)return;
    this.sceneMoved.add(12);
    this.frameFallAt=this.clock.elapsedTime;
  }
  setSuspense(elapsed:number){
    if(elapsed>=12&&!this.sceneMoved.has(12))this.triggerFrameDrop();
    if(elapsed>=50&&elapsed<53){
      this.apparitionUntil=performance.now()+1800;
    }
    if(elapsed>=105&&!this.sceneMoved.has(105)){
      this.sceneMoved.add(105);
      const moved=this.dynamicProps.find(o=>o.userData.assetId==="universal-ph-stone-coffee-table");
      if(moved){moved.position.x+=.7;moved.rotation.y+=.24;}
    }
    if(elapsed>=170&&!this.sceneMoved.has(170)&&this.sceneSurprise){
      this.sceneMoved.add(170);
      this.sceneSurprise.position.set(-2.44,1.88,centers[this.stage]-3.59);
      this.sceneSurprise.visible=true;
    }
    if(elapsed>=170&&elapsed<174)this.flickerUntil=performance.now()+300;
    if(elapsed>=240&&elapsed<242)this.apparitionUntil=performance.now()+850;
    if(elapsed>=280&&elapsed<283)this.flickerUntil=performance.now()+650;
  }
  win(){
    this.celebratory=true;
    this.revealCelebration();
    if(this.shadowFigure)this.shadowFigure.visible=false;
    if(this.sceneSurprise)this.sceneSurprise.visible=false;
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
    const rawDelta=this.clock.getDelta();
    const dt=Math.min(rawDelta,.045);
    // Adapt pixel density based on sustained observed frame time, never a single spike.
    if(rawDelta>0&&rawDelta<.3){
      this.frameSample+=rawDelta;this.frameCount++;
      if(this.frameSample>=2.8){
        const fps=this.frameCount/this.frameSample;
        if(fps<29&&this.dpr>.9){
          this.dpr=Math.max(.9,this.dpr-.15);this.renderer.setPixelRatio(this.dpr);this.resize();this.frameQualityHigh=0;
        }else if(fps>57&&this.dpr<this.maxDpr){
          if(++this.frameQualityHigh>=2){this.dpr=Math.min(this.maxDpr,this.dpr+.1);this.renderer.setPixelRatio(this.dpr);this.resize();this.frameQualityHigh=0;}
        }else this.frameQualityHigh=0;
        this.frameSample=0;this.frameCount=0;
      }
    }
    if(this.movement.forward||this.movement.strafe){
      const speed=2.3*dt/Math.max(1,Math.hypot(this.movement.forward,this.movement.strafe));
      const sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);
      const nx=THREE.MathUtils.clamp(this.camera.position.x+(-sin*this.movement.forward+cos*this.movement.strafe)*speed,-3.0,3.0);
      const nz=THREE.MathUtils.clamp(this.camera.position.z+(-cos*this.movement.forward-sin*this.movement.strafe)*speed,centers[this.stage]-2.92,centers[this.stage]+3);
      // Authored collision radii keep the player out of furniture, not only outside the walls.
      const obstacles=[
        [[-2.05,.8,.86],[2.35,-1.45,.53],[1.9,.65,.48],[-2.2,-2.3,.55]],
        [[-2,0,1.18],[0,.9,.63],[2.5,-1.3,.72],[2,1.5,.64]],
        [[0,-2.6,1.05],[-2.5,-1.4,.65],[-2.5,1.4,.59],[2.4,-1.1,.65],[1.5,1.4,.72]]
      ] as const;
      const open=(x:number,z:number)=>obstacles[this.stage].every(([px,pz,r])=>Math.hypot(x-px,z-centers[this.stage]-pz)>r+.31);
      if(open(nx,this.camera.position.z))this.camera.position.x=nx;
      if(open(this.camera.position.x,nz))this.camera.position.z=nz;
    }
    if(this.celebratory){
      const wardrobe=this.dynamicProps.find(o=>o.userData.assetId==="two-door-wardrobe-original-interior-furnishing");
      if(wardrobe){
        const open=THREE.MathUtils.smoothstep(this.clock.elapsedTime-this.revealStartedAt,0,1.6);
        wardrobe.position.x=this.wardrobeOriginX+open*2.42;
        wardrobe.rotation.y=-open*.16;
      }
    }
    const rect=this.renderer.domElement.getBoundingClientRect();
    const focus=this.ray(rect.left+rect.width/2,rect.top+rect.height/2);
    const label=focus?.userData.label||"";
    if(label!==this.lastFocus){this.lastFocus=label;this.onFocus(label);}
    const t=this.clock.elapsedTime;
    if(this.fallenFrame&&this.frameFallAt>=0){
      const p=THREE.MathUtils.clamp((t-this.frameFallAt)/.62,0,1);
      const fall=p*p*(3-2*p);
      this.fallenFrame.position.x=3.57-.46*fall;
      this.fallenFrame.position.y=1.77-1.73*fall;
      this.fallenFrame.rotation.z=-Math.PI/2*fall;
    }
    if(this.shadowFigure){
      this.shadowFigure.visible=!this.celebratory&&performance.now()<this.apparitionUntil&&this.stage!==2;
      if(this.shadowFigure.visible){
        this.shadowFigure.position.z=centers[this.stage]-1.55;
        this.shadowFigure.position.x=2.1+(1.8-(this.apparitionUntil-performance.now())/1000)*-.62;
      }
    }
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
    // Explicitly dispose generated canvas textures; shared GLB assets stay cached by library loader.
    this.ownedTextures.forEach(texture=>texture.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
