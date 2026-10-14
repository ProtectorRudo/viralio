import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type Chamber = 0 | 1 | 2;
export type Focus = { id: string; label: string; distance: number };
export type GameSignals = {
  onChamber: (room: Chamber) => void;
  onCaught: () => void;
  onThreat: (text: string) => void;
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
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) return null;
  c.fillStyle = "#102124"; c.fillRect(0, 0, width, height);
  c.fillStyle = "#244347"; c.fillRect(0, 0, width, 5);
  c.fillStyle = accent; c.font = "700 32px monospace";
  lines.forEach((line, i) => { c.font = i === 0 ? "700 34px monospace" : "500 28px monospace"; c.fillText(line, 24, 62 + i * 48, width - 48); });
  for (let i = 0; i < 9; i++) { c.fillStyle = "rgba(150,230,212,.08)"; c.fillRect(0, 18 + i * 28, width, 1); }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
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
  firstDoor = false;
  secondDoor = false;
  valves: string[] = [];
  ventReady = false;
  breakers: boolean[] = [false, false, false];
  foundLog = false;
  won = false;
  enemyMode: "dormant" | "roaming" | "hunting" = "dormant";
  private raycaster = new THREE.Raycaster();
  private pickupMeshes: THREE.Object3D[] = [];
  private clock = new THREE.Clock();
  private enemy: THREE.Group;
  private enemyMixer?: THREE.AnimationMixer;
  private enemyBase?: THREE.Object3D;
  private enemyLastAttack = -100;
  private eventAt = -1;
  private doorPanels: THREE.Mesh[] = [];
  private disposed = false;
  private pulse = 0;
  private walkPhase = 0;
  private flash?: THREE.PointLight;
  private signals: GameSignals;

  constructor(canvas: HTMLCanvasElement, signals: GameSignals) {
    this.signals = signals;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.55;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
    this.scene.background = new THREE.Color("#12191a");
    this.scene.fog = new THREE.FogExp2(0x10191b, .031);
    this.scene.add(new THREE.HemisphereLight(0xa0c5b9, 0x1c1e20, 1.48));
    this.camera.rotation.order = "YXZ";
    const floor = gridTexture();
    if (floor) mats.tile.map = floor;
    for (let i = 0; i < 3; i++) this.buildRoom(i as Chamber);
    this.enemy = this.makeEnemy();
    this.scene.add(this.enemy);
    this.loadRig();
    this.enemy.position.set(2.5, 0, -16.5);
    this.camera.position.copy(this.player);
    this.resize();
  }

  private block(name: string, x: number, y: number, z: number, w: number, h: number, d: number, mat = mats.steel, parent: THREE.Object3D = this.scene) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.name = name; m.position.set(x, y, z); m.scale.set(w, h, d);
    m.castShadow = h < 2.9 && w < 3.3; m.receiveShadow = true;
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
    m.position.set(x, y, z); this.scene.add(m); return m;
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
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; this.scene.add(g);
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
    light.position.set(x, 3.3, z); light.castShadow = this.lights.length % 3 === 0;
    if (light.castShadow) { light.shadow.mapSize.set(512, 512); light.shadow.bias = -.0006; }
    this.scene.add(light); this.lights.push(light);
  }

  private buildRoom(index: Chamber) {
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
    this.block("Emblema de compuerta", 0, 2.43, back + .29, 1.15, .075, .015, mats.red, door);
    this.doorPanels.push(door);
    this.doors.push(door);
    if (index === 0) this.buildEmergency(z);
    if (index === 1) this.buildIsolation(z);
    if (index === 2) this.buildContainment(z);
  }

  private buildEmergency(z: number) {
    this.panel(["URGENCIAS  //  NIVEL 01", "TRIAJE · ARCHIVO · SEGURIDAD", "PROTOCOLO 15 / ACTIVO"], 0, 2.83, z + 6.27, 4.05, 1.49, "#bfd5cb");
    this.desk(-2.95, z + 2.55, Math.PI / 2);
    this.gurney(2.85, z + 2, .28);
    this.gurney(3, z - 2.68, -.25);
    this.iv(4.12, z + 2.8);
    this.iv(4.5, z - 3.2);
    this.cabinet(-4.3, z - 2.3, true);
    this.block("Tótem informativo", -.6, 1.2, z + 2.66, .16, 2.2, .18, mats.dark);
    this.panel(["REGISTRO DE TRIAGE", "P1 = 4 · P2 = 2", "P3 = 7 / EDAD NO VÁLIDA"], -.4, 2.05, z - 6.24, 3.1, 1.1);
    this.panel(["SALA 01", "ALIMENTACIÓN AUXILIAR", "USE FUSIBLE F-08"], -5.22, 2, z - 1.4, 2.6, 1.06);
    const fuse = this.block("Fusible F-08", -3.09, 1.16, z + 2.22, .14, .13, .26, mats.amber);
    this.target("fuse", "Retirar fusible F-08 del mostrador", fuse, 0, 2.55);
    const fuseBox = this.block("Panel de fusibles", -5.16, 1.42, z - 1.5, .23, 1.0, .86, mats.dark);
    this.target("fusebox", "Restaurar alimentación de seguridad", fuseBox, 0, 2.4);
    const badge = this.block("Tarjeta identificatoria", 3.1, 1.07, z + 1.85, .26, .015, .14, mats.ceramic);
    this.target("badge", "Recoger tarjeta de personal", badge, 0, 2.2);
    const keyboard = this.block("Terminal de acceso", -.72, 1.38, z + 2.62, .53, .65, .12, mats.screen);
    this.target("terminal", "Terminal de seguridad — código de tres dígitos", keyboard, 0, 2.8);
    this.panel(["SISTEMA DE SEGURIDAD", "CLAVE = PRIORIDAD P1 P2 P3"], -1.18, 1.67, z + 2.71, 1.48, .7);
    // Directional floor strip lights are part of the world, not floating HUD markers.
    for (let k = 0; k < 4; k++) this.block("Camino luminiscente", 0, .01, z - 2.4 - k * .73, .28, .012, .17, mats.amber);
  }

  private buildIsolation(z: number) {
    this.panel(["AISLAMIENTO // NIVEL 02", "PRESIÓN NEGATIVA", "NO ABRIR EN PRESENCIA DE MOVIMIENTO"], 0, 2.83, z + 6.23, 4.4, 1.37);
    for (let i = 0; i < 3; i++) {
      const x = [-3.65, 0, 3.65][i];
      this.block("Módulo biológico", x, 1.2, z + .9, 2.14, 2.35, .95, mats.dark);
      this.block("Visor de cámara", x, 1.5, z + 1.42, 1.72, 1.25, .055, mats.glass);
      this.block("Tuberías de cámara", x - .68, 2.62, z + .92, .075, .34, .075, mats.steel);
      this.pipe("Cartucho de suspensión", x + .72, 2.29, z + .9, .11, .65, mats.steel);
    }
    this.panel(["SECUENCIA DE PURGA", "AZUL  >  VERDE  >  ROJO", "EXTRACTOR: ACTIVAR AL FINAL"], 0, 2.31, z - 6.25, 4.17, 1.34, "#cbe1b7");
    this.cabinet(-4.45, z - 2.7, true);
    const valveColors = [mats.blue, mats.green, mats.red];
    for (let n = 0; n < 3; n++) {
      const xx = -2.65 + n * 2.65, zz = z - 2.85;
      this.pipe("Conducto vertical", xx, 1.5, zz - .15, .12, 1.98, mats.steel);
      const valve = this.pipe("Válvula", xx, 1.45, zz + .13, .25, .08, valveColors[n]);
      valve.rotation.x = Math.PI / 2;
      for (let p = 0; p < 6; p++) {
        const a = p * Math.PI / 3;
        this.block("Radio de válvula", xx + Math.cos(a) * .18, 1.45 + Math.sin(a) * .18, zz + .18, .1, .043, .07, valveColors[n]);
      }
      this.target(["valve-blue", "valve-green", "valve-red"][n], ["Válvula azul", "Válvula verde", "Válvula roja"][n], valve, 1, 3.05);
    }
    this.block("Sistema de extracción", 4.13, 2.3, z - 4.2, 1.45, 1.55, .8, mats.dark);
    const extract = this.pipe("Ventilador", 4.13, 2.22, z - 3.77, .4, .08, mats.steel);
    extract.rotation.x = Math.PI / 2;
    this.target("extractor", "Activar extracción — purga completa", extract, 1, 3.6);
    this.panel(["ATENCIÓN", "SI ESCUCHÁS PASOS", "NO TE QUEDES QUIETO"], -4.79, 2.82, z + 4.35, 1.4, 1.2, "#efb18f");
    const hide = this.block("Cortina de aislamiento", -4.27, 1.53, z + 3.85, .12, 2.7, 1.3, mats.vinyl);
    this.target("hide", "Ocultarse detrás de la cortina", hide, 1, 2.3);
    for (const x of [-4.97, 4.97]) for (let i = 0; i < 5; i++) this.pipe("Red de presión", x, 3.65, z - 4 + i * 1.8, .047, 1.1, mats.steel).rotation.x = Math.PI / 2;
  }

  private buildContainment(z: number) {
    this.panel(["CONTENCIÓN // NIVEL 03", "REACTOR AUXILIAR", "CIERRE DEFINITIVO EN CURSO"], 0, 2.83, z + 6.23, 4.25, 1.42, "#e89d82");
    for (let i = 0; i < 3; i++) {
      const x = -3.05 + i * 3.08, zz = z + 1.13;
      this.block("Armario eléctrico", x, 1.38, zz, 1.45, 2.25, .66, mats.dark);
      this.block("Frontal eléctrico", x, 1.53, zz + .35, 1.22, 1.52, .035, mats.steel);
      this.block("Amperímetro", x, 1.88, zz + .38, .67, .38, .032, mats.screen);
      const breaker = this.block("Disyuntor", x, 1.22, zz + .48, .26, .35, .21, mats.amber);
      this.target("breaker-" + i, "Interruptor principal " + ["A", "B", "C"][i], breaker, 2, 3.2);
      this.pipe("Conducto reactor", x, 3.34, zz, .14, .85, mats.rust);
    }
    this.panel(["APERTURA DE EMERGENCIA", "A = ENCENDIDO", "B = APAGADO", "C = ENCENDIDO"], 0, 2.6, z - 6.23, 3.5, 1.56, "#bddfc1");
    const log = this.block("Registro audio #15", -4.28, 1.26, z - 2.8, .78, .18, .56, mats.dark);
    this.target("log", "Registro de identidad — expediente 15", log, 2, 3.4);
    this.panel(["TRANSMISIÓN INTERCEPTADA", "LA VOZ NO ES HUMANA", "PROTOCOLO: DESCONFIAR"], -5.17, 2.61, z - 2.9, 1.7, 1.18, "#ebbf9f");
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
    return group;
  }

  private loadRig() {
    // © Cesium 2017, CC BY 4.0, glTF Sample Assets / KhronosGroup.
    // AnimationMixer drives the actual glTF skeletal animation.
    const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb";
    new GLTFLoader().load(url, (gltf) => {
      if (this.disposed) return;
      const rig = gltf.scene;
      rig.scale.setScalar(1.82);
      rig.rotation.y = Math.PI;
      rig.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.material = new THREE.MeshStandardMaterial({ color: 0x292b29, roughness: .82, metalness: .07, side: THREE.DoubleSide });
        }
      });
      // The asset has a walking cycle and a real skinned mesh; augment its silhouette.
      const veil = new THREE.Mesh(new THREE.ConeGeometry(.43, 1.62, 16, 6), new THREE.MeshStandardMaterial({ color: 0x161a19, roughness: 1, side: THREE.DoubleSide }));
      veil.position.y = 1.03;
      rig.add(veil);
      rig.position.y = .02;
      this.enemy.add(rig);
      this.enemyBase = rig;
      const fallback = this.enemy.userData.fallback as THREE.Group;
      fallback.visible = false;
      if (gltf.animations.length) {
        this.enemyMixer = new THREE.AnimationMixer(rig);
        this.enemyMixer.clipAction(gltf.animations[0]).play();
      }
    }, undefined, () => { /* Graceful fallback remains visible if network is unavailable. */ });
  }

  getFocus(): Focus | null {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
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
    this.player.x = THREE.MathUtils.clamp(nx, -MAX_X + .27, MAX_X - .27);
    const boundary = CENTER[this.room] - 6.5;
    const unlocked = this.room === 0 ? this.firstDoor : this.room === 1 ? this.secondDoor : this.won;
    if (nz < boundary + .15 && this.player.x > -1.04 && this.player.x < 1.04 && unlocked) {
      if (this.room < 2) {
        this.room = (this.room + 1) as Chamber;
        this.player.z = CENTER[this.room] + 5.95;
        this.player.x = 0;
        this.enemyMode = this.room === 1 ? "roaming" : "hunting";
        this.enemy.position.set(3.7, 0, CENTER[this.room] - 4.5);
        this.signals.onChamber(this.room);
      } else this.player.z = boundary + .15;
    } else {
      const nearDoor = nz < boundary + .68 && this.player.x > -1.04 && this.player.x < 1.04;
      this.player.z = THREE.MathUtils.clamp(nz, boundary + (nearDoor && !unlocked ? .7 : .16), CENTER[this.room] + 5.75);
    }
    this.walkPhase += dt * 10;
  }

  private updateEnemy(dt: number) {
    if (this.room === 0 || !this.running || this.won) { this.enemy.visible = false; return; }
    this.enemy.visible = true;
    const dist = Math.hypot(this.enemy.position.x - this.player.x, this.enemy.position.z - this.player.z);
    if (this.elapsed > this.eventAt && this.eventAt > 0) this.eventAt = -1;
    const hiding = this.eventAt > this.elapsed;
    const hunting = this.room === 2 || (this.room === 1 && (dist < 3.5 || Math.floor(this.elapsed / 27) % 3 === 2));
    this.enemyMode = hiding ? "roaming" : hunting ? "hunting" : "roaming";
    const dest = hunting && !hiding
      ? new THREE.Vector3(this.player.x, 0, this.player.z)
      : new THREE.Vector3(Math.sin(this.elapsed * .24) * 3.9, 0, CENTER[this.room] - 2.6 + Math.cos(this.elapsed * .22) * 2.4);
    const dir = dest.sub(this.enemy.position); dir.y = 0;
    if (dir.length() > .1) {
      const speed = hunting && !hiding ? (this.room === 2 ? 1.21 : .98) : .48;
      const ang = Math.atan2(dir.x, dir.z);
      this.enemy.rotation.y = THREE.MathUtils.lerp(this.enemy.rotation.y, ang, Math.min(1, dt * 2.8));
      this.enemy.position.addScaledVector(dir.normalize(), Math.min(dir.length(), dt * speed));
    }
    this.enemy.position.y = Math.sin(this.elapsed * 7) * .03;
    if (this.enemyMixer) this.enemyMixer.update(dt * (hunting ? 1.2 : .7));
    const fallback = this.enemy.userData.fallback as THREE.Group;
    fallback.rotation.z = Math.sin(this.elapsed * 3.5) * .025;
    if (dist < .97 && this.elapsed - this.enemyLastAttack > 12) {
      this.enemyLastAttack = this.elapsed;
      this.signals.onCaught();
      this.enemy.position.set(4.5, 0, CENTER[this.room] - 4.3);
      this.eventAt = this.elapsed + 7;
    }
  }

  tick(dt: number, elapsed: number, danger: number) {
    if (this.disposed) return;
    dt = Math.min(dt, .055);
    this.elapsed = elapsed;
    this.pulse += dt;
    if (this.running) this.walk(dt);
    const bob = this.running && (this.keys.size > 0 || Math.hypot(this.mobileVector.x, this.mobileVector.y) > .08) ? Math.sin(this.walkPhase) * .021 : 0;
    this.camera.position.copy(this.player); this.camera.position.y += bob;
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.doorPanels.forEach((door, i) => {
      const open = i === 0 ? this.firstDoor : i === 1 ? this.secondDoor : this.won;
      const targetY = open ? 4.6 : 1.43;
      door.position.y = THREE.MathUtils.lerp(door.position.y, targetY, Math.min(1, dt * 1.7));
    });
    this.lights.forEach((light, i) => {
      const flicker = danger > .5 && Math.sin(this.pulse * 11 + i * 7) > .975 ? .35 : 1;
      light.intensity = (i % 2 === 1 ? 13 : 18) * flicker * (1 - danger * .22);
    });
    if (this.running) this.updateEnemy(dt);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    this.scene.traverse(o => {
      if (o instanceof THREE.Mesh && o.geometry !== boxGeo && o.geometry !== unitCylinder) o.geometry.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
