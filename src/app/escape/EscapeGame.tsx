"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./escape.module.css";
import Artefact from "./Artefact";
import {type CharacterId} from "./PortraitAssets";
import DiegeticFocus from "./DiegeticFocus";
import CinematicAtmosphere from "./CinematicAtmosphere";
import HouseListening from "./HouseListening";
import EvaMirror from "./EvaMirror";
import ThresholdSequence from "./ThresholdSequence";
import LockTumblers from "./LockTumblers";
import ClockMechanism from "./ClockMechanism";
import PhysicalLetter from "./PhysicalLetter";
import EvaMemory from "./EvaMemory";
import {unlockHorrorAudio,playHorror,playFootstepsAcrossRoom,playInterfaceCue,setHorrorMuted,stopHorrorAudio,resumeHorrorAudio} from "./SoundDirector";
import {startRoomTone,stopRoomTone} from "./RoomTone";
import EvidenceArchive from "./EvidenceArchive";
import RoomExplorer,{EMPTY_EXPLORATION,type ExplorationState} from "./RoomExplorer";
import {startAdaptiveScore,resumeAdaptiveScore,updateAdaptiveScore,finishAdaptiveScore,stopAdaptiveScore,tensionTier,TENSION_TITLES} from "./AdaptiveScore";

type Phase = "intro" | "playing" | "won" | "lost";
type Difficulty = "story" | "nightmare";
type PuzzleState = { clockWound?: boolean; mirrorRead?: boolean; portraits: number[]; candles: string[]; studyOpen: boolean; notesRead: boolean; evaRead: boolean; melody: string[]; nurseryOpen: boolean; keepsake: boolean; fuses: number[]; power: boolean; ending: "escape" | "save" | null };
type SaveState = { phase: Phase; room: number; seconds: number; hints: number[]; mistakes: number; puzzles: PuzzleState; difficulty?: Difficulty; exploration?:ExplorationState };
const TOTAL = 25 * 60;
const ROOM_NAMES = ["El vestíbulo", "El despacho", "La habitación de Eva", "El corazón de la casa"];
const INITIAL: PuzzleState = { clockWound:false, mirrorRead:false, portraits: [], candles: [], studyOpen: false, notesRead: false, evaRead: false, melody: [], nurseryOpen: false, keepsake: false, fuses: [], power: false, ending: null };
const CLUES = [
  ["Las cifras están en los marcos de tres retratos.", "Cada retrato conserva un año y una cifra. El calendario importa.", "Ordená los retratos de la persona más joven a la más vieja: 1918, 1902, 1891."],
  ["La nota habla del cielo, del camino y de lo que florece.", "Esas palabras representan los símbolos dibujados debajo de las velas.", "Tocá las velas en este orden: luna, llave, rosa."],
  ["La carta de Eva contiene una melodía escrita con nombres de notas.", "La caja musical acepta una secuencia de cuatro sonidos.", "Tocá SOL → MI → LA → SOL."],
  ["Dos fusibles pueden sumar exactamente siete.", "La palanca responde solo cuando se activan dos fusibles.", "Activá el 2 y el 5, o el 3 y el 4. Después bajá la palanca."]
];
const PORTRAITS: {id:CharacterId;name:string;year:number;mark:string;text:string}[] = [
  { id:"elias",name: "Elías", year: 1891, mark: "7", text: "Sus ojos siguen fijos en la cerradura. En el marco, un siete tallado." },
  { id:"mara",name: "Mara", year: 1902, mark: "2", text: "Una mujer sostiene una flor marchita. Debajo, la cifra dos." },
  { id:"nora",name: "Nora", year: 1918, mark: "4", text: "La niña mira hacia la puerta. Una pequeña cifra cuatro brilla en la madera." },
];
const SAVE_KEY = "umbral-casa-13-v1";
const RECORD_KEY = "umbral-personal-records-v1";
function fmt(seconds: number) {
  return String(Math.floor(Math.max(seconds, 0) / 60)).padStart(2, "0") + ":" + String(Math.max(seconds, 0) % 60).padStart(2, "0");
}

function SceneArt({ room, power, candles, studyOpen, nurseryOpen, fuses }: { room: number; power: boolean; candles: string[]; studyOpen: boolean; nurseryOpen: boolean; fuses: number[] }) {
  return <svg className={styles.artwork} viewBox="0 0 1200 690" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="wall" cx="49%" cy="41%" r="73%"><stop stopColor="#31302a"/><stop offset=".62" stopColor="#161c1d"/><stop offset="1" stopColor="#05090b"/></radialGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#292722"/><stop offset="1" stopColor="#060809"/></linearGradient>
      <linearGradient id="wood"><stop stopColor="#161514"/><stop offset=".44" stopColor="#514237"/><stop offset=".54" stopColor="#2e251f"/><stop offset="1" stopColor="#0b0e0e"/></linearGradient>
      <radialGradient id="halo"><stop stopColor="#ffd993" stopOpacity=".55"/><stop offset=".26" stopColor="#cd945a" stopOpacity=".13"/><stop offset="1" stopColor="#ba7742" stopOpacity="0"/></radialGradient>
      <linearGradient id="glass"><stop stopColor="#27363b"/><stop offset=".51" stopColor="#607278"/><stop offset="1" stopColor="#101c22"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="21"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
      <pattern id="wallpaper" width="58" height="92" patternUnits="userSpaceOnUse"><path d="M29 0Q8 25 29 46Q50 68 29 92 M0 45Q29 27 58 45" stroke="#8b7455" strokeOpacity=".08" strokeWidth="2" fill="none"/><circle cx="29" cy="46" r="2" fill="#9c8768" fillOpacity=".07"/></pattern>
      <pattern id="boards" width="95" height="690" patternUnits="userSpaceOnUse"><path d="M0 0V690 M89 0V690" stroke="#e2ae77" strokeOpacity=".09" strokeWidth="3"/><path d="M50 0V690" stroke="#000" strokeOpacity=".18"/></pattern>
    </defs>
    <rect width="1200" height="690" fill="url(#wall)"/>
    <path d="M0 0L138 90V490L0 690ZM1200 0L1062 90V490L1200 690" fill="#101414"/>
    <path d="M138 90H1062V490H138Z" fill="url(#wallpaper)" stroke="#5c4b3b" strokeOpacity=".3" strokeWidth="10"/>
    <path d="M0 690L138 484H1062L1200 690Z" fill="url(#floor)"/>
    <path d="M0 690L138 484H1062L1200 690Z" fill="url(#boards)" opacity=".8"/>
    <path d="M135 477H1065" stroke="#665443" strokeOpacity=".6" strokeWidth="14"/>
    <path d="M155 100H1045" stroke="#7c6147" strokeOpacity=".3" strokeWidth="5"/>
    {room===0 && <>
      <ellipse cx="600" cy="348" rx="360" ry="270" fill="url(#halo)" opacity=".27"/>
      <path d="M690 486V172Q690 129 731 129H937Q977 129 977 172V486Z" fill="#070c0e" stroke="#725842" strokeWidth="16"/>
      <path d="M709 478V175Q709 150 739 150H928Q959 150 959 175V478Z" fill="url(#wood)" stroke="#241b16" strokeWidth="8"/>
      <path d="M832 158V477 M719 298H950 M721 425H949" stroke="#a78b63" strokeOpacity=".26" strokeWidth="4"/>
      <rect x="927" y="329" width="11" height="47" rx="5" fill="#ae8351"/><ellipse cx="930" cy="351" rx="11" ry="13" fill="#c6a06a"/>
      {[218,387,553].map((x,i)=><g key={x}>
        <rect x={x-67} y="199" width="119" height="160" rx="2" fill="#0b1112" stroke="#887052" strokeWidth="9"/>
        <rect x={x-54} y="213" width="92" height="132" fill={i===0?"#322c2b":i===1?"#443a32":"#303639"}/>
        <ellipse cx={x-9} cy="258" rx="28" ry="32" fill={i===0?"#4f4a42":"#696052"} opacity=".5"/>
        <path d={"M"+(x-49)+" 341Q"+(x-38)+" 283 "+(x-9)+" 294Q"+(x+20)+" 281 "+(x+37)+" 341Z"} fill="#181a1b"/>
        <circle cx={x-19} cy="259" r="2" fill="#e8bd80" opacity=".65"/><circle cx={x+1} cy="259" r="2" fill="#e8bd80" opacity=".5"/>
        <rect x={x-32} y="355" width="46" height="13" fill="#59442d" stroke="#aa835a" strokeWidth="2"/>
      </g>)}
      <rect x="108" y="381" width="66" height="104" rx="4" fill="#29241e" stroke="#70533b" strokeWidth="4"/>
      <circle cx="141" cy="409" r="22" fill="#dac598" opacity=".8"/>
      <circle cx="141" cy="409" r="18" fill="#232827"/><path d="M141 393V408L151 414" stroke="#c2a77b" strokeWidth="3" fill="none"/>
      <path d="M132 432V469" stroke="#b99557" strokeWidth="3"/><circle cx="132" cy="461" r="7" fill="#b99557"/>
      <ellipse cx="837" cy="520" rx="180" ry="22" fill="#000" opacity=".5"/>
    </>}
    {room===1 && <>
      {[179,335,490,910,1060].map(x=><g key={x}><rect x={x-65} y="130" width="115" height="353" fill="#181715" stroke="#6b543b" strokeWidth="12"/>
       {[163,238,317,393].map((y,i)=><g key={y}><rect x={x-55} y={y} width="99" height="8" fill="#68523b"/>{[0,1,2,3,4].map((b)=><rect key={b} x={x-53+b*19} y={y-55} width={14+(b%2)*3} height={48} fill={["#4d3d35","#675743","#373938","#7c4835","#353e40"][(b+i)%5]} stroke="#987c5e" strokeOpacity=".2"/>)}</g>)}</g>)}
      <ellipse cx="610" cy="510" rx="410" ry="64" fill="#090909" opacity=".7"/>
      <path d="M350 457L871 457L934 535L277 535Z" fill="#493a2b" stroke="#98765a" strokeWidth="7"/>
      <path d="M298 532H921L899 603H319Z" fill="#29231d" stroke="#71563d" strokeWidth="8"/>
      <rect x="362" y="493" width="120" height="10" rx="2" fill="#cfba8f" transform="rotate(-5 362 493)"/>
      <rect x="553" y="478" width="135" height="9" rx="2" fill="#e2d0a5" transform="rotate(8 553 478)"/>
      {[500,653,787].map((x,i)=><g key={x} data-candle={["luna","llave","rosa"][i]} data-active={candles.includes(["luna","llave","rosa"][i])?"true":"false"}><ellipse cx={x} cy="454" rx="24" ry="8" fill="#ab8659" opacity=".45"/><rect x={x-14} y="399" width="28" height="56" rx="5" fill={i===1?"#d8ccb0":"#c4ac8d"}/><text x={x} y="442" textAnchor="middle" fontSize="17" fill="#635542">{["☾","⚿","✿"][i]}</text><path d={"M"+x+" 401Q"+(x-20)+" 379 "+x+" 358Q"+(x+20)+" 382 "+x+" 401Z"} fill={candles.includes(["luna","llave","rosa"][i])?"#f9ecab":"#b88c5c"} opacity={candles.includes(["luna","llave","rosa"][i])?1:.58}/><circle cx={x} cy="387" r={candles.includes(["luna","llave","rosa"][i])?57:25} fill="url(#halo)" opacity={candles.includes(["luna","llave","rosa"][i])?.9:.25}/>{candles.includes(["luna","llave","rosa"][i])&&<circle cx={x} cy="367" r="8" fill="#fbe8af" opacity=".45"/>}</g>)}
      <rect x="984" y="300" width="106" height="172" fill={studyOpen?"#4f493a":"#151817"} stroke={studyOpen?"#e2bf8a":"#594633"} strokeWidth="14"/>
      {studyOpen&&<path d="M1006 311L1081 308L1107 462L1002 462Z" fill="#f8cb85" opacity=".16"/>}
      <circle cx="1037" cy="393" r="19" fill="#b49a69"/><path d="M1026 393L1040 401L1047 383" stroke="#28251d" strokeWidth="4" fill="none"/>
    </>}
    {room===2 && <>
      <path d="M139 135H478V472H139Z" fill="#121b1f" stroke="#4d5046" strokeWidth="15"/>
      <rect x="160" y="157" width="295" height="289" fill="url(#glass)"/>
      <path d="M309 155V446 M162 300H453" stroke="#1c252a" strokeWidth="12"/>
      <circle cx="222" cy="215" r="50" fill="#e1e3c4" opacity=".6"/><ellipse cx="222" cy="215" rx="98" ry="75" fill="url(#halo)" opacity=".33"/>
      <path d="M520 487H998L1060 565H468Z" fill="#302a28" stroke="#84705a" strokeWidth="8"/>
      <path d="M516 556H1024L1000 619H546Z" fill="#201d1c"/>
      <path d="M527 416H839L810 495H552Z" fill="#553b2d" stroke="#917454" strokeWidth="9"/>
      <rect x="555" y="356" width="249" height="92" rx="14" fill="#322821" stroke="#a18a63" strokeWidth="8"/>
      <ellipse cx="679" cy={nurseryOpen?327:356} rx="100" ry="21" fill={nurseryOpen?"#ad9275":"#594536"} stroke="#a18a63" strokeWidth="5"/>
      {nurseryOpen&&<><path d="M583 367L778 367" stroke="#f4d7a0" strokeWidth="5" opacity=".55"/><circle cx="679" cy="378" r="27" fill="url(#halo)" opacity=".8"/></>}
      <circle cx="679" cy="332" r="16" fill="#b5a17a"/>
      <path d="M899 468V252Q899 211 940 211H1038V478Z" fill="#1b1716" stroke="#6d5140" strokeWidth="15"/>
      <ellipse cx="964" cy="310" rx="29" ry="37" fill="#77716b"/>
      <path d="M947 346L921 435H1003L982 346Z" fill="#494242"/>
      <circle cx="953" cy="302" r="3" fill="#f7bb88"/><circle cx="972" cy="302" r="3" fill="#f7bb88"/>
      <rect x="226" y="465" width="108" height="63" rx="3" fill="#67513f" stroke="#a48962" strokeWidth="6"/>
      <path d="M234 491H326M285 469V523" stroke="#b89a72" strokeWidth="3"/>
    </>}
    {room===3 && <>
      <circle cx="596" cy="340" r="245" fill={power?"url(#halo)":"#090f11"} opacity={power?".34":".9"}/>
      <rect x="300" y="138" width="565" height="379" rx="13" fill="#202b2a" stroke="#7b7661" strokeWidth="13"/>
      <rect x="317" y="157" width="532" height="342" rx="4" fill="#1b2322" stroke="#394943" strokeWidth="6"/>
      {[380,505,630,755].map((x,i)=><g key={x} data-fuse={i+2} data-active={fuses.includes(i+2)?"true":"false"}><rect x={x-37} y="252" width="74" height="151" rx="7" fill="#111817" stroke="#726a4b" strokeWidth="7"/><rect x={x-22} y="278" width="44" height="52" rx="5" fill={power||fuses.includes(i+2)?"#e4b778":"#3b4b43"} stroke="#8e7959" strokeWidth="3"/><path d={"M"+x+" 331V377"} stroke="#7f7360" strokeWidth="5"/><circle cx={x} cy="385" r="14" fill={power||fuses.includes(i+2)?"#f2c783":"#948365"}/><text x={x} y="437" textAnchor="middle" fontSize="19" fill="#cdbb9c">{i+2}</text>{(power||fuses.includes(i+2))&&<circle cx={x} cy="305" r="38" fill="url(#halo)" opacity=".7"/>}</g>)}
      <path d="M895 230H1128V485H895Z" fill="#0a1113" stroke="#61503c" strokeWidth="14"/>
      <path d="M1012 463V300" stroke={power?"#d9b66f":"#7a302b"} strokeWidth="18"/><circle cx="1012" cy="300" r="28" fill={power?"#e6c68c":"#a64e40"}/>
      <path d="M85 490V150H267V490" fill="#111518" stroke="#635b49" strokeWidth="12"/>
      <circle cx="177" cy="307" r="69" fill="#132021" stroke="#6b6b58" strokeWidth="7"/><path d="M177 307L209 268M177 307L144 344" stroke="#a89a76" strokeWidth="5"/><circle cx="177" cy="307" r="11" fill="#b59b6d"/>
      <path d="M88 460H268" stroke="#887459" strokeWidth="10"/>
      <rect x="356" y="189" width="454" height="23" fill="#645d4a" opacity=".65"/>
      {power&&<g><path d="M330 204H835M280 410H870" stroke="#f5c985" strokeWidth="4" opacity=".5"/><circle cx="800" cy="175" r="25" fill="#f3cc91" opacity=".65"/></g>}
    </>}
    <rect width="1200" height="690" fill="url(#halo)" opacity=".03"/>
  </svg>;
}

type Spot = { id: string; text: string; x: number; y: number; act: () => void; active?: boolean; glyph: string };

export default function EscapeGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [entering, setEntering] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [room, setRoom] = useState(0);
  const [seconds, setSeconds] = useState(TOTAL);
  const [difficulty,setDifficulty] = useState<Difficulty>("story");
  const [records,setRecords] = useState<Record<Difficulty,number>>({story:0,nightmare:0});
  const [puzzles, setPuzzles] = useState<PuzzleState>(INITIAL);
  const [exploration,setExploration] = useState<ExplorationState>(EMPTY_EXPLORATION);
  const [hints, setHints] = useState([0,0,0,0]);
  const [mistakes, setMistakes] = useState(0);
  const [sound, setSound] = useState(true);
  const [musicEnabled,setMusicEnabled] = useState(true);
  const [cinematicScares,setCinematicScares] = useState(true);
  const [scareStage,setScareStage] = useState<"off"|"black"|"reveal">("off");
  const scareAlreadyPlayed=useRef(false);
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [dollSpeaking,setDollSpeaking] = useState(false);
  // Prefetch exactly one upcoming room after play begins, rather than
  // downloading all four dark-scene photographs while the player is on the
  // landing page. Retina is chosen on high-DPI mobile screens; low-density
  // clients keep the lightweight WebP variant.
  const nextScenePrefetch = useRef<HTMLImageElement | null>(null);
  useEffect(()=>{
    if(phase!=="playing" || room>=3) return;
    if(window.matchMedia("(prefers-reduced-data: reduce)").matches) return;
    const density=window.devicePixelRatio>=1.5?"retina/":"";
    const image=new window.Image();
    image.decoding="async";
    image.src="/escape/images/"+density+"room-"+(room+1)+".webp";
    nextScenePrefetch.current=image;
    return ()=>{nextScenePrefetch.current=null;};
  },[phase,room]);

  const cinematicPause=modal==="tape" || scareStage!=="off" || transitioning;
  const scoreDuck=cinematicPause || dollSpeaking || Boolean(modal);
  const scoreTier=tensionTier(seconds);
  const [pin, setPin] = useState("");
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const deadlineRef = useRef<number | null>(null);

  const [apparition, setApparition] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [jolt, setJolt] = useState(false);
  const [storm, setStorm] = useState(false);
  const [sceneSize,setSceneSize] = useState({ width:0, height:0 });
  useEffect(()=>{
    // Warm the image cache before the player opens an object: never reveal a black placeholder.
    const imagesByRoom=[
      ["clock","lock"],
      ["letter","door","signal"],
      ["doll","music","letter","door"],
      ["circuit","door","signal"],
    ];
    const preloads=(imagesByRoom[room]||[]).map(name=>{
      const img=new window.Image();
      img.src="/escape/images/objects/"+name+".webp";
      return img;
    });
    if(room===0){
      // Preload each unique family member, not the old shared portrait.webp.
      for(const person of PORTRAITS){
        const img=new window.Image();
        img.src="/escape/images/characters/"+person.id+".webp";
        preloads.push(img);
      }
    }
    if(room===2){
      const img=new window.Image();
      img.src="/escape/images/characters/eva.webp";
      preloads.push(img);
    }
    return ()=>{ for(const img of preloads){img.onload=null;img.onerror=null;} };
  },[room]);

  useEffect(()=>{
    setHorrorMuted(!sound);
  },[sound]);

  // Story director: the one substantial blackout is reserved for Eva's nursery
  // after exploration, not at random while entering codes or watching a tape.
  useEffect(()=>{
    if(!cinematicScares || (typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || phase!=="playing" || room!==2 || paused || modal || scareStage!=="off" || scareAlreadyPlayed.current)return;
    const id=window.setTimeout(()=>{
      scareAlreadyPlayed.current=true;
      setScareStage("black");
      stopHorrorAudio();
      resumeHorrorAudio();
      playHorror("darkness");
      if(typeof navigator!=="undefined" && navigator.vibrate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate([32,115,45]);
    },5800);
    return ()=>window.clearTimeout(id);
  },[cinematicScares,phase,room,paused,modal,scareStage]);
  
  useEffect(()=>{
    if(scareStage==="off")return;
    const clocks:number[]=[];
    if(scareStage==="black"){
      clocks.push(window.setTimeout(()=>{
        setScareStage("reveal");
        playHorror("heartbeat",{pan:-.45});
        playFootstepsAcrossRoom();
        if(sound)playHorror("shock",{pan:.28,intensity:.78});
      },2200));
    }else if(scareStage==="reveal"){
      clocks.push(window.setTimeout(()=>{
        setScareStage("off");
        resumeHorrorAudio();
        message("La luz regresó. La muñeca está mirando hacia otro lado.");
      },1650));
    }
    return ()=>clocks.forEach(window.clearTimeout);
  },[scareStage,sound]);

  function skipScare(){
    setScareStage("off");
    stopHorrorAudio();
    window.setTimeout(resumeHorrorAudio,85);
  }

  useEffect(() => {
    if(phase!=="playing") return;
    const element=document.getElementById("umbral-playfield");
    if(!element) return;
    const observer=new ResizeObserver(entries => {
      const rect=entries[0]?.contentRect;
      if(rect) setSceneSize({width:rect.width,height:rect.height});
    });
    observer.observe(element);
    return ()=>observer.disconnect();
  },[phase]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if(raw) {
        const saved = JSON.parse(raw) as SaveState;
        if(saved && saved.phase==="playing" && Number.isFinite(saved.seconds) && saved.room>=0 && saved.room<=3) {
          window.queueMicrotask(() => {
            setPhase(saved.phase); setRoom(saved.room); setSeconds(saved.seconds);
            if(saved.difficulty==="story" || saved.difficulty==="nightmare") setDifficulty(saved.difficulty);
            setHints(saved.hints); setMistakes(saved.mistakes); setPuzzles(saved.puzzles); setExploration(saved.exploration??EMPTY_EXPLORATION);
            setPaused(true);
          });
        }
      }
    } catch { /* saved game unavailable */ }
    try {
      const rawRecord=window.localStorage.getItem(RECORD_KEY);
      if(rawRecord) {
        const data=JSON.parse(rawRecord) as Partial<Record<Difficulty,number>>;
        window.queueMicrotask(()=>setRecords({story:Number(data.story)||0,nightmare:Number(data.nightmare)||0}));
      }
    } catch { /* records are optional */ }
    window.queueMicrotask(() => setReady(true));
  }, []);
  useEffect(() => {
    if(!ready) return;
    try {
      if(phase!=="playing") window.localStorage.removeItem(SAVE_KEY);
      else window.localStorage.setItem(SAVE_KEY, JSON.stringify({ phase, room, seconds, hints, mistakes, puzzles, difficulty, exploration } satisfies SaveState));
    } catch { /* private browsing can restrict storage */ }
  }, [ready, phase, room, seconds, hints, mistakes, puzzles, difficulty, exploration]);
  useEffect(() => {
    if(phase!=="playing" || paused || cinematicPause) {
      deadlineRef.current=null;
      return;
    }
    const deadline=Date.now()+seconds*1000;
    deadlineRef.current=deadline;
    const tick=()=>setSeconds(Math.max(0,Math.ceil((deadline-Date.now())/1000)));
    const timer=window.setInterval(tick,250);
    const synchronize=()=>{if(!document.hidden) tick();};
    window.addEventListener("focus",synchronize);
    document.addEventListener("visibilitychange",synchronize);
    return ()=>{
      window.clearInterval(timer);
      window.removeEventListener("focus",synchronize);
      document.removeEventListener("visibilitychange",synchronize);
    };
    // A single deadline, not 1500 naive setInterval ticks, avoids background-tab time drift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, cinematicPause]);
  useEffect(() => {
    if(phase!=="playing" || seconds!==0) return;
    const timeout=window.setTimeout(()=>{finishAdaptiveScore("lost");playHorror("door",{pan:0,intensity:.55});setPhase("lost");setPaused(false);setModal(null);},0);
    return ()=>window.clearTimeout(timeout);
  },[seconds,phase]);
  useEffect(() => {
    if(!toast) return;
    const timer=window.setTimeout(()=>setToast(""),3200);
    return ()=>window.clearTimeout(timer);
  },[toast]);

  useEffect(() => {
    if(phase!=="playing" || paused || modal || cinematicPause || scareStage!=="off" || transitioning) return;
    // The visual storm never interrupts letters, apparition or an active blackout.
    const interval=window.setInterval(()=>{
      if(Math.random()>.56){
        playHorror("creak",{pan:Math.random()>.5?.68:-.68});
        setStorm(true);
        window.setTimeout(()=>setStorm(false),430);
      }
    }, 8700);
    return ()=>window.clearInterval(interval);
  },[phase,paused,modal,cinematicPause,scareStage,transitioning]);

  // Low-intensity room foley: movement far from the player, then silence.
  // Never play over dialogue, clues, the film or the blackout.
  useEffect(()=>{
    if(phase!=="playing" || paused || modal || scareStage!=="off" || !sound || !cinematicScares)return;
    const foley=window.setInterval(()=>{
      if(room===3) playHorror("electric",{pan:-.7,intensity:.28});
      else if(room===2 && Math.random()>.33)playHorror("footsteps",{pan:.75,intensity:.42});
      else if(room===1)playHorror("creak",{pan:-.75,intensity:.34});
      else if(Math.random()>.58)playHorror("footsteps",{pan:-.65,intensity:.4});
    },18700);
    return ()=>window.clearInterval(foley);
  },[phase,paused,modal,scareStage,room,sound,cinematicScares]);

  useEffect(()=>{
    updateAdaptiveScore({remaining:seconds,room,active:phase==="playing"&&!paused&&!transitioning,silent:!sound||!musicEnabled,duck:scoreDuck});
  },[seconds,room,phase,paused,transitioning,sound,musicEnabled,scoreDuck]);
  useEffect(()=>()=>stopAdaptiveScore(),[]);

  const lateDanger=seconds<=300, finalDanger=seconds<=60;
  useEffect(()=>{
    if(phase!=="playing" || paused || cinematicPause || !sound || !lateDanger)return;
    const id=window.setInterval(()=>playHorror("heartbeat",{pan:-.12,intensity:.18}),finalDanger?6000:11500);
    return ()=>window.clearInterval(id);
  },[phase,paused,cinematicPause,sound,finalDanger,lateDanger]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent)=>{
      if(event.key==="Escape" && modal && modal!=="finale") setModal(null);
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[modal]);

  useEffect(()=>{
    // One quiet diegetic room bed per scene, routed through the same mute-aware
    // mixer as the procedural score and recorded foley. Avoid opening a second
    // AudioContext or leaking rumble while the player pauses or reads evidence.
    if(phase==="playing" && !paused && !cinematicPause && !transitioning && !modal && sound)startRoomTone(room);
    else stopRoomTone();
    return stopRoomTone;
  },[phase,paused,room,sound,cinematicPause,transitioning,modal]);

  useEffect(() => {
    if(phase!=="playing" || paused || room!==2 || modal || scareStage!=="off" || transitioning) return;
    let vanish: number | undefined;
    const appear = window.setTimeout(() => {
      setApparition(true);
      setToast("Por un instante, alguien estuvo de pie junto a la ventana.");
      vanish = window.setTimeout(() => setApparition(false), 1500);
    }, 12000);
    return () => {
      window.clearTimeout(appear);
      if(vanish!==undefined) window.clearTimeout(vanish);
    };
  }, [phase, paused, room, modal, scareStage, transitioning]);

  useEffect(()=>{
    if(modal==="doll") return;
    if(typeof window!=="undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    window.queueMicrotask(()=>setDollSpeaking(false));
  },[modal]);

  function whisperEva(phrase = "No apagues la música. Todavía estoy acá."){
    if(!sound){message("Activá el sonido si querés escuchar a Eva. Su mensaje también está subtitulado.");return;}
    if(typeof window==="undefined" || !("speechSynthesis" in window)){
      message("La voz no está disponible en este navegador. Podés leer el mensaje debajo.");return;
    }
    try{
      const synth=window.speechSynthesis;
      synth.cancel();
      const utterance=new SpeechSynthesisUtterance(phrase);
      const voices=synth.getVoices();
      const voice=voices.find(v=>v.lang.toLowerCase().startsWith("es-ar"))||voices.find(v=>v.lang.toLowerCase().startsWith("es"));
      if(voice) utterance.voice=voice;
      utterance.lang=voice?.lang||"es-AR";
      utterance.rate=0.76;utterance.pitch=0.88;utterance.volume=0.67;
      utterance.onstart=()=>setDollSpeaking(true);
      utterance.onend=()=>setDollSpeaking(false);
      utterance.onerror=()=>setDollSpeaking(false);
      setDollSpeaking(true);
      synth.speak(utterance);
    }catch{message("No se pudo reproducir la voz. Los subtítulos siguen disponibles.");setDollSpeaking(false);}
  }

  function sfx(kind: "click" | "success" | "error" | "step" | "tone" = "click", pitch = 440) {
    if(typeof window==="undefined") return;
    if(kind==="error" || kind==="success") {
      if(typeof navigator!=="undefined" && navigator.vibrate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        navigator.vibrate(kind==="error"?[35,45,35]:[16,22,20]);
      }
      setJolt(true);
      window.setTimeout(()=>setJolt(false),360);
    }
    if(sound) playInterfaceCue(kind,pitch);
  }
  function message(t:string){setToast(t);}
  function begin() {
    unlockHorrorAudio();
    setEntering(false);
    startAdaptiveScore({remaining:difficulty==="nightmare"?720:TOTAL,room:0,active:true,silent:!sound||!musicEnabled,duck:false});
    scareAlreadyPlayed.current=false;
    setScareStage("off");
    resumeHorrorAudio();
    if(typeof window!=="undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    deadlineRef.current=null;setDollSpeaking(false);setTransitioning(false);setFlashlight(false);setJolt(false);setRoom(0);setSeconds(difficulty==="nightmare"?12*60:TOTAL);setPuzzles(INITIAL);setExploration(EMPTY_EXPLORATION);setHints([0,0,0,0]);setMistakes(0);setPhase("playing");setPaused(false);setModal(null);setPin("");sfx("step");
  }
  function approachHouse() {
    if(entering) return;
    // Both the door sound and the Web Audio unlock belong to a real user tap.
    // The 25/12-minute countdown will not start until the cinematic finishes.
    unlockHorrorAudio();
    if(sound)playHorror("door",{pan:-.48,intensity:cinematicScares?.72:.31});
    setEntering(true);
  }
  function nextRoom() {
    if(transitioning) return;
    sfx("success");
    if(sound)playHorror("door",{pan:room%2===0?.65:-.7,intensity:cinematicScares?.78:.36});
    setModal(null);
    setTransitioning(true);
  }
  function finishRoomThreshold(){
    if(!transitioning) return;
    setRoom(v=>Math.min(3,v+1));
    setPin("");
    setTransitioning(false);
    setToast("CAPÍTULO DESBLOQUEADO · Escuchaste pasos detrás de vos.");
  }
  function portrait(i:number) {
    sfx();setPuzzles(p=>({...p,portraits:Array.from(new Set([...p.portraits,i]))}));setModal("portrait"+i);
  }
  function pinTry(){
    if(pin==="427"){nextRoom();}
    else {setMistakes(v=>v+1);setPin("");sfx("error");playHorror("knock",{pan:.7});message("La cerradura rechaza la combinación. Alguien golpea detrás de la puerta.");}
  }
  function candle(sym:string) {
    if(puzzles.studyOpen){message("El pasadizo ya está abierto.");return;}
    const sequence=[...puzzles.candles,sym],correct=["luna","llave","rosa"];
    if(sequence[sequence.length-1]!==correct[sequence.length-1]){
      setPuzzles(p=>({...p,candles:[]}));setMistakes(v=>v+1);sfx("error");playHorror("creak",{pan:-.8});message("Las tres llamas se apagan al mismo tiempo.");return;
    }
    setPuzzles(p=>({...p,candles:sequence,studyOpen:sequence.length===3}));
    sfx(sequence.length===3?"success":"tone",360+sequence.length*120);
    if(sequence.length===3)message("Algo se mueve detrás de los libros. Un pasadizo ha quedado abierto.");
    else message("La llama se eleva. La casa parece contener la respiración.");
  }
  function tune(note:string,pitch:number){
    const seq=[...puzzles.melody,note],correct=["sol","mi","la","sol"];
    sfx("tone",pitch);
    if(seq[seq.length-1]!==correct[seq.length-1]){
      setPuzzles(p=>({...p,melody:[]}));setMistakes(v=>v+1);playHorror("creak",{pan:.82});message("Una nota desafinada. La muñeca gira lentamente la cabeza.");return;
    }
    const solved=seq.length===4;
    setPuzzles(p=>({...p,melody:seq,nurseryOpen:solved}));
    if(solved){setModal("musicSolved");sfx("success");message("La caja se abre. Debajo hay una carta con el nombre de EVA.");}
  }
  function fuse(n:number){
    setPuzzles(p=>({...p,fuses:p.fuses.includes(n)?p.fuses.filter(v=>v!==n):[...p.fuses,n],power:false}));sfx();
  }
  function lever(){
    if(puzzles.fuses.length===2 && puzzles.fuses.reduce((a,b)=>a+b,0)===7){
      setPuzzles(p=>({...p,power:true}));sfx("success");playHorror("electric",{pan:.1});setModal("finale");
    } else {setMistakes(v=>v+1);sfx("error");playHorror("electric",{pan:.3});message("Las luces estallan. DOS circuitos deben sumar exactamente SIETE.");}
  }
  function ending(choice:"save"|"escape"){
    finishAdaptiveScore("won");
    setPuzzles(p=>({...p,ending:choice}));sfx("success");setPhase("won");setModal(null);
  }
  function showHint(){
    const tier=Math.min(2,hints[room]);
    setHints(v=>v.map((n,i)=>i===room?Math.min(3,n+1):n));
    setModal("hint"+tier);sfx();
  }
  const totalHints=hints.reduce((a,b)=>a+b,0);
  const recoveredCount=puzzles.portraits.length+Number(puzzles.notesRead)+Number(puzzles.evaRead)+Number(puzzles.nurseryOpen)+Number(puzzles.keepsake)+Number(puzzles.power);
  const score=Math.max(100,Math.round(seconds*2+4000-(totalHints*240)-(mistakes*90)+(puzzles.keepsake?500:0)+(puzzles.ending==="save"?700:0)+(difficulty==="nightmare"?1600:0)+(recoveredCount===8?850:0)+(puzzles.clockWound?300:0)+(puzzles.mirrorRead?300:0)));
  const personalBest=records[difficulty]||0;
  const isNewRecord=phase==="won" && score>=personalBest;
  useEffect(()=>{
    if(!ready || phase!=="won" || score<=personalBest) return;
    const update={...records,[difficulty]:score};
    try{window.localStorage.setItem(RECORD_KEY,JSON.stringify(update));}catch{/*no persistent storage*/}
    window.queueMicrotask(()=>setRecords(update));
  },[ready,phase,score,personalBest,difficulty,records]);
  const hotspots:Spot[] = room===0?[
    ...PORTRAITS.map((p,i)=>({id:"portrait"+i,text:"Retrato de "+p.name,x:18+i*13.8,y:44,glyph:"✧",act:()=>portrait(i)})),
    {id:"clock",text:"Examinar reloj",x:11.7,y:61,glyph:"◷",act:()=>{sfx();setModal("clock");}},
    {id:"door",text:"Abrir cerradura",x:69.4,y:58,glyph:"⌑",act:()=>{sfx();setModal("pin");}},
  ]:room===1?[
    {id:"letter",text:"Leer nota",x:31,y:74,glyph:"✉",act:()=>{sfx();setPuzzles(p=>({...p,notesRead:true}));setModal("letter");}},
    {id:"luna",text:"Vela con la luna",x:42,y:61,glyph:"☾",act:()=>candle("luna")},
    {id:"llave",text:"Vela con la llave",x:55,y:61,glyph:"⚿",act:()=>candle("llave")},
    {id:"rosa",text:"Vela con la rosa",x:66.7,y:61,glyph:"✿",act:()=>candle("rosa")},
    {id:"studyexit",text:"Puerta secreta",x:87,y:56,glyph:"➜",active:puzzles.studyOpen,act:()=>puzzles.studyOpen?nextRoom():message("La piedra no se mueve. Tal vez las velas sostengan el mecanismo.")},
  ]:room===2?[
    {id:"scrap",text:"Leer carta",x:24,y:72,glyph:"✉",act:()=>{sfx();setPuzzles(p=>({...p,evaRead:true}));setModal("eva");}},
    {id:"box",text:"Tocar caja musical",x:55.7,y:56,glyph:"♫",act:()=>{sfx();setModal("music");}},
    {id:"keepsake",text:"Examinar muñeca",x:80,y:48,glyph:"✧",act:()=>{sfx();setPuzzles(p=>({...p,keepsake:true}));setModal("doll");}},
    {id:"mirror",text:"Limpiar espejo empañado",x:39,y:39,glyph:"◈",active:Boolean(puzzles.mirrorRead),act:()=>{sfx("step");setModal("mirror");}},
    ...(puzzles.nurseryOpen?[{id:"tape",text:"Cinta de Eva",x:51,y:70,glyph:"▷",act:()=>{sfx("step");setModal("tape");}}]:[]),
    {id:"nurseryexit",text:"Abrir puerta",x:88,y:78,glyph:"➜",active:puzzles.nurseryOpen,act:()=>puzzles.nurseryOpen?nextRoom():message("La cerradura vibra con una melodía que todavía no reconocés.")},
  ]:[
    {id:"memo",text:"Examinar instrucciones",x:14,y:43,glyph:"!",act:()=>{sfx();setModal("memo");}},
    ...[2,3,4,5].map((n,i)=>({id:"fuse"+n,text:"Fusible "+n,x:31.7+i*10.4,y:50,glyph:String(n),active:puzzles.fuses.includes(n),act:()=>fuse(n)})),
    {id:"lever",text:"Bajar palanca",x:83.6,y:57,glyph:"⏚",act:lever},
  ];
  const subtitle=["Algo detrás de esos retratos todavía observa.","Los libros saben más de lo que deberían.","Una caja musical lleva años sonando sola.","Solo la electricidad puede abrir la salida."][room];
  const chapterTaglines=["Todo comienza con una puerta cerrada.","Las pistas siempre estuvieron ahí.","Los recuerdos también esconden secretos.","La verdad siempre deja una salida."];
  const focusKind = modal?.startsWith("portrait") ? "portrait" : modal==="pin" ? "lock"
    : modal==="clock" || modal==="doll" || modal==="music" ? modal : null;
  const focusSpot = hotspots.find(spot=>spot.id === (focusKind==="portrait" ? modal : focusKind==="lock" ? "door" : focusKind==="music" ? "box" : focusKind==="doll" ? "keepsake" : focusKind));
  const focusYear = modal?.startsWith("portrait") ? String(PORTRAITS[Number(modal.replace("portrait",""))]?.year ?? "") : undefined;
  const focusPerson = modal?.startsWith("portrait") ? PORTRAITS[Number(modal.replace("portrait",""))]?.id : undefined;
  // Project interactive targets through the same viewBox math as the SVG, even
  // when its wide artwork is cropped to fill a portrait-sized phone.
  function spotPosition(spot:Spot) {
    const {width:w,height:h}=sceneSize;
    if(!w || !h) return {left:spot.x+"%",top:spot.y+"%"};
    const imageWidth=w<=800?Math.max(790,w):w;
    const scale=Math.max(imageWidth/1200,h/690);
    const left=(w-imageWidth)/2+(imageWidth-1200*scale)/2+12*spot.x*scale;
    const top=(h-690*scale)/2+6.9*spot.y*scale;
    return {left:left+"px",top:top+"px"};
  }

  return <main className={styles.root}>
    <div className={styles.noise} aria-hidden="true"/>
    <div className={styles.vignette} aria-hidden="true"/>
    {phase==="intro" ? <section className={styles.intro}>
      <div className={styles.brand}>VIRALIO <span>ESCAPE</span></div>
      <div className={styles.heroFog} aria-hidden="true"/>
      <div className={styles.introArt} aria-hidden="true"><div className={styles.gateFrame}><div className={styles.gate}><span>13</span><i/></div></div><div className={styles.introLight}/></div>
      <div className={styles.introContent}>
        <p className={styles.eyebrow}><span className={styles.liveDot}/> UNA EXPERIENCIA INTERACTIVA · CASO 013</p>
        <h1>UMBRAL<span>.</span></h1>
        <p className={styles.tagline}>LA CASA QUE RECUERDA</p>
        <p className={styles.story}>Hace diez años Eva desapareció en esta casa. Hoy recibiste una carta anónima. La puerta se cerró a tus espaldas. <strong>Tenés {difficulty==="nightmare"?"12":"25"} minutos</strong> para descubrir qué ocurrió con Eva. Pero hay algo que la casa nunca te contó: no todos los que escapan realmente salen.</p>
        <div className={styles.introSpecs}><span>◷ CONTRARRELOJ</span><span>✦ 4 CAPÍTULOS</span><span>◈ 2 FINALES</span></div>
        <fieldset className={styles.difficulty}><legend>ELEGÍ CUÁNTO SE ACERCA LA OSCURIDAD</legend><button type="button" aria-pressed={difficulty==="story"} className={difficulty==="story"?styles.selectedDifficulty:""} onClick={()=>setDifficulty("story")}><b>25 MIN</b><small>MODO HISTORIA</small></button><button type="button" aria-pressed={difficulty==="nightmare"} className={difficulty==="nightmare"?styles.selectedDifficulty:""} onClick={()=>setDifficulty("nightmare")}><b>12 MIN</b><small>MODO PESADILLA</small></button></fieldset>
        <button className={styles.primary} onClick={approachHouse} disabled={entering}>ENTRAR A LA CASA <span>↗</span></button>
        <div className={styles.introOptions} aria-label="Preferencias de la experiencia">
          <button className={styles.soundIntro} onClick={()=>setSound(v=>!v)} aria-pressed={sound}>{sound?"◉ SONIDO ACTIVADO":"◎ JUGAR SIN SONIDO"}</button>
          <button className={styles.scoreChoice} type="button" aria-pressed={musicEnabled} onClick={()=>setMusicEnabled(v=>!v)}>{musicEnabled?"♫ BANDA SONORA DINÁMICA ACTIVADA":"♫ BANDA SONORA DESACTIVADA"}</button>
          <button className={styles.scareChoice} type="button" aria-pressed={cinematicScares} onClick={()=>setCinematicScares(v=>!v)}>{cinematicScares?"◉ EXPERIENCIA DE TERROR CINEMATOGRÁFICO":"◎ TERROR SUAVE · SIN APAGONES"}</button>
        </div>
        <p className={styles.introFine}>Auriculares recomendados · Jugable en celular y computadora · Sin descargas</p>
      </div>
      {entering&&<ThresholdSequence toRoom={0} arrival onComplete={begin}/>}
      <div className={styles.chapterRail} aria-label="Las cuatro habitaciones del escape room">{ROOM_NAMES.map((name,i)=><div key={name} className={styles.chapterCard} style={{backgroundImage:`linear-gradient(180deg,transparent 40%,rgba(0,0,0,.92) 100%),image-set(url("/escape/images/room-${i}.webp") 1x,url("/escape/images/retina/room-${i}.webp") 2x)`}}><span className={styles.chapterNumber}>{i+1}</span><div><strong>{name}</strong><small>{chapterTaglines[i]}</small></div></div>)}</div>
    </section> : phase==="playing" ? <>
      <header className={styles.hud}>
        <div className={styles.identity}><div className={styles.monogram}>U<span>.</span></div><div><strong>UMBRAL</strong><small>{difficulty==="nightmare"?"MODO PESADILLA":"EXPEDIENTE 013"}</small></div></div>
        <div className={styles.hudCenter}><span>CAPÍTULO {String(room+1).padStart(2,"0")}/04</span><strong>{ROOM_NAMES[room]}</strong></div>
        <div className={styles.hudRight}><div className={seconds<=300?styles.timerDanger:styles.timer}><small>{seconds<=60?"NO QUEDA TIEMPO":"TIEMPO RESTANTE"}</small><strong className={seconds<=10?styles.timerFinal:""}>{fmt(seconds)}</strong><em className={styles.tensionTitle} data-tier={scoreTier}>{TENSION_TITLES[scoreTier]}</em></div><button className={styles.iconButton} onClick={()=>{sfx();setPaused(true);}} aria-label="Pausar partida">Ⅱ</button></div>
      </header>
      <section id="umbral-playfield" className={styles.playfield+" "+(flashlight?styles.torchOn:"")+" "+(jolt?styles.jolt:"")+" "+(seconds<=300?styles.lastMinutes:"")} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;e.currentTarget.style.setProperty("--torch-x",(x*100)+"%");e.currentTarget.style.setProperty("--torch-y",(y*100)+"%");if(e.pointerType==="mouse"){e.currentTarget.style.setProperty("--parallax-x",(-1*(x-.5)*8)+"px");e.currentTarget.style.setProperty("--parallax-y",(-1*(y-.5)*8)+"px");}}}>
        <div className={styles.roomArt}>
          <div className={styles.cinematicRoom} data-room={room} style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.25),rgba(2,5,8,.02) 35%,rgba(0,0,0,.14)),image-set(url("/escape/images/room-${room}.webp") 1x,url("/escape/images/retina/room-${room}.webp") 2x)`}} aria-hidden="true"/>
          <SceneArt room={room} power={puzzles.power} candles={puzzles.candles} studyOpen={puzzles.studyOpen} nurseryOpen={puzzles.nurseryOpen} fuses={puzzles.fuses}/>
          <div className={styles.dust} aria-hidden="true"/><div className={styles.fog} aria-hidden="true"/><div className={styles.lightning+" "+(storm?styles.stormOn:"")} aria-hidden="true"/>
          {room===2 && apparition && <div className={styles.apparition} aria-hidden="true"><i/><i/></div>}
          <div className={styles.shade} aria-hidden="true"/>
          <CinematicAtmosphere room={room} powered={puzzles.power} paused={paused || transitioning || Boolean(modal)} />
        </div>
        <div className={styles.torch} aria-hidden="true"/><div className={styles.sceneTitle}><span>0{room+1} / REGISTRO ENCONTRADO</span><h2>{ROOM_NAMES[room]}</h2><p>{subtitle}</p></div>
        {hotspots.map((spot)=><button key={spot.id} className={styles.hotspot+" "+(spot.active?styles.hotspotActive:"")} disabled={transitioning} style={spotPosition(spot)} onClick={spot.act} aria-label={spot.text} title={spot.text}><span>{spot.glyph}</span><small>{spot.text}</small></button>)}
        {!paused && !modal && !transitioning && scareStage==="off" && <HouseListening
          key={room}
          room={room}
          solved={room===0?Boolean(puzzles.clockWound):room===1?puzzles.studyOpen:room===2?puzzles.nurseryOpen:puzzles.power}
          dangerous={seconds<=300}
          onStart={()=>{
            if(sound) playHorror(room===3?"electric":"creak",{pan:room%2===0?-.7:.65,intensity:cinematicScares?.24:.13});
          }}
          onReveal={()=>{
            if(sound) {
              const cue = (["knock","footsteps","heartbeat","electric"] as const)[room] ?? "knock";
              playHorror(cue,{pan:room%2===0?.85:-.82,intensity:cinematicScares?.46:.19});
            }
            if(typeof navigator!=="undefined" && navigator.vibrate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              navigator.vibrate([13,58,18]);
            }
          }}
        />}

        <button type="button" className={styles.exploreSceneButton} data-testid="umbral-explore-launch" onClick={()=>{sfx("step");setModal("explore");}}>⌖ RECORRER LA ESCENA <span>12 OBJETOS POR ZONAS</span></button>
        <button className={styles.caseButton} onClick={()=>{sfx("click");setModal("journal");}} aria-label={"Abrir expediente. "+recoveredCount+" pruebas encontradas de 8"}>▤ EXPEDIENTE <span>{recoveredCount}/8</span></button>
        <div className={styles.roomProgress}><span>INVESTIGACIÓN</span><div>{ROOM_NAMES.map((n,i)=><i key={n} className={i<=room?styles.done:""}/>)}</div></div>
        <div className={styles.flicker} aria-hidden="true"/>
      </section>
      <nav className={styles.mobileInteract} aria-label="Objetos para investigar">
        <span>OBJETOS PARA INVESTIGAR · {String(hotspots.length).padStart(2,"0")}</span>
        <div>{hotspots.map(spot=><button type="button" key={spot.id} onClick={spot.act} disabled={transitioning} aria-pressed={spot.active ? true : undefined}><b aria-hidden="true">{spot.glyph}</b>{spot.text}</button>)}</div>
      </nav>
      <button type="button" className={styles.exploreMobileButton} onClick={()=>{sfx("step");setModal("explore");}} aria-label="Recorrer habitación y manipular objetos">⌖ EXPLORAR LA HABITACIÓN <span>12 OBJETOS · 3 ZONAS · INVENTARIO →</span></button>
      <div className={styles.bottomBar}>
        <div className={styles.bottomIntro}><span className={styles.pulseCircle}>✧</span><div><strong>TOCÁ LOS OBJETOS PARA INVESTIGAR</strong><small>Las pistas están en la habitación. No hay objetos decorativos marcados.</small></div></div>
        <div className={styles.bottomActions}><button onClick={showHint}>◇ PEDIR PISTA <span>{hints[room]}/3</span></button><button onClick={()=>{setPaused(true);sfx();}}>Ⅱ PAUSAR</button><button onClick={()=>setFlashlight(v=>!v)} aria-pressed={flashlight}>{flashlight?"◉ APAGAR LUZ":"☼ LINTERNA"}</button><button onClick={()=>setMusicEnabled(v=>!v)} aria-label={musicEnabled?"Silenciar música":"Activar música"} aria-pressed={musicEnabled}>{musicEnabled?"♫ MÚSICA":"♫ SIN MÚSICA"}</button><button onClick={()=>setSound(v=>!v)} aria-label={sound?"Silenciar":"Activar sonido"}>{sound?"◉ SONIDO":"◎ MUDO"}</button></div>
      </div>
      {seconds<=10 && seconds>0 && !paused && !cinematicPause && <div className={styles.finalCountdown} aria-label={"Quedan "+seconds+" segundos"}><span>EL UMBRAL SE CIERRA</span><strong>{seconds}</strong></div>}
      {scareStage!=="off"&&<div className={styles.blackoutCurtain+" "+(scareStage==="reveal"?styles.blackoutReveal:"")} role="dialog" aria-label="Apagón inesperado en la casa" aria-modal="true" aria-live="off">
        <div className={styles.blackoutDark} aria-hidden="true"/>
        <div className={styles.blackoutPresence} aria-hidden="true"/>
        <div className={styles.blackoutWhisper}>NO APAGUES LA MÚSICA.</div>
        <div className={styles.blackoutPulse} aria-hidden="true"/>
        <button className={styles.blackoutSkip} onClick={skipScare}>OMITIR SUSTO ↗</button>
      </div>}
      {transitioning&&<ThresholdSequence toRoom={Math.min(room+1,3)} arrival={false} onComplete={finishRoomThreshold}/>}
      {toast&&<div role="status" className={styles.toast}>{toast}</div>}
      {paused&&<div className={styles.overlay}><div className={styles.pauseCard}><span className={styles.eyebrow}>EXPEDIENTE EN ESPERA</span><h2>Hasta la casa guarda silencio.</h2><p>El cronómetro se detuvo. Tus descubrimientos están guardados en este navegador.</p><button className={styles.primary} onClick={()=>{unlockHorrorAudio();resumeAdaptiveScore({remaining:seconds,room,active:true,silent:!sound||!musicEnabled,duck:scoreDuck});setPaused(false);sfx("step");}}>SEGUIR INVESTIGANDO →</button><button className={styles.ghost} onClick={()=>{stopAdaptiveScore();setPaused(false);setPhase("intro");setModal(null);}}>ABANDONAR LA PARTIDA</button></div></div>}
      {modal&&!paused&&<div className={styles.overlay+" "+(focusKind?styles.focusOverlay:"")} onMouseDown={e=>{if(e.target===e.currentTarget || (focusKind && e.target instanceof Element && e.target.closest("[data-focus-object]")))setModal(null);}}>
        {focusKind&&<DiegeticFocus room={room} kind={focusKind} mark={focusYear} character={focusPerson} origin={focusSpot?{x:focusSpot.x,y:focusSpot.y}:undefined}/>}
        {modal==="explore"?<RoomExplorer room={room} state={exploration} onChange={setExploration} onClose={()=>setModal(null)} onSound={success=>sfx(success?"success":"step")}/>:<section role="dialog" aria-modal="true" aria-label={modal==="journal"?"Expediente de Eva":modal==="pin"?"Candado numérico":"Objeto investigado"} className={styles.dialog+" "+(focusKind?styles.focusDialog:"")+" "+(modal==="journal"?styles.journalDialog:modal==="mirror"?styles.mirrorDialog:modal==="pin"?styles.pinDialog:modal==="clock"?styles.clockDialog:modal==="letter"||modal==="eva"?styles.letterDialog:modal==="tape"?styles.memoryDialog:"")}>
          <button className={styles.close} onClick={()=>setModal(null)} aria-label="Cerrar">✕</button>
          {modal!=="journal" && modal!=="tape" && modal!=="mirror" &&<span className={styles.eyebrow}>◈ OBJETO INVESTIGADO</span>}
          {modal==="tape"&&<EvaMemory onClose={()=>setModal(null)}/>}
          {modal==="journal"&&<EvidenceArchive portraits={puzzles.portraits} notesRead={puzzles.notesRead} evaRead={puzzles.evaRead||false} nurseryOpen={puzzles.nurseryOpen} keepsake={puzzles.keepsake} power={puzzles.power} mirrorRead={Boolean(puzzles.mirrorRead)}/>}
          {modal.startsWith("portrait")&&(()=>{const p=PORTRAITS[Number(modal.replace("portrait",""))];return <><Artefact kind="portrait" character={p.id} mark={String(p.year)}/><h2>{p.name}</h2><p>{p.text}</p><div className={styles.evidence}><span>AÑO DEL RETRATO</span><strong>{p.year}</strong><span>MARCA</span><strong>{p.mark}</strong></div></>})()}
          {modal==="clock"&&<div className={styles.clockLayout}><div className={styles.clockStory}><Artefact kind="clock"/><h2>El reloj detenido</h2><p>La aguja quedó inmóvil en las 03:13. Debajo del péndulo hay un mecanismo que todavía puede girar.</p><span className={styles.clockAside}>FABRICANTE: J. VÉLEZ · AÑO 1891<br/>CERRADO POR EL TIEMPO, NO POR UNA LLAVE.</span></div><ClockMechanism solved={Boolean(puzzles.clockWound)} onSolve={()=>{setPuzzles(p=>({...p,clockWound:true}));sfx("success");playHorror("creak",{pan:-.27});message("Desbloqueaste el grabado oculto del reloj. +300 puntos de investigación.");}}/></div>}
          {modal==="pin"&&<div className={styles.pinLayout}>
            <div className={styles.pinDescription}><Artefact kind="lock"/><h2>Una cerradura sin llave</h2><p>Tres cifras. Escuchás tres golpes del otro lado. Cada vez más cerca.</p></div>
            <LockTumblers code={pin} onChange={setPin} onConfirm={pinTry} onTick={()=>sfx("click")}/>
            <details className={styles.keypadAlternative}>
              <summary>⌨ USAR TECLADO NUMÉRICO · ALTERNATIVA</summary>
              <div className={styles.code}><input inputMode="numeric" maxLength={3} autoComplete="off" aria-label="Código de tres cifras" placeholder="— — —" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,3))} onKeyDown={e=>{if(e.key==="Enter")pinTry();}}/><button onClick={pinTry} disabled={pin.length!==3}>DESBLOQUEAR ↗</button></div>
              <div className={styles.keypad} aria-label="Teclado numérico alternativo de la cerradura">{[1,2,3,4,5,6,7,8,9,"⌫",0,"↵"].map(key=><button key={key} type="button" aria-label={key==="⌫"?"Borrar último dígito":key==="↵"?"Confirmar código":"Ingresar "+key} disabled={key==="↵"&&pin.length!==3} onClick={()=>{sfx("click");if(key==="⌫")setPin(v=>v.slice(0,-1));else if(key==="↵")pinTry();else setPin(v=>(v+key).slice(0,3));}}>{key}</button>)}</div>
            </details>
          </div>}
          {modal==="mirror"&&<EvaMirror revealed={Boolean(puzzles.mirrorRead)} onReveal={()=>{setPuzzles(p=>({...p,mirrorRead:true}));sfx("success");if(sound)playHorror("creak",{pan:.38,intensity:.25});message("Una frase apareció bajo el vaho: NO ME DEJES ATRÁS.");}}/>}
          {modal==="letter"&&<><h2>Una nota entre cenizas</h2><p>Un papel doblado entre las páginas. La caligrafía tiembla: es la letra de Eva. Hay algo escrito del otro lado.</p><PhysicalLetter kind="study"/></>}
          {modal==="eva"&&<><h2>Para quien todavía escucha</h2><p>Eva dejó una carta junto a sus juguetes. Algunas palabras están escritas con otra tinta. Dale vuelta para encontrar el resto.</p><PhysicalLetter kind="eva"/></>}
          {modal==="music"&&<><Artefact kind="music"/><h2>La caja musical</h2><p>Los mecanismos están intactos. Tocá las teclas para reconstruir la canción.</p><div className={styles.notes}>{[["DO",261.63],["RE",293.66],["MI",329.63],["FA",349.23],["SOL",392],["LA",440]].map(([note,freq])=><button key={note} onClick={()=>tune(String(note).toLowerCase(),Number(freq))}>{note}</button>)}</div><div className={styles.sequence}>SECUENCIA {puzzles.melody.map(()=> "◆").join("  ")} {puzzles.melody.length<4?"◇  ".repeat(4-puzzles.melody.length):""}</div></>}
          {modal==="musicSolved"&&<><Artefact kind="portrait" character="eva" mark="FOTO 013"/><h2>La canción de Eva</h2><p>La caja se abre por primera vez en décadas. Adentro hay una pequeña fotografía de Eva, sonriente. En el reverso:</p><blockquote>«No abras la puerta sin encender primero el corazón de la casa».</blockquote><div className={styles.discoveryActions}><button className={styles.primary} onClick={()=>{sfx("step");setModal("tape");}}>▶ REPRODUCIR CINTA 013</button><button className={styles.ghost} onClick={()=>setModal(null)}>GUARDAR LA FOTOGRAFÍA</button></div></>}
          {modal==="doll"&&<><Artefact kind="doll" speaking={dollSpeaking}/><h2>La muñeca de Eva</h2><p>En el vestido hay una costura con forma de corazón. Encontraste una medalla grabada: «NUNCA DEJES A NADIE ATRÁS».</p><blockquote>«No apagues la música. Todavía estoy acá.»</blockquote><button className={styles.whisperButton} type="button" onClick={()=>whisperEva()}>{dollSpeaking?"◉ EVA ESTÁ HABLANDO…":"◉ ESCUCHAR A LA MUÑECA"}</button><p className={styles.good}>RECUERDO OPCIONAL RECUPERADO · +500 PUNTOS</p></>}
          {modal==="memo"&&<><Artefact kind="circuit"/><h2>Manual de emergencia</h2><p>Una placa oxidada explica cómo alimentar el mecanismo:</p><blockquote>«El motor exige exactamente DOS circuitos activos. Su energía combinada debe ser SIETE. No tolera el exceso».</blockquote><p>Los fusibles tienen valores individuales: 2, 3, 4 y 5.</p></>}
          {modal==="finale"&&<><Artefact kind="door"/><h2>La última decisión</h2><p>La energía vuelve. Una salida se abre y oís una voz infantil desde el otro lado del muro.</p><blockquote>«¿Me vas a dejar acá otra vez?»</blockquote><p>Podés escapar mientras hay tiempo o volver por Eva. Una elección cambia cómo termina el expediente.</p>{puzzles.keepsake&&<p className={styles.good}>La medalla que recuperaste empieza a calentarse en tu mano. Eva reconoce su antiguo recuerdo.</p>}<div className={styles.choices}><button onClick={()=>ending("save")}>VOLVER POR EVA <span>✦</span></button><button onClick={()=>ending("escape")}>CORRER HACIA LA SALIDA <span>↗</span></button></div></>}
          {modal.startsWith("hint")&&<><Artefact kind="signal"/><h2>Una señal en la oscuridad</h2><p>{CLUES[room][Number(modal.replace("hint",""))]}</p><p className={styles.hintCost}>Usar pistas reduce la puntuación final, pero nunca bloquea tu escape.</p></>}
        </section>}
      </div>}
    </> : <section className={styles.ending+" "+(phase==="lost"?styles.endingLost:"")}>
      <p className={styles.eyebrow}>{phase==="won"?"EXPEDIENTE CERRADO":"ARCHIVO INTERRUMPIDO"} · {difficulty==="nightmare"?"PESADILLA":"HISTORIA"}</p>
      <div className={styles.endingGlyph}>{phase==="won"?"✦":"◷"}</div>
      <h1>{phase==="won"?(puzzles.ending==="save"?"No escapaste solo.":"Saliste. Pero ella sigue ahí."):"La casa te recordó."}</h1>
      <p>{phase==="won"?(puzzles.ending==="save"?"Encontraste a Eva detrás del último muro. Al cruzar juntos el umbral, la casa quedó en silencio por primera vez.":"Cruzaste el portón antes de que el reloj se detuviera. Afuera, el viento dice tu nombre. Todavía tenés la medalla en la mano."):"El último minuto se consumió. El reloj acaba de empezar de nuevo... y un retrato nuevo apareció en el vestíbulo."}</p>
      {phase==="won"&&puzzles.clockWound&&<p className={styles.clockAchievement}>✦ MECANISMO RESTAURADO · +300 PUNTOS · Descubriste lo que ocultaba el reloj.</p>}
      {phase==="won"&&recoveredCount===8&&<div className={styles.perfectEvidence}><strong>ARCHIVO COMPLETO · 8/8</strong><span>Encontraste todos los recuerdos. Ahora sabés por qué Eva no podía abandonar la casa.</span></div>}
      <div className={styles.stats}><div><span>TIEMPO</span><strong>{fmt(seconds)}</strong></div><div><span>PISTAS</span><strong>{totalHints}</strong></div><div><span>ERRORES</span><strong>{mistakes}</strong></div>{phase==="won"&&<div><span>PUNTUACIÓN</span><strong>{score.toLocaleString("es-AR")}</strong></div>}</div>
      {phase==="won"&&<p className={styles.personalRecord}>{isNewRecord?"✦ NUEVO RÉCORD PERSONAL":"TU MEJOR PUNTUACIÓN"} · {Math.max(score,personalBest).toLocaleString("es-AR")} PUNTOS</p>}
      {phase==="won"&&puzzles.ending==="save"&&<section className={styles.evaEpilogue} aria-label="Último mensaje de Eva"><span className={styles.eyebrow}>ÚLTIMO REGISTRO · EVA</span><p>«Gracias por volver. Ahora sí podemos irnos.»</p><button onClick={()=>whisperEva("Gracias por volver. Ahora sí podemos irnos.")} aria-label="Escuchar el agradecimiento de Eva">◉ ESCUCHAR SU ÚLTIMA VOZ</button></section>}
      <button className={styles.primary} onClick={begin}>VOLVER A ENTRAR ↻</button>
      <button className={styles.ghost} onClick={()=>{stopAdaptiveScore();setPhase("intro");}}>CAMBIAR EL DESAFÍO</button>
      <button className={styles.ghost} onClick={()=>{const txt="Sobreviví a UMBRAL: La casa que recuerda. "+(phase==="won"?"Conseguí "+score+" puntos. ":"")+"¿Te animás a entrar? https://viralio.net/escape";if(navigator.share)void navigator.share({title:"UMBRAL",text:txt,url:"https://viralio.net/escape"}).catch(()=>{});else if(navigator.clipboard)void navigator.clipboard.writeText(txt).then(()=>message("Enlace copiado")).catch(()=>{});}}>COMPARTIR EL DESAFÍO ↗</button>
      {toast&&<div className={styles.toast}>{toast}</div>}
    </section>}
    <div className={styles.copyright}>UMBRAL · UNA HISTORIA ORIGINAL · © 2026</div>
  </main>;
}
