import {GLTFLoader,type GLTF} from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * One first-party GLB cache shared across 3 separate physical rooms.
 * Fetch and parse each verified CC0 model exactly once per browser session.
 * If a model fails, all rooms retain their functional in-world fallback.
 */
const loader=new GLTFLoader();
const cache=new Map<string,Promise<GLTF>>();
const BASE="/la-ultima-jugada/models/";

export const FOOTBALL_ASSETS={
 player:BASE+"player-quaternius.glb",
 desk:BASE+"desk-kari.glb",
 chair:BASE+"chair-olve.glb",
 shelf:BASE+"shelf-kant.glb",
 lamp:BASE+"table-lamp-ember.glb"
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
 await Promise.allSettled(Object.values(FOOTBALL_ASSETS).map(loadFootballModel));
}
