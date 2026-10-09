import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,it,expect} from "vitest";
import {experiences,getExperience} from "../src/app/tehiceesto/data";
import {getExperienceCopy} from "../src/app/tehiceesto/experienceCopy";
const file=(path:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",path),"utf8");
describe("Cumpleaños premium quality and safe reuse",()=>{
 const birthday=getExperience("cumpleanos");
 if(!birthday)throw new Error("No birthday model");
 const copy=getExperienceCopy(birthday);
 it("preserves the model order and every unrelated model",()=>{
  expect(birthday.recipe).toEqual(["intro","candles","balloons","memories","light","voices","hold","letter","finale"]);
  expect(experiences.filter(e=>e.slug!=="cumpleanos").length).toBeGreaterThan(5);
 });
 it("keeps the wish confirmation in the same button without the old touch instruction",()=>{
  const candle=file("CandleBlow.tsx");
  expect(candle).toContain('birthdayMode?');
  expect(candle).toContain('"Ya soplé"');
  expect(candle).toContain('birthdayMode)return');
  expect(file("ExperienceEngine.tsx")).toContain('birthdayMode={experience.slug==="cumpleanos"}');
 });
 it("allows exactly three balloon pops before locking remaining balloons",()=>{
  const engine=file("ExperienceEngine.tsx");
  expect(engine).toContain('popped.length>=3} onClick');
  expect(engine).toContain('experience.slug==="cumpleanos"&&v.length>=3');
  expect(birthday.demo.balloons).toHaveLength(6);
 });
 it("explores three memories before the flashlight can reveal its closing",()=>{
  const scene=file("BirthdayLantern.tsx");
  expect(copy.light.clues).toHaveLength(3);
  expect(scene).toContain('found.length===3');
  expect(scene).toContain('setPointerCapture');
  expect(scene).toContain('thi-bday-lantern-darkness');
  expect(scene).toContain('onPointerMove={e=>scan(e)}');
 });
 it("makes real audio pause and resume without replacing other engines",()=>{
  const voice=file("BirthdayVoices.tsx");
  expect(voice).toContain('void player.play()');
  expect(voice).toContain('player.pause()');
  expect(voice).toContain('data-action="birthday-voice-toggle"');
  expect(file("ExperienceEngine.tsx")).toContain('<BirthdayVoices');
 });
 it("uses closed envelope, final scratch and named customizable gift signature",()=>{
  const engine=file("ExperienceEngine.tsx");
  expect(engine).toContain('experience.slug==="pareja"||experience.slug==="cumpleanos"');
  expect(engine).toContain('data-revealed={birthdayFinalScratched');
  expect(engine).toContain('thi-bday-finale-signature');
  expect(copy.finale.fromLabel).toContain("mamá, Nati, Fran");
  expect(copy.memories.cta).not.toMatch(/escuchá esto/i);
  const editor=file("admin/ScriptEditor.tsx");
  expect(editor).toContain('path:"finale.fromLabel"');
  expect(editor).toContain('path:"light.clues"');
 });
 it("shows photos of real people in the public demo, not random strangers in customer gifts",()=>{
   const engine=file("ExperienceEngine.tsx");
   const lantern=file("BirthdayLantern.tsx");
   // Anchor this assertion to the actual BirthdayLantern render, not a stale switch-case layout.
   const begin=engine.indexOf('<BirthdayLantern clues=');
   expect(begin).toBeGreaterThan(-1);
   const scene=engine.slice(begin,engine.indexOf('completed={lightRevealed}',begin));
   expect(scene).toContain('photos={customerGift');
   expect(scene).toContain('currentPhotos.filter');
   expect(scene).toContain('photo-1758275557513-241a2a229936');
   expect(scene).toContain('photo-1755705153160-67b29c7718ee');
   expect(scene).toContain('photo-1772724317388-4d1d1cc45c09');
   expect(lantern).toContain('photos[i]?.url&&!imageUnavailable.includes(i)?');
   expect(lantern).toContain('thi-bday-lantern-photo');
 });
 it("raises the opened paper over the envelope flap and preserves readable long text",()=>{
   const css=file("tehiceesto-birthday.css");
   const fix=css.slice(css.indexOf("LETTER OPEN — actually pull"));
   expect(fix).toContain(".thi-envelope.open .paper");
   expect(fix).toContain("z-index:20!important");
   expect(fix).toContain("overflow-y:auto!important");
   expect(fix).toContain(".thi-envelope.open .paper strong");
   expect(fix).toContain("overflow:visible!important");
   expect(fix).toContain(".thi-envelope.open .front");
 });
 it("limits new CSS to live version and does not modify frozen templates",()=>{
  const css=file("tehiceesto-birthday.css");
  expect(css).toContain("thi-template-live.thi-theme-cumpleanos");
  expect(file("layout.tsx")).toContain('import "./tehiceesto-birthday.css";');
  for(const version of ["template-v1","template-v2"]){
   expect(file(`${version}/ExperienceEngine.tsx`)).not.toContain("BirthdayLantern");
   expect(file(`${version}/data.ts`)).not.toContain("thi-bday-lantern");
  }
 });
});