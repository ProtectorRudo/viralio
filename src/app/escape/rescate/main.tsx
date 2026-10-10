"use client";
import React,{useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {createRoot} from "react-dom/client";
import {createWorld,TARGETS,type Target,type ClueId,type World} from "./RescueWorld";
import styles from "./Rescue.module.css";

type Screen="intro"|"connecting"|"game"|"final";
type Overlay="none"|"inspect"|"lock"|"letter";
type Ev="calendar"|"cassette"|"memo";
type Config={fecha:string;hora:string;lugar:string};
const CODE="131026";
const EVIDENCE:Record<Ev,{title:string;value:string;body:string}>={
 calendar:{title:"Fotografía intervenida",value:"XIII",body:"Al dorso alguien escribió «XIII». Parece un número romano. No hay ninguna fecha escrita."},
 cassette:{title:"Cinta recuperada",value:"10",body:"La etiqueta de la cinta tiene escrito «10». El audio advierte que alguien está por regresar."},
 memo:{title:"Grabación vigilada",value:"2026",body:"Registro de seguridad: operación archivada en 2026. Para la clave solo importan las últimas dos cifras del año."},
};
const DESCRIPTIONS:Record<ClueId,string>={
 calendar:"Una vieja fotografía adherida a la pared. La parte de atrás podría esconder algo importante.",
 cassette:"El grabador está conectado, a pesar de que la habitación parece abandonada.",
 memo:"Un monitor de vigilancia conectado a la cámara. Su archivo contiene el año en que prepararon el operativo.",
 clock:"Un reloj viejo cuyas agujas quedaron detenidas. El mecanismo sigue conectado a alguna parte de la casa.",
 drawer:"Un cajón pesado, asegurado con un candado de seis ruedas. El sobre está adentro.",
 envelope:"Un sobre oscuro, con un lacre que lleva una letra M.",
 phone:"La línea está cortada. Al levantar el tubo se escucha el eco de una respiración.",
 camera:"La luz roja de REC se enciende. El monitor sobre la mesa derecha permite revisar las grabaciones.",
 board:"El tablero está cubierto de horarios, fotos y rutas. Estuvieron estudiando los movimientos de Mauro.",
 locker:"El armario contiene un abrigo mojado y botas demasiado grandes. No hay ninguna clave.",
 lamp:"La luz oscila y proyecta una silueta sobre la silla. Cuando volvés a mirar, desaparece.",
 pipe:"Del otro lado del conducto se oyen tres golpes. No forman parte del código.",
};
function fmtTime(t:number){return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function confettiPieces(){return Array.from({length:39},(_,i)=>({left:(i*37+11)%100+"%",delay:(i*13%19)/10+"s",duration:3+(i%6)*.6+"s",color:["#eeb86d","#ac504c","#e4e1cf","#607b87","#a28cbd"][i%5]}));}
const particles=confettiPieces();

function App(){
 const [screen,setScreen]=useState<Screen>("intro"),[overlay,setOverlay]=useState<Overlay>("none");
 const [seconds,setSeconds]=useState(180),[expired,setExpired]=useState(false);
 const [seen,setSeen]=useState<Ev[]>([]);
 const [photoFlipped,setPhotoFlipped]=useState(false);
 const [active,setActive]=useState<Target|null>(null),[focus,setFocus]=useState<Target|null>(null);
 const [near,setNear]=useState<Target[]>([]),[showNear,setShowNear]=useState(false);
 const [drawerOpen,setDrawerOpen]=useState(false),[digits,setDigits]=useState([0,0,0,0,0,0]),[wrong,setWrong]=useState(false);
 const [clockState,setClockState]=useState<"idle"|"running"|"done">("idle");
 const clockTimeout=useRef<number|null>(null);
 const [hintOpen,setHintOpen]=useState(false),[hintLevel,setHintLevel]=useState(0);
 const [openedLetter,setOpenedLetter]=useState(false),[sealBreaking,setSealBreaking]=useState(false),[evidenceExpanded,setEvidenceExpanded]=useState(false);
 const [muted,setMuted]=useState(false),[toast,setToast]=useState("");
 const [error,setError]=useState(""),[available,setAvailable]=useState(false);
 const overlayState=useRef<Overlay>("none"),expiredState=useRef(false);
 const world=useRef<World|null>(null),canvas=useRef<HTMLCanvasElement|null>(null),activeRef=useRef<Target|null>(null);
 const envelopeMarker=useRef<HTMLButtonElement|null>(null),unlockedRef=useRef(false);
 const joystick=useRef({x:0,y:0}),joyId=useRef<number|null>(null),joyBox=useRef<HTMLDivElement|null>(null);
 const pointer=useRef<{id:number;x:number;y:number;originX:number;originY:number;dragged:boolean}|null>(null),buttons=useRef(new Set<string>());
 const lastCanvasTap=useRef(0),raf=useRef(0),frameLast=useRef(0),audio=useRef<AudioContext|null>(null),drone=useRef<OscillatorNode|null>(null),audioRef=useRef(false);
 const tapeAudio=useRef<HTMLAudioElement|null>(null),musicAudio=useRef<HTMLAudioElement|null>(null);
 const [musicPlaying,setMusicPlaying]=useState(false);
 const [tapeStatus,setTapeStatus]=useState<"idle"|"playing"|"ended"|"error">("idle");
 const dialDrag=useRef<{id:number;index:number;y:number}|null>(null);
 const flags=useRef({unlocked:false,clockActivated:false,intruder:false});
 const [doorWarning,setDoorWarning]=useState(false),[figureWarning,setFigureWarning]=useState(false);
 const threatFired=useRef(false),ambientOsc=useRef<OscillatorNode[]>([]),threatTimers=useRef<number[]>([]),transitionTimer=useRef<number|null>(null),sealTimer=useRef<number|null>(null);
 const config=useRef<Config>({fecha:"13 DE OCTUBRE DE 2026",hora:"17:00 HS",lugar:"CALLE 49 ENTRE 26 Y 27 · LA PLATA"});
 useEffect(()=>{overlayState.current=overlay;expiredState.current=expired;},[overlay,expired]);
 useEffect(()=>()=>{if(clockTimeout.current!==null)window.clearTimeout(clockTimeout.current);if(transitionTimer.current!==null)window.clearTimeout(transitionTimer.current);if(sealTimer.current!==null)window.clearTimeout(sealTimer.current);},[]);
 useEffect(()=>()=>{for(const id of threatTimers.current)window.clearTimeout(id);threatTimers.current=[];},[]);
 useEffect(()=>{const q=new URLSearchParams(location.search);
  config.current={fecha:(q.get("fecha")||"13 DE OCTUBRE DE 2026").slice(0,80),hora:(q.get("hora")||"17:00 HS").slice(0,80),lugar:(q.get("lugar")||"CALLE 49 ENTRE 26 Y 27 · LA PLATA").slice(0,125)};
 },[]);
 useEffect(()=>{
  if(screen!=="game"||expired||overlay==="letter"||drawerOpen)return;
  const clock=window.setInterval(()=>setSeconds(t=>{if(t<=1){setExpired(true);return 0;}return t-1;}),1000);
  return()=>clearInterval(clock);
 },[screen,expired,overlay,drawerOpen]);
 useEffect(()=>{
  if(screen!=="game")return;
  const el=canvas.current;if(!el)return;
  let disposed=false;let engine:World|null=null;
  try{
   engine=createWorld(el,flags.current,(pos,target)=>{
    if(disposed)return;
    // World-space telemetry is also useful for joystick accessibility tests.
    el.dataset.cameraX=pos.x.toFixed(2);
    el.dataset.cameraZ=pos.z.toFixed(2);
     const marker=envelopeMarker.current;
     if(marker&&unlockedRef.current){
      const point=world.current?.project([.02,.79,-1.48]);
      if(point){marker.style.left=point.x+"px";marker.style.top=point.y+"px";
       marker.style.visibility=point.visible?"visible":"hidden";
       marker.dataset.anchorVisible=point.visible?"yes":"no";
       marker.dataset.worldDistance=point.distance.toFixed(2);
      }
     }
    if(activeRef.current?.id!==target?.id){activeRef.current=target;setActive(target);}
    // re-render of position deliberately throttled in engine.
   });
   world.current=engine;queueMicrotask(()=>{if(!disposed)setAvailable(true)});
  }catch(ex){const s=ex instanceof Error?ex.message:"No se pudo cargar el motor 3D";queueMicrotask(()=>{if(!disposed)setError(s)});}
  const onKeyDown=(e:KeyboardEvent)=>{const key=e.key.toLowerCase();
   if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)){buttons.current.add(key);if(overlayState.current==="none")e.preventDefault();}
   if(key==="e"&&overlayState.current==="none"&&!e.repeat){const t=world.current?.aim();if(t)examine(t);}
   if(key==="escape"&&overlayState.current!=="none"){setOverlay("none");}
  };
  const onKeyUp=(e:KeyboardEvent)=>buttons.current.delete(e.key.toLowerCase());
  window.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);
  const held=buttons.current;
  const move=(now:number)=>{
   if(disposed)return;
   raf.current=requestAnimationFrame(move);
   const dt=Math.min(.22,(now-(frameLast.current||now))/1000);frameLast.current=now;
   if(overlayState.current!=="none"||expiredState.current)return;
   const k=held,f=(k.has("w")||k.has("arrowup")?1:0)-(k.has("s")||k.has("arrowdown")?1:0);
   const side=(k.has("d")||k.has("arrowright")?1:0)-(k.has("a")||k.has("arrowleft")?1:0);
   world.current?.move(f-joystick.current.y,side+joystick.current.x,dt);
  };
  raf.current=requestAnimationFrame(move);
  return()=>{disposed=true;cancelAnimationFrame(raf.current);window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);held.clear();engine?.dispose();world.current=null;};
 // Start world exactly once per game, do not rebuild mesh as clues change.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[screen]);
 useEffect(()=>{
  if(screen!=="game"||muted||expired||drawerOpen)return;
  const id=window.setInterval(()=>{if(seconds<=48)sound("beat");else if(seconds<=105)sound("tick");},seconds<=48?1100:2400);
  return()=>clearInterval(id);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[screen,muted,expired,drawerOpen,seconds<=48,seconds<=105]);
 useEffect(()=>{
  if(screen!=="game"||expired||seconds>60||threatFired.current)return;
  threatFired.current=true;flags.current.intruder=true;world.current?.setFlags({...flags.current});
  setDoorWarning(true);setShowNear(false);setToast("RUIDO EN EL PASILLO · ¡LA PUERTA SE ESTÁ ABRIENDO!");
  sound("door");navigator.vibrate?.([140,100,260]);
  const schedule=(ms:number,cb:()=>void)=>threatTimers.current.push(window.setTimeout(cb,ms));
  schedule(1700,()=>sound("step"));
  schedule(3100,()=>sound("step"));
  schedule(4500,()=>sound("step"));
  schedule(10000,()=>{setFigureWarning(true);setToast("NO ESTÁS SOLO.");sound("step");navigator.vibrate?.([120,60,120]);});
  schedule(12900,()=>sound("metal"));
  schedule(16500,()=>setFigureWarning(false));
  schedule(8500,()=>setDoorWarning(false));
 // Audio/event is intentionally triggered exactly once.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[screen,expired,seconds]);
 function fallbackVoice(){
  if(!("speechSynthesis" in window)){setTapeStatus("error");setToast("LA GRABACIÓN NO ESTÁ DISPONIBLE. LEÉ LA TRANSCRIPCIÓN.");return;}
  const synth=window.speechSynthesis;
  synth.cancel();
  const voice=new SpeechSynthesisUtterance("Por favor... no pierdas tiempo... Van a volver.");
  voice.lang="es-AR";voice.rate=.78;voice.pitch=.74;voice.volume=1;
  const available=synth.getVoices();
  voice.voice=available.find(x=>x.lang==="es-AR")||available.find(x=>x.lang.startsWith("es"))||null;
  voice.onstart=()=>setTapeStatus("playing");
  voice.onend=()=>setTapeStatus("ended");
  voice.onerror=()=>setTapeStatus("error");
  synth.speak(voice);
 }
 function playTape(){
  sound("click");
  if(muted){setToast("PRIMERO ACTIVÁ EL SONIDO PARA ESCUCHAR LA CINTA");return;}
  const player=tapeAudio.current;
  if(!player||player.error){fallbackVoice();return;}
  player.pause();player.currentTime=0;player.volume=1;
  void player.play().then(()=>{setTapeStatus("playing");
   if(musicAudio.current)musicAudio.current.volume=.22;
  }).catch(()=>fallbackVoice());
 }
 function sound(type:"start"|"click"|"clue"|"wrong"|"unlock"|"beat"|"tick"|"celebrate"|"door"|"step"|"metal"|"paper"){
  if(muted||!audioRef.current)return;
  const a=audio.current;if(!a)return;
  try{
   if(a.state==="suspended")void a.resume();
   const now=a.currentTime,osc=a.createOscillator(),gain=a.createGain();
    if(type==="paper"){
     const len=Math.round(a.sampleRate*.75),buffer=a.createBuffer(1,len,a.sampleRate),samples=buffer.getChannelData(0);
     let seed=29013;for(let i=0;i<len;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      samples[i]=((seed/4294967296)*2-1)*(.24+.19*Math.sin(i/71))*Math.exp(-i/(len*.40));}
     const source=a.createBufferSource(),eq=a.createBiquadFilter(),amp=a.createGain();
     source.buffer=buffer;eq.type="bandpass";eq.frequency.value=1780;eq.Q.value=.64; amp.gain.value=.29;
     source.connect(eq);eq.connect(amp);amp.connect(a.destination);source.start(now);return;
    }
    if(type==="metal"){
     osc.type="sawtooth";osc.frequency.setValueAtTime(760,now);
     osc.frequency.exponentialRampToValueAtTime(1360,now+.16);
     osc.frequency.exponentialRampToValueAtTime(200,now+.68);
     gain.gain.setValueAtTime(.0001,now);
     gain.gain.exponentialRampToValueAtTime(.037,now+.045);
     gain.gain.exponentialRampToValueAtTime(.0001,now+.72);
     const band=a.createBiquadFilter();band.type="bandpass";band.frequency.value=970;band.Q.value=.75;
     osc.connect(band);band.connect(gain);gain.connect(a.destination);
     osc.start(now);osc.stop(now+.74);return;
    }
    if(type==="door"||type==="step"){
     // Layer real filtered texture under impacts, never a simple sine beep.
     const len=Math.round(a.sampleRate*(type==="door"?1.65:.43));
     const buffer=a.createBuffer(1,len,a.sampleRate),samples=buffer.getChannelData(0);
     let seed=type==="door"?554903:10388,low=0;
     for(let i=0;i<len;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const white=seed/2147483648-1;
      low=low*.91+white*.09;
      const t=i/a.sampleRate;
      const env=type==="door"?
       Math.min(1,t/.12)*Math.exp(-t*.8)*(1+.24*Math.sin(t*39)):
       Math.min(1,t/.018)*Math.exp(-t*15);
      samples[i]=(low*.64+white*.08)*env;
     }
     const source=a.createBufferSource(),filter=a.createBiquadFilter(),body=a.createGain();
     source.buffer=buffer;filter.type="lowpass";filter.frequency.value=type==="door"?830:440;
     filter.Q.value=type==="door"?1.15:.50;body.gain.value=type==="door"?.52:.47;
     source.connect(filter);filter.connect(body);body.connect(a.destination);
     source.start(now);
     // Dull structural thump makes the footstep physical, not electronic.
     osc.type="triangle";
     osc.frequency.setValueAtTime(type==="door"?94:63,now);
     osc.frequency.exponentialRampToValueAtTime(type==="door"?31:39,now+(type==="door"?.83:.21));
     gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(type==="door"?.085:.11,now+.026);
     gain.gain.exponentialRampToValueAtTime(.0001,now+(type==="door"?.86:.23));
     osc.connect(gain);gain.connect(a.destination);osc.start(now);osc.stop(now+(type==="door"?.9:.24));
     return;
    }
   osc.type=type==="wrong"||type==="beat"?"sine":type==="celebrate"?"triangle":"sawtooth";
   const freq={start:93,click:270,clue:390,wrong:64,unlock:490,beat:48,tick:890,celebrate:600}[type];
   osc.frequency.setValueAtTime(freq,now);
   osc.frequency.exponentialRampToValueAtTime(type==="wrong"?38:type==="celebrate"?940:Math.max(42,freq*.7),now+.25);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(type==="beat"?.075:type==="tick"?.018:.1,now+.02);
   gain.gain.exponentialRampToValueAtTime(.0001,now+.33);
   osc.connect(gain);gain.connect(a.destination);osc.start(now);osc.stop(now+.35);
  }catch{/* Audio may be disabled by the OS */}
 }
 function start(){
  if(screen!=="intro")return;
  try{
   const ctx=new AudioContext();audio.current=ctx;audioRef.current=true;void ctx.resume();
  }catch{/* Audio effects are optional; music still plays */}
  // Real soundtrack must not depend on AudioContext support.
  const recording=musicAudio.current;
  if(recording){
   recording.volume=.65;
   void recording.play().then(()=>setMusicPlaying(true)).catch(()=>{
    setMusicPlaying(false);setToast("TOCÁ «ACTIVAR MÚSICA» PARA ESCUCHAR LA BANDA SONORA");
   });
  }
  setScreen("connecting");transitionTimer.current=window.setTimeout(()=>setScreen("game"),1450);
 }
 function toggleMute(){
  const player=musicAudio.current;
  if(!muted&&!musicPlaying){
   if(player)void player.play().then(()=>setMusicPlaying(true)).catch(()=>setToast("VOLVÉ A TOCAR PARA ACTIVAR EL AUDIO"));
   return;
  }
  const next=!muted;setMuted(next);
  if(next){player?.pause();tapeAudio.current?.pause();window.speechSynthesis?.cancel();setMusicPlaying(false);}
  else if(player){player.volume=.65;void player.play().then(()=>setMusicPlaying(true)).catch(()=>setToast("VOLVÉ A TOCAR PARA ACTIVAR EL AUDIO"));}
 }
 function viewDown(e:ReactPointerEvent<HTMLCanvasElement>){
  if(e.pointerType==="mouse"&&e.button!==0)return;
  pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,originX:e.clientX,originY:e.clientY,dragged:false};e.currentTarget.setPointerCapture(e.pointerId);
 }
 function viewMove(e:ReactPointerEvent<HTMLCanvasElement>){
  const p=pointer.current;if(p?.id!==e.pointerId||overlay!=="none")return;
  const moved=p.dragged||Math.hypot(e.clientX-p.originX,e.clientY-p.originY)>13;
  if(moved)world.current?.look(e.clientX-p.x,e.clientY-p.y);
  pointer.current={...p,x:e.clientX,y:e.clientY,dragged:moved};
 }
 function viewUp(e:ReactPointerEvent<HTMLCanvasElement>){
  const gesture=pointer.current;if(gesture?.id!==e.pointerId)return;pointer.current=null;
  lastCanvasTap.current=performance.now();
  if(!gesture.dragged&&overlayState.current==="none"&&!expiredState.current)pickOnCanvas(e.currentTarget,e.clientX,e.clientY);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 function pickOnCanvas(el:HTMLCanvasElement,clientX:number,clientY:number){
  const rect=el.getBoundingClientRect();
  const obj=world.current?.pick(clientX-rect.left,clientY-rect.top,rect.width,rect.height);
  if(obj)examine(obj);
 }
 // Fallback for Android embedded WebViews that suppress the touch pointer-up.
 function viewClick(e:React.MouseEvent<HTMLCanvasElement>){
  if(performance.now()-lastCanvasTap.current<350||overlayState.current!=="none"||expiredState.current)return;
  pickOnCanvas(e.currentTarget,e.clientX,e.clientY);
 }
 function cancelView(){pointer.current=null;}
 function joyStart(e:ReactPointerEvent<HTMLDivElement>){if(joyId.current!==null)return;
  e.preventDefault();joyId.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);joyMove(e);
 }
 function joyMove(e:ReactPointerEvent<HTMLDivElement>){
  if(joyId.current!==e.pointerId)return;
  const b=joyBox.current?.getBoundingClientRect();if(!b)return;
  let x=(e.clientX-(b.left+b.width/2))/(b.width*.33),y=(e.clientY-(b.top+b.height/2))/(b.height*.33);
  const len=Math.max(1,Math.hypot(x,y));x/=len;y/=len;joystick.current={x,y};
  const knob=e.currentTarget.querySelector<HTMLElement>("[data-knob]");
  if(knob)knob.style.transform=`translate(calc(-50% + ${x*33}px),calc(-50% + ${y*33}px))`;
 }
 function joyEnd(e:ReactPointerEvent<HTMLDivElement>){
  if(joyId.current!==e.pointerId)return;joyId.current=null;joystick.current={x:0,y:0};
  const knob=e.currentTarget.querySelector<HTMLElement>("[data-knob]");
  if(knob)knob.style.transform="translate(-50%,-50%)";
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 function examine(t:Target){
  if(t.id==="envelope"&&!drawerOpen)return;
  if(t.id==="cassette")playTape();
  if(t.id==="calendar")setPhotoFlipped(false);
  setFocus(t);
  setOverlay(t.id==="drawer"?"lock":t.id==="envelope"?"letter":"inspect");
  setShowNear(false);sound("click");
 }
 function closeInspect(){tapeAudio.current?.pause();window.speechSynthesis?.cancel();if(musicAudio.current)musicAudio.current.volume=.65;setTapeStatus("idle");setOverlay("none");setFocus(null);setWrong(false);}
 function touchObject(){
  const obj=world.current?.aim()||active;
  if(obj)examine(obj);
  else{setNear(world.current?.nearby()||[]);setShowNear(true);setToast("Acercate y apuntá a un objeto, o elegilo entre los cercanos.");}
 }
 function discover(k:Ev){
  setSeen(old=>old.includes(k)?old:[...old,k]);sound("clue");
  setToast("EVIDENCIA RECUPERADA · "+EVIDENCE[k].title);
 }
 function activate(){
  if(!focus)return;
  if(focus.id==="clock"){activateClock();return;}
  if(focus.id in EVIDENCE){discover(focus.id as Ev);}
  else sound("click");
  closeInspect();
 }
 function activateClock(){
  if(clockState!=="idle")return;
  setClockState("running");
  flags.current.clockActivated=true;
  world.current?.setFlags({...flags.current});
  sound("click");
  clockTimeout.current=window.setTimeout(()=>{
    setClockState("done");
    sound("clue");
    setToast("RELOJ ACTIVADO · LAS AGUJAS SE DETUVIERON EN LAS 17:00 HS");
  },3100);
 }
 function wheel(index:number,step:number){setDigits(old=>old.map((v,i)=>i===index?(v+step+10)%10:v));sound("click")}
 function dialStart(e:ReactPointerEvent<HTMLDivElement>,i:number){
  // A pointer capture on the wheel container would steal release/click from
  // its arrow buttons. Only capture gestures starting on the central digit.
  if((e.target as HTMLElement).closest("button"))return;
  if(e.pointerType==="mouse"&&e.button!==0)return;
  dialDrag.current={id:e.pointerId,index:i,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);
 }
 function dialMove(e:ReactPointerEvent<HTMLDivElement>){
  const p=dialDrag.current;if(!p||p.id!==e.pointerId)return;
  const delta=p.y-e.clientY;
  if(Math.abs(delta)>=18){wheel(p.index,Math.sign(delta));dialDrag.current={...p,y:e.clientY};}
 }
 function dialEnd(e:ReactPointerEvent<HTMLDivElement>){
  if(dialDrag.current?.id!==e.pointerId)return;dialDrag.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 function unlock(){
  if(digits.join("")!==CODE){setWrong(true);sound("wrong");setToast("CLAVE INCORRECTA · REVISÁ LAS PISTAS");navigator.vibrate?.([50,70,50]);return;}
  setWrong(false);setDrawerOpen(true);unlockedRef.current=true;flags.current.unlocked=true;world.current?.setFlags({...flags.current});
  sound("unlock");navigator.vibrate?.([80,40,130]);closeInspect();
  const envelopeTarget=TARGETS.find(t=>t.id==="envelope");if(envelopeTarget)world.current?.lookAt(envelopeTarget);
  setToast("¡ABRISTE EL CAJÓN! EL SOBRE ESTÁ FRENTE A VOS.");
 }
 function envelope(){
  if(sealBreaking||openedLetter)return;
  setSealBreaking(true);sound("paper");navigator.vibrate?.([25,35,90]);
  sealTimer.current=window.setTimeout(()=>{setOpenedLetter(true);setSealBreaking(false);sound("unlock");},1260);
 }
 function finish(){musicAudio.current?.pause();for(const id of threatTimers.current)window.clearTimeout(id);threatTimers.current=[];sound("celebrate");window.speechSynthesis?.cancel();setScreen("final");setOverlay("none");drone.current?.stop();drone.current=null;for(const osc of ambientOsc.current)osc.stop();ambientOsc.current=[];}
 function extend(){setSeconds(60);setExpired(false);setToast("UNA ÚLTIMA OPORTUNIDAD · +01:00");sound("start")}
 const HINTS=["Las tres pruebas están en objetos distintos. La fotografía parece ocultar algo más en su reverso."];
 function hint(){
  setHintOpen(true);setHintLevel(1);sound("click");
 }
 function shareMessage(){
  const {fecha,hora,lugar}=config.current;
  return `¡Rescaté a Mauro! 🎉 ¡Estás invitado al cumple de Mauro! 🥳 Fecha: ${fecha}. Hora: ${hora}. Lugar: ${lugar}.`;
 }
 async function copyInvite(){
  try{await navigator.clipboard.writeText(shareMessage());setToast("INVITACIÓN COPIADA");}
  catch{setToast("No se pudo copiar. Usá Compartir por WhatsApp.");}
 }
 const canContinue=seen.length===3;
 return <main className={styles.app} data-stage={screen} data-testid="rescate-mauro-app">
   <audio data-testid="rescate-music-audio" ref={musicAudio} src="./audio/suspense.wav" preload="auto" loop
     onPlaying={()=>setMusicPlaying(true)} onPause={()=>setMusicPlaying(false)}
     onError={()=>{setMusicPlaying(false);setToast("MÚSICA NO DISPONIBLE · REINTENTÁ SONIDO");}}/>
   <audio data-testid="rescate-tape-audio" ref={tapeAudio} src="./audio/rescue-message.mp3" preload="auto"
     onEnded={()=>{setTapeStatus("ended");if(musicAudio.current)musicAudio.current.volume=.65}}
     onError={()=>setTapeStatus("error")}/>
  {screen==="intro"&&<section className={styles.intro}>
    <div className={styles.noise}/><div className={styles.introBackdrop} aria-hidden="true"><div className={styles.introDoor}><i/></div><div className={styles.introLight}/></div>
    <span className={styles.classified}>CANAL 09 / M·013 <i>◉</i> TRANSMISIÓN INTERCEPTADA</span>
    <span className={styles.radar} aria-hidden="true"><i/><i/><i/></span>
    <div className={styles.introText}>
      <span className={styles.red}>◉ ACCESO CONFIDENCIAL · OPERACIÓN M</span>
      <h1>SECUESTRARON<br/><em>A MAURO.</em></h1><span className={styles.introSubline}>LA ÚLTIMA TRANSMISIÓN SIGUE ABIERTA.</span>
      <p>Una habitación abandonada. Una voz que pide ayuda. <strong>Tres minutos</strong> antes de que vuelvan.</p>
      <div className={styles.introCard}>
        <span><i className={styles.recDot}/> CINTA N.º 013 · MENSAJE INTERCEPTADO</span>
        <div className={styles.waveform} aria-hidden="true">{Array.from({length:39},(_,i)=><i key={i} style={{height:(8+(i*17%30))+"px"}}/>)}</div>
        <p>«Si querés saber dónde está Mauro… abrí el cajón. Encontrá las seis cifras. El tiempo ya está corriendo».</p>
       </div>
      <div className={styles.introTimer}>03<span>:</span>00 <small>PARA RESOLVER EL CASO</small></div>
      <button type="button" className={styles.start} onClick={start}>INICIAR RESCATE <span>↗</span></button>
      <small className={styles.disclaimer}>Experiencia de ficción y entretenimiento · No se trata de una emergencia real</small>
    </div>
    <div className={styles.introFooter}>CASO M · CINE INTERACTIVO · MISIÓN PERSONALIZADA</div>
   </section>}
  {screen==="connecting"&&<section className={styles.connecting} data-testid="rescate-connecting" aria-live="polite">
    <div className={styles.connectingFrame}><i className={styles.recDot}/> CANAL INTERCEPTADO / M-013
      <div className={styles.connectionBars}>{Array.from({length:23},(_,i)=><b key={i} style={{height:(11+i*11%42)+"px"}}/>)}</div>
      <strong>RESTABLECIENDO SEÑAL...</strong><span>NO HAGAS RUIDO. YA ESTÁS ADENTRO.</span>
    </div>
   </section>}
  {screen==="game"&&<>
    <canvas ref={canvas} className={styles.canvas} data-testid="rescate-webgl" onPointerDown={viewDown} onPointerMove={viewMove} onPointerUp={viewUp} onPointerCancel={cancelView} onLostPointerCapture={cancelView} onClick={viewClick} aria-label="Habitación 3D: tocá objetos para abrirlos y deslizá para mirar"/>
    <div className={styles.film} aria-hidden="true"/>
    <div className={styles.sceneGrain} aria-hidden="true"/>
    {seconds<=60&&!drawerOpen&&<div className={styles.pulseFrame} aria-hidden="true"/>}
    <div className={styles.threatVignette} data-threat={flags.current.intruder?"yes":"no"} aria-hidden="true"/>
    {figureWarning&&<div className={styles.knifeAlert} data-testid="rescate-knife-alert" role="alert"><span>ADVERTENCIA · PRESENCIA DETECTADA</span><strong>NO ESTÁS SOLO.</strong><small>¡APURATE, EL TIEMPO SE AGOTA!</small></div>}
    {doorWarning&&<div className={styles.doorAlert} data-testid="rescate-intruder-alert" role="alert"><span>¡ESCUCHASTE ESO!</span><strong>ALGUIEN ESTÁ ABRIENDO LA PUERTA.</strong><small>NO TE DETENGAS · QUEDA 1 MINUTO</small></div>}
    <header className={styles.hud}>
      <div className={styles.hudTitle}><span>CASO 013 · OPERACIÓN RESCATE</span><strong>¿DÓNDE ESTÁ MAURO?</strong></div>
      <div className={styles.countdown} data-critical={seconds<=35?"yes":"no"} data-testid="rescate-timer"><small>TIEMPO RESTANTE</small><strong>{fmtTime(seconds)}</strong></div>
    </header>
    <div className={styles.topHints}>
      <span>PRUEBAS {seen.length}/3</span>
      <button type="button" onClick={hint} data-testid="rescate-hint-button">◈ {hintLevel?"VER MI PISTA":"RECIBIR UNA PISTA"}</button>
      <button type="button" onClick={toggleMute}>{muted?"SONIDO OFF":musicPlaying?"MÚSICA ON":"ACTIVAR MÚSICA"}</button>
    </div>
    {error&&<div className={styles.fallback}><h2>Modo 3D no disponible</h2><p>{error}</p><button onClick={()=>{setError("");setAvailable(false);setScreen("intro")}}>VOLVER</button><small>Podemos adaptar esta experiencia a 2.5D si tu teléfono no admite WebGL.</small></div>}
    {!available&&!error&&<div className={styles.load}>INICIANDO RECONSTRUCCIÓN TRIDIMENSIONAL...</div>}
    <div className={styles.reticle} data-has-target={active?"yes":"no"}><span>{active?"◇":"·"}</span></div>
    {active&&overlay==="none"&&<div className={styles.target}><span>TOCÁ PARA INVESTIGAR</span><strong>{active.label}</strong></div>}
    <div className={styles.objectives} data-collapsed={!evidenceExpanded?"yes":"no"}>
     <button type="button" className={styles.dossierToggle} onClick={()=>setEvidenceExpanded(v=>!v)}
       aria-expanded={evidenceExpanded} data-testid="rescate-dossier-toggle">
       <span>◈ EXPEDIENTE · {seen.length}/3 INDICIOS</span><b>{evidenceExpanded?"−":"+"}</b></button>
     <div className={styles.dossierContents}><span>INDICIOS RECUPERADOS</span>
      {seen.map((k,i)=><div key={k} data-found="yes" className={styles.evidenceSlip} style={{transform:`rotate(${[-3,2,-1][i]}deg)`}}>◆ <span>{EVIDENCE[k].title} · {EVIDENCE[k].value}</span></div>)}
      {Array.from({length:3-seen.length},(_,i)=><div key={"empty"+i} data-found="no">◇ <span>INDICIO SIN RECUPERAR</span></div>)}
     </div>
    </div>
    {drawerOpen&&overlay==="none"&&<button ref={envelopeMarker} type="button" className={styles.envelopeBeacon} data-testid="rescate-envelope-beacon" onClick={()=>{const target=TARGETS.find(t=>t.id==="envelope");if(target)examine(target);}}>
       <span className={styles.beaconArrow}>↙</span><strong>¡AHÍ ESTÁ EL SOBRE!</strong><small>TOCÁ PARA ABRIRLO</small>
     </button>}
    <div className={styles.controlBar}>
      <div className={styles.joyColumn}>
       <div ref={joyBox} className={styles.joy} onPointerDown={joyStart} onPointerMove={joyMove} onPointerUp={joyEnd} onPointerCancel={joyEnd} onLostPointerCapture={()=>{joyId.current=null;joystick.current={x:0,y:0}}} data-testid="rescate-joystick" aria-label="Joystick para caminar">
        <i className={styles.joyRing}/><i data-knob className={styles.joyKnob}/><small>↑</small>
       </div><span>CAMINAR</span>
      </div>
      <div className={styles.actions}>
       <button className={styles.actionButton} type="button" onClick={touchObject}>◎ INVESTIGAR</button>
       <button className={styles.scanButton} type="button" onClick={()=>{setNear(world.current?.nearby()||[]);setShowNear(x=>!x)}} aria-expanded={showNear}>⌕ OBJETOS CERCANOS</button>
       <span>TOCÁ UN OBJETO O DESLIZÁ PARA MIRAR</span>
      </div>
    </div>
    {showNear&&<div className={styles.nearby} data-testid="rescate-nearby"><div>OBJETOS A TU ALCANCE <button onClick={()=>setShowNear(false)} aria-label="Cerrar objetos cercanos">✕</button></div>
     {near.length?near.map(t=><button key={t.id} onClick={()=>examine(t)}>{t.label} <span>↗</span></button>):<p>Caminá más cerca de los muebles.</p>}
    </div>}
    {hintOpen&&<aside className={styles.hintPanel} data-testid="rescate-hint-panel" aria-label="Pista de la misión">
      <div className={styles.hintHead}><span>AYUDA CONFIDENCIAL · PISTA ÚNICA</span><button type="button" aria-label="Cerrar pista" onClick={()=>setHintOpen(false)}>✕</button></div>
      <p>{HINTS[Math.max(0,hintLevel-1)]}</p>
    </aside>}
    {toast&&<div className={styles.toast} role="status" onClick={()=>setToast("")}>{toast} <button type="button" aria-label="Cerrar aviso" onClick={()=>setToast("")}>✕</button></div>}
    {overlay==="inspect"&&focus&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label={"Examinar "+focus.label}><div className={styles.inspectCard}>
      <span>ARCHIVO / INSPECCIÓN</span><h2>{focus.label}</h2><p>{DESCRIPTIONS[focus.id]}</p>
      {focus.id==="clock"&&<div className={styles.clockInteraction} data-testid="rescate-clock" data-clock={clockState}>
       <div className={styles.clockDial} aria-label="Reloj mecánico con las agujas girando hasta las cinco en punto">
        <span className={styles.clockTwelve}>12</span><span className={styles.clockThree}>3</span><span className={styles.clockSix}>6</span><span className={styles.clockNine}>9</span>
        <i className={styles.clockHour}/><i className={styles.clockMinute}/><i className={styles.clockAxle}/>
       </div>
       <p>{clockState==="idle"?"Pulsá el mecanismo para que las agujas recuperen su última posición.":clockState==="running"?"Las agujas giran cada vez más rápido...":"SEÑAL RECUPERADA · 17:00 HS"}</p>
       <button type="button" className={styles.clockStart} onClick={activateClock} disabled={clockState!=="idle"}>{clockState==="idle"?"⟳ ACTIVAR Y GIRAR LAS AGUJAS":clockState==="running"?"GIRANDO...":"✓ DETENIDO EN 17:00"}</button>
      </div>}
      {focus.id==="calendar"&&<div className={styles.photoInspection} data-testid="rescate-photo" data-flipped={photoFlipped?"yes":"no"}>
       <div className={styles.polaroidCard}><div className={styles.polaroidVisual}>
         {!photoFlipped?<><i className={styles.photoShadow}/><i className={styles.photoScratch}/></>:<div className={styles.photoMark}><small>ESCRITO EN EL REVERSO</small><strong>XIII</strong><span>¿QUÉ SIGNIFICA?</span></div>}
       </div><span>{photoFlipped?"EVIDENCIA / ENCONTRADA":"ARCHIVO FOTOGRÁFICO SIN FECHA"}</span></div>
       <button type="button" className={styles.photoFlipButton} onClick={()=>{setPhotoFlipped(v=>!v);sound("click")}}>{photoFlipped?"↶ VOLVER A MIRAR EL FRENTE":"↻ DAR VUELTA LA FOTOGRAFÍA"}</button>
      </div>}
      {focus.id==="memo"&&<div className={styles.surveillanceScreen} data-testid="rescate-surveillance">
        <div className={styles.surveillanceHeader}><span>● REC · CÁMARA 03</span><span>ARCHIVO 2026</span></div>
        <div className={styles.surveillanceFootage}><span>OBJETIVO / M</span><i/><i/><div className={styles.surveillanceCross}>+</div><small>SEGUIMIENTO ARCHIVADO</small></div>
        <p>REGISTRO OPERATIVO: <strong>2026</strong></p><small>SOLO IMPORTAN LAS DOS ÚLTIMAS CIFRAS DEL AÑO</small>
       </div>}
       {focus.id==="board"&&<div className={styles.investigationBoard} data-testid="rescate-investigation-board">
        <strong>OPERACIÓN M · PLAN DE SEGUIMIENTO</strong>
        <div><span>07:10</span> INICIO DE RUTINA / OBSERVADO</div>
        <div><span>12:40</span> TRAYECTO EN LA CIUDAD / CONFIRMADO</div>
        <div><span>17:00</span> ÚLTIMO MOVIMIENTO / SIN VERIFICAR</div>
        <div><span>ARCH.</span> FOTOGRAFÍAS, HORARIOS Y RECORTES</div>
        <small>NO TODAS LAS NOTAS SON CLAVES DEL CANDADO.</small>
       </div>}
       {focus.id==="cassette"&&<div className={styles.tapeControl} data-testid="rescate-voice"><span>● CINTA RECUPERADA · SEÑAL INTERCEPTADA</span><p>«Por favor, no pierdas tiempo… van a volver».</p><small>MENSAJE RECONSTRUIDO · VOZ PROVISIONAL, NO ES LA VOZ ORIGINAL</small><button type="button" data-testid="rescate-play-tape" onClick={playTape}>{tapeStatus==="playing"?"↻ VOLVER A ESCUCHAR":"▶ REPRODUCIR GRABACIÓN"}</button><small className={styles.tapeStatus} role="status">{tapeStatus==="playing"?"● REPRODUCIENDO":tapeStatus==="error"?"REPRODUCÍ CON EL BOTÓN · RESPALDO DE VOZ DISPONIBLE":tapeStatus==="ended"?"CINTA FINALIZADA":"PULSÁ PARA ESCUCHAR"}</small></div>}
      {focus.id in EVIDENCE&&(focus.id!=="calendar"||photoFlipped)?<div className={styles.evidence}><span>INDICIO ENCONTRADO</span><strong>{EVIDENCE[focus.id as Ev].value}</strong><p>{EVIDENCE[focus.id as Ev].body}</p></div>:<p className={styles.redHerring}>{focus.hint}</p>}
      {focus.id!=="clock"&&<button className={styles.confirm} onClick={activate} disabled={focus.id==="calendar"&&!photoFlipped}>{focus.id==="calendar"&&!photoFlipped?"PRIMERO REVISÁ EL REVERSO":focus.id in EVIDENCE?"GUARDAR EVIDENCIA EN EL EXPEDIENTE":"TERMINAR INSPECCIÓN"} →</button>}
      <button className={styles.secondary} onClick={closeInspect}>VOLVER A LA SALA</button>
    </div></div>}
    {overlay==="lock"&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label="Candado de seis cifras"><div className={styles.lockCard}>
      <span className={styles.lockSerial}>CAJÓN N.º 013 · CERRADURA MECÁNICA</span>
      <h2>SEIS CIFRAS.</h2><p>Las seis ruedas esconden una combinación. Buscá patrones entre los indicios y girá con el dedo.</p>
      <div className={styles.dials} data-testid="rescate-lock">
       {digits.map((d,i)=><div key={i} className={styles.dial} onPointerDown={e=>dialStart(e,i)} onPointerMove={dialMove} onPointerUp={dialEnd} onPointerCancel={dialEnd} onLostPointerCapture={()=>{dialDrag.current=null}}>
        <button type="button" aria-label={"Subir cifra "+(i+1)} onClick={()=>wheel(i,1)}>⌃</button>
        <strong aria-label={"Cifra "+(i+1)+": "+d}>{d}</strong>
        <button type="button" aria-label={"Bajar cifra "+(i+1)} onClick={()=>wheel(i,-1)}>⌄</button>
       </div>)}
      </div>
      {wrong&&<div className={styles.wrong}>CLAVE RECHAZADA. REVISÁ EL EXPEDIENTE.</div>}
      <button type="button" className={styles.confirm} onClick={unlock}>⛓ PROBAR COMBINACIÓN</button>
      <button type="button" className={styles.secondary} onClick={closeInspect}>VOLVER A BUSCAR PISTAS {canContinue?"· TENÉS TODO":""}</button>
    </div></div>}
    {overlay==="letter"&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label="Sobre del cajón"><div className={styles.letterCard} data-open={openedLetter?"yes":"no"} data-breaking={sealBreaking?"yes":"no"}>
      {!openedLetter?<><span className={styles.letterCaption}>EVIDENCIA FINAL · UN MENSAJE PARA VOS</span>
       <span className={styles.sealInstruction}>{sealBreaking?"EL SELLO SE ESTÁ ROMPIENDO…":"ESTABA ESPERANDO A QUE LO ENCONTRARAS."}</span>
       <button className={styles.envelope} type="button" onClick={envelope} disabled={sealBreaking} aria-label="Romper el sello del sobre y abrirlo">
        <i className={styles.envelopeSeam}/><i className={styles.flap}/><b>M</b><small>PERSONAL · CONFIDENCIAL</small>
       </button><p>Hay algo escrito adentro. Pero antes tenés que romper el sello.</p></>
       :<><span className={styles.letterCaption}>EXPEDIENTE M-013 · EL SECRETO</span>
        <div className={styles.letterInside} data-testid="rescate-letter-inside"><small>CONFIDENCIAL / PARA VOS</small>
          <h2>ESTA VEZ,<br/>LA MISIÓN ES OTRA.</h2>
          <p>Nunca tuviste que rescatar a Mauro. <strong>Tenías que encontrar la invitación.</strong></p>
          <p className={styles.letterReveal}>TE ESPERAMOS PARA CELEBRAR.</p>
        </div></>}
      <button className={styles.confirm} disabled={sealBreaking} onClick={openedLetter?finish:envelope}>{openedLetter?"REVELAR MI INVITACIÓN →":sealBreaking?"ROMPIENDO EL LACRE…":"ROMPER EL LACRE →"}</button>
    </div></div>}
    {expired&&<div className={styles.timeout} role="dialog" aria-modal="true" aria-label="Tiempo agotado">
      <span>00:00 · CONEXIÓN PERDIDA</span><h2>SE TERMINÓ EL TIEMPO.</h2><p>Pero Mauro dejó una última oportunidad. La puerta sigue entreabierta...</p>
      <button onClick={extend}>RECIBIR 1 MINUTO EXTRA →</button>
    </div>}
    <footer className={styles.gameBottom}><span>WASD · JOYSTICK · ARRASTRÁ PARA MIRAR</span><span>EXPERIENCIA FICTICIA</span></footer>
   </>}
  {screen==="final"&&<section className={styles.finale} data-testid="rescate-invite-final">
    <div className={styles.confetti} aria-hidden="true">{particles.map((p,i)=><i key={i} style={{left:p.left,animationDelay:p.delay,animationDuration:p.duration,background:p.color}}/>)}</div>
    <span className={styles.finalKicker}>MISIÓN CUMPLIDA · EXPEDIENTE M-013 CERRADO</span>
    <h1>NO ERA UN SECUESTRO.<em>ERA UNA INVITACIÓN.</em></h1>
    <div className={styles.invitationPaper}>
      <span className={styles.inviteEyebrow}>INVITACIÓN PRIVADA · CELEBRACIÓN 2026</span>
      <div className={styles.partyIcon}>✳</div><div className={styles.inviteMonogram}>M<span>·</span>013</div>
      <h2>Una noche para celebrar.</h2>
      <p>Seguiste las pistas, desafiaste al reloj y abriste el último sobre. <strong>Ahora sólo falta una cosa: que estés ahí.</strong></p>
      <div className={styles.details}><div><small>FECHA</small><strong>{config.current.fecha}</strong></div><div><small>HORA</small><strong>{config.current.hora}</strong></div><div><small>LUGAR</small><strong>{config.current.lugar}</strong></div></div>
      <p className={styles.secret}>La mejor parte del caso comienza cuando llegues.</p>
    </div>
    <div className={styles.finalActions}>
     <button onClick={copyInvite}>✧ GUARDAR LOS DATOS</button>
     <a href={"https://api.whatsapp.com/send?text="+encodeURIComponent(shareMessage())} target="_blank" rel="noopener noreferrer">COMPARTIR POR WHATSAPP ↗</a>
    </div>
    <button className={styles.replay} onClick={()=>{setScreen("intro");setSeconds(180);setExpired(false);setSeen([]);setDigits([0,0,0,0,0,0]);setClockState("idle");setHintOpen(false);setHintLevel(0);if(clockTimeout.current!==null)window.clearTimeout(clockTimeout.current);setDrawerOpen(false);unlockedRef.current=false;flags.current.unlocked=false;flags.current.clockActivated=false;flags.current.intruder=false;threatFired.current=false;setDoorWarning(false);setFigureWarning(false);for(const id of threatTimers.current)window.clearTimeout(id);threatTimers.current=[];setPhotoFlipped(false);setOpenedLetter(false);setSealBreaking(false);setEvidenceExpanded(false);setToast("");setOverlay("none");setAvailable(false);setError("");for(const osc of ambientOsc.current)osc.stop();ambientOsc.current=[];drone.current?.stop();drone.current=null;window.speechSynthesis?.cancel();musicAudio.current?.pause();setMusicPlaying(false);void audio.current?.close();audio.current=null;audioRef.current=false;}}>↺ VOLVER A VIVIR LA EXPERIENCIA</button>
    {toast&&<p className={styles.finalToast} role="status">{toast}</p>}
   </section>}
 </main>;
}

const mount=document.getElementById("rescate-root");
if(mount)createRoot(mount).render(<App/>);
