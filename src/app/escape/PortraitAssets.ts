export type CharacterId = "elias" | "mara" | "nora" | "eva";

export const CHARACTERS: Record<CharacterId,{name:string;year:string;identity:string}> = {
  elias: {name:"Elías",year:"1891",identity:"El guardián de la casa"},
  mara: {name:"Mara",year:"1902",identity:"La mujer de la flor"},
  nora: {name:"Nora",year:"1918",identity:"La niña que miraba la puerta"},
  eva: {name:"Eva",year:"013",identity:"La última voz"},
};

/**
 * Deliberately separate 1x and master image per character. Previously every
 * portrait modal and dolly close-up used exactly the same portrait.webp.
 * The one canonical mapping makes future art updates coherent across rooms,
 * the focused camera, evidence board and Eva's music-box photograph.
 */
export function characterImageSet(id:CharacterId):string {
  return `image-set(url("/escape/images/characters/${id}.webp") 1x,url("/escape/images/retina/characters/${id}.webp") 2x)`;
}
