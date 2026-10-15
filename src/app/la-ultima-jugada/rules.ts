export type FootballPuzzle = "monitores" | "pizarra" | "relay" | "cctv" | "prueba";
export type PuzzleInput = {
  selection: string;
  moves: readonly string[];
  relays: readonly number[];
  evidence: string;
  confirm: string;
};
export const FOOTBALL_GAME_LENGTH_SECONDS = 15 * 60;
export const FOOTBALL_ROOM_COUNT = 3;
export function verifyFootballPuzzle(id: FootballPuzzle, input: PuzzleInput): boolean {
  switch (id) {
    case "monitores": return input.selection === "C2";
    case "pizarra": return input.moves.length === 3 &&
      input.moves[0] === "banda derecha" &&
      input.moves[1] === "medialuna" &&
      input.moves[2] === "primer palo";
    case "relay": return input.relays.length === 3 &&
      input.relays[0] === 2 && input.relays[1] === 3 && input.relays[2] === 1;
    case "cctv": return input.evidence === "09";
    case "prueba": return input.confirm === "derecha";
  }
}
export function canEnterCorridor(solved: {informe:boolean}) {return solved.informe;}
export function canEnterTunnel(solved: {relay:boolean,cctv:boolean}) {return solved.relay && solved.cctv;}
export function canFinish(solved:{prueba:boolean,informe:boolean}) {return solved.prueba && solved.informe;}
