import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { installHospitalPremiumArt } from "./HospitalPremiumArt";
import { installHospitalCinematics } from "./HospitalCinematics";
import { installHospitalInteractionArt } from "./HospitalInteractionArt";
import { constructOrderlyIdentity } from "./OrderlyCreature";
import { canStand, clearSight, findPath, slide } from "./ChamberNavigation";

export type Chamber = 0 | 1 | 2;
export type Focus = { id: string; label: string; distance: number };
export type GameSignals = {
  onChamber: (room: Chamber) => void;
  onCaught: () => void;
  onThreat: (text: string) => void;
  onMoment?: (kind: "glass" | "lights" | "reactor" | "knock", text: string) => void;
};
type Target = { id: string; label: string; object: THREE.Object3D; room: Chamber; range: number };

const CENTER = [0, -13, -26] as const;
const MAX_X = 5.28;
const mats: Record<string, THREE.MeshStandardMaterial> = {
  tile: new THREE.MeshStandardMaterial({ color: 0x7a8581, roughness: .94, metalness: 0 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x353e40, roughness: .91 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x424b4b, roughness: .99 }),
  paint: new THREE.MeshStandardMaterial({ color: 0x677974, roughness: .87 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0x9bada9, roughness: .32, metalness: .06 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x151c20, metalness: .56, roughness: .49 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x7a8789, roughness: .32, metalness: .78 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x754f42, roughness: .88, metalness: .33 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x719494, roughness: .14, metalness: .2, transparent: true, opacity: .41, depthWrite: false }),
  vinyl: new THREE.MeshStandardMaterial({ color: 0x4c6364, roughness: .82 }),
  linen: new THREE.MeshStandardMaterial({ color: 0xb6b0a4, roughness: 1 }),
  red: new THREE.MeshStandardMaterial({ color: 0xa52d29, emissive: 0x8a0c06, emissiveIntensity: .9, roughness: .46 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xcc863c, emissive: 0x9a4a0a, emissiveIntensity: .55 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3987a8, emissive: 0x1266a4, emissiveIntensity: .55 }),
  green: new THREE.MeshStandardMaterial({ color: 0x57946c, emissive: 0x277a39, emissiveIntensity: .45 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x142e30, emissive: 0x143f41, emissiveIntensity: 1.3, roughness: .48 }),
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 18);
const pos = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function gridTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = "#747f7a"; ctx.fillRect(0, 0, 512, 512);
  let seed = 71;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 14500; i++) {
    const n = random(), x = random() * 512, y = random() * 512;
    ctx.fillStyle = n < .47 ? "rgba(10,25,24,.052)" : "rgba(245,246,218,.045)";
    ctx.fillRect(x, y, 1 + random() * 4, 1 + random() * 4);
  }
  ctx.strokeStyle = "rgba(18,28,30,.42)"; ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
  for (let y = 0; y <= 512; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function signTexture(lines: string[], width = 600, height = 260, accent = "#d7e9dc") {
  const canvas = document.createElement("canvas");
  // Render the lettering at 1.5x resolution. Mobile players can walk up to
  // the same physical sign, with an accessible transcribed inspection action.
  const dpr = 1.5;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d");
  if (!c) return null;
  c.scale(dpr, dpr);
  c.fillStyle = "#102124"; c.fillRect(0, 0, width, height);
  c.fillStyle = "#244347"; c.fillRect(0, 0, width, 5);
  c.fillStyle = accent; c.font = "700 32px monospace";
  lines.forEach((line, i) => { c.font = i === 0 ? "700 34px monospace" : "500 28px monospace"; c.fillText(line, 24, 62 + i * 48, width - 48); });
  for (let i = 0; i < 9; i++) { c.fillStyle = "rgba(150,230,212,.08)"; c.fillRect(0, 18 + i * 28, width, 1); }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class IsolationWorld {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(72, 1, .07, 85);
  readonly renderer: THREE.WebGLRenderer;
  readonly player = pos(0, 1.64, 4.3);
  readonly keys = new Set<string>();
  readonly doors: THREE.Object3D[] = [];
  readonly lights: THREE.PointLight[] = [];
  readonly targets: Target[] = [];
  readonly roomCenters = CENTER;
  room: Chamber = 0;
  yaw = 0;
  pitch = 0;
  zoom = 72;
  elapsed = 0;
  running = false;
  mobileVector = { x: 0, y: 0 };
  hasFuse = false;
  fusePlaced = false;
  hasBadge = false;
  readonly triageDigits = [[4, 2, 7], [5, 8, 3], [3, 1, 6], [7, 4, 9]][Math.floor(Math.random() * 4)];
  readonly relayPattern = [[1, 0, 2], [2, 1, 0], [0, 2, 1], [1, 2, 0]][Math.floor(Math.random() * 4)];
  readonly valvePattern = [["blue", "green", "red"], ["green", "red", "blue"], ["red", "blue", "green"]][Math.floor(Math.random() * 3)];
  relays: number[] = [];
  oxygenCells: string[] = [];
  oxygenInstalled = false;
  readTriage = false;
  recordingPlayed = false;
  firstDoor = false;
  secondDoor = false;
  valves: string[] = [];
  ventReady = false;
  breakers: boolean[] = [false, false, false];
  foundLog = false;
  won = false;
  enemyMode: "dormant" | "roaming" | "hunting" = "dormant";
  private raycaster = new THREE.Raycaster();
  private signage = new Map<string, string[]>();
  private pickupMeshes: THREE.Object3D[] = [];
  readonly enemy: THREE.Group;
  private enemyMixer?: THREE.AnimationMixer;
  private enemyWalk?: THREE.AnimationAction;
  private enemyChase?: THREE.AnimationAction;
  private enemyIdle?: THREE.AnimationAction;
  private enemyActiveAction?: THREE.AnimationAction;
  private enemyBase?: THREE.Object3D;
  private creatureIdentity?: ReturnType<typeof constructOrderlyIdentity>;
  private enemyRoute: THREE.Vector3[] = [];
  private enemyRouteAt = -99;
  private preyMemory = -99;
  private prevEnemyMode = "dormant";
  private lastHuntAlert = -99;
  private roomEnteredAt = 0;
  private momentSeen = new Set<string>();
  private hitJolt = 0;
  private enemyLastAttack = -100;
  private eventAt = -1;
  private doorPanels: THREE.Mesh[] = [];
  private disposed = false;
  private pulse = 0;
  private walkPhase = 0;
  private art?: ReturnType<typeof installHospitalPremiumArt>;
  private director?: ReturnType<typeof installHospitalCinematics>;
  private interactionArt?: ReturnType<typeof installHospitalInteractionArt>;
  private stagedThreats=new Set<number>();
  private clinicalBeds: THREE.Group[] = [];
  private loadedAssets: THREE.Object3D[] = [];
  private doorDressing: THREE.Group[] = [];
  private rotators = new Map<string, THREE.Object3D>();
  private breakerNodes: THREE.Object3D[] = [];
  private alertSign?: THREE.Mesh;
  private alertLight?: THREE.PointLight;
  private flickerUntil = -1;
  private nextThreatAt = 58;
  private oldChamber: Chamber = 0;
  private keySpot?: THREE.SpotLight;
  private softwareRenderer = false;
  private avgFrame = 0;
  private frameCount = 0;
  private scalePixelRatio = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.4);
  private signals: GameSignals;

  constructor(canvas: HTMLCanvasElement, signals: GameSignals) {
    this.signals = signals;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
    // CI, virtual machines and older browsers may provide a software GPU.
    // Reduced render scale and no realtime shadow maps prevent stalls.
    const context = this.renderer.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const gpu = info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    this.softwareRenderer = /swiftshader|llvmpipe|software rasterizer/i.test(gpu);
    if (this.softwareRenderer) this.scalePixelRatio = .78;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.58;
    this.renderer.shadowMap.enabled = !this.softwareRenderer;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(this.scalePixelRatio);
    this.scene.background = new THREE.Color("#12191a");
    this.scene.fog = new THREE.FogExp2(0x10191b, .022);
    this.scene.add(new THREE.HemisphereLight(0xb5c9bc, 0x202123, 1.06));
    this.camera.rotation.order = "YXZ";
    const floor = gridTexture();
    if (floor) mats.tile.map = floor;
    for (let i = 0; i < 3; i++) this.buildRoom(i as Chamber);
    this.art = installHospitalPremiumArt(this.scene, mats);
    this.director = installHospitalCinematics(this.scene);
    this.interactionArt = installHospitalInteractionArt(this.scene);
    this.indexPremiumArt();
    void this.loadClinicalAssets();
    void this.loadMedicalSetPieces();
    this.enemy = this.makeEnemy();
    this.scene.add(this.enemy);
    this.loadRig();
    this.enemy.position.set(2.5, 0, -16.5);
    this.camera.position.copy(this.player);
    // One shadowed spotlight rather than the extremely expensive six-pass
    // cubemap shadow for every point light. Only current-room geometry is active.
    this.keySpot = new THREE.SpotLight(0xc3e4d7, 22, 14, .83, .72, 1.7);
    this.keySpot.position.set(-2.65, 3.66, 2.6);
    this.keySpot.target.position.set(0, 1.2, -1.8);
    this.keySpot.castShadow = !this.softwareRenderer;
    this.keySpot.shadow.mapSize.set(512, 512);
    this.keySpot.shadow.bias = -.0007;
    this.scene.add(this.keySpot, this.keySpot.target);
    this.showRoom();
    this.resize();
  }

  private block(name: string, x: number, y: number, z: number, w: number, h: number, d: number, mat = mats.steel, parent: THREE.Object3D = this.scene) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.name = name; m.position.set(x, y, z); m.scale.set(w, h, d);
    m.castShadow = h > .22 && h < 3 && w > .14 && w < 3 && d < 3; m.receiveShadow = true;
    parent.add(m); return m;
  }

  private pipe(name: string, x: number, y: number, z: number, radius: number, height: number, mat = mats.steel, parent: THREE.Object3D = this.scene) {
    const m = new THREE.Mesh(unitCylinder, mat);
    m.name = name; m.position.set(x, y, z); m.scale.set(radius, height, radius);
    m.castShadow = true; parent.add(m); return m;
  }

  private panel(lines: string[], x: number, y: number, z: number, w: number, h: number, accent?: string) {
    const texture = signTexture(lines, 640, 255, accent);
    if (!texture) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    m.position.set(x, y, z); this.scene.add(m);
    if (lines.length > 0) {
      const id = "sign-" + this.signage.size;
      this.signage.set(id, [...lines]);
      let nearest: Chamber = 0;
      if (Math.abs(z - CENTER[1]) < Math.abs(z - CENTER[nearest])) nearest = 1;
      if (Math.abs(z - CENTER[2]) < Math.abs(z - CENTER[nearest])) nearest = 2;
      this.target(id, "Leer cartel: " + lines[0], m, nearest, 4.4);
    }
    return m;
  }

  private target(id: string, label: string, mesh: THREE.Object3D, room: Chamber, range = 3.25) {
    mesh.userData.target = id;
    this.targets.push({ id, label, object: mesh, room, range });
    this.pickupMeshes.push(mesh);
    return mesh;
  }

  private desk(x: number, z: number, angle = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; this.scene.add(g);
    this.block("Mostrador", 0, 1.01, 0, 2.45, .16, .92, mats.ceramic, g);
    for (const x1 of [-1.07, 1.07]) for (const z1 of [-.34, .34]) this.block("Pata metálica", x1, .5, z1, .06, .98, .06, mats.dark, g);
    this.block("Panel de seguridad", 0, .45, .43, 2.2, .8, .08, mats.paint, g);
    return g;
  }

  private gurney(x: number, z: number, angle = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; g.name = "HospitalBedFallback"; this.scene.add(g);
    this.clinicalBeds.push(g);
    this.block("Colchón clínico", 0, .9, 0, 1.07, .19, 2.23, mats.vinyl, g);
    this.block("Sábana", 0, 1.012, -.32, .98, .025, 1.48, mats.linen, g);
    this.block("Almohada", 0, 1.07, -.83, .86, .11, .38, mats.ceramic, g);
    this.block("Base", 0, .70, 0, .9, .085, 1.95, mats.steel, g);
    for (const a of [-.75, .75]) {
      this.block("Barra lateral", -.6, 1.17, a, .052, .42, .055, mats.steel, g);
      this.block("Barra lateral", .6, 1.17, a, .052, .42, .055, mats.steel, g);
      this.block("Armazón", 0, 1.34, a, 1.3, .055, .055, mats.steel, g);
    }
    for (const x1 of [-.43, .43]) for (const z1 of [-.85, .85]) {
      this.pipe("Rueda", x1, .21, z1, .11, .085, mats.dark, g).rotation.z = Math.PI / 2;
      this.pipe("Pata", x1, .5, z1, .055, .6, mats.steel, g);
    }
    return g;
  }

  private iv(x: number, z: number) {
    this.pipe("Soporte de suero", x, 1.35, z, .02, 2.65, mats.steel);
    this.pipe("Base", x, .1, z, .21, .055, mats.dark);
    this.block("Suero", x + .13, 2.36, z, .18, .34, .11, mats.glass);
    this.block("Etiqueta médica", x + .13, 2.37, z + .06, .13, .12, .01, mats.linen);
    this.block("Gancho", x + .08, 2.64, z, .28, .025, .03, mats.steel);
  }

  private cabinet(x: number, z: number, sideways = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); if (sideways) g.rotation.y = Math.PI / 2; this.scene.add(g);
    this.block("Armario", 0, 1.12, 0, 1.52, 2.15, .55, mats.paint, g);
    for (const n of [-.38, .38]) {
      this.block("Puerta de armario", n, 1.12, .3, .72, 1.96, .035, mats.steel, g);
      this.block("Asa", n + .21, 1.15, .35, .026, .25, .045, mats.dark, g);
    }
    for (let i = 0; i < 5; i++) this.block("Ventilación", -.45 + i * .22, .54, .33, .13, .014, .02, mats.dark, g);
    return g;
  }

  private light(x: number, z: number, red = false) {
    const g = new THREE.Group(); g.position.set(x, 3.63, z); this.scene.add(g);
    this.block("Caja luminaria", 0, 0, 0, 1.52, .12, .47, mats.steel, g);
    this.block("Difusor", 0, -.075, 0, 1.32, .017, .33, red ? mats.red : new THREE.MeshStandardMaterial({ color: 0xc5d9d0, emissive: 0x9ab5b6, emissiveIntensity: 1.25 }), g);
    const light = new THREE.PointLight(red ? 0xff4840 : 0xb8d5c7, red ? 14 : 18, 10, 2);
    light.position.set(x, 3.3, z);
    // The shared spotlight supplies optimized shadows; these illuminate only.
    light.castShadow = false;
    this.scene.add(light); this.lights.push(light);
  }

  private buildRoom(index: Chamber) {
    const rootStart = this.scene.children.length;
    const z = CENTER[index];
    const dark = index === 2;
    // Distinct contiguous 13-metre chambers with physically traversable door thresholds.
    this.block("Suelo esmaltado", 0, -.14, z, 11.4, .28, 12.94, mats.tile);
    this.block("Techo", 0, 3.96, z, 11.4, .16, 12.96, mats.ceiling);
    this.block("Pared izquierda", -5.63, 1.91, z, .28, 3.8, 13, mats.concrete);
    this.block("Pared derecha", 5.63, 1.91, z, .28, 3.8, 13, mats.concrete);
    this.block("Panel izquierdo", -5.47, 1.2, z, .025, 2.35, 12.73, mats.paint);
    this.block("Panel derecho", 5.47, 1.2, z, .025, 2.35, 12.73, mats.paint);
    const back = z - 6.51;
    const front = z + 6.51;
    this.block("Entrada norte A", -3.68, 1.92, back, 3.76, 3.86, .24, mats.concrete);
    this.block("Entrada norte B", 3.68, 1.92, back, 3.76, 3.86, .24, mats.concrete);
    this.block("Dintel norte", 0, 3.49, back, 2.16, .86, .26, mats.steel);
    this.block("Marco izquierdo", -1.08, 1.49, back + .10, .11, 2.96, .31, mats.steel);
    this.block("Marco derecho", 1.08, 1.49, back + .10, .11, 2.96, .31, mats.steel);
    if (index === 0) this.block("Muro de entrada", 0, 1.93, front, 11.3, 3.9, .28, mats.concrete);
    else {
      this.block("Pared trasera izquierda", -3.68, 1.92, front, 3.76, 3.86, .24, mats.concrete);
      this.block("Pared trasera derecha", 3.68, 1.92, front, 3.76, 3.86, .24, mats.concrete);
      this.block("Dintel sur", 0, 3.49, front, 2.16, .86, .26, mats.steel);
    }
    this.block("Zócalo izquierdo", -5.28, .19, z, .18, .38, 12.69, mats.dark);
    this.block("Zócalo derecho", 5.28, .19, z, .18, .38, 12.69, mats.dark);
    for (let k = 0; k < 7; k++) {
      const za = z - 5.5 + k * 1.75;
      this.block("Placa lateral", -5.26, 2.66, za, .035, .012, 1.2, mats.steel);
      this.block("Placa lateral", 5.26, 2.66, za, .035, .012, 1.2, mats.steel);
      this.block("Tubería del techo", -4.8, 3.78, za, .19, .19, 1.53, mats.dark);
    }
    this.light(-2.6, z + 2.4);
    this.light(2.2, z - 2.7, dark);
    const door = this.block("Puerta de contención", 0, 1.43, back + .16, 1.97, 2.78, .17, mats.dark);
    this.block("Emblema de compuerta", 0, 2.40, back + .29, 1.15, .075, .015, mats.red);
    this.doorPanels.push(door);
    this.doors.push(door);
    // The raised face, gasket, hinges and bolt lines travel with the door.
    const dressing = new THREE.Group();
    dressing.position.z = back + .3;
    dressing.name = "Puerta Blindada - Detalles";
    this.scene.add(dressing);
    this.doorDressing.push(dressing);
    for (const y of [.35, 2.55]) {
      this.block("Relieve transversal", 0, y, 0, 1.76, .11, .065, mats.steel, dressing);
    }
    for (const x of [-.8, .8]) {
      this.block("Nervadura de acero", x, 1.45, .02, .14, 2.27, .07, mats.steel, dressing);
      for (const y of [.47, .94, 1.45, 1.94, 2.43]) {
        this.pipe("Perno hexagonal", x, y, .09, .065, .04, mats.rust, dressing).rotation.x = Math.PI / 2;
      }
    }
    this.block("Ventana acero reforzado", 0, 1.86, .065, 1.13, .69, .055, mats.steel, dressing);
    this.block("Visor blindado", 0, 1.86, .099, .97, .53, .035, mats.glass, dressing);
    this.block("Junta de portillo", 0, 1.86, .131, .87, .035, .01, mats.dark, dressing);
    this.block("Palanca de desbloqueo", .45, .87, .15, .39, .09, .11, mats.amber, dressing);
    for (let slot = 0; slot < 7; slot++) this.block("Rejilla de presión", -.36 + slot * .12, 1.11, .12, .075, .22, .032, mats.dark, dressing);

    if (index === 0) this.buildEmergency(z);
    if (index === 1) this.buildIsolation(z);
    if (index === 2) this.buildContainment(z);
    for (const object of this.scene.children.slice(rootStart)) object.userData.chamber = index;
  }

  private buildEmergency(z: number) {
    this.panel(["URGENCIAS  //  NIVEL 01", "TRIAJE · ARCHIVO · SEGURIDAD", "PROTOCOLO 15 / ACTIVO"], 0, 2.83, z + 6.27, 4.05, 1.49, "#bfd5cb");
    this.desk(-2.95, z + 2.55, Math.PI / 2);
    this.gurney(2.85, z + 2, .28);
    this.gurney(3, z - 2.68, -.25);
    this.iv(4.12, z + 2.8);
    this.iv(4.5, z - 3.2);
    this.cabinet(-4.3, z - 2.3, true);
    // No obstructive floating kiosks: the terminal is mounted on the desk.
    this.panel(["REGISTRO DE TRIAJE", "CLAVE = PRIORIDADES P1 P2 P3", "CONSULTAR ARCHIVO CLÍNICO"], -3.38, 2.03, z - 6.24, 2.26, 1.15);
    const triage = this.block("Archivo de triaje", 3.92, 1.1, z + 1.8, .37, .035, .28, mats.linen);
    this.target("triage", "Consultar historias de triaje", triage, 0, 2.3);
    this.panel(["TABLERO DE RELÉS", "ORDEN: " + this.relayPattern.map(i => "R" + (i + 1)).join(" > "), "LIBERAR CONSOLA DE SEGURIDAD"], 2.98, 1.57, z - 6.24, 2.22, .8, "#f2cf92");
    for (let n = 0; n < 3; n++) {
      const zRelay = z - 3.6 + n * 1.3;
      this.block("Panel de relé", 5.16, 1.47, zRelay, .29, .61, .52, mats.dark);
      const lever = this.block("Palanca del relé", 4.97, 1.44, zRelay, .22, .24, .15, mats.amber);
      this.target("relay-" + n, "Relé R" + (n + 1), lever, 0, 2.6);
      this.rotators.set("relay-" + n, lever);
    }
    this.panel(["SALA 01", "ALIMENTACIÓN AUXILIAR", "USE FUSIBLE F-08"], 3.35, 2.66, z - 6.24, 2.28, .91);
    const fuse = this.block("Fusible F-08", -3.09, 1.16, z + 2.22, .14, .13, .26, mats.amber);
    this.target("fuse", "Retirar fusible F-08 del mostrador", fuse, 0, 2.55);
    const fuseBox = this.block("Panel de fusibles", -5.16, 1.42, z - 1.5, .23, 1.0, .86, mats.dark);
    this.target("fusebox", "Restaurar alimentación de seguridad", fuseBox, 0, 2.4);
    const badge = this.block("Tarjeta identificatoria", 3.1, 1.07, z + 1.85, .26, .015, .14, mats.ceramic);
    this.target("badge", "Recoger tarjeta de personal", badge, 0, 2.2);
    this.block("Base de terminal", -2.82, 1.11, z + 2.49, .65, .12, .42, mats.steel);
    const keyboard = this.block("Terminal de acceso", -2.82, 1.4, z + 2.48, .56, .62, .13, mats.screen);
    this.block("Consola de botones", -2.82, 1.12, z + 2.75, .55, .036, .21, mats.dark);
    this.target("terminal", "Terminal de seguridad — código de tres dígitos", keyboard, 0, 2.8);
    const emergencyMsg = signTexture(["PROHIBIDO EL ACCESO", "PACIENTE 015 IDENTIFICADO", "NO SALDRÁS DE AQUÍ"], 640, 255, "#f49a85");
    if (emergencyMsg) {
      this.alertSign = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.23), new THREE.MeshBasicMaterial({ map: emergencyMsg, side: THREE.DoubleSide }));
      this.alertSign.position.set(.55, 2.5, z - 6.18);
      this.alertSign.visible = false;
      this.scene.add(this.alertSign);
    }
    // Readable triage wall board replaces a floating screen-sized hint.
    // Directional floor strip lights are part of the world, not floating HUD markers.
    for (let k = 0; k < 4; k++) this.block("Camino luminiscente", 0, .01, z - 2.4 - k * .73, .28, .012, .17, mats.amber);
  }

  private buildIsolation(z: number) {
    this.panel(["AISLAMIENTO // NIVEL 02", "PRESIÓN NEGATIVA", "NO ABRIR EN PRESENCIA DE MOVIMIENTO"], 0, 2.83, z + 6.23, 4.4, 1.37);
    // Biopods are staggered against the side walls. The central sightline
    // stays open to the exit and the three puzzle valves.
    const pods = [
      { x: -4.04, offset: 2.2 },
      { x: 4.04, offset: .2 },
      { x: -4.04, offset: -.55 }
    ];
    for (const pod of pods) {
      const x = pod.x, zz = z + pod.offset;
      this.block("Módulo biológico", x, 1.2, zz, 2.14, 2.35, .95, mats.dark);
      this.block("Visor de cámara", x, 1.5, zz + .52, 1.72, 1.25, .055, mats.glass);
      this.block("Tuberías de cámara", x - .68, 2.62, zz + .02, .075, .34, .075, mats.steel);
      this.pipe("Cartucho de suspensión", x + .72, 2.29, zz, .11, .65, mats.steel);
    }
    this.panel(["SECUENCIA DE PURGA", this.valvePattern.map(c => ({ blue: "AZUL", green: "VERDE", red: "ROJO" }[c] || c.toUpperCase())).join(" > "), "EXTRACTOR: ACTIVAR AL FINAL"], 0, 2.31, z - 6.25, 4.17, 1.34, "#cbe1b7");
    this.cabinet(-4.45, z - 2.7, true);
    this.panel(["REGULADOR DE OXÍGENO", "DOS CELDAS ANTES DE PURGAR", "SOLO DESPUÉS: ABRIR VÁLVULAS"], 2.8, 1.55, z - 6.24, 2.52, .98, "#c5eee2");
    for (const [key, x, zz] of [["alpha", -3.85, z + 3.1], ["beta", 3.72, z + 3.25]] as const) {
      this.block("Soporte de celda de oxígeno", x, 1.06, zz, .72, .43, .36, mats.steel);
      const cartridge = this.pipe("Celda criogénica", x, 1.38, zz, .12, .42, mats.ceramic);
      this.target("cell-" + key, "Retirar celda de oxígeno " + key.toUpperCase(), cartridge, 1, 2.6);
    }
    // Offset left so evacuation corridor retains an unobstructed sightline.
    this.block("Regulador bipuerto", -2.9, 1.34, z - 4.0, .95, .85, .4, mats.dark);
    const regulator = this.block("Selector de regulador", -2.9, 1.4, z - 3.75, .51, .36, .1, mats.blue);
    this.target("regulator", "Instalar dos celdas en el regulador", regulator, 1, 2.9);
    // Three industrial handwheels are bolted to the right-side gas network,
    // not hovering on poles in the middle of the escape corridor.
    const valveColors = [mats.blue, mats.green, mats.red];
    const valveOffsets = [3.85, 2.55, -2];
    for (let n = 0; n < 3; n++) {
      const zz = z + valveOffsets[n];
      this.block("Placa de montaje", 5.02, 1.48, zz, .17, .76, .78, mats.dark);
      this.pipe("Línea de presión vertical", 5.06, 1.47, zz, .085, 1.82, mats.steel);
      const spindle = this.pipe("Eje giratorio", 4.85, 1.48, zz, .085, .45, mats.steel);
      spindle.rotation.z = Math.PI / 2;
      const wheel = new THREE.Group();
      wheel.name = "Volante de purga " + n;
      wheel.position.set(4.63, 1.48, zz);
      this.scene.add(wheel);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.29, .044, 9, 28), mats.steel);
      ring.name = "Corona metálica"; ring.rotation.y = Math.PI / 2;
      wheel.add(ring);
      for (let spoke = 0; spoke < 6; spoke++) {
        const spokeMesh = this.block("Radio metálico", 0, 0, 0, .047, .047, .54, mats.rust, wheel);
        spokeMesh.rotation.x = spoke * Math.PI / 6;
      }
      const hub = this.pipe("Núcleo cromático", 0, 0, 0, .11, .13, valveColors[n], wheel);
      hub.rotation.z = Math.PI / 2;
      // Generous invisible pick surface makes the wheel usable on a phone.
      const touchSurface = new THREE.Mesh(
        new THREE.CylinderGeometry(.37, .37, .062, 24),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
      );
      touchSurface.name = "Zona táctil del volante";
      touchSurface.rotation.z = Math.PI / 2;
      wheel.add(touchSurface);
      const plate = this.block("Indicador de gas", 4.87, 1.94, zz, .11, .14, .38, valveColors[n]);
      plate.castShadow = false;
      const valveId = ["valve-blue", "valve-green", "valve-red"][n];
      this.target(valveId, ["Válvula azul", "Válvula verde", "Válvula roja"][n], wheel, 1, 2.85);
      this.rotators.set(valveId, wheel);
    }
    this.block("Sistema de extracción", 4.13, 2.3, z - 4.2, 1.45, 1.55, .8, mats.dark);
    const extract = this.pipe("Ventilador", 4.13, 2.22, z - 3.77, .4, .08, mats.steel);
    extract.rotation.x = Math.PI / 2;
    this.target("extractor", "Activar extracción — purga completa", extract, 1, 3.6);
    this.panel(["ATENCIÓN", "SI ESCUCHÁS PASOS", "NO TE QUEDES QUIETO"], -3.74, 2.8, z - 6.24, 1.4, 1.2, "#efb18f");
    const hide = this.block("Cortina de aislamiento", -4.27, 1.53, z + 3.85, .12, 2.7, 1.3, mats.vinyl);
    this.target("hide", "Ocultarse detrás de la cortina", hide, 1, 2.3);
    for (const x of [-4.97, 4.97]) for (let i = 0; i < 5; i++) this.pipe("Red de presión", x, 3.65, z - 4 + i * 1.8, .047, 1.1, mats.steel).rotation.x = Math.PI / 2;
  }

  private buildContainment(z: number) {
    this.panel(["CONTENCIÓN // NIVEL 03", "REACTOR AUXILIAR", "CIERRE DEFINITIVO EN CURSO"], 0, 2.83, z + 6.23, 4.25, 1.42, "#e89d82");
    // Never hide the final door behind a large central electrical cabinet.
    // Physical distribution keeps switches reachable along the perimeter.
    const breakerLocations = [
      { x: -3.7, offset: 1.4 },
      { x: 3.7, offset: 1.4 },
      { x: 3.7, offset: -1.35 }
    ];
    for (let i = 0; i < 3; i++) {
      const { x, offset } = breakerLocations[i];
      const zz = z + offset;
      this.block("Armario eléctrico", x, 1.38, zz, 1.45, 2.25, .66, mats.dark);
      this.block("Frontal eléctrico", x, 1.53, zz + .35, 1.22, 1.52, .035, mats.steel);
      this.block("Amperímetro", x, 1.88, zz + .38, .67, .38, .032, mats.screen);
      // An electromechanical handle fits into the inset security panel.
      this.block("Placa disyuntor", x, 1.22, zz + .48, .38, .48, .055, mats.dark);
      const breaker = new THREE.Group();
      breaker.name = "Palanca principal " + ["A", "B", "C"][i];
      breaker.position.set(x, 1.22, zz + .55);
      this.scene.add(breaker);
      this.block("Tapa de palanca", 0, 0, .04, .16, .33, .085, mats.ceramic, breaker);
      this.block("Indicador de posición", 0, .10, .10, .16, .07, .075, mats.amber, breaker);
      this.block("Muelle mecánico", 0, -.12, .10, .13, .055, .055, mats.steel, breaker);
      this.target("breaker-" + i, "Interruptor principal " + ["A", "B", "C"][i], breaker, 2, 3.2);
      this.breakerNodes.push(breaker);
      this.pipe("Conducto reactor", x, 3.34, zz, .14, .85, mats.rust);
    }
    this.panel(["APERTURA DE EMERGENCIA", "A = ENCENDIDO", "B = APAGADO", "C = ENCENDIDO"], 0, 2.6, z - 6.23, 3.5, 1.56, "#bddfc1");
    const log = this.block("Registro audio #15", -4.28, 1.26, z - 2.8, .78, .18, .56, mats.dark);
    this.target("log", "Registro de identidad — expediente 15", log, 2, 3.4);
    this.panel(["TRANSMISIÓN INTERCEPTADA", "LA VOZ NO ES HUMANA", "PROTOCOLO: DESCONFIAR"], -3.88, 2.61, z - 6.23, 1.7, 1.18, "#ebbf9f");
    this.block("Consola de control", 0, .97, z - 3.2, 2.35, .78, .95, mats.steel);
    const speaker = this.block("Intercomunicador", 0, 1.42, z - 3.3, .9, .65, .14, mats.screen);
    this.target("speaker", "Elegir comunicación de emergencia", speaker, 2, 3.1);
    this.block("Señal salida", 0, 3.08, z - 6.2, 1.35, .33, .13, mats.green);
    const escape = this.block("Control de evacuación", 1.48, 1.13, z - 5.98, .36, .57, .18, mats.red);
    this.target("escape", "Activar puerta de evacuación", escape, 2, 2.9);
    for (let i = 0; i < 9; i++) this.pipe("Cable suspendido", -4.7 + i * 1.14, 3.66, z - 3, .042, 4.2, mats.dark).rotation.x = Math.PI / 2;
  }

  private makeEnemy() {
    // Geometrical body provides fallback while licensed skeletal GLB is fetched.
    const group = new THREE.Group();
    const body = new THREE.Group(); group.add(body);
    const black = new THREE.MeshStandardMaterial({ color: 0x12191b, roughness: .88, side: THREE.DoubleSide });
    const skin = new THREE.MeshStandardMaterial({ color: 0x9d9890, roughness: .94 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.38, 1.08, 7, 14), black);
    torso.position.y = 1.20; body.add(torso);
    const face = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 12), skin);
    face.scale.set(.78, 1.13, .68); face.position.y = 2.22; body.add(face);
    const shroud = new THREE.Mesh(new THREE.ConeGeometry(.56, 1.72, 9), black);
    shroud.position.y = .86; body.add(shroud);
    for (const x of [-.36, .36]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .79, 5, 10), black);
      arm.position.set(x * 1.25, 1.28, .035); arm.rotation.z = x > 0 ? -.18 : .18; body.add(arm);
    }
    for (const x of [-.17, .17]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.115, .72, 5, 9), black);
      leg.position.set(x, .46, 0); body.add(leg);
    }
    const mask = new THREE.Mesh(new THREE.SphereGeometry(.195, 12, 11), new THREE.MeshStandardMaterial({ color: 0xd9d2c1, roughness: .49 }));
    mask.scale.set(.86, 1.1, .27); mask.position.set(0, 2.23, -.138); body.add(mask);
    for (const x of [-.077, .077]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.027, 9, 7), mats.dark);
      eye.position.set(x, 2.26, -.196); body.add(eye);
    }
    group.userData.fallback = body;
    this.creatureIdentity = constructOrderlyIdentity();
    this.creatureIdentity.root.position.set(0, 1.86, -.06);
    body.add(this.creatureIdentity.root);
    return group;
  }

  private indexPremiumArt() {
    for (const object of this.scene.children) {
      if (object.userData.chamber !== undefined || object instanceof THREE.Light || object instanceof THREE.InstancedMesh) continue;
      // The premium art kit intentionally uses top-level world-space placements.
      // Dust particles tag their own chamber. Shared instanced trim spans all rooms.
      const z = object.position.z;
      const chamber = Math.max(0, Math.min(2, Math.round(-z / 13))) as Chamber;
      object.userData.chamber = chamber;
    }
  }

  private showRoom() {
    for (const object of this.scene.children) {
      const ch = object.userData.chamber as number | undefined;
      if (ch !== undefined) object.visible = ch === this.room;
    }
    if (this.keySpot) {
      const z = CENTER[this.room];
      this.keySpot.position.set(-2.65, 3.66, z + 2.65);
      this.keySpot.target.position.set(this.room===2?-.7:0, 1.36, z - 2.8);
      this.keySpot.color.setHex(this.room===0?0xd6e9dc:this.room===1?0x9ad8d0:0xc6a7a0);
    }
  }

  private async loadClinicalAssets() {
    // Original Innerscene medical GLBs, CC0; downloaded and bundled by Pages CI.
    // Non-blocking: full physical fallback geometry remains if a file is missing.
    const loader = new GLTFLoader();
    const base = "/aislamiento-15/models/";
    const selected = ["hospital-bed-flat.glb", "hospital-bed-raised.glb"];
    for (let i = 0; i < selected.length; i++) {
      try {
        const gltf = await loader.loadAsync(base + selected[i]);
        if (this.disposed) return;
        const model = gltf.scene;
        const originalBounds = new THREE.Box3().setFromObject(model);
        const size = originalBounds.getSize(new THREE.Vector3());
        if (!Number.isFinite(size.length()) || size.length() < .3) continue;
        // Assets use real metres. Normalize only orientation and ground pivot.
        if (size.x > size.z * 1.15) model.rotation.y = Math.PI / 2;
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        model.position.y -= bounds.min.y;
        model.traverse(o => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true; o.receiveShadow = true;
          }
        });
        const fallback = this.clinicalBeds[i];
        if (!fallback) break;
        fallback.visible = false;
        const sceneWrapper = new THREE.Group();
        sceneWrapper.name = "GLB Hospital Bed CC0";
        sceneWrapper.position.copy(fallback.position);
        sceneWrapper.rotation.copy(fallback.rotation);
        sceneWrapper.add(model);
        sceneWrapper.userData.chamber = 0;
        sceneWrapper.visible = this.room === 0;
        this.scene.add(sceneWrapper); this.loadedAssets.push(sceneWrapper);
      } catch { /* Keep detailed fallback stretcher in place. */ }
    }
    try {
      const headwall = await loader.loadAsync(base + "medical-headwall.glb");
      if (this.disposed) return;
      const unit = headwall.scene;
      unit.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
      unit.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(unit);
      unit.position.y -= bbox.min.y;
      unit.rotation.y = Math.PI / 2;
      const fixture = new THREE.Group();
      fixture.position.set(5.08, 1.04, 2.30);
      fixture.add(unit);
      fixture.name = "GLB Medical Headwall CC0";
      fixture.userData.chamber = 0;
      fixture.visible = this.room === 0;
      this.scene.add(fixture); this.loadedAssets.push(fixture);
    } catch { /* Architectural fixtures remain if offline. */ }
  }

  private async loadMedicalSetPieces() {
    // All models are CC0 original Innerscene medical equipment and are placed
    // in corners or against walls, away from core puzzle interaction zones.
    // Explicitly asynchronous: the hospital and gameplay are already usable.
    const loader = new GLTFLoader();
    const entries = [
      { file: "supply-cart.glb", placements: [[-4.56, 4.35, .28], [4.55, -30.1, -1.1]] },
      { file: "vital-monitor.glb", placements: [[4.53, -.04, -.32], [4.36, -16.35, 1.4]] },
      { file: "exam-light.glb", placements: [[4.51, -9.3, -.45]] },
      { file: "privacy-curtain.glb", placements: [[-4.1, -9.15, Math.PI / 2]] },
      { file: "transport-stretcher.glb", placements: [[3.44, -4.63, 1.43]] }
    ] as const;
    for (const entry of entries) {
      try {
        const gltf = await loader.loadAsync("/aislamiento-15/models/" + entry.file);
        if (this.disposed) return;
        for (const [x, z, yaw] of entry.placements) {
          const node = gltf.scene.clone(true);
          const group = new THREE.Group();
          group.name = "Premium CC0 " + entry.file;
          // Physical scale and local pivot are kept consistent with room geometry.
          node.rotation.y = yaw;
          node.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(node);
          const center = bounds.getCenter(new THREE.Vector3());
          node.position.x -= center.x;
          node.position.y -= bounds.min.y;
          node.position.z -= center.z;
          node.traverse(object => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true; object.receiveShadow = true;
            }
          });
          group.position.set(x, 0, z);
          group.add(node);
          group.userData.chamber = Math.max(0, Math.min(2, Math.round(-z / 13)));
          group.visible = group.userData.chamber === this.room;
          this.scene.add(group); this.loadedAssets.push(group);
        }
      } catch { /* The illustrated fixture already present remains as fallback. */ }
    }
  }

  private loadRig() {
    // First choice: licensed CC0 adult human locomotion set (7 skeletal clips).
    // Shipped locally and texture-optimized for mobile. The studio-owned model
    // remains as a low-bandwidth fallback if the new asset cannot load.
    const url = "/aislamiento-15/models/warden-human.glb";
    const loader = new GLTFLoader();
    const attach = (gltf: Awaited<ReturnType<GLTFLoader["loadAsync"]>>) => {
      if (this.disposed) return;
      const rig = gltf.scene;
      // Model dimensions and pivots are normalized without a character controller.
      rig.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(rig);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= .1) return;
      rig.scale.setScalar(Math.min(6, Math.max(.12, 2.20 / size.y)));
      rig.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(rig);
      rig.position.set(-(fitted.min.x + fitted.max.x) / 2, -fitted.min.y, -(fitted.min.z + fitted.max.z) / 2);
      rig.rotation.y = Math.PI;
      rig.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true; o.receiveShadow = true;
          // Respect professional textures and tailor dark hospital uniform.
          const baseMaterial = Array.isArray(o.material) ? o.material : [o.material];
          const updated = baseMaterial.map(m => {
            if (!(m instanceof THREE.MeshStandardMaterial)) return m;
            const clone = m.clone();
            clone.color.multiply(new THREE.Color(0x657970));
            clone.roughness = Math.max(.76, clone.roughness);
            clone.metalness = Math.min(.16, clone.metalness);
            return clone;
          });
          o.material = Array.isArray(o.material) ? updated : updated[0];
        }
      });
      // Studio GLB supplies the skeletal walk; an original medical mask gives
      // the antagonist a unique silhouette without flattening the 3D character.
      if (this.creatureIdentity) {
        // Bind the bespoke faceplate to the actual animated Head bone. A mask
        // fixed to the actor root visibly drifts away during walk and chase.
        let headBone: THREE.Bone | undefined;
        rig.traverse(node => {
          if (node instanceof THREE.Bone && /(^|[._:| ])head($|[._:| ])/i.test(node.name)) {
            headBone = node;
          }
        });
        if (headBone) {
          const identity = this.creatureIdentity.root;
          // Normalize for the imported character's metre conversion. Rigid
          // local geometry inherits the head's animated translation/rotation.
          identity.scale.setScalar(1 / rig.scale.x);
          identity.position.set(0, -.18, -.06);
          identity.rotation.set(0, Math.PI, 0);
          headBone.add(identity);
          this.enemy.userData.headAnchored = true;
        } else {
          // Tertiary fallback for non-skeletal public sample assets.
          this.creatureIdentity.root.position.set(0, 1.68, .16);
          this.creatureIdentity.root.rotation.y = Math.PI;
          this.enemy.add(this.creatureIdentity.root);
          this.enemy.userData.headAnchored = false;
        }
      }
      this.enemy.add(rig); this.enemyBase = rig;
      const fallback = this.enemy.userData.fallback as THREE.Group;
      fallback.visible = false;
      if(gltf.animations.length){
        this.enemyMixer = new THREE.AnimationMixer(rig);
        const clips=gltf.animations;
        const chosen=(pattern:RegExp)=>clips.find(clip=>pattern.test(clip.name.toLowerCase()));
        this.enemyIdle = this.enemyMixer.clipAction(chosen(/idle/)??clips[0]);
        this.enemyWalk = this.enemyMixer.clipAction(chosen(/relaxed.?walk|walking|walk/)??clips[0]);
        this.enemyChase = this.enemyMixer.clipAction(chosen(/brisk.?walk|jog|run/)??clips[0]);
        const initial=this.enemyWalk??this.enemyIdle;
        initial.setLoop(THREE.LoopRepeat,Infinity).play();
        this.enemyActiveAction=initial;
      }
    };
    void loader.loadAsync(url).then(attach).catch(()=>{
      void loader.loadAsync("/aislamiento-15/models/warden.glb").then(attach).catch(()=>{
        // Khronos CC BY 4.0 emergency model remains only when local assets fail.
        void loader.loadAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb").then(attach).catch(()=>{});
      });
    });
  }

  getSignText(id: string): string[] | null {
    return this.signage.get(id) ?? null;
  }

  getPerformanceSnapshot() {
    return {
      dpr: this.renderer.getPixelRatio(),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      webgl2: this.renderer.capabilities.isWebGL2,
      software: this.softwareRenderer,
      chamber: this.room + 1
    };
  }

  getFocus(): Focus | null { return this.hitAt(0, 0); }

  hitAt(ndcX: number, ndcY: number): Focus | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const meshes = this.raycaster.intersectObjects(this.pickupMeshes, true);
    for (const hit of meshes) {
      let object: THREE.Object3D | null = hit.object;
      let id: string | undefined;
      while (object && !id) { id = object.userData.target as string | undefined; object = object.parent; }
      const t = this.targets.find(t => t.id === id && t.room === this.room);
      if (!t) continue;
      const d = this.camera.position.distanceTo(hit.point);
      if (d <= t.range) return { id: t.id, label: t.label, distance: d };
    }
    return null;
  }

  markTaken(id: string) {
    const target = this.targets.find(t => t.id === id);
    if (target) { target.object.visible = false; target.object.userData.target = undefined; }
  }

  setAlert(seconds = 1.35) { this.flickerUntil = Math.max(this.flickerUntil, this.elapsed + seconds); }

  rotateValve(id: string) {
    const node = this.rotators.get(id);
    if (node) node.rotation.x += Math.PI / 3;
  }
  rotateRelay(id: string) {
    const node = this.rotators.get(id);
    if (node) node.rotation.z = -.44;
  }
  resetRelays() {
    for (const id of ["relay-0", "relay-1", "relay-2"]) {
      const node = this.rotators.get(id);
      if (node) node.rotation.z = 0;
    }
  }
  private panelSafetyCooldown = -100;
  holdAtPanel(seconds = 10) {
    if (this.room === 0 || this.elapsed - this.panelSafetyCooldown < 22) return;
    this.panelSafetyCooldown = this.elapsed;
    this.eventAt = this.elapsed + Math.min(12, seconds);
    this.enemy.position.set(2.8, 0, CENTER[this.room] - 4.8);
  }
  updateBreaker(index: number, on: boolean) {
    const node = this.breakerNodes[index];
    if (node) node.rotation.x = on ? -.33 : 0;
    if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial) {
      node.material.emissiveIntensity = on ? .8 : .2;
    }
  }

  openDoor(index: 0 | 1) {
    if (index === 0) this.firstDoor = true; else this.secondDoor = true;
  }

  rotate(dx: number, dy: number) {
    this.yaw -= dx * .0039;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * .0035, -1.08, 1.1);
  }

  moveJoystick(x: number, y: number) {
    this.mobileVector = { x: THREE.MathUtils.clamp(x, -1, 1), y: THREE.MathUtils.clamp(y, -1, 1) };
  }

  hide() {
    this.enemyMode = "roaming";
    this.eventAt = this.elapsed + 6;
    this.enemy.position.set(4.4, 0, CENTER[this.room] - 3.0);
  }

  resize() {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    this.camera.aspect = w / h;
    this.camera.fov = this.zoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  setZoom(fov: number) { this.zoom = THREE.MathUtils.clamp(fov, 51, 83); this.resize(); }

  private walk(dt: number) {
    let right = Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) + this.mobileVector.x;
    let forward = Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) - Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) - this.mobileVector.y;
    const length = Math.hypot(right, forward);
    if (length < .06) return;
    right /= Math.max(1, length); forward /= Math.max(1, length);
    const speed = this.keys.has("ShiftLeft") ? 3.55 : 2.52;
    const sn = Math.sin(this.yaw), cs = Math.cos(this.yaw);
    const nx = this.player.x + (right * cs - forward * sn) * speed * dt;
    const nz = this.player.z + (-right * sn - forward * cs) * speed * dt;
    // Sliding collision: furniture does not become intangible when moving.
    // The door threshold is handled by the existing chamber transition below.
    slide(this.room, this.player, nx-this.player.x, 0, .30);
    const boundary = CENTER[this.room] - 6.5;
    const unlocked = this.room === 0 ? this.firstDoor : this.room === 1 ? this.secondDoor : this.won;
    if (nz < boundary + .15 && this.player.x > -1.04 && this.player.x < 1.04 && unlocked) {
      if (this.room < 2) {
        this.room = (this.room + 1) as Chamber;
        this.oldChamber = this.room;
        this.nextThreatAt = this.elapsed + (this.room === 1 ? 24 : 14);
        this.roomEnteredAt = this.elapsed;
        this.player.z = CENTER[this.room] + 5.95;
        this.player.x = 0;
        this.enemyMode = this.room === 1 ? "roaming" : "hunting";
        this.enemy.position.set(2.6, 0, CENTER[this.room] - 4.5);
        this.enemyRoute = [];
        this.enemyRouteAt = -99;
        this.preyMemory = -99;
        this.showRoom();
        this.signals.onChamber(this.room);
      } else this.player.z = boundary + .15;
    } else {
      const nearDoor = nz < boundary + .68 && this.player.x > -1.04 && this.player.x < 1.04;
      const limitedZ = THREE.MathUtils.clamp(nz, boundary + (nearDoor && !unlocked ? .7 : .16), CENTER[this.room] + 5.75);
      slide(this.room, this.player, 0, limitedZ-this.player.z, .30);
    }
    this.walkPhase += dt * 10;
  }

  private updateEnemy(dt:number) {
    if(this.room===0 || !this.running || this.won){
      this.enemy.visible=false;this.enemyMode="dormant";return;
    }
    this.enemy.visible=true;
    const target=new THREE.Vector3(this.player.x,0,this.player.z);
    const self=new THREE.Vector3(this.enemy.position.x,0,this.enemy.position.z);
    const dist=self.distanceTo(target);
    if(this.elapsed>this.eventAt && this.eventAt>0)this.eventAt=-1;
    const safe = this.eventAt>this.elapsed;
    const grace = this.elapsed<this.nextThreatAt;
    const visible=clearSight(this.room,self,target);
    const recentlySeen=this.elapsed-this.preyMemory<7;
    if(visible && dist<7 && !grace)this.preyMemory=this.elapsed;
    const urgent=this.room===2 && this.elapsed>this.nextThreatAt;
    const hunting=!safe && !grace && (urgent || (visible && dist<7) || recentlySeen);
    this.enemyMode=hunting?"hunting":"roaming";
    if(this.enemyMode!==this.prevEnemyMode){
      if(this.enemyMode==="hunting" && this.elapsed>this.nextThreatAt+1
          && this.elapsed-this.lastHuntAlert>27){
        this.lastHuntAlert=this.elapsed;
        this.setAlert(.35);
        this.signals.onThreat("EL CELADOR TE HA VISTO. ¡SEGUÍ MOVIÉNDOTE!");
      }
      this.prevEnemyMode=this.enemyMode;
    }
    const center=CENTER[this.room];
    const patrol = [
      new THREE.Vector3(3.7,0,center-4.6),
      new THREE.Vector3(-2.9,0,center-2.9),
      new THREE.Vector3(2.45,0,center+2.8),
      new THREE.Vector3(-3.0,0,center+3.3)
    ];
    const patrolIndex=Math.floor(this.elapsed/13)%patrol.length;
    const goal=hunting?target:patrol[patrolIndex];
    // Grid recomputation roughly once per second rather than per frame.
    if(this.elapsed-this.enemyRouteAt>.83 || this.enemyRoute.length===0){
      this.enemyRoute=findPath(this.room,self,goal);
      this.enemyRouteAt=this.elapsed;
    }
    while(this.enemyRoute.length && self.distanceTo(this.enemyRoute[0])<.32)
      this.enemyRoute.shift();
    const waypoint=this.enemyRoute[0] ?? goal;
    const direction=waypoint.clone().sub(self).setY(0);
    const speed=hunting?(this.room===2?1.5:1.35):.78;
    if(direction.lengthSq()>.03){
      const angle=Math.atan2(direction.x,direction.z);
      let yawDifference=angle-this.enemy.rotation.y;
      yawDifference=Math.atan2(Math.sin(yawDifference),Math.cos(yawDifference));
      this.enemy.rotation.y+=yawDifference*Math.min(1,dt*4.2);
      direction.normalize();
      // The pursuer uses the same solid footprints as the player.
      slide(this.room,this.enemy.position,direction.x*speed*dt,direction.z*speed*dt,.35);
    }
    this.enemy.position.y=Math.sin(this.elapsed*(hunting?8.1:4.2))*.014;
    if(this.enemyMixer){
      const desired=hunting?(this.enemyChase??this.enemyWalk):(this.enemyWalk??this.enemyIdle);
      if(desired && desired!==this.enemyActiveAction){
        this.enemyActiveAction?.fadeOut(.33);
        desired.reset().setLoop(THREE.LoopRepeat,Infinity).fadeIn(.33).play();
        this.enemyActiveAction=desired;
      }
      this.enemyMixer.update(dt*(hunting?1.04:.88));
    }
    const fallback=this.enemy.userData.fallback as THREE.Group;
    fallback.rotation.z=Math.sin(this.elapsed*2.4)*.012;
    if(this.enemyBase)this.enemyBase.rotation.z=Math.sin(this.elapsed*1.7)*.008;
    this.creatureIdentity?.animate(this.elapsed,hunting,dist);
    const collisionDist=Math.hypot(this.enemy.position.x-target.x,this.enemy.position.z-target.z);
    if(!safe && !grace && collisionDist<.84 && this.elapsed-this.enemyLastAttack>13){
      this.enemyLastAttack=this.elapsed;
      this.hitJolt=1;
      this.signals.onCaught();
      this.enemy.position.set(2.4,0,center-4.65);
      this.eventAt=this.elapsed+9;
      this.enemyRoute=[];
      this.preyMemory=-99;
    }
  }

  private runMoments() {
    const timeInside = this.elapsed-this.roomEnteredAt;
    const story = this.room===0
      ? [{at:37,kind:"knock" as const,text:"TRES GOLPES DESDE LA COMPUERTA. NADIE RESPONDE."},
         {at:78,kind:"lights" as const,text:"FALLA EN EL GENERADOR. ¿VISte ESA SOMBRA?".toUpperCase()}]
      : this.room===1
        ? [{at:23,kind:"glass" as const,text:"CRISTAL 02: IMPACTO DETECTADO DESDE ADENTRO."},
           {at:56,kind:"lights" as const,text:"LA CÁMARA BIOLÓGICA 015 ESTÁ ABIERTA."}]
        : [{at:13,kind:"reactor" as const,text:"REACTOR HÉLIX: FUGA DE CONTENCIÓN INMINENTE."},
           {at:50,kind:"knock" as const,text:"LA COMPUERTA DE SALIDA RECIBE GOLPES DEL OTRO LADO."}];
    for(let i=0;i<story.length;i++){
      const beat=story[i],key=this.room+"-"+i;
      if(timeInside>=beat.at && !this.momentSeen.has(key)){
        this.momentSeen.add(key);
        this.director?.cue(beat.kind,this.elapsed);
        this.setAlert(beat.kind==="lights"?1.1:.30);
        this.signals.onMoment?.(beat.kind,beat.text);
      }
    }
  }

  tick(dt: number, elapsed: number, danger: number) {
    if (this.disposed || !this.running) return;
    dt = Math.min(dt, .055);
    this.elapsed = elapsed;
    this.pulse += dt;
    if (this.running) this.walk(dt);
    const bob = this.running && (this.keys.size > 0 || Math.hypot(this.mobileVector.x, this.mobileVector.y) > .08) ? Math.sin(this.walkPhase) * .021 : 0;
    this.camera.position.copy(this.player); this.camera.position.y += bob;
    const trauma=this.hitJolt;
    this.hitJolt=Math.max(0,trauma-dt*1.8);
    this.camera.rotation.set(this.pitch+Math.sin(this.elapsed*23)*trauma*.018,
      this.yaw+Math.sin(this.elapsed*17)*trauma*.013,trauma*Math.sin(this.elapsed*18)*.011,"YXZ");
    this.doorPanels.forEach((door, i) => {
      const open = i === 0 ? this.firstDoor : i === 1 ? this.secondDoor : this.won;
      const targetY = open ? 4.6 : 1.43;
      door.position.y = THREE.MathUtils.lerp(door.position.y, targetY, Math.min(1, dt * 1.7));
      if (this.doorDressing[i]) this.doorDressing[i].position.y = door.position.y - 1.43;
    });
    this.lights.forEach((light, i) => {
      const flicker = this.elapsed < this.flickerUntil ? .08 : danger > .5 && Math.sin(this.pulse * 11 + i * 7) > .975 ? .35 : 1;
      light.intensity = (i % 2 === 1 ? 13 : 18) * flicker * (1 - danger * .22);
    });
    if (this.alertSign) {
      this.alertSign.visible = this.room === 0 && this.elapsed > 62 && this.elapsed < 86;
    }
    if (this.running) this.updateEnemy(dt);
    if (this.running) this.runMoments();
    const threatDistance = this.room===0 ? 30 :
      Math.hypot(this.player.x-this.enemy.position.x,this.player.z-this.enemy.position.z);
    if (this.running && this.room>0 && this.elapsed>this.nextThreatAt+4 && !this.stagedThreats.has(this.room)) {
      this.stagedThreats.add(this.room);
      this.signals.onThreat(this.room===1
        ? "EL SENSOR DETECTA MOVIMIENTO DETRÁS DEL CRISTAL. NO TE DETENGAS."
        : "PROTOCOLO ROJO: EL SISTEMA TE HA RECONOCIDO.");
    }
    if (this.keySpot){
      const pulse = this.elapsed < this.flickerUntil ? .24 : 1;
      this.keySpot.intensity = (this.room===0 ? 22 : this.room===1 ? 25 : 21) * pulse * (1-danger*.14);
    }
    this.art?.update(this.elapsed, danger);
    this.director?.update({elapsed:this.elapsed,danger,room:this.room,threat:Math.max(0,1-threatDistance/8)});
    // Adaptive internal resolution: preserve input/HUD responsiveness on
    // middle-range phones while never exceeding device-native resolution.
    if (this.running && !document.hidden && dt < .065) {
      this.avgFrame += dt;
      this.frameCount++;
      if (this.frameCount >= 180) {
        const average = this.avgFrame / this.frameCount;
        const max = Math.min(window.devicePixelRatio || 1, this.softwareRenderer ? .85 : 1.4);
        const next = average > .038 ? Math.max(this.softwareRenderer ? .6 : .8, this.scalePixelRatio - .13)
          : average < .022 ? Math.min(max, this.scalePixelRatio + .06) : this.scalePixelRatio;
        if (Math.abs(next - this.scalePixelRatio) > .015) {
          this.scalePixelRatio = next;
          this.renderer.setPixelRatio(next);
          this.resize();
        }
        this.avgFrame = 0; this.frameCount = 0;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    this.scene.traverse(o => {
      if (o instanceof THREE.Mesh && o.geometry !== boxGeo && o.geometry !== unitCylinder) o.geometry.dispose();
    });
    this.art?.dispose();
    this.director?.dispose();
    this.interactionArt?.dispose();
    this.creatureIdentity?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
