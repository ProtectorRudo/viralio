/**
 * Biblioteca 3D compartida de Viralio Escape.
 * Carga selectiva: solo se descargan modelos usados en la sala actual.
 * Fuente: public/viralio-3d/index.json generado por scripts/build-viralio-3d-library.mjs.
 * Ninguna sala debe depender del servidor de Innerscene en tiempo de juego.
 */
import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AnimationClip } from "three";

export type Viralio3DItem = {
  id: string;
  title: string;
  category: string;
  tier: string;
  quality: string;
  license: "CC0-1.0";
  sourcePage: string;
  author: string;
  path: string;
  byteSize: number;
  sha256: string;
  meshes: number;
  nodes: number;
  materials: number;
  textures: number;
  animations: number;
  optimized: boolean;
};
export type Viralio3DIndex = {
  name: string;
  version: string;
  generatedAt: string;
  total: number;
  license: "CC0-1.0";
  items: Viralio3DItem[];
};

type CachedAsset = { scene: Group; animations: AnimationClip[]; entry: Viralio3DItem };
let indexRequest: Promise<Viralio3DIndex> | null = null;
const resourceCache = new Map<string, Promise<CachedAsset>>();
const loader = new GLTFLoader();

export function getViralio3DIndex(): Promise<Viralio3DIndex> {
  if (!indexRequest) {
    indexRequest = fetch("/viralio-3d/index.json", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Biblioteca 3D no publicada: " + response.status);
        const index = (await response.json()) as Viralio3DIndex;
        if (!Array.isArray(index.items)) throw new Error("Índice 3D inválido");
        return index;
      }).catch(error=>{indexRequest=null;throw error;});
  }
  return indexRequest;
}

export async function findViralio3DItems(
  filters: { category?: string; text?: string; tier?: string } = {}
): Promise<Viralio3DItem[]> {
  const { items } = await getViralio3DIndex();
  const text = filters.text?.trim().toLocaleLowerCase("es") ?? "";
  return items.filter(item =>
    (!filters.category || item.category === filters.category)
    && (!filters.tier || item.tier === filters.tier)
    && (!text || (item.title+" "+item.category+" "+item.id).toLocaleLowerCase("es").includes(text))
  );
}

/** Devuelve una COPIA independiente de la escena para permitir reutilizarla en varios niveles. */
export async function loadViralio3DAsset(id: string): Promise<CachedAsset> {
  const index = await getViralio3DIndex();
  const entry = index.items.find(item => item.id === id);
  if (!entry) throw new Error("Modelo 3D no disponible en la biblioteca: "+id);
  if (!resourceCache.has(id)) {
    resourceCache.set(id,
      loader.loadAsync(entry.path)
        .then(gltf=>({scene:gltf.scene,animations:gltf.animations,entry}))
        .catch(error=>{resourceCache.delete(id);throw error;})
    );
  }
  const cached = await resourceCache.get(id)!;
  return { scene: cloneSkinned(cached.scene) as Group, animations: cached.animations, entry: cached.entry };
}

/** Precarga opcional de los recursos de la SALA actual; no precargar los 81 modelos. */
export async function preloadViralio3DAssets(ids: string[]): Promise<void> {
  await Promise.all(ids.map(async id => { await loadViralio3DAsset(id); }));
}

export function clearViralio3DCache(): void {
  resourceCache.clear();
  indexRequest = null;
}
