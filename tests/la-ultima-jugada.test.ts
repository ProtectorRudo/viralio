import {describe,expect,it} from "vitest";
import {verifyFootballPuzzle,canEnterCorridor,canEnterTunnel,canFinish,FOOTBALL_GAME_LENGTH_SECONDS,FOOTBALL_ROOM_COUNT,type PuzzleInput} from "../src/app/la-ultima-jugada/rules";

const right:PuzzleInput={selection:"C2",moves:["banda derecha","medialuna","primer palo"],relays:[2,3,1],evidence:"09",confirm:"derecha"};
describe("La Última Jugada",()=>{
 it("enforces three scenes and exactly fifteen minutes",()=>{
  expect(FOOTBALL_ROOM_COUNT).toBe(3);expect(FOOTBALL_GAME_LENGTH_SECONDS).toBe(900);
 });
 it("accepts the correct clue for every physically discoverable puzzle",()=>{
  for(const puzzle of ["monitores","pizarra","relay","cctv","prueba"] as const)
   expect(verifyFootballPuzzle(puzzle,right)).toBe(true);
 });
 it("rejects a doctored camera feed",()=>{
  expect(verifyFootballPuzzle("monitores",{...right,selection:"C3"})).toBe(false);
 });
 it("rejects wrong positioning and prevents a premature victory",()=>{
  expect(verifyFootballPuzzle("pizarra",{...right,moves:["centro","medialuna","primer palo"]})).toBe(false);
  expect(verifyFootballPuzzle("prueba",{...right,confirm:"centro"})).toBe(false);
  expect(canFinish({informe:true,prueba:false})).toBe(false);
 });
 it("enforces complete relay and security evidence",()=>{
  expect(verifyFootballPuzzle("relay",{...right,relays:[2,1,3]})).toBe(false);
  expect(verifyFootballPuzzle("cctv",{...right,evidence:"17"})).toBe(false);
  expect(canEnterCorridor({informe:false})).toBe(false);
  expect(canEnterCorridor({informe:true})).toBe(true);
  expect(canEnterTunnel({relay:true,cctv:false})).toBe(false);
  expect(canEnterTunnel({relay:true,cctv:true})).toBe(true);
 });
});
