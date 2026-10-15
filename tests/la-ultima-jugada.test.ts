import {describe,expect,it} from "vitest";
import {tacticsFrame} from "../src/app/la-ultima-jugada/TacticSimulation";
import {verifyFootballPuzzle,canEnterCorridor,canEnterTunnel,canFinish,FOOTBALL_GAME_LENGTH_SECONDS,FOOTBALL_ROOM_COUNT,type PuzzleInput} from "../src/app/la-ultima-jugada/rules";

const right:PuzzleInput={
 selection:"C2",differences:["salto","duplicado","continuidad"],
 moves:["banda derecha","medialuna","primer palo"],
 fragments:["PLANO","SELLO","RUTA","FIRMA"],
 locker:"04",lockerPin:"247",relays:[2,4,3],evidence:"09",confirm:"derecha",
 finalSequence:["C2","04","ROJO"]
};
describe("La Última Jugada",()=>{
 it("enforces three scenes and exactly fifteen minutes",()=>{
  expect(FOOTBALL_ROOM_COUNT).toBe(3);expect(FOOTBALL_GAME_LENGTH_SECONDS).toBe(900);
 });
 it("accepts the correct clue for every physically discoverable puzzle",()=>{
  for(const puzzle of ["monitores","pizarra","informe","casillero","relay","cctv","prueba"] as const)
   expect(verifyFootballPuzzle(puzzle,right)).toBe(true);
 });
 it("rejects a doctored camera feed",()=>{
  expect(verifyFootballPuzzle("monitores",{...right,selection:"C3"})).toBe(false);
 });
 it("rejects wrong positioning and prevents a premature victory",()=>{
  expect(verifyFootballPuzzle("pizarra",{...right,moves:["centro","medialuna","primer palo"]})).toBe(false);
  expect(verifyFootballPuzzle("prueba",{...right,confirm:"centro"})).toBe(false);
  expect(canFinish({informe:true,prueba:false,casillero:true})).toBe(false);
 });
 it("enforces complete relay and security evidence",()=>{
  expect(verifyFootballPuzzle("relay",{...right,relays:[2,1,3]})).toBe(false);
  expect(verifyFootballPuzzle("informe",{...right,fragments:["PLANO","SELLO","FIRMA","RUTA"]})).toBe(false);
  expect(verifyFootballPuzzle("casillero",{...right,lockerPin:"271"})).toBe(false);
  expect(verifyFootballPuzzle("monitores",{...right,differences:["salto","duplicado","bandera"]})).toBe(false);
  expect(verifyFootballPuzzle("prueba",{...right,finalSequence:["ROJO","04","C2"]})).toBe(false);
  expect(verifyFootballPuzzle("cctv",{...right,evidence:"17"})).toBe(false);
  expect(canEnterCorridor({informe:false})).toBe(false);
  expect(canEnterCorridor({informe:true})).toBe(true);
  expect(canEnterTunnel({casillero:true,relay:true,cctv:false})).toBe(false);
  expect(canEnterTunnel({casillero:true,relay:true,cctv:true})).toBe(true);
  expect(canEnterTunnel({casillero:false,relay:true,cctv:true})).toBe(false);
  expect(canFinish({informe:true,prueba:true,casillero:false})).toBe(false);
 });
});


describe("Three-camera evidence integrity",()=>{
 it("shows real continuous ball motion on original C2",()=>{
  const before=tacticsFrame("C2",.42),after=tacticsFrame("C2",.45);
  expect(Math.hypot(after.ball.x-before.ball.x,after.ball.y-before.ball.y)).toBeLessThan(4);
  expect(before.duplicate).toBeUndefined();
  expect(after.duplicate).toBeUndefined();
 });
 it("renders a detectable impossible spatial leap in C1",()=>{
  const before=tacticsFrame("C1",.42),after=tacticsFrame("C1",.45);
  expect(Math.hypot(after.ball.x-before.ball.x,after.ball.y-before.ball.y)).toBeGreaterThan(20);
 });
 it("renders a second ball only in corrupted C3",()=>{
  expect(tacticsFrame("C3",.51).duplicate).toBeDefined();
  expect(tacticsFrame("C3",.30).duplicate).toBeUndefined();
 });
});
