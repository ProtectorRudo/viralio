"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter, GameAction } from "./FootballWorld";
import { verifyFootballPuzzle, canEnterCorridor, canEnterTunnel, canFinish, FRAGMENT_ORDER, FINAL_STAMPS } from "./rules";
import TacticalReplay from "./TacticalReplay";
import MagneticTactics from "./MagneticTactics";
import "./game.css";

type Puzzle = "monitores" | "pizarra" | "informe" | "casillero" | "relay" | "cctv" | "prueba";
type Solved = Record<Puzzle, boolean>;
type Mode = "intro" | "playing" | "finale" | "victory" | "defeat" | "unsupported";
const EMPTY: Solved = {monitores:false,pizarra:false,informe:false,casillero:false,relay:false,cctv:false,prueba:false};
const titles = ["CABINA DE ANÁLISIS","CORREDOR RESTRINGIDO","TÚNEL DE LA FINAL"] as const;
const stories=[
 {time:90,text:"RADIO / El entrenador pidió el informe. Tenemos 13 minutos.",tone:"alert"},
 {time:180,text:"TRANSMISIÓN INTERVENIDA · Una cámara acaba de perder la señal.",tone:"danger"},
 {time:270,text:"SEGURIDAD / Se escucharon pasos detrás de los armarios.",tone:"alert"},
 {time:360,text:"¡LA TRIBUNA GRITA! El reloj no se detiene por vos.",tone:"danger"},
 {time:475,text:"ALERTA / El saboteador intenta borrar el expediente.",tone:"danger"},
 {time:590,text:"RADIO / El técnico se acercó al túnel. Necesita el informe YA.",tone:"alert"},
 {time:710,text:"SE ANUNCIA TIEMPO AÑADIDO. La última oportunidad se acerca.",tone:"danger"},
 {time:780,text:"ÚLTIMOS DOS MINUTOS · Corré hacia el entrenador.",tone:"danger"},
 {time:845,text:"45 SEGUNDOS · ENTREGÁ EL INFORME AHORA.",tone:"danger"}
] as const;

function TacticalPitch({kind}:{kind:"video"|"board"|"final"}){
 return <div className={"lj-pitch lj-pitch-"+kind} aria-hidden="true">
   <div className="lj-pitch-center"/>
   <div className="lj-pitch-box lj-pitch-box-left"/><div className="lj-pitch-box lj-pitch-box-right"/>
   <span className="lj-player lj-blue lj-p1">7</span><span className="lj-player lj-blue lj-p2">10</span>
   <span className="lj-player lj-blue lj-p3">9</span>
   <span className="lj-player lj-white lj-e1">4</span><span className="lj-player lj-white lj-e2">5</span>
   <span className="lj-player lj-white lj-e3">6</span><span className="lj-ball">⚽</span>
   <span className="lj-route">↗</span>
 </div>;
}
class StadiumAudio {
 ctx:AudioContext|null=null;
 noise:AudioBufferSourceNode|null=null;
 gain:GainNode|null=null;
 panner:PannerNode|null=null;
 start(){
  try{
   const ctx=new AudioContext();this.ctx=ctx;
   const len=ctx.sampleRate*2,b=ctx.createBuffer(1,len,ctx.sampleRate),data=b.getChannelData(0);
   let previous=0;
   for(let i=0;i<len;i++){previous=(previous+Math.random()*2-1)/1.014;data[i]=Math.max(-1,Math.min(1,previous*.045));}
   const noise=ctx.createBufferSource();noise.buffer=b;noise.loop=true;
   const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=790;
   const g=ctx.createGain();g.gain.value=.29;
   const pan=ctx.createPanner();pan.panningModel="HRTF";pan.distanceModel="inverse";pan.refDistance=23;pan.maxDistance=180;pan.rolloffFactor=.55;
   pan.positionX.value=0;pan.positionY.value=8;pan.positionZ.value=-38;this.panner=pan;
   noise.connect(filter);filter.connect(pan);pan.connect(g);g.connect(ctx.destination);
   noise.start();this.noise=noise;this.gain=g;
  }catch{}
 }
 pulse(f=490){
  if(!this.ctx)return;
  const c=this.ctx, o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(f*.55,c.currentTime+.24);
  g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.065,c.currentTime+.015);
  g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.35);
  o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.36);
 }
 position(x:number,y:number,z:number,yaw:number){
  if(!this.ctx)return;const t=this.ctx.currentTime,listener=this.ctx.listener;
  listener.positionX.setTargetAtTime(x,t,.04);listener.positionY.setTargetAtTime(y,t,.04);listener.positionZ.setTargetAtTime(z,t,.04);
  listener.forwardX.setTargetAtTime(-Math.sin(yaw),t,.04);listener.forwardY.setTargetAtTime(0,t,.04);listener.forwardZ.setTargetAtTime(-Math.cos(yaw),t,.04);
 }
 chapter(n:number){
  if(this.gain&&this.ctx)this.gain.gain.setTargetAtTime(n===2?.54:.22,this.ctx.currentTime,.5);
  this.pulse(n===2?680:390);
 }
 goal(){
  if(!this.ctx)return;
  const c=this.ctx;
  if(this.gain)this.gain.gain.setTargetAtTime(.88,c.currentTime,.16);
  for(let i=0;i<5;i++){
   const osc=c.createOscillator(),g=c.createGain();
   const at=c.currentTime+i*.19;
   osc.type="triangle";osc.frequency.value=[392,493.88,587.33,783.99,987.77][i];
   g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.038,at+.04);
   g.gain.exponentialRampToValueAtTime(.0001,at+.76);
   osc.connect(g);g.connect(c.destination);osc.start(at);osc.stop(at+.8);
  }
 }
 stop(){try{this.noise?.stop();void this.ctx?.close();}catch{}this.ctx=null;this.noise=null;this.gain=null;this.panner=null;}
}
function format(seconds:number){const s=Math.max(0,Math.floor(seconds));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
type FragmentPickup="pieza1"|"pieza2"|"pieza3"|"pieza4";
const pieces:readonly FragmentPickup[]=["pieza1","pieza2","pieza3","pieza4"];
const fragmentLabels:{id:FragmentPickup;title:string;hint:string}[]=[
 {id:"pieza1",title:"PLANO",hint:"Buscá el papel junto al escritorio"},
 {id:"pieza2",title:"SELLO",hint:"Revisá las carpetas del estante lateral"},
 {id:"pieza3",title:"RUTA",hint:"Inspeccioná el archivador del fondo"},
 {id:"pieza4",title:"FIRMA",hint:"El cuarto fragmento está cerca de la puerta"}
];
function targetAction(chapter:Chapter,s:Solved,found:readonly FragmentPickup[]):GameAction{
 if(chapter===0)return !s.monitores?"monitores":!s.pizarra?"pizarra":found.length<4?pieces.find(p=>!found.includes(p))! :!s.informe?"informe":"salida1";
 if(chapter===1)return !s.casillero?"casillero":!s.relay?"relay":!s.cctv?"cctv":"salida2";
 return !s.prueba?"prueba":"entrega";
}
function nextObjective(chapter:Chapter,s:Solved,found:readonly FragmentPickup[]){
 if(chapter===0){
  if(!s.monitores)return "Descubrí las tres diferencias entre las grabaciones.";
  if(!s.pizarra)return "Recomponé las posiciones de tres fichas en el tablero.";
  if(found.length<4)return "Encontrá los cuatro fragmentos del informe ("+found.length+"/4).";
  if(!s.informe)return "Ordená los cuatro fragmentos para reconstruir el informe.";
  return "Buscá la puerta al corredor de servicio.";
 }
 if(chapter===1){
  if(!s.casillero)return "Descifrá qué casillero contiene la llave y abrilo.";
  if(!s.relay)return "Repará la central uniendo los símbolos correctos.";
  if(!s.cctv)return "Identificá al intruso comparando dos capturas.";
  return "Accedé al túnel del estadio.";
 }
 return !s.prueba?"Uní las tres pistas y sellá el informe definitivo.":"Entregale el informe al entrenador antes del pitazo.";
}
function hintFor(chapter:Chapter,s:Solved,found:readonly FragmentPickup[],level:number){
 const hints=chapter===0?
  !s.monitores?["Pausá las tres cámaras en el mismo instante. Hay una pelota que salta, una que se duplica y una toma continua.","Revisá la cámara 1 cerca del segundo 5, la 3 cerca del segundo 6, y buscá la única secuencia sin trampas."]:
  !s.pizarra?["No hace falta saber fútbol. Compará el dibujo de referencia con la ubicación de los números 7, 10 y 9.","7 termina arriba a la derecha, 10 cerca del círculo derecho y 9 cerca del arco arriba."]:
  found.length<4?["Hay papeles pequeños repartidos por la sala, no todos están en la misma mesa.",fragmentLabels.find(p=>!found.includes(p.id))?.hint||"Ya tenés los cuatro fragmentos."]:
  !s.informe?["Cada hoja tiene un sello con un número del 1 al 4.","Ordená PLANO, SELLO, RUTA y FIRMA según los números impresos."]:
  ["La puerta está en el extremo derecho del muro de pantallas.","Acercate al portón SECTOR INTERNO."]:
 chapter===1?
  !s.casillero?["Combiná tres recuerdos de la primera sala: cámara auténtica, cantidad de hojas y dorsal de la ficha principal.","El código tiene tres cifras: 2 por la cámara, 4 por las hojas y 7 por la ficha. Buscá el casillero 04."]:
  !s.relay?["No necesitás conocer fútbol. Las placas de mantenimiento indican cuántas figuras hay de cada tipo.","En las placas hay 2 rayas rojas, 4 cuadros azules y 3 círculos verdes."]:
  !s.cctv?["Compará las dos capturas: el número se revela entre ambas.","Las capturas muestran 0_ y _9. Juntas forman 09."]:
  ["El túnel está al fondo del corredor.","Acercate a la puerta con el cartel TÚNEL DE CAMPO."]:
 !s.prueba?["Reconstruí los tres sellos que conseguiste y elegí el dibujo que coincide con tu tablero.","Los sellos se leen en orden: C2, 04, ROJO. Elegí la ruta que comienza por la derecha."]:
 ["El técnico espera en el propio túnel, lejos de la tribuna.","Acercate al técnico de pelo oscuro y tocá ENTREGAR."];
 return hints[Math.min(level,1)];
}
export default function LaUltimaJugada(){
 const [mode,setMode]=useState<Mode>("intro");
 const [worldReady,setWorldReady]=useState(false);
 const [chapter,setChapter]=useState<Chapter>(0);
 const [solved,setSolved]=useState<Solved>({...EMPTY});
 const solvedRef=useRef<Solved>({...EMPTY});
 const [time,setTime]=useState(900);
 const [modal,setModal]=useState<Puzzle|null>(null);
 const [briefing,setBriefing]=useState(false);
 const [found,setFound]=useState<FragmentPickup[]>([]);
 const foundRef=useRef<FragmentPickup[]>([]);
 const [differences,setDifferences]=useState<string[]>([]);
 const [fragmentOrder,setFragmentOrder]=useState<string[]>([]);
 const [locker,setLocker]=useState("01");
 const [lockerPin,setLockerPin]=useState("");
 const [finalSequence,setFinalSequence]=useState<string[]>([]);
 const timeDebt=useRef(0);
 const [mistakes,setMistakes]=useState(0);
 const [focus,setFocus]=useState("");
 const [alert,setAlert]=useState("");
 const [cinematic,setCinematic]=useState<""|"var"|"blackout"|"betrayal">("");
 const [finaleCue,setFinaleCue]=useState<"apertura"|"pase"|"centro"|"gol">("apertura");
 const [hintLevel,setHintLevel]=useState(-1);
 const [hintVisible,setHintVisible]=useState(false);
 const [isMuted,setIsMuted]=useState(false);
 const [selection,setSelection]=useState("C1");
 const [moves,setMoves]=useState<string[]>(["centro","banda izquierda","segundo palo"]);
 const [relays,setRelays]=useState<number[]>([1,1,1]);
 const [evidence,setEvidence]=useState("");
 const [confirm,setConfirm]=useState("");
 const canvas=useRef<HTMLCanvasElement>(null);
 const engine=useRef<import("./FootballWorld").FootballWorld|null>(null);
 const audio=useRef<StadiumAudio|null>(null);
 const startStamp=useRef(0);
 const announcements=useRef(new Set<number>());
 const crisisTriggered=useRef(false);
 const alertTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const cinematicTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const modeRef=useRef<Mode>("intro");
 const chapterRef=useRef<Chapter>(0);
 const isMutedRef=useRef(false);
 const notify=useCallback((msg:string)=>{
  if(alertTimeout.current)clearTimeout(alertTimeout.current);
  setAlert(msg);alertTimeout.current=setTimeout(()=>setAlert(""),5800);
  if(!isMutedRef.current)audio.current?.pulse();
 },[]);
 const advance=useCallback((id:Puzzle)=>{
  if(id==="monitores"||id==="relay"||id==="cctv"){
   if(cinematicTimeout.current)clearTimeout(cinematicTimeout.current);
   setCinematic(id==="monitores"?"var":id==="relay"?"blackout":"betrayal");
   cinematicTimeout.current=setTimeout(()=>setCinematic(""),3800);
  }
  const n={...solvedRef.current,[id]:true};solvedRef.current=n;setSolved(n);setModal(null);setHintLevel(-1);
  // A successful terminal must release game movement immediately; some
  // mobile browsers can defer the React effect until a later frame.
  if(modeRef.current==="playing")engine.current?.setGameplayActive(true);
  if(!isMutedRef.current)audio.current?.pulse(820);
 },[]);
 const win=useCallback(()=>{
  modeRef.current="finale";setMode("finale");setModal(null);
  setFinaleCue("apertura");
  if(!isMutedRef.current)audio.current?.chapter(2);
  if(!engine.current){modeRef.current="victory";setMode("victory");return;}
  engine.current.startFinale((cue)=>{
   setFinaleCue(cue);
   if(cue==="gol"){
    if(!isMutedRef.current)audio.current?.goal();
    if("vibrate" in navigator)navigator.vibrate([90,50,140,60,190]);
   }else if(!isMutedRef.current)audio.current?.pulse(cue==="centro"?800:540);
  },()=>{
   modeRef.current="victory";setMode("victory");
  });
 },[]);
 const action=useCallback((id:GameAction)=>{
  if(modeRef.current!=="playing")return;
  const s=solvedRef.current;
  if(id==="salida1"){
   if(!canEnterCorridor(s)){notify("ACCESO DENEGADO · Necesitás recuperar el informe auténtico.");return;}
   chapterRef.current=1;setChapter(1);setModal(null);setFocus("");setHintLevel(-1);notify("Sector 02 · Una voz desconocida interceptó las comunicaciones.");return;
  }
  if(id==="salida2"){
   if(!canEnterTunnel(s)){notify("ACCESO DENEGADO · Restablecé el enlace e identificá al intruso.");return;}
   chapterRef.current=2;setChapter(2);setModal(null);setFocus("");setHintLevel(-1);notify("Sector 03 · Se escucha la tribuna. Ya casi estás en la cancha.");return;
  }
  if(pieces.includes(id as FragmentPickup)){
   if(!s.monitores||!s.pizarra){notify("Primero investigá las cámaras y la pizarra.");return;}
   const p=id as FragmentPickup;
   if(foundRef.current.includes(p)){notify("Ya recogiste este fragmento.");return;}
   const updated=[...foundRef.current,p];foundRef.current=updated;setFound(updated);
   notify("HOJA ENCONTRADA · "+updated.length+"/4. "+(updated.length===4?"Ya podés ordenar el expediente.":"Buscá las restantes."));
   if(!isMutedRef.current)audio.current?.pulse(920);
   return;
  }
  if(id==="informe"){
   if(!s.monitores||!s.pizarra||foundRef.current.length<4){
    notify("EL EXPEDIENTE ESTÁ INCOMPLETO · Necesitás las 4 hojas. ");return;
   }
   if(s.informe){notify("Ya recuperaste el expediente. Buscá la salida.");return;}
   setModal("informe");setFragmentOrder([]);return;
  }
  if(id==="entrega"){
   if(!canFinish(s)){notify("El entrenador necesita una jugada VERIFICADA. Revisá el informe en el túnel.");return;}
   win();return;
  }
  if(id==="casillero"&&!s.informe){notify("Necesitás reconstruir el expediente primero.");return;}
  if(id==="relay"&&!s.casillero){notify("Primero encontrá la llave del casillero.");return;}
  if(id==="pizarra"&&!s.monitores){notify("Primero debés reconstruir la repetición auténtica.");return;}
  if(id==="cctv"&&!s.relay){notify("Primero restaurá la señal del circuito cerrado.");return;}
  if(id==="prueba"&&(!s.informe||!s.casillero)){notify("No encontraste el expediente original.");return;}
  const p=id as Puzzle;if(s[p]){notify("Esa prueba ya está resuelta. Seguí hacia el siguiente objetivo.");return;}
  setModal(p);setSelection("C1");setEvidence("");setConfirm("");setDifferences([]);setFinalSequence([]);
 },[advance,notify,win]);
 useEffect(()=>{engine.current?.setGameplayActive(!briefing&&!modal&&!cinematic&&mode==="playing");},[briefing,modal,cinematic,mode]);
 useEffect(()=>{
   if(!modal)return;
   const closeOnEscape=(e:KeyboardEvent)=>{if(e.key==="Escape")setModal(null);};
   window.addEventListener("keydown",closeOnEscape);
   return()=>window.removeEventListener("keydown",closeOnEscape);
 },[modal]);
 useEffect(()=>{isMutedRef.current=isMuted;if(audio.current?.gain&&audio.current.ctx)audio.current.gain.gain.setTargetAtTime(isMuted?0:chapter===2?.54:.22,audio.current.ctx.currentTime,.2);},[isMuted,chapter]);
 const sceneActive=mode==="playing"||mode==="finale"||mode==="victory";
 useEffect(()=>{
  if(!sceneActive||!canvas.current)return;
  let disposed=false;setWorldReady(false);setFocus("");
  (async()=>{
   try{
    // The game does not expose the scene until its first-party GLB cache
    // is settled: no disappearing players or furniture on slow connections.
    const {preloadFootballAssets}=await import("./AssetLibrary");
    await preloadFootballAssets();
    if(disposed||!canvas.current)return;
    const {FootballWorld}=await import("./FootballWorld");
    if(disposed||!canvas.current)return;
    const w=new FootballWorld(canvas.current,chapter,{action,focus:setFocus,position:(x,y,z,yaw)=>audio.current?.position(x,y,z,yaw),failure:()=>{modeRef.current="unsupported";setMode("unsupported");}});
    engine.current=w;setWorldReady(true);if(!isMutedRef.current)audio.current?.chapter(chapter);
   }catch{if(!disposed){modeRef.current="unsupported";setMode("unsupported");}}
  })();
  return()=>{disposed=true;engine.current?.dispose();engine.current=null;};
 },[sceneActive,chapter,action]);
 useEffect(()=>{
  if(mode!=="playing"||briefing)return;
  const ticker=setInterval(()=>{
   const elapsed=Math.max(0,Math.floor((performance.now()-startStamp.current)/1000)+timeDebt.current);
   const remaining=Math.max(0,900-elapsed);
   setTime(remaining);
   engine.current?.setMatchTime(remaining);
   if(elapsed>=180&&!crisisTriggered.current&&engine.current){
    crisisTriggered.current=true;
    engine.current.triggerCrisis();
    notify("INTERFERENCIA · Alguien controla las luces. Apareció un mensaje en las paredes.");
    if("vibrate" in navigator)navigator.vibrate([95,65,150]);
   }
   for(const item of stories){
    if(elapsed>=item.time&&!announcements.current.has(item.time)){
     announcements.current.add(item.time);notify(item.text);
    }
   }
   if(elapsed>=900){modeRef.current="defeat";setMode("defeat");setModal(null);}
  },200);
  return()=>clearInterval(ticker);
 },[mode,notify,briefing]);
 useEffect(()=>()=>{audio.current?.stop();if(alertTimeout.current)clearTimeout(alertTimeout.current);if(cinematicTimeout.current)clearTimeout(cinematicTimeout.current);},[]);
 const start=()=>{
  if(!document.createElement("canvas").getContext("webgl2")){setMode("unsupported");return;}
  audio.current?.stop();audio.current=new StadiumAudio();audio.current.start();
  isMutedRef.current=false;setIsMuted(false);setWorldReady(false);setChapter(0);chapterRef.current=0;setSolved({...EMPTY});
  solvedRef.current={...EMPTY};setModal(null);setFocus("");setHintLevel(-1);setHintVisible(false);setTime(900);
  setMoves(["centro","banda izquierda","segundo palo"]);setRelays([1,1,1]);setEvidence("");setFound([]);foundRef.current=[];setDifferences([]);setFragmentOrder([]);setLocker("01");setLockerPin("");setFinalSequence([]);setMistakes(0);timeDebt.current=0;
  announcements.current.clear();crisisTriggered.current=false;setCinematic("");setFinaleCue("apertura");
  startStamp.current=0;setBriefing(true);modeRef.current="playing";setMode("playing");
  notify("RADIO RECIBIDA · Confirmá la misión para iniciar la cuenta regresiva.");
 };
 const verify=()=>{
  if(!modal)return;
  const valid=verifyFootballPuzzle(modal,{selection,differences,moves,fragments:fragmentOrder,relays,locker,lockerPin,evidence,confirm,finalSequence});
  if(!valid){timeDebt.current=Math.min(90,timeDebt.current+12);setMistakes(m=>m+1);
   if(!isMutedRef.current)audio.current?.pulse(190);
   notify("RESPUESTA INCORRECTA · El sistema perdió 12 segundos. Revisá las pistas.");
   return;
  }
  if(modal==="monitores"){advance("monitores");notify("TRES ANOMALÍAS IDENTIFICADAS · Ahora reconstruí las fichas.");}
  if(modal==="pizarra"){advance("pizarra");notify("PIZARRA RESUELTA · Hay cuatro hojas del expediente ocultas en la sala.");}
  if(modal==="informe"){advance("informe");notify("EXPEDIENTE COMPLETO · Recordá el código: C2 / 4 HOJAS / 7.");}
  if(modal==="casillero"){advance("casillero");notify("CASILLERO ABIERTO · Recuperaste la llave de mantenimiento.");}
  if(modal==="relay"){advance("relay");notify("SEÑAL RESTAURADA · Investigá las cámaras del pasillo.");}
  if(modal==="cctv"){advance("cctv");notify("SABOTAJE CONFIRMADO · Una silueta acaba de cruzar la puerta.");}
  if(modal==="prueba"){advance("prueba");notify("INFORME SELLADO · El entrenador está esperando. ¡CORRÉ!");}
 };
 const moveRef=useRef({x:0,z:0});
 const move=(x:number,z:number)=>{moveRef.current={x,z};engine.current?.movement(x,z);};
 const btn=(icon:string,x:number,z:number,cls:string)=> <button type="button" className={"lj-pad "+cls} aria-label={cls} onPointerDown={e=>{e.preventDefault();move(x,z);(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)}} onPointerUp={()=>move(0,0)} onPointerCancel={()=>move(0,0)} onLostPointerCapture={()=>move(0,0)}>{icon}</button>;
 const close=()=>{
  setModal(null);
  if(modeRef.current==="playing")engine.current?.setGameplayActive(true);
 };
 return <main className={"lj-root lj-root-"+mode+(time<=180&&mode==="playing"?" lj-danger-phase":"")}>
  {mode==="intro"&&<section className="lj-intro">
   <div className="lj-intro-content">
    <span className="lj-kicker">VIRALIO ORIGINALS / MISIÓN 004</span>
    <h1>LA ÚLTIMA<br/><em>JUGADA.</em></h1>
    <p className="lj-tagline">LLEVÁ LA INFORMACIÓN. CAMBIÁ LA FINAL.</p>
    <div className="lj-score-intro"><span>ARGENTINA</span><b>1 — 1</b><span>INGLATERRA</span></div>
    <p className="lj-synopsis">Sos un investigador externo de la selección. Faltan minutos para que termine la final del mundo. Alguien manipuló los informes del entrenador y bloqueó las comunicaciones. Recuperá la estrategia auténtica, cruzá el estadio y entregala antes del pitazo final.</p>
    <div className="lj-features"><span>◷ 15 MINUTOS</span><span>◇ 3 ESCENARIOS 3D</span><span>⌁ AURICULARES RECOMENDADOS</span></div>
    <button className="lj-mainbutton" onClick={start}>INICIAR MISIÓN <span>↗</span></button>
    <p className="lj-note">Exploración en primera persona · Pellizcá con dos dedos para acercarte · Controles táctiles y teclado · Ficción deportiva no oficial</p>
    <a className="lj-back" href="/#experiencias">← Volver a Viralio Escape</a>
   </div><div className="lj-hero-shine" aria-hidden="true"/>
  </section>}
  {sceneActive&&<>
   <div className="lj-canvas-frame"><canvas ref={canvas} aria-label="Escenario tridimensional explorable: usá WASD para caminar, arrastrá para mirar y tocá los objetos para examinarlos."/></div>
   <div className="lj-vignette" aria-hidden="true"/>
   {!worldReady&&<div className="lj-loading-scene" role="status"><span>V / VIRALIO ORIGINALS</span><strong>PREPARANDO EL ESTADIO</strong><small>Cargando escena 3D y controles…</small></div>}
   {briefing&&worldReady&&<section className="lj-mission-backdrop" role="dialog" aria-modal="true" aria-label="Orden de misión" >
    <div className="lj-mission-sheet">
     <span className="lj-mission-kicker"><span className="lj-live-dot"/> TRANSMISIÓN ENCRIPTADA / INFORME 87</span>
     <p className="lj-mission-classified">CONFIDENCIAL — CUERPO TÉCNICO ARGENTINO</p>
     <h2>LA ÚLTIMA <em>JUGADA</em></h2>
     <div className="lj-mission-score"><span>FINAL DEL MUNDO · MINUTO 87</span><strong>ARGENTINA 1 — 1 INGLATERRA</strong></div>
     <p>Alguien alteró el informe que puede cambiar esta final. Sos la única persona capaz de recuperar las pruebas antes del pitazo.</p>
     <div className="lj-mission-steps"><div><b>01</b><span>OBSERVÁ LAS PRUEBAS</span></div><div><b>02</b><span>RECONSTRUÍ EL INFORME</span></div><div><b>03</b><span>ENTREGALO EN EL TÚNEL</span></div></div>
     <div className="lj-mission-first"><small>PRIMERA PISTA / SIN SABER DE FÚTBOL</small><strong>Las tres cámaras parecen iguales, pero no lo son.</strong><p>Buscá tres anomalías: una pelota que salta, otra que se duplica y una grabación que continúa normalmente. Elegí la auténtica.</p></div>
     <button className="lj-mainbutton" onClick={()=>{
      startStamp.current=performance.now();
      setBriefing(false);
      engine.current?.orientToward("monitores");
      notify("MISIÓN ACTIVADA · Buscá las diferencias en las tres cámaras.");
     }}>COMENZAR CUENTA REGRESIVA <span>↗</span></button>
     <small className="lj-mission-footer">15 MINUTOS · 3 ESCENARIOS · 7 PRUEBAS · EL RELOJ NO SE DETIENE</small>
    </div>
   </section>}
   {mode==="finale"&&<div className={"lj-finale-banner lj-finale-"+finaleCue} role="status" key={finaleCue}><small>LA ÚLTIMA JUGADA</small><strong>{finaleCue==="apertura"?"EL ENTRENADOR RECIBIÓ LA INFORMACIÓN":finaleCue==="pase"?"EL 7 SE ESCAPA POR LA BANDA DERECHA":finaleCue==="centro"?"CENTRO AL PRIMER PALO…":"¡¡GOOOOOOOL DE ARGENTINA!!"}</strong><span>{finaleCue==="gol"?"ARGENTINA 2 — 1 INGLATERRA":"LA FINAL SE DEFINE AHORA"}</span></div>}
   {cinematic&&<div className={"lj-cinematic lj-cinematic-"+cinematic} aria-live="assertive"><span>{cinematic==="var"?"¡GOL DE INGLATERRA!":cinematic==="blackout"?"COMUNICACIÓN INTERRUMPIDA":"TE HAN ENGAÑADO"}</span><strong>{cinematic==="var"?"REVISIÓN VAR · GOL ANULADO":cinematic==="blackout"?"SISTEMA BLOQUEADO · RESTAURANDO ENLACE":"EL OPERADOR DE RADIO ERA EL SABOTEADOR"}</strong></div>}
   <header className="lj-hud">
    <div className="lj-brand">V / <strong>LA ÚLTIMA JUGADA</strong><small>{titles[chapter]}</small></div>
    <div className={"lj-clock "+(time<120?"lj-clock-urgent":"")}><small>TIEMPO RESTANTE</small><strong>{format(time)}</strong></div>
    <div className="lj-match"><span>ARG</span><strong>1 : 1</strong><span>ING</span><small>FINAL DEL MUNDO</small></div>
   </header>
   <div className="lj-progress"><span className={chapter>=0?"is-current":""}>01 ANÁLISIS</span><i/><span className={chapter>=1?"is-current":""}>02 SABOTAJE</span><i/><span className={chapter>=2?"is-current":""}>03 ENTREGA</span></div>
   {!briefing&&mode==="playing"&&<div className={"lj-pressure "+(time<=180?"lj-pressure-critical":time<=420?"lj-pressure-high":"")} role="status" aria-live="off">
    <div className="lj-pressure-top"><span>{time>600?"LA FINAL SIGUE · RECUPERÁ EL INFORME":time>420?"ALGUIEN INTENTA BORRAR LAS PRUEBAS":time>180?"EL BANCO ARGENTINO ESTÁ ESPERANDO":"ÚLTIMOS MINUTOS · NO HAY TIEMPO"}</span><strong>{time<=180?"URGENTE":time<=420?"ALERTA":"EN VIVO"}</strong></div>
    <div className="lj-pressure-track"><span style={{width:Math.max(0,time/900*100)+"%"}}/></div>
    {mistakes>0&&<small>INTERFERENCIAS: {mistakes} · {Math.min(90,mistakes*12)} S DE PENALIZACIÓN</small>}
   </div>}
   <div className="lj-cross" aria-hidden="true">+</div>
   {focus&&<div className="lj-focus"><span>◎</span>{focus}</div>}
   <div className="lj-objective"><small>OBJETIVO ACTUAL</small><p>{nextObjective(chapter,solved,found)}</p></div>
   {alert&&<div className="lj-alert" role="status"><span className="lj-alert-beep">●</span>{alert}</div>}
   <div className="lj-topactions"><button onClick={()=>setHintVisible(!hintVisible)} aria-label="Mostrar u ocultar pista">? PISTA</button><button onClick={()=>setIsMuted(m=>!m)} aria-label={isMuted?"Activar sonido":"Silenciar"}>{isMuted?"♫ OFF":"♫ ON"}</button></div>
   {hintVisible&&<div className="lj-hintbox"><strong>PISTA / {String(Math.max(1,hintLevel+2)).padStart(2,"0")}</strong><p>{hintFor(chapter,solved,found,Math.max(0,hintLevel))}</p><button onClick={()=>setHintLevel(i=>Math.min(1,i+1))}>Pista más clara ↗</button><button onClick={()=>{if(engine.current?.orientToward(targetAction(chapter,solved,found)))setHintVisible(false);}}>ORIENTARME ◎</button><button onClick={()=>setHintVisible(false)}>Cerrar ×</button></div>}
   <div className="lj-touchpad" aria-label="Controles de desplazamiento">
    {btn("▲",0,-1,"lj-forward")}{btn("◀",-1,0,"lj-left")}{btn("▼",0,1,"lj-backward")}{btn("▶",1,0,"lj-right")}
   </div>
   <div className="lj-control-info">ARRASTRÁ PARA MIRAR · WASD PARA CAMINAR · E PARA INTERACTUAR</div>
   <button className="lj-interact" onClick={()=>engine.current?.interactCenter()} aria-label="Interactuar con el objeto enfocado">INTERACTUAR <span>◎</span></button>
   {modal&&<div className="lj-modal-backdrop"><section className="lj-terminal" role="dialog" aria-modal="true" aria-label="Acertijo interactivo">
    <div className="lj-terminal-header"><span>VIRALIO / TERMINAL DE INVESTIGACIÓN</span><button onClick={close} aria-label="Cerrar acertijo">×</button></div>
    {modal==="monitores"&&<><h2>Tres pantallas. Tres anomalías.</h2><p>Revisá y pausá cada grabación. Marcá las <b>tres observaciones que encontraste</b> y luego elegí qué cámara no fue manipulada.</p>
     <TacticalReplay selection={selection} onSelect={setSelection}/>
     <div className="lj-observations" aria-label="Anomalías detectadas">
      {[["salto","La pelota aparece de golpe en otra zona"],["duplicado","Veo dos pelotas al mismo tiempo"],["continuidad","Hay una cámara con movimiento continuo"],["bandera","La bandera cambia de color"],["tribuna","La tribuna desaparece"]].map(([id,label])=>
       <button key={id} type="button" className={differences.includes(id)?"selected":""} aria-pressed={differences.includes(id)}
        onClick={()=>setDifferences(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id])}>{differences.includes(id)?"✓ ":"□ "}{label}</button>)}
     </div><small className="lj-puzzle-count">{differences.length}/3 OBSERVACIONES SELECCIONADAS · Tres son reales; dos fueron inventadas.</small>
    </>}
    {modal==="pizarra"&&<><h2>Rompecabezas magnético</h2><p>No hace falta entender de fútbol. Mirá la <b>tarjeta de referencia</b> y reconstruí las posiciones de las tres fichas numeradas. Seleccionalas y movelas a las zonas que coinciden con el croquis.</p>
     <div className="lj-pattern"><small>REFERENCIA RECUPERADA / 3 MOVIMIENTOS</small><span>7 ↗ ZONA SUPERIOR DERECHA</span><span>10 ◌ A UN LADO DEL CÍRCULO</span><span>9 ▷ JUNTO AL ARCO, ARRIBA</span></div>
     <MagneticTactics moves={moves} onChange={setMoves}/>
    </>}
    {modal==="informe"&&<><h2>Expediente fragmentado</h2><p>Recuperaste las cuatro hojas físicas. Ahora ordenalas según los pequeños sellos estampados en sus esquinas. Tocá las tarjetas una por una.</p>
     <div className="lj-fragments-inventory">{fragmentLabels.map((p,i)=><span key={p.id}><small>HOJA {i+1} · RECUPERADA</small><strong>{p.title}</strong></span>)}</div>
     <div className="lj-puzzle-count">ORDEN RECONSTRUIDO: {fragmentOrder.length?fragmentOrder.join(" → "):"AÚN VACÍO"}</div>
     <div className="lj-fragment-order">{[["RUTA","03"],["PLANO","01"],["FIRMA","04"],["SELLO","02"]].map(([name,stamp])=>
      <button key={name} type="button" disabled={fragmentOrder.includes(name)}
       onClick={()=>setFragmentOrder(p=>[...p,name])}><small>SELLO {stamp}</small>{name}</button>)}</div>
     <button className="lj-reset-puzzle" onClick={()=>setFragmentOrder([])}>↶ REORDENAR FRAGMENTOS</button>
     <p className="lj-evidence-strip">Al terminar, guardá este dato para el corredor: <b>cámara auténtica + hojas recuperadas + ficha número 7</b>.</p>
    </>}
    {modal==="casillero"&&<><h2>¿Cuál casillero contiene la llave?</h2><p>Una nota del saboteador dice: «No busques el número más alto. Abrí el 04 con las tres pistas que recuperaste». Combiná <b>la cámara auténtica, cuántas hojas encontraste y el número de la primera ficha</b>.</p>
     <div className="lj-lockers">{["01","02","03","04"].map(n=><button type="button" key={n} className={locker===n?"selected":""} aria-pressed={locker===n} onClick={()=>setLocker(n)}><span>▤</span><strong>CASILLERO {n}</strong><small>{n==="04"?"CERRADURA MECÁNICA":"IDENTIFICACIÓN RESTRINGIDA"}</small></button>)}</div>
     <label className="lj-pin-label">INTRODUCÍ EL CÓDIGO DE TRES CIFRAS<input aria-label="Código del casillero" inputMode="numeric" maxLength={3} value={lockerPin} onChange={e=>setLockerPin(e.target.value.replace(/[^0-9]/g,"").slice(0,3))} placeholder="_ _ _"/></label>
    </>}
    {modal==="relay"&&<><h2>Repará la señal</h2><p>No necesitás conocer fútbol: las placas de mantenimiento muestran formas. Contá cuántas hay de cada color y poné esa cantidad en cada dial.</p>
     <div className="lj-relay-clue"><span>ROJO / ━ ━</span><span>AZUL / ▪ ▪ ▪ ▪</span><span>VERDE / ● ● ●</span></div>
     <div className="lj-dials">{["ROJO","AZUL","VERDE"].map((name,i)=><div key={name}><small>{name}</small><button aria-label={"Cambiar "+name} onClick={()=>setRelays(r=>r.map((v,j)=>i===j?v%4+1:v))}>{relays[i]}<span>↻</span></button></div>)}</div>
    </>}
    {modal==="cctv"&&<><h2>¿Quién entró al pasillo?</h2><p>Compará las dos capturas. La credencial está tapada en cada una, pero juntas forman el mismo número.</p>
     <div className="lj-security"><div><span>CAM 09 / 89:12</span><strong>ACCESO / 0_</strong></div><div><span>CAM 09 / 89:13</span><strong>ACCESO / _9</strong></div></div>
     <div className="lj-options">{["12","09","17"].map(code=><button key={code} className={evidence===code?"selected":""} onClick={()=>setEvidence(code)}>CREDENCIAL {code}</button>)}</div>
    </>}
    {modal==="prueba"&&<><h2>Última validación: tres sellos</h2><p>La llave del entrenador exige tres sellos en orden: <b>cámara auténtica → casillero abierto → color de la señal reparada</b>. Después elegí la ruta del dibujo reconstruido.</p>
     <TacticalPitch kind="final"/>
     <div className="lj-final-sequence"><small>SELLOS RECUPERADOS</small><strong>{finalSequence.length?finalSequence.join(" → "):"TOCÁ LAS TRES PISTAS EN ORDEN"}</strong><div>{["ROJO","04","C2","AZUL","09"].map(id=><button type="button" key={id} disabled={finalSequence.includes(id)||finalSequence.length>=3} onClick={()=>setFinalSequence(p=>[...p,id])}>{id}</button>)}</div>
      <button className="lj-reset-puzzle" onClick={()=>setFinalSequence([])}>↶ LIMPIAR SECUENCIA</button></div>
     <div className="lj-options lj-final-options">{[["centro","Ruta A: las tres fichas se agrupan sobre la línea central."],["derecha","La ruta que coincide con las fichas: 7 arriba a la derecha, 10 en el círculo y 9 junto al arco."],["izquierda","Ruta B: las tres fichas se colocan a la izquierda del tablero."]].map(([id,text])=><button key={id} onClick={()=>setConfirm(id)} className={confirm===id?"selected":""}>{text}</button>)}</div>
    </>}
    <div className="lj-terminal-footer"><button onClick={close}>VOLVER A LA SALA</button><button className="primary" onClick={verify}>VERIFICAR RESPUESTA ↗</button></div>
   </section></div>}
  </>}
  {mode==="victory"&&<section className="lj-ending lj-winner">
   <span className="lj-kicker">LA INFORMACIÓN LLEGÓ A TIEMPO</span><h1>HICISTE<br/><em>HISTORIA.</em></h1>
   <p className="lj-goal">GOOOOOOL DE ARGENTINA</p>
   <div className="lj-end-score"><span>ARGENTINA</span><strong>2 : 1</strong><span>INGLATERRA</span></div>
   <h2>CAMPEONES DEL MUNDO</h2><p>El 10 atrajo la marca. El 7 se abrió a la derecha. El 9 atacó el primer palo. Esa jugada que reconstruiste fue el gol del campeonato.</p>
   <div className="lj-victory-quote">«No hiciste el gol. Hiciste posible la jugada»</div>
   <button className="lj-mainbutton" onClick={start}>VOLVER A JUGAR ↗</button><a href="/#experiencias" className="lj-back">Explorar otras salas</a>
  </section>}
  {mode==="defeat"&&<section className="lj-ending lj-lose">
   <span className="lj-kicker">PITAZO FINAL / MISIÓN FALLIDA</span><h1>SE ACABÓ<br/><em>EL TIEMPO.</em></h1>
   <div className="lj-end-score"><span>ARGENTINA</span><strong>1 : 1</strong><span>INGLATERRA</span></div>
   <p>El entrenador no recibió la prueba a tiempo. La oportunidad se perdió y la final continúa hacia un desenlace incierto.</p>
   <button className="lj-mainbutton" onClick={start}>REINICIAR MISIÓN ↗</button><a href="/#experiencias" className="lj-back">Volver al catálogo</a>
  </section>}
  {mode==="unsupported"&&<section className="lj-ending"><h1>DISPOSITIVO NO COMPATIBLE</h1><p>Esta experiencia necesita WebGL2 y un navegador actualizado con aceleración gráfica.</p><button className="lj-mainbutton" onClick={()=>{modeRef.current="intro";setMode("intro")}}>VOLVER AL INICIO</button></section>}
 </main>;
}
