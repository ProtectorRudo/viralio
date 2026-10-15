import {GLTFLoader,type GLTF} from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * One first-party GLB cache shared across 3 separate physical rooms.
 * Fetch and parse each verified CC0 model exactly once per browser session.
 * If a model fails, all rooms retain their functional in-world fallback.
 */
const loader=new GLTFLoader();
const cache=new Map<string,Promise<GLTF>>();
const BASE="/la-ultima-jugada/models/";
const SHARED="/viralio-3d/models/";

export const FOOTBALL_ASSETS={
 player:BASE+"player-quaternius.glb",
 desk:SHARED+"steel-office-desk.glb",
 chair:BASE+"chair-olve.glb",
 shelf:BASE+"shelf-kant.glb",
 lamp:BASE+"table-lamp-ember.glb"
} as const;

/** Premium CC0 assets copied from Viralio's verified 3D catalog, selectively. */
export const FOOTBALL_PREMIUM={
 monitor:SHARED+"video-analysis-27inch-monitor.glb",
 keyboard:SHARED+"key-grid-mechanical-keyboard.glb",
 camera:SHARED+"cctv-security-camera.glb",
 keypad:SHARED+"access-control-keypad.glb",
 duffel:SHARED+"football-duffel-bag.glb",
 backpack:SHARED+"football-backpack.glb",
 locker:SHARED+"vent-perforated-locker.glb",
 fourLocker:SHARED+"four-compartment-locker.glb",
 football:SHARED+"football-polyhaven-dirty.glb",
 scoreboard:SHARED+"football-scoreboard.glb",
 steelDoor:SHARED+"workshop-industrial-steel-door.glb"
} as const;

export function loadFootballModel(url:string):Promise<GLTF>{
 let model=cache.get(url);
 if(!model){
  model=loader.loadAsync(url).catch((error:unknown)=>{
   cache.delete(url);
   throw error;
  });
  cache.set(url,model);
 }
 return model;
}

export async function preloadFootballAssets():Promise<void>{
 // Critical path only: do not preload all 12 premium models on midrange phones.
 await Promise.allSettled([
  ...Object.values(FOOTBALL_ASSETS),
  FOOTBALL_PREMIUM.monitor,FOOTBALL_PREMIUM.keyboard
 ].map(loadFootballModel));
}
