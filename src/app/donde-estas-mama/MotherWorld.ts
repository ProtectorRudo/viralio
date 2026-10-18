import * as THREE from "three";
import { loadViralio3DAsset } from "@/lib/viralio-3d";
import { loadViralioPBR } from "@/lib/viralio-rooms";

export type MotherStage = 0 | 1 | 2;
type Spot = { id: string; mesh: THREE.Object3D; stage: MotherStage; radius: number; enabled: boolean };
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
  private roomShells: THREE.Group[] = [];
  private shellTarget: THREE.Group | null = null;
  private assetModels: THREE.Group[] = [];
  private childModel: THREE.Group | null = null;
  private childMixer: THREE.AnimationMixer | null = null;
  private childArm: THREE.Bone | null = null;
  private childHead: THREE.Bone | null = null;
  private childOriginalY = 0;
  private childOriginalZ = 0;
  private childOriginalRotation = 0;
  private childArmRest = 0;
  private childHeadRest = 0;
  private activeScene = false;
  private dynamicProps: THREE.Object3D[] = [];
  private sceneSurprise: THREE.Mesh | null = null;
  private fallenFrame: THREE.Mesh | null = null;
  private frameFallAt = -1;
  private sceneMoved = new Set<number>();
  private pickableItems = new Map<string,THREE.Group>();
  private pillow:THREE.Group|null=null;
  private pillowRaisedAt=-1;
  private pillowLifted=false;
  private pillowRestY=.62;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private shadowFigure: THREE.Group | null = null;
  private apparitionRequested = false;
  private apparitionMixer:THREE.AnimationMixer|null = null;
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
    (this.shellTarget||this.scene).add(m);
    return m;
  }
  private makeWall(room:number,wall:"back"|"front"|"left"|"right"){
    const z=centers[room],wallMat=this.mat(room===2?0x594b50:0x5c5a58);
    if(wall==="left"||wall==="right"){
      this.addBox(.18,3.5,7.7,wall==="left"?-3.75:3.75,1.74,z,wallMat);
    }else{
      const wz=z+(wall==="back"?3.8:-3.8);
      if(wall==="front"&&room<2){
        this.addBox(2.55,3.5,.18,-2.45,1.74,wz,wallMat);
        this.addBox(2.55,3.5,.18,2.45,1.74,wz,wallMat);
        this.addBox(2,1,.18,0,3,wz,wallMat);
        // Finish the doorway with a flush frame, rather than black gaps.
        for(const x of [-.98,.98])this.addBox(.38,2.6,.18,x,1.3,wz,wallMat);
        const jamb=this.mat(0x44352e);
        for(const x of [-.80,.80])this.addBox(.055,2.57,.24,x,1.32,wz+.06,jamb);
        this.addBox(2.06,.12,.24,0,2.62,wz+.025,jamb);
      }else this.addBox(7.5,3.5,.18,0,1.74,wz,wallMat);
    }
  }
  private buildRooms(){
    const floor=this.mat(0x534033),trim=this.mat(0x2f211b);
    for(let s=0;s<3;s++){
      const z=centers[s];
      const roomGroup=new THREE.Group();
      roomGroup.name="habitacion-"+(s+1);
      roomGroup.visible=s===0;
      this.roomShells.push(roomGroup);
      this.scene.add(roomGroup);
      this.shellTarget=roomGroup;
      this.addBox(7.5,.25,7.6,0,-.16,z,floor);
      this.addBox(7.5,.15,7.6,0,3.55,z,this.mat(0x3f3a38));
      this.makeWall(s,"back");this.makeWall(s,"front");this.makeWall(s,"left");this.makeWall(s,"right");
      // Horizontal skirting and dado rail instead of floating vertical strips.
      for(const x of [-3.62,3.62]){
        this.addBox(.14,.18,7.3,x,.14,z,trim);
        this.addBox(.085,.072,7.23,x,1.07,z,trim);
      }
      for(const zz of [z-3.66,z+3.66])this.addBox(7.2,.17,.1,0,.14,zz,trim);
      const area=new THREE.PointLight(s===2?0xffc6a7:0xffe0b7,s===0?33:27,10,1.65);
      area.position.set(s===0?-1.7:1.2,2.85,z+.35);
      area.castShadow=s===1;
      if(area.castShadow)area.shadow.mapSize.set(512,512);
      roomGroup.add(area);this.eventLights.push(area);
      const fill=new THREE.PointLight(0x9cb5cf,8,9,2);
      fill.position.set(-2.9,2.4,z-2.5);roomGroup.add(fill);
      this.warmLights.push(fill);
      // No flat rectangular block pretending to be a rug across the walking aisle.
    }
    this.shellTarget=null;
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
      const {scene,animations}=await loadViralio3DAsset(a.id);
      if(!this.running)return null;
      const box=new THREE.Box3().setFromObject(scene);
      const size=new THREE.Vector3(),center=new THREE.Vector3();
      box.getSize(size);box.getCenter(center);
      if(size.x<.001||size.y<.001||size.z<.001)return null;
      const k=a.id==="mother-child-eli"?Math.min(1.19/size.y,a.width/Math.max(size.x,size.z)*1.35):Math.min(a.width/Math.max(size.x,size.z),2.2/size.y);
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
      scene.userData.assetStage=a.stage;
      scene.userData.revealOnly=a.id==="mother-child-eli";
      scene.visible=a.stage===this.stage&&(!scene.userData.revealOnly||this.celebratory);
      if(a.id==="mother-child-eli"){
        this.childModel=scene;
        this.childOriginalY=scene.position.y;
        this.childOriginalZ=scene.position.z;
        this.childOriginalRotation=scene.rotation.y;
        const armNames:THREE.Bone[]=[],headNames:THREE.Bone[]=[];
        scene.traverse(node=>{
          if(!(node instanceof THREE.Bone))return;
          if(/(upper.?arm|shoulder|bicep).*(right|[._ -]r$)|^(r.?upper.?arm|right.?arm)/i.test(node.name))armNames.push(node);
          if(/(^head$|head[._ -]|neck[._ -]?1)/i.test(node.name))headNames.push(node);
        });
        this.childArm=armNames[0]||null;
        this.childHead=headNames[0]||null;
        this.childArmRest=this.childArm?.rotation.z||0;
        this.childHeadRest=this.childHead?.rotation.y||0;
        if(animations.length){
          this.childMixer=new THREE.AnimationMixer(scene);
          const idle=animations.find(clip=>/idle|stand|wave|hello/i.test(clip.name))||animations[0];
          this.childMixer.clipAction(idle).play();
        }
      }
      this.assetModels.push(scene);
      this.dynamicProps.push(scene);
      return scene;
    }catch(e){console.warn("Asset CC0 no disponible",a.id,e);return null;}
  }
  private buildProps(){
    // Furniture grouped against the walls, a clear center aisle in every scene.
    const assets:AssetSpec[]=[
      // 01 · Child's bedroom: sleeping corner on right, phone and clock on left.
      {id:"universal-ph-worn-coffee-table",stage:0,x:-2.38,z:1.14,width:1.32},
      {id:"desk-call-office-phone",stage:0,x:-2.38,z:1.14,width:.42,supportId:"universal-ph-worn-coffee-table"},
      {id:"flush-flush-interior-door",stage:0,x:0,z:-3.64,width:1.48,depth:.3},
      {id:"football-coat-stand",stage:0,x:3.02,z:2.34,width:.74},
      {id:"hotel-bed-with-headboard-and-bench-original-hotel-furnishing",stage:0,x:2.14,z:-1.75,width:2.65},
      {id:"football-backpack",stage:0,x:3.12,z:.48,width:.54},
      {id:"oak-side-table",stage:0,x:-2.65,z:-2.3,width:.79},
      {id:"mantel-clock",stage:0,x:-2.65,z:-2.3,width:.56,supportId:"oak-side-table"},
      {id:"slit-bedside-cabinet",stage:0,x:.13,z:-2.66,width:.51},
      {id:"bell-wake-clock",stage:0,x:.13,z:-2.66,width:.23,supportId:"slit-bedside-cabinet"},
      // 02 · Family living room: seat grouping on one side, bookshelf on the other.
      {id:"universal-modular-sofa-set",stage:1,x:-2.31,z:-.38,width:2.1,rotate:Math.PI/2},
      {id:"universal-ph-stone-coffee-table",stage:1,x:-.63,z:.60,width:.96},
      {id:"filled-bookshelf-small-original-interior-furnishing",stage:1,x:2.65,z:-1.33,width:1.08},
      {id:"crime-photo-frame",stage:1,x:-2.35,z:-3.58,width:.7},
      {id:"flush-flush-interior-door",stage:1,x:0,z:-3.64,width:1.48,depth:.3},
      {id:"wingback-armchair",stage:1,x:2.48,z:1.92,width:.86,rotate:-.52},
      {id:"gilt-landscape-picture-frame",stage:1,x:-3.12,z:1.89,width:.54},
      // 03 · Final room: armario clear as the central goal, props at the periphery.
      {id:"two-door-wardrobe-original-interior-furnishing",stage:2,x:0,z:-2.6,width:2.6},
      {id:"universal-ph-wooden-crate",stage:2,x:-2.55,z:-.93,width:1.04},
      {id:"slit-bedside-cabinet",stage:2,x:-2.65,z:1.68,width:.68},
      {id:"bookshelf-with-bins-original-interior-furnishing",stage:2,x:2.62,z:-.94,width:1.12},
      {id:"universal-ph-round-wood-table",stage:2,x:2.45,z:1.63,width:.86},
      {id:"mother-child-eli",stage:2,x:-.73,z:-2.66,width:.51,rotate:0}
    ];
    this.assetSpecs=assets;
    // Stage-aware streaming: load only the entrance immediately.
    this.loadStageAssets(0);
    this.createContactShadows();
    this.createPillow();
    this.createFamilyPhoto();
    this.spot("telefono",0,-2.38,1.1,1.14,.78,"Teléfono");
    this.spot("caja",0,3.12,.7,.48,.66,"Mochila");
    this.spot("perchero",0,3.02,1.5,2.34,.55,"Perchero");
    this.spot("cama",0,2.05,.88,-1.08,.79,"Cama desordenada");
    this.spot("almohada",0,2.14,.68,-2.42,.47,"Almohada");
    this.spot("llave",0,2.14,.6,-2.42,.48,"Llave pequeña");
    this.setSpotEnabled("llave",false);
    this.spot("puerta",0,0,1.5,-3.67,1.25,"Puerta de la sala");
    this.spot("foto",1,-2.35,1.65,-3.5,.88,"Fotografía familiar");
    this.spot("libros",1,2.65,1.5,-1.33,.89,"Biblioteca");
    this.spot("puerta",1,0,1.5,-3.67,1.25,"Puerta del dormitorio");
    this.spot("juguetes",2,-2.55,.96,-.93,.76,"Caja de juguetes");
    this.spot("cajon",2,-2.65,.98,1.68,.74,"Mesa de luz");
    this.spot("estante",2,2.62,1.45,-.94,.81,"Estante");
    this.spot("cajamusical",2,2.45,1.05,1.63,.74,"Caja musical");
    this.spot("armario",2,0,1.5,-2.69,1.4,"Armario cerrado");
    // Puzzle pieces are physical metal artifacts in the scene, not screen-only icons.
    this.addKey("key1",2.14,.57,centers[0]-2.42);
    const hiddenKey=this.pickableItems.get("key1");
    if(hiddenKey){hiddenKey.scale.setScalar(.33);hiddenKey.rotation.set(Math.PI/2,.12,.48);hiddenKey.visible=false;}
    this.addGear("juguetes",-2.55,.84,centers[2]-.93,.13);
    this.addGear("cajon",-2.65,.92,centers[2]+1.68,.10);
    this.addGear("estante",2.62,1.48,centers[2]-.94,.075);
    // A physical frame falls when the child is heard, and a tangible warning materializes on the wall.
    this.fallenFrame = this.addBox(.075,.88,.68,3.57,1.77,-.9,this.mat(0x9e7453,.1,.6),true);
    this.fallenFrame.rotation.y=-.15;
    const warningCanvas=document.createElement("canvas");warningCanvas.width=512;warningCanvas.height=192;
    const ctx=warningCanvas.getContext("2d");
    if(ctx){ctx.clearRect(0,0,512,192);ctx.font="bold 48px Georgia";ctx.textAlign="center";ctx.fillStyle="#ad2e36";ctx.shadowBlur=10;ctx.shadowColor="#7c131e";ctx.fillText("TE ESTÁ",256,73);ctx.fillText("ESPERANDO",256,138);}
    const warningTexture=new THREE.CanvasTexture(warningCanvas);this.ownedTextures.push(warningTexture);
    this.sceneSurprise=new THREE.Mesh(new THREE.PlaneGeometry(2.45,.95),new THREE.MeshBasicMaterial({map:warningTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    this.sceneSurprise.visible=false;this.scene.add(this.sceneSurprise);
    // The skinned actor is streamed after the player starts, not during the intro.
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
  /** Adult skinned actor from local CC0 library, visually treated as a fleeting shadow. */
  private async prepareApparition(){
    if(this.apparitionRequested)return;
    this.apparitionRequested=true;
    try{
      const {scene,animations}=await loadViralio3DAsset("npc-sam-locomotion");
      if(!this.running)return;
      const bounds=new THREE.Box3().setFromObject(scene);
      const height=bounds.getSize(new THREE.Vector3()).y;
      if(height<.2)return;
      const scale=1.79/height;
      scene.scale.setScalar(scale);
      scene.position.y=-bounds.min.y*scale;
      const shadowMaterial=new THREE.MeshStandardMaterial({
        color:0x131018,roughness:1,metalness:0,transparent:true,opacity:.9,depthWrite:true
      });
      scene.traverse(node=>{
        if(node instanceof THREE.Mesh){node.material=shadowMaterial;node.castShadow=false;node.receiveShadow=false;}
      });
      const actor=new THREE.Group();
      actor.name="sombra-animada-sam";
      actor.position.set(2.2,0,centers[0]-1.55);
      actor.add(scene);
      actor.visible=false;
      this.scene.add(actor);
      this.shadowFigure=actor;
      if(animations.length){
        this.apparitionMixer=new THREE.AnimationMixer(scene);
        const walk=animations.find(clip=>/walk_relaxed|walk/i.test(clip.name))||animations[0];
        this.apparitionMixer.clipAction(walk).play();
      }
    }catch(e){
      // Never replace an unavailable real skinned character with floating primitive capsules.
      console.warn("CC0 shadow actor could not be loaded",e);
    }
  }
  private revealCelebration(){
    if(this.finalDecorations)return;
    this.revealStartedAt=this.clock.elapsedTime;
    const wardrobe=this.dynamicProps.find(o=>o.userData.assetId==="two-door-wardrobe-original-interior-furnishing");
    this.wardrobeOriginX=wardrobe?.position.x||0;
    const group=new THREE.Group();
    const stageZ=centers[2];
    const colors=[0xf1c3c8,0xefddc0,0xe6bacf,0xf4e7d7];
    const cord=new THREE.MeshBasicMaterial({color:0xf5deb8});
    // Two intentional balloon bouquets leave the child's face and the banner unobstructed.
    for(let i=0;i<10;i++){
      const side=i<5?-1:1;
      const offset=i%5;
      const x=side*(2.04+(offset%3)*.28);
      const color=colors[i%colors.length];
      const balloon=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),new THREE.MeshStandardMaterial({color,roughness:.29,metalness:.08}));
      balloon.scale.set(1,1.35,.86);
      balloon.position.set(x,2.18+(i%5)*.13,stageZ-2.77+(i%2)*.16);
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
    const portraitLight=new THREE.SpotLight(0xffe2c1,25,5.5,Math.PI/5,.72,1.8);
    portraitLight.position.set(-1.2,2.65,stageZ+.25);
    portraitLight.target.position.set(-.73,1.13,stageZ-2.65);
    portraitLight.castShadow=false;
    group.add(portraitLight,portraitLight.target);
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
  /** Physical inset photograph, not an untextured glyph floating near the frame. */
  private createFamilyPhoto(){
    const texture=new THREE.TextureLoader().load("/donde-estas-mama/foto-familiar.svg",undefined,undefined,
      ()=>this.onNotice("No se pudo cargar la fotografía de la familia"));
    texture.colorSpace=THREE.SRGBColorSpace;
    this.ownedTextures.push(texture);
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(.52,.67),
      new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthWrite:true,toneMapped:false}));
    panel.name="foto-familiar-fisica";
    panel.position.set(-2.35,1.77,centers[1]-3.44);
    this.roomShells[1].add(panel);
  }
  /** Contact darkening grounds each furniture GLB without another shadow-casting light. */
  private createContactShadows(){
    const cv=document.createElement("canvas");cv.width=64;cv.height=64;
    const ctx=cv.getContext("2d");
    if(!ctx)return;
    const grad=ctx.createRadialGradient(32,32,2,32,32,32);
    grad.addColorStop(0,"rgba(19,12,10,.54)");
    grad.addColorStop(.55,"rgba(24,15,15,.29)");
    grad.addColorStop(1,"rgba(20,14,12,0)");
    ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
    const texture=new THREE.CanvasTexture(cv);this.ownedTextures.push(texture);
    const footprints:[number,number,number,number,number][]=[
      [0,-2.38,1.14,1.5,1.3],[0,-2.65,-2.3,1.1,1],
      [0,2.14,-1.75,2.55,2.65],[0,.13,-2.66,.65,.65],
      [0,3.02,2.34,.6,.65],[0,3.12,.48,.75,.65],
      [1,-2.31,-.38,2.25,2.35],[1,-.63,.6,1.1,.95],
      [1,2.65,-1.33,1.45,1.25],[1,2.48,1.92,1.2,1.05],
      [2,0,-2.6,2.8,1.3],[2,-2.55,-.93,1.25,1.2],
      [2,-2.65,1.68,.85,.8],[2,2.62,-.94,1.35,1.15],
      [2,2.45,1.63,1.15,1.1]
    ];
    for(const [stage,x,z,w,h] of footprints){
      const surface=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
        new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
      surface.rotation.x=-Math.PI/2;
      surface.position.set(x,.015,centers[stage]+z);
      surface.renderOrder=2;
      this.roomShells[stage].add(surface);
    }
  }
  /** Bespoke fabric pillow: deformed high-subdivision cloth volume, not a plain box. */
  private createPillow(){
    const group=new THREE.Group();
    group.name="almohada-interactiva";
    const geometry=new THREE.BoxGeometry(.79,.19,.47,16,6,12);
    const pos=geometry.attributes.position as THREE.BufferAttribute;
    const v=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      const edge=Math.min(1,Math.abs(v.x)/.395,Math.abs(v.z)/.235);
      const fold=Math.sin((v.x/.79+.5)*Math.PI)*Math.sin((v.z/.47+.5)*Math.PI);
      v.y=v.y*(.64+.36*fold)+.017*Math.cos(v.x*19)*Math.sin(v.z*21)*(1-edge*.6);
      v.x-=Math.sign(v.x)*.025*edge;
      v.z-=Math.sign(v.z)*.018*edge;
      pos.setXYZ(i,v.x,v.y,v.z);
    }
    geometry.computeVertexNormals();
    const fabric=new THREE.MeshStandardMaterial({color:0xd5c2b4,roughness:.97,metalness:0,side:THREE.DoubleSide});
    const cushion=new THREE.Mesh(geometry,fabric);
    cushion.castShadow=true;cushion.receiveShadow=true;
    group.add(cushion);
    // Subtle sewn piping follows the fabric silhouette.
    const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.35,.011,-.2),new THREE.Vector3(-.38,.008,0),
      new THREE.Vector3(-.35,.011,.2),new THREE.Vector3(0,.015,.219),
      new THREE.Vector3(.35,.011,.2),new THREE.Vector3(.38,.008,0),
      new THREE.Vector3(.35,.011,-.2),new THREE.Vector3(0,.015,-.219),
      new THREE.Vector3(-.35,.011,-.2)
    ]),36,.005,5),new THREE.MeshStandardMaterial({color:0xbda294,roughness:1}));
    group.add(seam);
    group.position.set(2.14,this.pillowRestY,centers[0]-2.42);
    this.roomShells[0].add(group);
    this.pillow=group;
  }
  /** The hidden physical key becomes selectable only once the pillow was moved. */
  liftPillow(){
    if(this.pillowLifted)return false;
    this.pillowLifted=true;
    this.pillowRaisedAt=this.clock.elapsedTime;
    this.setSpotEnabled("almohada",false);
    this.setSpotEnabled("llave",true);
    const key=this.pickableItems.get("key1");
    if(key)key.visible=true;
    return true;
  }
  private setSpotEnabled(id:string,enabled:boolean){
    for(const spot of this.spots)if(spot.stage===0&&spot.id===id){
      spot.enabled=enabled;
      // Hit testing remains available without drawn hotspots.
    }
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
    group.visible=this.stage===2;
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
    // Players discover objects by aiming and touching; no glowing rings.
    this.spots.push({id,mesh:hit,stage,radius,enabled:true});
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
      if(spot.stage!==this.stage||!spot.enabled)continue;
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
  setActive(active:boolean){this.activeScene=active;}
  setMotion(forward:number,strafe:number){this.movement.forward=forward;this.movement.strafe=strafe;}
  setStage(stage:MotherStage){
    if(this.activeScene)void this.prepareApparition();
    this.loadStageAssets(stage);
    if(stage<2)this.loadStageAssets((stage+1) as MotherStage);
    this.stage=stage;this.camera.position.set(0,1.65,centers[stage]+2.25);
    this.roomShells.forEach((room,index)=>{room.visible=index===stage;});
    this.assetModels.forEach(model=>{model.visible=model.userData.assetStage===stage&&(!model.userData.revealOnly||this.celebratory);});
    this.pickableItems.forEach((group,id)=>{group.visible=(id==="key1"?stage===0&&this.pillowLifted:stage===2);});
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
    this.activeScene=true;
    this.revealCelebration();
    if(this.childModel)this.childModel.visible=true;
    if(this.shadowFigure)this.shadowFigure.visible=false;
    if(this.sceneSurprise)this.sceneSurprise.visible=false;
    this.eventLights.forEach(light=>{light.color.setHex(0xffc58c);light.intensity=49;});
    this.scene.background=new THREE.Color(0x382622);
    this.renderer.toneMappingExposure=1.63;
    for(let i=0;i<16;i++){
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(.012+Math.random()*.013,5,5),new THREE.MeshBasicMaterial({color:i%2?0xffdca1:0xf6aeb9}));
      mesh.position.set((Math.random()-.5)*5,1.2+Math.random()*1.6,centers[2]-1+(Math.random()-.5)*1.8);
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
    if(!this.activeScene)return;
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
        [[-2.38,1.14,.78],[3.02,2.34,.38],[3.12,.48,.37],[-2.65,-2.3,.49],[2.14,-1.75,1.14],[.13,-2.66,.34]],
        [[-2.31,-.38,1.09],[-.63,.6,.55],[2.65,-1.33,.68],[2.48,1.92,.53]],
        [[0,-2.6,1.05],[-2.55,-.93,.63],[-2.65,1.68,.45],[2.62,-.94,.68],[2.45,1.63,.55]]
      ] as const;
      const open=(x:number,z:number)=>obstacles[this.stage].every(([px,pz,r])=>Math.hypot(x-px,z-centers[this.stage]-pz)>r+.31);
      if(open(nx,this.camera.position.z))this.camera.position.x=nx;
      if(open(this.camera.position.x,nz))this.camera.position.z=nz;
    }
    if(this.pillow&&this.pillowRaisedAt>=0){
      const progress=THREE.MathUtils.clamp((this.clock.elapsedTime-this.pillowRaisedAt)/.65,0,1);
      const lift=progress*progress*(3-2*progress);
      // Lift over an arc and set the cushion DOWN on the mattress beside the key.
      this.pillow.position.x=2.14+.43*lift;
      this.pillow.position.y=this.pillowRestY+.15*Math.sin(Math.PI*lift);
      this.pillow.position.z=centers[0]-2.42+.37*lift;
      this.pillow.rotation.y=.22*lift;
      this.pillow.rotation.z=.1*lift;
    }
    if(this.celebratory&&this.childModel){
      this.childMixer?.update(dt);
      const tick=Math.max(0,this.clock.elapsedTime-this.revealStartedAt);
      if(this.childArm&&!this.childMixer){
        // Gentle skeletal greeting from the authentic child rig where supported.
        const wave=THREE.MathUtils.smoothstep(tick,.55,1.3);
        this.childArm.rotation.z=this.childArmRest+wave*(.28+.11*Math.sin(tick*6));
      }
      if(this.childHead&&!this.childMixer)this.childHead.rotation.y=this.childHeadRest+.085*Math.sin(tick*1.7);
      // Restrained breathing and a small smile-like lift; no rescaled adult actor.
      this.childModel.position.y=this.childOriginalY+Math.sin(tick*2.6)*.009;
      this.childModel.position.z=this.childOriginalZ+THREE.MathUtils.smoothstep(tick,.7,2.7)*.12;
      this.childModel.rotation.y=this.childOriginalRotation+.045*Math.sin(tick*1.4);
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
        this.apparitionMixer?.update(dt);
        this.shadowFigure.position.z=centers[this.stage]-1.55;
        this.shadowFigure.position.x=2.1+(1.8-(this.apparitionUntil-performance.now())/1000)*-.62;
      }
    }
    // Object hit targets stay invisible, including on touchscreens.
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
