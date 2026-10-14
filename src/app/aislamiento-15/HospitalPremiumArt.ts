/**
 * AISLAMIENTO 15 — premium environment dressing.
 * Detail is world geometry, not a 2D room simulation. Shared geometries and
 * instanced trim keep draw calls bounded on Android and iPhone.
 * Textures are original procedural canvas materials (no third party images).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type MaterialBank = Record<string, THREE.MeshStandardMaterial>;

const rust = new THREE.MeshStandardMaterial({ color: 0x79615a, metalness: .44, roughness: .76 });
const steel = new THREE.MeshStandardMaterial({ color: 0x84908c, metalness: .76, roughness: .35 });
const steelDark = new THREE.MeshStandardMaterial({ color: 0x25383a, metalness: .59, roughness: .45 });
const seal = new THREE.MeshStandardMaterial({ color: 0x192728, roughness: .82 });
const enamel = new THREE.MeshStandardMaterial({ color: 0x7c9791, metalness: .17, roughness: .53 });
const paper = new THREE.MeshStandardMaterial({ color: 0xb6ac92, metalness: 0, roughness: .91, side: THREE.DoubleSide });
const glowRed = new THREE.MeshStandardMaterial({ color: 0xd06757, emissive: 0xc32b1b, emissiveIntensity: 1.3 });
const glowGreen = new THREE.MeshStandardMaterial({ color: 0x82e2ac, emissive: 0x238b5e, emissiveIntensity: 1.2 });
const unit = new THREE.BoxGeometry(1, 1, 1);
const circle = new THREE.CylinderGeometry(1, 1, 1, 14);
const rounded = new RoundedBoxGeometry(1, 1, 1, 3, .07);

function wearTexture(kind: "floor" | "wall" | "ceiling") {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  if (!g) return undefined;
  const colors = kind === "floor" ? ["#687a77", "#899895", "#536562"] : kind === "wall"
    ? ["#6c837d", "#758b84", "#435b56"] : ["#3d5353", "#526466", "#263a3d"];
  g.fillStyle = colors[0]; g.fillRect(0, 0, 512, 512);
  let seed = kind === "floor" ? 99823 : kind === "wall" ? 49491 : 9841;
  const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 17500; i++) {
    const x = rnd() * 512, y = rnd() * 512;
    const v = rnd();
    g.fillStyle = v > .69 ? "rgba(6,16,15,.08)" : "rgba(242,248,221,.048)";
    g.fillRect(x, y, 1.0 + rnd() * 6, 1.2 + rnd() * 7);
  }
  if (kind === "floor") {
    for (let x = 0; x <= 512; x += 128) for (let y = 0; y <= 512; y += 128) {
      const shade = rnd() * .13 + .05;
      g.fillStyle = "rgba(20,38,37," + shade + ")";
      g.fillRect(x + 4, y + 4, 120, 120);
      g.strokeStyle = "rgba(179,193,171,.24)"; g.lineWidth = 2;
      g.strokeRect(x + 3, y + 3, 122, 122);
      for (let k = 0; k < 8; k++) {
        const px = x + 8 + rnd() * 107, py = y + 8 + rnd() * 108;
        g.fillStyle = "rgba(33,46,44,.11)";
        g.fillRect(px, py, 2 + rnd() * 10, 1 + rnd() * 3);
      }
    }
  } else {
    g.strokeStyle = "rgba(11,31,30,.15)"; g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(kind === "floor" ? 3 : 1.6, kind === "floor" ? 3 : 1.4);
  tex.anisotropy = 4;
  return tex;
}

function normalMapFrom(source: THREE.CanvasTexture) {
  const sourceCanvas = source.image as HTMLCanvasElement;
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) return undefined;
  const width = sourceCanvas.width, height = sourceCanvas.height;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const dest = canvas.getContext("2d");
  if (!dest) return undefined;
  const data = dest.createImageData(width, height);
  const brightness = (x: number, y: number) => {
    const px = ((y + height) % height * width + (x + width) % width) * 4;
    return (pixels[px] * .299 + pixels[px + 1] * .587 + pixels[px + 2] * .114) / 255;
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = brightness(x + 1, y) - brightness(x - 1, y);
    const dy = brightness(x, y + 1) - brightness(x, y - 1);
    const nx = -dx * 5.2, ny = -dy * 5.2, nz = 1;
    const inv = 1 / Math.hypot(nx, ny, nz);
    const p = (y * width + x) * 4;
    data.data[p] = (nx * inv * .5 + .5) * 255;
    data.data[p + 1] = (ny * inv * .5 + .5) * 255;
    data.data[p + 2] = (nz * inv * .5 + .5) * 255;
    data.data[p + 3] = 255;
  }
  dest.putImageData(data, 0, 0);
  const result = new THREE.CanvasTexture(canvas);
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.repeat.copy(source.repeat);
  result.anisotropy = 4;
  return result;
}

function signage(text: string, width = 768, height = 180, warning = false) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) return undefined;
  g.fillStyle = warning ? "#581f1b" : "#102426";
  g.fillRect(0, 0, width, height);
  g.strokeStyle = warning ? "#bf5e4f" : "#548079"; g.lineWidth = 7; g.strokeRect(8, 8, width - 16, height - 16);
  g.fillStyle = warning ? "#f4c3a8" : "#d5e5d6";
  g.font = "bold 43px Arial"; g.textAlign = "center"; g.fillText(text, width / 2, height / 2 + 15, width - 42);
  g.font = "16px monospace"; g.fillStyle = warning ? "#d58d77" : "#739b93";
  g.fillText("INSTALACIÓN 015 // ACCESO RESTRINGIDO", width / 2, height - 25, width - 40);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function decal(scene: THREE.Scene, x: number, y: number, z: number, text: string, size: [number, number], warn = false) {
  const map = signage(text, 768, 180, warn);
  if (!map) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map, transparent: false, side: THREE.DoubleSide }));
  m.position.set(x, y, z); scene.add(m);
}

function mesh(scene: THREE.Scene, name: string, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material, shape: "box" | "rounded" = "box", parent?: THREE.Group) {
  const m = new THREE.Mesh(shape === "rounded" ? rounded : unit, material);
  m.name = name; m.position.set(x, y, z); m.scale.set(w, h, d);
  m.castShadow = h < 2 && w < 3; m.receiveShadow = true;
  (parent || scene).add(m);
  return m;
}

function disc(scene: THREE.Scene, x: number, y: number, z: number, radius: number, height: number, material: THREE.Material, orientation: "x" | "z" = "z", parent?: THREE.Group) {
  const m = new THREE.Mesh(circle, material);
  m.position.set(x, y, z); m.scale.set(radius, height, radius);
  if (orientation === "z") m.rotation.x = Math.PI / 2;
  else m.rotation.z = Math.PI / 2;
  (parent || scene).add(m); m.castShadow = true;
  return m;
}

function addInstanced(s: THREE.Scene, geo: THREE.BufferGeometry, mat: THREE.Material, count: number, fn: (i: number, obj: THREE.Object3D) => void) {
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const proxy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    proxy.position.set(0, 0, 0); proxy.rotation.set(0, 0, 0); proxy.scale.set(1, 1, 1);
    fn(i, proxy); proxy.updateMatrix(); inst.setMatrixAt(i, proxy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  inst.receiveShadow = true;
  s.add(inst);
}

function impactDecals(scene: THREE.Scene, cx: number, cz: number, room: number) {
  for (let k = 0; k < 17; k++) {
    const ix = (k * 73 + room * 51) % 97 / 97;
    const iz = (k * 33 + room * 9) % 103 / 103;
    const x = cx - 4.9 + ix * 9.8, z = cz - 5.8 + iz * 11.5;
    if (Math.abs(x) < 1.25) continue;
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(.13 + (k % 4) * .11, .09 + (k % 3) * .1),
      new THREE.MeshBasicMaterial({ color: k % 7 === 0 ? 0x523b36 : 0x283d3b, transparent: true, opacity: .2 + k % 3 * .08, depthWrite: false }));
    patch.rotation.x = -Math.PI / 2; patch.position.set(x, .017 + k * .00005, z);
    scene.add(patch);
  }
}

function fittedMedicalRoomProps(scene: THREE.Scene, z: number, room: number) {
  // Distinct medical identity for each chamber. All detail is physical 3D geometry.
  for (const side of [-1, 1]) {
    const x = side * 5.24;
    // Medical gas copper rails, protective bumper and upper technical channel.
    for (const yy of [.52, 1.03, 2.85]) {
      mesh(scene, "Módulo de protección de pared", x, yy, z, .095, yy === .52 ? .2 : .09, 11.85, yy === 2.85 ? steel : steelDark);
      for (let n = 0; n < 7; n++) {
        const zz = z - 5.2 + n * 1.7;
        mesh(scene, "Fijación empotrada", x - side * .08, yy, zz, .028, .1, .08, rust);
      }
    }
    for (let n = 0; n < 4; n++) {
      const zz = z - 4.65 + n * 2.8;
      mesh(scene, "Marquetería de pared", x - side * .035, 1.94, zz, .055, 1.05, .055, steelDark);
      // Dial and socket recessed in surface; not floating UI elements.
      disc(scene, x - side * .1, 1.72, zz, .08, .035, steel, "x");
      disc(scene, x - side * .121, 1.72, zz, .037, .04, seal, "x");
    }
  }
  // Grid of medical ceiling panels with visible rails.
  for (let n = 0; n < 8; n++) {
    const zz = z - 5.6 + n * 1.5;
    mesh(scene, "Estructura de falso techo", 0, 3.81, zz, 10.7, .054, .052, steelDark);
  }
  for (const x of [-3.55, 0, 3.55]) mesh(scene, "Junta longitudinal de techo", x, 3.81, z, .042, .05, 12.4, steelDark);
  // Wires, drain gutters and air-conditioning ducts.
  for (const side of [-1, 1]) {
    mesh(scene, "Conducto de climatización", side * 4.62, 3.50, z, .39, .32, 11.7, steelDark, "rounded");
    for (let n = 0; n < 5; n++) {
      const zz = z - 4.5 + n * 2.15;
      mesh(scene, "Abrazadera conducto", side * 4.62, 3.49, zz, .44, .38, .065, rust);
    }
  }
  // Vent grilles; real apertures in 3D.
  for (const x of [-3.4, 3.4]) {
    const gr = new THREE.Group(); gr.position.set(x, 3.70, z - 1.7); scene.add(gr);
    mesh(scene, "Marco retorno", 0, 0, 0, 1.3, .08, .64, steel);
    mesh(scene, "Receso retorno", 0, -.046, 0, 1.17, .014, .51, seal);
    for (let i = 0; i < 8; i++) mesh(scene, "Aleta ventilación", -.5 + i * .145, -.055, 0, .04, .018, .5, steelDark, "box", gr);
  }
  // Thresholds: black gasket, ribbed diamond-plate step and emergency sill.
  const dz = z - 6.35;
  mesh(scene, "Umbral blindado", 0, .027, dz, 2.26, .035, .42, steel);
  for (let i = 0; i < 8; i++) mesh(scene, "Estría antideslizante", -1.0 + i * .28, .049, dz, .018, .016, .39, seal);
  const title = room === 0 ? "URGENCIAS   /   01" : room === 1 ? "BIOAISLAMIENTO   /   02" : "CONTENCIÓN   /   03";
  decal(scene, 0, 3.35, z - 6.245, title, [2.62, .6], room === 2);
  impactDecals(scene, 0, z, room);
}

function decorateEquipment(scene: THREE.Scene, zs: readonly number[]) {
  // Clinical observation displays, oxygen sockets, documentation, supports.
  for (const [room, z] of zs.entries()) {
    const station = new THREE.Group(); station.position.set(4.5, 0, z + 4.2); scene.add(station);
    mesh(scene, "Armario de cartuchos médicos", 0, 1.22, 0, .65, 1.95, .44, enamel, "rounded", station);
    for (let row = 0; row < 4; row++) {
      mesh(scene, "Cajonera hospitalaria", 0, .6 + row * .36, .236, .56, .3, .025, steelDark, "rounded", station);
      mesh(scene, "Tirador de acero", 0, .6 + row * .36, .266, .28, .027, .03, steel, "rounded", station);
    }
    const report = new THREE.Group(); report.position.set(-3.2, 0, z - 4.7); scene.add(report);
    mesh(scene, "Bandeja papeleo", 0, 1.08, 0, .96, .05, .48, steelDark, "rounded", report);
    for (let k = 0; k < 4; k++) {
      const sheet = mesh(scene, "Expediente de paciente", -.12 + k * .02, 1.11 + k * .007, -.01 + k * .014, .62, .008, .41, paper, "box", report);
      sheet.rotation.y = k * .036;
    }
    const x = room === 0 ? 4.95 : -4.95;
    // Oxygen control panel, with actual sockets and raised gauges.
    mesh(scene, "Canalización biomédica", x, 2.34, z - 2.1, .18, .47, 1.85, steelDark, "rounded");
    for (let i = 0; i < 3; i++) {
      const zz = z - 2.74 + i * .62;
      disc(scene, x + (x > 0 ? -.15 : .15), 2.37, zz, .11, .045, steel, "x");
      disc(scene, x + (x > 0 ? -.175 : .175), 2.37, zz, .065, .05, i === 1 ? glowGreen : seal, "x");
    }
  }
}

export function installHospitalPremiumArt(scene: THREE.Scene, materials: MaterialBank) {
  const mats = materials;
  const floorTexture = wearTexture("floor");
  const wallTexture = wearTexture("wall");
  const ceilingTexture = wearTexture("ceiling");
  const floorNormal = floorTexture && normalMapFrom(floorTexture);
  const wallNormal = wallTexture && normalMapFrom(wallTexture);
  if (floorTexture) {
    mats.tile.map?.dispose();
    mats.tile.color.set(0xffffff);
    mats.tile.map = floorTexture;
    mats.tile.normalMap = floorNormal || null;
    mats.tile.normalScale = new THREE.Vector2(.33, .33);
    mats.tile.bumpMap = floorTexture; mats.tile.bumpScale = .012;
    mats.tile.roughness = .64; mats.tile.metalness = .06; mats.tile.needsUpdate = true;
  }
  if (wallTexture) {
    for (const name of ["paint", "concrete"]) {
      mats[name].map = wallTexture;
      mats[name].color.set(name === "paint" ? 0xd4e4dc : 0x8b9e96);
      mats[name].normalMap = wallNormal || null;
      mats[name].normalScale = new THREE.Vector2(.13, .13);
      mats[name].bumpMap = wallTexture;
      mats[name].bumpScale = name === "paint" ? .025 : .063;
      mats[name].roughness = .89; mats[name].needsUpdate = true;
    }
  }
  if (ceilingTexture) {
    mats.ceiling.map = ceilingTexture;
    mats.ceiling.color.set(0xd2dbd7);
    mats.ceiling.roughness = .83; mats.ceiling.needsUpdate = true;
  }
  mats.steel.roughness = .4;
  mats.ceramic.roughness = .32;
  mats.vinyl.roughness = .79;

  for (let i = 0; i < 3; i++) fittedMedicalRoomProps(scene, -13 * i, i);
  decorateEquipment(scene, [0, -13, -26]);

  // Screwed-down floor drainage, signage brackets and fine seams: shared instanced mesh.
  const dustClouds: THREE.Points[] = [];
  for (let room = 0; room < 3; room++) {
    const positions = new Float32Array(280 * 3);
    for (let k = 0; k < 280; k++) {
      const a = (k * 73.7 + room * 53.1) % 100;
      const b = (k * 17.3 + room * 7.17) % 100;
      positions[k * 3] = a / 100 * 10.3 - 5.15;
      positions[k * 3 + 1] = .38 + ((k * 29.7) % 100) / 100 * 3.15;
      positions[k * 3 + 2] = -13 * room + b / 100 * 11.7 - 5.85;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const cloud = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaec4b7, size: .023, transparent: true, opacity: .31, depthWrite: false, sizeAttenuation: true }));
    cloud.frustumCulled = false;
    scene.add(cloud); dustClouds.push(cloud);
  }
  addInstanced(scene, circle, steel, 180, (i, obj) => {
    const room = Math.floor(i / 60);
    const n = i % 60, side = n % 2 ? -1 : 1;
    obj.position.set(side * (4.95 - (n % 5) * .05), .038, -13 * room - 5.8 + Math.floor(n / 2) * .4);
    obj.scale.set(.023, .008, .023);
  });
  addInstanced(scene, unit, steelDark, 78, (i, obj) => {
    const room = Math.floor(i / 26);
    const n = i % 26, side = n % 2 ? -1 : 1;
    obj.position.set(side * 5.38, 3.25, -13 * room - 5.8 + Math.floor(n / 2) * .94);
    obj.scale.set(.043, .065, .034);
  });

  // Medical warning lamps physically installed above the exit openings.
  const emergency: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const z = -13 * i - 6.26;
    mesh(scene, "Baliza de evacuación", 1.46, 2.95, z + .16, .29, .26, .22, steelDark, "rounded");
    const lamp = mesh(scene, "LED de evacuación", 1.46, 2.95, z + .3, .18, .16, .025, i === 2 ? glowRed : glowGreen);
    emergency.push(lamp);
    for (const x of [-1.16, 1.16]) {
      mesh(scene, "Pilar compuerta hermética", x, 1.58, z, .24, 3.16, .34, enamel, "rounded");
      for (const y of [.34, .89, 1.44, 1.99, 2.54]) {
        mesh(scene, "Perno de compuerta", x + .085, y, z + .20, .055, .08, .025, rust, "rounded");
      }
    }
    mesh(scene, "Dintel multilámina", 0, 3.08, z, 2.58, .32, .42, steelDark, "rounded");
    mesh(scene, "Junta de contención", 0, 2.84, z + .075, 2.08, .075, .25, seal);
  }
  // Visual event support: no extra animation loop, state updated by existing game tick.
  return {
    update(elapsed: number, danger: number) {
      for (let i = 0; i < dustClouds.length; i++) dustClouds[i].rotation.y = Math.sin(elapsed * .068 + i) * .003;
      for (let i = 0; i < emergency.length; i++) {
        const active = danger > .65 && Math.sin(elapsed * 6.4 + i * 1.7) > .73;
        const material = emergency[i].material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = active ? 2.8 : 1.0;
      }
    },
    dispose() {
      [floorTexture, wallTexture, ceilingTexture, floorNormal, wallNormal].forEach(t => t?.dispose());
      for (const cloud of dustClouds) { cloud.geometry.dispose(); (cloud.material as THREE.PointsMaterial).dispose(); }
    }
  };
}
