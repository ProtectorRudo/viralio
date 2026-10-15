/**
 * Personajes animados reutilizables para Viralio Escape.
 * Las identidades de escena son papeles narrativos; no indican que los modelos de
 * origen tengan el vestuario, rostro o calidad visual final de cada papel.
 * El movimiento de IA/collisions/persecución pertenece a cada juego.
 */
import { AnimationAction, AnimationClip, AnimationMixer, Group, LoopRepeat } from "three";
import { loadViralio3DAsset, type Viralio3DItem } from "@/lib/viralio-3d";

export type ViralioCharacterId = "sam"|"harper"|"jordan"|"maya";
export type ViralioCharacterRole = "intruso"|"celador"|"guardia"|"acomodador"|"investigador"|"testigo"|"recepcionista"|"enfermera";
export type ViralioCharacterMotion = "idle"|"walk"|"brisk"|"jog"|"run"|"carry"|"sit";
export const VIRALIO_CHARACTER_LIBRARY: Record<ViralioCharacterId,{assetId:string; description:string; roles:ViralioCharacterRole[]}> = {
  sam:{assetId:"npc-sam-locomotion",description:"Adulto con ropa informal",roles:["intruso","celador","testigo"]},
  harper:{assetId:"npc-harper-locomotion",description:"Adulta con ropa profesional",roles:["enfermera","investigador","recepcionista"]},
  jordan:{assetId:"npc-jordan-locomotion",description:"Adulto con ropa de oficina",roles:["guardia","acomodador","investigador"]},
  maya:{assetId:"npc-maya-locomotion",description:"Adulta con ropa informal",roles:["testigo","recepcionista","intruso"]},
};

export type ViralioAnimatedCharacter = {
  id:ViralioCharacterId;
  scene:Group;
  mixer:AnimationMixer;
  animations:readonly AnimationClip[];
  entry:Viralio3DItem;
  /** No mueve la raíz: el juego decide desplazamiento y colisiones. */
  update:(seconds:number)=>void;
  play:(motion:ViralioCharacterMotion,fadeSeconds?:number)=>boolean;
  availableMotions:ViralioCharacterMotion[];
  stop:()=>void;
};

function classifyClip(name:string):ViralioCharacterMotion|null {
  const n=name.toLowerCase().replace(/[_-]+/g," ");
  if(/sit|stand up/.test(n))return "sit";
  if(/carry|holding/.test(n))return "carry";
  if(/brisk|fast walk/.test(n))return "brisk";
  if(/jog/.test(n))return "jog";
  if(/run|sprint/.test(n))return "run";
  if(/walk/.test(n))return "walk";
  if(/idle|stand|breath/.test(n))return "idle";
  return null;
}

/**
 * Carga un único modelo con rig y clips originales, devuelve controles para
 * cross-fade entre acciones. Reutiliza cache GLB sin compartir huesos entre NPCs.
 */
export async function createViralioCharacter(
  id:ViralioCharacterId,
  opts:{initialMotion?:ViralioCharacterMotion}={}
):Promise<ViralioAnimatedCharacter> {
  const data=VIRALIO_CHARACTER_LIBRARY[id];
  if(!data)throw Error("Personaje desconocido: "+id);
  const {scene,animations,entry}=await loadViralio3DAsset(data.assetId);
  const hasSkeleton=scene.getObjectByProperty("type","SkinnedMesh")!==undefined;
  if(!hasSkeleton||animations.length<3){
    throw Error("Personaje incompleto: falta esqueleto o clips ("+data.assetId+")");
  }
  const mixer=new AnimationMixer(scene);
  const actions=new Map<ViralioCharacterMotion,AnimationAction>();
  animations.forEach((clip)=>{
    const motion=classifyClip(clip.name);
    if(motion&&!actions.has(motion)){
      const action=mixer.clipAction(clip);
      action.setLoop(LoopRepeat,Infinity);
      actions.set(motion,action);
    }
  });
  if(!actions.size)throw Error("No se reconocieron los nombres de las animaciones de "+id);
  let active:AnimationAction|undefined;
  const play=(motion:ViralioCharacterMotion,fadeSeconds=.28)=>{
    const next=actions.get(motion);
    if(!next)return false;
    if(next===active)return true;
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    if(active)next.crossFadeFrom(active,Math.max(0,fadeSeconds),false);
    active=next;
    return true;
  };
  play(opts.initialMotion??"idle",0);
  return {
    id,scene,mixer,animations,entry,
    availableMotions:[...actions.keys()],
    play,
    update(seconds:number){if(Number.isFinite(seconds)&&seconds>0)mixer.update(Math.min(seconds,.1));},
    stop(){mixer.stopAllAction();mixer.uncacheRoot(scene);}
  };
}
