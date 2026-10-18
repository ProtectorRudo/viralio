/**
 * Deterministic escape-room puzzle rules, independent from React, WebGL and audio.
 * These functions are tested in CI so scene improvements cannot silently break progression.
 */
export type MotherGear="grande"|"mediano"|"pequeño";
export const BOOK_SEQUENCE=["verde","rojo","dorado","azul"] as const;
export const PHOTO_TILES=[0,1,2,3] as const;
export function swapPhotoTiles(tiles:readonly number[],a:number,b:number):number[]{
  if(a<0||b<0||a>=tiles.length||b>=tiles.length)return [...tiles];
  const next=[...tiles];[next[a],next[b]]=[next[b],next[a]];return next;
}
export const GEAR_SEQUENCE:readonly MotherGear[]=["grande","mediano","pequeño"];

export function rotatePhotoPiece(pieces:readonly number[],index:number):number[]{
  if(index<0||index>=pieces.length)return [...pieces];
  return pieces.map((p,i)=>i===index?(p+1)%4:p);
}
export function photoComplete(pieces:readonly number[],order:readonly number[]=[0,1,2,3]):boolean{
  return pieces.length===4&&pieces.every(n=>n===0)&&order.length===4&&order.every((n,i)=>n===i);
}
export function enterOrderedItem<T extends string>(
  entered:readonly T[],choice:T,solution:readonly T[]
):{next:T[];error:boolean;complete:boolean}{
  if(solution[entered.length]!==choice)return {next:[],error:true,complete:false};
  const next=[...entered,choice];
  return {next,error:false,complete:next.length===solution.length};
}
export function timeRemaining(endAt:number,now:number):number{
  return Math.max(0,Math.ceil((endAt-now)/1000));
}
export type MotherBeat={at:number;title:string;text:string;tone:"warning"|"danger"};
export const MOTHER_BEATS:readonly MotherBeat[]=[
  {at:12,title:"PASOS",text:"Algo cayó en el pasillo. ¿Hay alguien más en casa?",tone:"warning"},
  {at:50,title:"NÚMERO DESCONOCIDO",text:"NO SIGAS BUSCANDO.",tone:"danger"},
  {at:105,title:"NUEVO MENSAJE",text:"ÉL TE ESTÁ ESPERANDO.",tone:"danger"},
  {at:170,title:"INTERRUPCIÓN ELÉCTRICA",text:"Las luces parpadean. Algo parece haber cambiado de lugar.",tone:"warning"},
  {at:240,title:"VOZ DESDE LA CASA",text:"«Mamá, apurate... Estoy acá.»",tone:"danger"},
  {at:280,title:"ÚLTIMA ADVERTENCIA",text:"LA PUERTA NO VA A ESPERAR.",tone:"danger"}
] as const;
export function dueMotherBeats(elapsed:number,seen:ReadonlySet<number>):MotherBeat[]{
  return MOTHER_BEATS.filter(b=>elapsed>=b.at&&!seen.has(b.at));
}
