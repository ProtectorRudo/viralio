"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter, GameAction } from "./FootballWorld";
import { verifyFootballPuzzle, canEnterCorridor, canEnterTunnel, canFinish } from "./rules";
import TacticalReplay from "./TacticalReplay";
import MagneticTactics from "./MagneticTactics";
import "./game.css";

type Puzzle = "monitores" | "pizarra" | "relay" | "cctv" | "prueba";
type Solved = Record<Puzzle | "informe", boolean>;
type Mode = "intro" | "playing" | "finale" | "victory" | "defeat" | "unsupported";
const EMPTY: Solved = {monitores:false,pizarra:false,relay:false,cctv:false,prueba:false,informe:false};
const titles = ["CABINA DE ANÁLISIS","CORREDOR RESTRINGIDO","TÚNEL DE LA FINAL"] as const;
const stories = [
 {time:60,text:"Los ingleses preparan un cambio. La transmisión del banco se está deteriorando.",tone:"alert"},
 {time:155,text:"¡GOL DE INGLATERRA! ... Un momento. El VAR revisa la posición del delantero.",tone:"danger"},
 {time:172,text:"FUERA DE JUEGO. Gol anulado. La final sigue 1 a 1.",tone:"success"},
 {time:320,text:"SEGURIDAD: hay una credencial anulada en el corredor de servicio.",tone:"alert"},
 {time:490,text:"RADIO INTERVENIDA: «No le entregues ese informe al técnico. Dámelo a mí».",tone:"danger"},
 {time:620,text:"Detectaron que alguien reemplazó el análisis original por una jugada falsa.",tone:"alert"},
 {time:750,text:"CUARTO ÁRBITRO: se anuncia tiempo añadido. El banco espera tu información.",tone:"danger"},
 {time:845,text:"ÚLTIMA OPORTUNIDAD. Si el entrenador no recibe la prueba, la final se escapa.",tone:"danger"}
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
function targetAction(chapter:Chapter,s:Solved):GameAction {
 if(chapter===0)return !s.monitores?"monitores":!s.pizarra?"pizarra":!s.informe?"informe":"salida1";
 if(chapter===1)return !s.relay?"relay":!s.cctv?"cctv":"salida2";
 return !s.prueba?"prueba":"entrega";
}
function nextObjective(chapter:Chapter, s:Solved){
 if(chapter===0){
  if(!s.monitores)return "Compará las grabaciones de las tres cámaras.";
  if(!s.pizarra)return "Reconstruí la jugada en la pizarra táctica.";
  if(!s.informe)return "Recuperá el informe verdadero del escritorio.";
  return "Buscá la puerta al corredor de servicio.";
 }
 if(chapter===1){if(!s.relay)return "Repará la central de comunicaciones.";if(!s.cctv)return "Encontrá al saboteador en el circuito cerrado.";return "Accedé al túnel del estadio.";}
 if(!s.prueba)return "Verificá la táctica antes de entregarla.";
 return "Llegá al entrenador, al final del túnel.";
}
function hintFor(chapter:Chapter,s:Solved,level:number){
 const texts=chapter===0?
  !s.monitores?["Las tres cámaras muestran un mismo ataque, pero el balón no puede estar en dos lugares al mismo tiempo.","Observá la pelota y su sombra. La toma sin saltos temporales es la CÁMARA 02."]:
  !s.pizarra?["Fijate cómo el defensor inglés persigue al 10: se abre un espacio por derecha.","El 7 debe abrirse a banda derecha, el 10 ir a la medialuna y el 9 atacar el primer palo."]:
  !s.informe?["Sobre el escritorio hay una carpeta de color claro.","Tocá el expediente que está delante de los monitores."]:
  ["La salida al corredor está a la derecha de la cabina.","Acercate al portón marcado SECTOR INTERNO."]:
 chapter===1?
  !s.relay?["Los símbolos codifican cantidades: zaguero, tres leones y origen.","Terminal roja = 2, azul = 3, verde = 1."]:
  !s.cctv?["El saboteador aparece varias veces en el monitor de seguridad.","Su acreditación termina en 09."]:
  ["La puerta de salida da al túnel que conduce al campo.","Seguí hasta el portón TÚNEL DE CAMPO."]:
 !s.prueba?["El video auténtico muestra a los defensores cerrando el centro.","El plan correcto es atacar por derecha tras atraer la marca al centro."]:
 ["La salida al campo está frente a vos.","Caminá hacia el estadio y tocá SALIDA AL BANCO."];
 return texts[Math.min(level,1)];
}
export default function LaUltimaJugada(){
 const [mode,setMode]=useState<Mode>("intro");
 const [chapter,setChapter]=useState<Chapter>(0);
 const [solved,setSolved]=useState<Solved>({...EMPTY});
 const solvedRef=useRef<Solved>({...EMPTY});
 const [time,setTime]=useState(900);
 const [modal,setModal]=useState<Puzzle|null>(null);
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
 const advance=useCallback((id:Puzzle|"informe")=>{
  if(id==="monitores"||id==="relay"||id==="cctv"){
   if(cinematicTimeout.current)clearTimeout(cinematicTimeout.current);
   setCinematic(id==="monitores"?"var":id==="relay"?"blackout":"betrayal");
   cinematicTimeout.current=setTimeout(()=>setCinematic(""),3800);
  }
  const n={...solvedRef.current,[id]:true};solvedRef.current=n;setSolved(n);setModal(null);setHintLevel(-1);
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
   chapterRef.current=1;setChapter(1);setModal(null);setHintLevel(-1);notify("Sector 02 · Una voz desconocida interceptó las comunicaciones.");return;
  }
  if(id==="salida2"){
   if(!canEnterTunnel(s)){notify("ACCESO DENEGADO · Restablecé el enlace e identificá al intruso.");return;}
   chapterRef.current=2;setChapter(2);setModal(null);setHintLevel(-1);notify("Sector 03 · Se escucha la tribuna. Ya casi estás en la cancha.");return;
  }
  if(id==="informe"){
   if(!s.monitores||!s.pizarra){notify("El expediente no se puede abrir: falta verificar las cámaras y la pizarra.");return;}
   if(!s.informe){advance("informe");notify("INFORME RECUPERADO · Llevá la prueba al banco argentino.");}
   else notify("Tenés el informe auténtico. Dirigite al corredor.");return;
  }
  if(id==="entrega"){
   if(!canFinish(s)){notify("El entrenador necesita una jugada VERIFICADA. Revisá el informe en el túnel.");return;}
   win();return;
  }
  if(id==="pizarra"&&!s.monitores){notify("Primero debés reconstruir la repetición auténtica.");return;}
  if(id==="cctv"&&!s.relay){notify("Primero restaurá la señal del circuito cerrado.");return;}
  if(id==="prueba"&&!s.informe){notify("No encontraste el expediente original.");return;}
  const p=id as Puzzle;if(s[p]){notify("Esa prueba ya está resuelta. Seguí hacia el siguiente objetivo.");return;}
  setModal(p);setSelection("C1");setEvidence("");setConfirm("");
 },[advance,notify,win]);
 useEffect(()=>{engine.current?.setGameplayActive(!modal&&!cinematic&&mode==="playing");},[modal,cinematic,mode]);
 useEffect(()=>{
   if(!modal)return;
   const closeOnEscape=(e:KeyboardEvent)=>{if(e.key==="Escape")setModal(null);};
   window.addEventListener("keydown",closeOnEscape);
   return()=>window.removeEventListener("keydown",closeOnEscape);
 },[modal]);
 useEffect(()=>{isMutedRef.current=isMuted;if(audio.current?.gain&&audio.current.ctx)audio.current.gain.gain.setTargetAtTime(isMuted?0:chapter===2?.54:.22,audio.current.ctx.currentTime,.2);},[isMuted,chapter]);
 const sceneActive=mode==="playing"||mode==="finale";
 useEffect(()=>{
  if(!sceneActive||!canvas.current)return;
  let disposed=false;
  (async()=>{
   try{
    const {FootballWorld}=await import("./FootballWorld");
    if(disposed||!canvas.current)return;
    const w=new FootballWorld(canvas.current,chapter,{action,focus:setFocus,position:(x,y,z,yaw)=>audio.current?.position(x,y,z,yaw),failure:()=>{modeRef.current="unsupported";setMode("unsupported");}});
    engine.current=w;if(!isMutedRef.current)audio.current?.chapter(chapter);
   }catch{if(!disposed){modeRef.current="unsupported";setMode("unsupported");}}
  })();
  return()=>{disposed=true;engine.current?.dispose();engine.current=null;};
 },[sceneActive,chapter,action]);
 useEffect(()=>{
  if(mode!=="playing")return;
  const ticker=setInterval(()=>{
   const elapsed=Math.max(0,Math.floor((performance.now()-startStamp.current)/1000));
   setTime(Math.max(0,900-elapsed));
   for(const item of stories){
    if(elapsed>=item.time&&!announcements.current.has(item.time)){
     announcements.current.add(item.time);notify(item.text);
    }
   }
   if(elapsed>=900){modeRef.current="defeat";setMode("defeat");setModal(null);}
  },200);
  return()=>clearInterval(ticker);
 },[mode,notify]);
 useEffect(()=>()=>{audio.current?.stop();if(alertTimeout.current)clearTimeout(alertTimeout.current);if(cinematicTimeout.current)clearTimeout(cinematicTimeout.current);},[]);
 const start=()=>{
  if(!document.createElement("canvas").getContext("webgl2")){setMode("unsupported");return;}
  audio.current?.stop();audio.current=new StadiumAudio();audio.current.start();
  isMutedRef.current=false;setIsMuted(false);setChapter(0);chapterRef.current=0;setSolved({...EMPTY});
  solvedRef.current={...EMPTY};setModal(null);setFocus("");setHintLevel(-1);setHintVisible(false);setTime(900);
  setMoves(["centro","banda izquierda","segundo palo"]);setRelays([1,1,1]);setEvidence("");
  announcements.current.clear();setCinematic("");setFinaleCue("apertura");startStamp.current=performance.now();modeRef.current="playing";setMode("playing");
  notify("MINUTO 87 · Argentina 1 - 1 Inglaterra. Encontrá la grabación auténtica.");
 };
 const verify=()=>{
  if(!modal)return;
  const valid=verifyFootballPuzzle(modal,{selection,moves,relays,evidence,confirm});
  if(modal==="monitores"){
   if(valid){advance("monitores");notify("CÁMARA 02 VERIFICADA · La defensa inglesa cierra el centro. Revisá la pizarra.");}
   else notify("ESA CÁMARA FUE MANIPULADA. Mirá la continuidad del balón y sus sombras.");
  }
  if(modal==="pizarra"){
   if(valid){advance("pizarra");notify("JUGADA RECONSTRUIDA · El expediente original ya se puede recuperar.");}
   else notify("LA JUGADA NO CIERRA. Necesitás generar un espacio por derecha y atacar el primer palo.");
  }
  if(modal==="relay"){
   if(valid){advance("relay");notify("SEÑAL RESTAURADA · Ahora podés examinar las cámaras de seguridad.");}
   else notify("FALLO DE SINCRONIZACIÓN · Revisá las pistas de cada terminal.");
  }
  if(modal==="cctv"){
   if(valid){advance("cctv");notify("SABOTAJE CONFIRMADO · El operador de radio anuló tu credencial.");}
   else notify("LA ACREDITACIÓN NO COINCIDE. Observá la secuencia en el monitor.");
  }
  if(modal==="prueba"){
   if(valid){advance("prueba");notify("PRUEBA AUTENTICADA · Entregá la instrucción al entrenador. ¡Corré!");}
   else notify("INFORME FALSO · Esa instrucción favorece a la defensa inglesa.");
  }
 };
 const moveRef=useRef({x:0,z:0});
 const move=(x:number,z:number)=>{moveRef.current={x,z};engine.current?.movement(x,z);};
 const btn=(icon:string,x:number,z:number,cls:string)=> <button type="button" className={"lj-pad "+cls} aria-label={cls} onPointerDown={e=>{e.preventDefault();move(x,z);(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)}} onPointerUp={()=>move(0,0)} onPointerCancel={()=>move(0,0)} onLostPointerCapture={()=>move(0,0)}>{icon}</button>;
 const close=()=>setModal(null);
 return <main className={"lj-root lj-root-"+mode}>
  {mode==="intro"&&<section className="lj-intro">
   <div className="lj-intro-content">
    <span className="lj-kicker">VIRALIO ORIGINALS / MISIÓN 004</span>
    <h1>LA ÚLTIMA<br/><em>JUGADA.</em></h1>
    <p className="lj-tagline">LLEVÁ LA INFORMACIÓN. CAMBIÁ LA FINAL.</p>
    <div className="lj-score-intro"><span>ARGENTINA</span><b>1 — 1</b><span>INGLATERRA</span></div>
    <p className="lj-synopsis">Sos un investigador externo de la selección. Faltan minutos para que termine la final del mundo. Alguien manipuló los informes del entrenador y bloqueó las comunicaciones. Recuperá la estrategia auténtica, cruzá el estadio y entregala antes del pitazo final.</p>
    <div className="lj-features"><span>◷ 15 MINUTOS</span><span>◇ 3 ESCENARIOS 3D</span><span>⌁ AURICULARES RECOMENDADOS</span></div>
    <button className="lj-mainbutton" onClick={start}>INICIAR MISIÓN <span>↗</span></button>
    <p className="lj-note">Exploración en primera persona · Controles táctiles y teclado · Ficción deportiva no oficial</p>
    <a className="lj-back" href="/#experiencias">← Volver a Viralio Escape</a>
   </div><div className="lj-hero-shine" aria-hidden="true"/>
  </section>}
  {sceneActive&&<>
   <div className="lj-canvas-frame"><canvas ref={canvas} aria-label="Escenario tridimensional explorable: usá WASD para caminar, arrastrá para mirar y tocá los objetos para examinarlos."/></div>
   <div className="lj-vignette" aria-hidden="true"/>
   {mode==="finale"&&<div className={"lj-finale-banner lj-finale-"+finaleCue} role="status" key={finaleCue}><small>LA ÚLTIMA JUGADA</small><strong>{finaleCue==="apertura"?"EL ENTRENADOR RECIBIÓ LA INFORMACIÓN":finaleCue==="pase"?"EL 7 SE ESCAPA POR LA BANDA DERECHA":finaleCue==="centro"?"CENTRO AL PRIMER PALO…":"¡¡GOOOOOOOL DE ARGENTINA!!"}</strong><span>{finaleCue==="gol"?"ARGENTINA 2 — 1 INGLATERRA":"LA FINAL SE DEFINE AHORA"}</span></div>}
   {cinematic&&<div className={"lj-cinematic lj-cinematic-"+cinematic} aria-live="assertive"><span>{cinematic==="var"?"¡GOL DE INGLATERRA!":cinematic==="blackout"?"COMUNICACIÓN INTERRUMPIDA":"TE HAN ENGAÑADO"}</span><strong>{cinematic==="var"?"REVISIÓN VAR · GOL ANULADO":cinematic==="blackout"?"SISTEMA BLOQUEADO · RESTAURANDO ENLACE":"EL OPERADOR DE RADIO ERA EL SABOTEADOR"}</strong></div>}
   <header className="lj-hud">
    <div className="lj-brand">V / <strong>LA ÚLTIMA JUGADA</strong><small>{titles[chapter]}</small></div>
    <div className={"lj-clock "+(time<120?"lj-clock-urgent":"")}><small>TIEMPO RESTANTE</small><strong>{format(time)}</strong></div>
    <div className="lj-match"><span>ARG</span><strong>1 : 1</strong><span>ING</span><small>FINAL DEL MUNDO</small></div>
   </header>
   <div className="lj-progress"><span className={chapter>=0?"is-current":""}>01 ANÁLISIS</span><i/><span className={chapter>=1?"is-current":""}>02 SABOTAJE</span><i/><span className={chapter>=2?"is-current":""}>03 ENTREGA</span></div>
   <div className="lj-cross" aria-hidden="true">+</div>
   {focus&&<div className="lj-focus"><span>◎</span>{focus}</div>}
   <div className="lj-objective"><small>OBJETIVO ACTUAL</small><p>{nextObjective(chapter,solved)}</p></div>
   {alert&&<div className="lj-alert" role="status"><span className="lj-alert-beep">●</span>{alert}</div>}
   <div className="lj-topactions"><button onClick={()=>setHintVisible(!hintVisible)} aria-label="Mostrar u ocultar pista">? PISTA</button><button onClick={()=>setIsMuted(m=>!m)} aria-label={isMuted?"Activar sonido":"Silenciar"}>{isMuted?"♫ OFF":"♫ ON"}</button></div>
   {hintVisible&&<div className="lj-hintbox"><strong>PISTA / {String(Math.max(1,hintLevel+2)).padStart(2,"0")}</strong><p>{hintFor(chapter,solved,Math.max(0,hintLevel))}</p><button onClick={()=>setHintLevel(i=>Math.min(1,i+1))}>Pista más clara ↗</button><button onClick={()=>{if(engine.current?.orientToward(targetAction(chapter,solved)))setHintVisible(false);}}>ORIENTARME ◎</button><button onClick={()=>setHintVisible(false)}>Cerrar ×</button></div>}
   <div className="lj-touchpad" aria-label="Controles de desplazamiento">
    {btn("▲",0,-1,"lj-forward")}{btn("◀",-1,0,"lj-left")}{btn("▼",0,1,"lj-backward")}{btn("▶",1,0,"lj-right")}
   </div>
   <div className="lj-control-info">ARRASTRÁ PARA MIRAR · WASD PARA CAMINAR · E PARA INTERACTUAR</div>
   <button className="lj-interact" onClick={()=>engine.current?.interactCenter()} aria-label="Interactuar con el objeto enfocado">INTERACTUAR <span>◎</span></button>
   {modal&&<div className="lj-modal-backdrop"><section className="lj-terminal" role="dialog" aria-modal="true" aria-label="Acertijo interactivo">
    <div className="lj-terminal-header"><span>VIRALIO / TERMINAL DE INVESTIGACIÓN</span><button onClick={close} aria-label="Cerrar acertijo">×</button></div>
    {modal==="monitores"&&<><h2>La grabación alterada</h2><p>Las tres cámaras registraron el mismo ataque. Una tiene saltos de continuidad. Encontrá la secuencia verdadera.</p>
     <TacticalReplay selection={selection} onSelect={setSelection}/>
    </>}
    {modal==="pizarra"&&<><h2>Reconstruí la jugada</h2><p>El 10 arrastra la marca inglesa hacia adentro. Acomodá los tres movimientos para explotar el espacio que deja libre.</p>
     <MagneticTactics moves={moves} onChange={setMoves}/>
    </>}
    {modal==="relay"&&<><h2>Central intervenida</h2><p>Restaurá las tres terminales usando las inscripciones de mantenimiento. Cada dial acepta las posiciones del 1 al 4.</p>
     <div className="lj-relay-clue"><span>ROJO / DORSAL DEL ZAGUERO</span><span>AZUL / LEONES DEL ESCUDO INGLÉS</span><span>VERDE / PUNTO DE ORIGEN</span></div>
     <div className="lj-dials">{["ROJO","AZUL","VERDE"].map((name,i)=><div key={name}><small>{name}</small><button aria-label={"Cambiar "+name} onClick={()=>setRelays(r=>r.map((v,j)=>i===j?v%4+1:v))}>{relays[i]}<span>↻</span></button></div>)}</div>
    </>}
    {modal==="cctv"&&<><h2>El intruso tenía acceso</h2><p>Las cámaras de seguridad muestran al operador que anuló tu credencial. Compará el número que aparece en dos capturas consecutivas.</p>
     <div className="lj-security"><div><span>CAM 09 / 89:12</span><strong>ACCESO / 0_</strong></div><div><span>CAM 09 / 89:13</span><strong>ACCESO / _9</strong></div></div>
     <div className="lj-options">{["12","09","17"].map(code=><button key={code} className={evidence===code?"selected":""} onClick={()=>setEvidence(code)}>CREDENCIAL {code}</button>)}</div>
    </>}
    {modal==="prueba"&&<><h2>¿Cuál es la instrucción real?</h2><p>El sabotaje insertó dos planes falsos en el reporte del técnico. Elegí el que coincide con la secuencia auténtica que investigaste.</p>
     <TacticalPitch kind="final"/>
     <div className="lj-options lj-final-options">{[["centro","Atacar en línea recta por el centro, con los tres delanteros juntos."],["derecha","Atraer la marca al centro, abrir al 7 por derecha y buscar al 9 en el primer palo."],["izquierda","Retrasar el balón y buscar un centro desde la izquierda, sin desmarques."]].map(([id,text])=><button key={id} onClick={()=>setConfirm(id)} className={confirm===id?"selected":""}>{text}</button>)}</div>
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
