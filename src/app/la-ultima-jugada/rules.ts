export type FootballPuzzle="monitores"|"pizarra"|"informe"|"casillero"|"relay"|"cctv"|"prueba";
export type PuzzleInput={
 selection:string;
 differences:readonly string[];
 moves:readonly string[];
 fragments:readonly string[];
 relays:readonly number[];
 locker:string;
 lockerPin:string;
 evidence:string;
 confirm:string;
 finalSequence:readonly string[];
};
export const FOOTBALL_GAME_LENGTH_SECONDS=15*60;
export const FOOTBALL_ROOM_COUNT=3;
export const CORRECT_DIFFERENCES=["salto","duplicado","continuidad"] as const;
export const FRAGMENT_ORDER=["PLANO","SELLO","RUTA","FIRMA"] as const;
export const FINAL_STAMPS=["C2","04","ROJO"] as const;
export function verifyFootballPuzzle(id:FootballPuzzle,input:PuzzleInput):boolean {
 switch(id){
  case "monitores":
   return input.selection==="C2"&&input.differences.length===3&&
    CORRECT_DIFFERENCES.every(d=>input.differences.includes(d));
  case "pizarra":
   return input.moves.length===3&&input.moves[0]==="banda derecha"&&
     input.moves[1]==="medialuna"&&input.moves[2]==="primer palo";
  case "informe":
   return input.fragments.length===4&&FRAGMENT_ORDER.every((f,i)=>input.fragments[i]===f);
  case "casillero":
   return input.locker==="04"&&input.lockerPin==="247";
  case "relay":return input.relays.length===3&&
   input.relays[0]===2&&input.relays[1]===4&&input.relays[2]===3;
  case "cctv":return input.evidence==="09";
  case "prueba":return input.confirm==="derecha"&&input.finalSequence.length===3&&
    FINAL_STAMPS.every((stamp,i)=>input.finalSequence[i]===stamp);
 }
}
export function canEnterCorridor(solved:{informe:boolean}){return solved.informe;}
export function canEnterTunnel(solved:{casillero:boolean;relay:boolean;cctv:boolean}){
 return solved.casillero&&solved.relay&&solved.cctv;
}
export function canFinish(solved:{prueba:boolean;informe:boolean;casillero:boolean}){
 return solved.prueba&&solved.informe&&solved.casillero;
}
