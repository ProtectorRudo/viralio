"use client";
import React,{useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {createRoot} from "react-dom/client";
import {createWorld,TARGETS,type Target,type ClueId,type World} from "./RescueWorld";
import styles from "./Rescue.module.css";

type Screen="intro"|"game"|"final";
type Overlay="none"|"inspect"|"lock"|"letter";
type Ev="calendar"|"cassette"|"memo";
type Config={fecha:string;hora:string;lugar:string};
const CODE="1310";
const EVIDENCE:Record<Ev,{title:string;value:string;body:string}>={
 calendar:{title:"El calendario",value:"13",body:"Alguien rodeó con tinta el día TRECE. El resto de los días fue tachado."},
 cassette:{title:"Cinta recuperada",value:"10",body:"Una voz distorsionada repite: «El mes de octubre. El décimo mes. No lo olvides»."},
 memo:{title:"Orden de operación",value:"DÍA → MES",body:"«Primero el día. Después el mes. Cuatro ruedas. Nadie conseguirá abrirlo a ciegas»."},
};
const DESCRIPTIONS:Record<ClueId,string>={
 calendar:"Un calendario de octubre, casi completamente destruido. Una fecha está encerrada en rojo.",
 cassette:"El grabador está conectado, a pesar de que la habitación parece abandonada.",
 memo:"Un documento confidencial dejado sobre la mesa. Alguien quiso que lo encontraras.",
 drawer:"Un cajón pesado, asegurado con un candado de cuatro ruedas. El sobre está adentro.",
 envelope:"Un sobre oscuro, con un lacre que lleva una letra M.",
 phone:"La línea está cortada. Al levantar el tubo se escucha el eco de una respiración.",
 camera:"La luz roja de REC se enciende. Alguien sigue tu recorrido desde otra habitación.",
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
 const [active,setActive]=useState<Target|null>(null),[focus,setFocus]=useState<Target|null>(null);
 const [near,setNear]=useState<Target[]>([]),[showNear,setShowNear]=useState(false);
 const [drawerOpen,setDrawerOpen]=useState(false),[digits,setDigits]=useState([0,0,0,0]),[wrong,setWrong]=useState(false);
 const [openedLetter,setOpenedLetter]=useState(false);
 const [muted,setMuted]=useState(false),[toast,setToast]=useState("");
 const [error,setError]=useState(""),[available,setAvailable]=useState(false);
 const overlayState=useRef<Overlay>("none"),expiredState=useRef(false);
 const world=useRef<World|null>(null),canvas=useRef<HTMLCanvasElement|null>(null),activeRef=useRef<Target|null>(null);
 const joystick=useRef({x:0,y:0}),joyId=useRef<number|null>(null),joyBox=useRef<HTMLDivElement|null>(null);
 const pointer=useRef<{id:number;x:number;y:number}|null>(null),buttons=useRef(new Set<string>());
 const raf=useRef(0),frameLast=useRef(0),audio=useRef<AudioContext|null>(null),drone=useRef<OscillatorNode|null>(null),droneGain=useRef<GainNode|null>(null),audioRef=useRef(false);
 const dialDrag=useRef<{id:number;index:number;y:number}|null>(null);
 const flags=useRef({unlocked:false});
 const config=useRef<Config>({fecha:"13 DE OCTUBRE",hora:"HORARIO A CONFIRMAR",lugar:"LUGAR A CONFIRMAR"});
 useEffect(()=>{overlayState.current=overlay;expiredState.current=expired;},[overlay,expired]);
 useEffect(()=>{const q=new URLSearchParams(location.search);
  config.current={fecha:(q.get("fecha")||"13 DE OCTUBRE").slice(0,80),hora:(q.get("hora")||"HORARIO A CONFIRMAR").slice(0,80),lugar:(q.get("lugar")||"LUGAR A CONFIRMAR").slice(0,125)};
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
   const dt=Math.min(.058,(now-(frameLast.current||now))/1000);frameLast.current=now;
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
 function sound(type:"start"|"click"|"clue"|"wrong"|"unlock"|"beat"|"tick"|"celebrate"){
  if(muted||!audioRef.current)return;
  const a=audio.current;if(!a)return;
  try{
   if(a.state==="suspended")void a.resume();
   const now=a.currentTime,osc=a.createOscillator(),gain=a.createGain();
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
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type="sawtooth";oscillator.frequency.value=48;
   const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=95;
   gain.gain.value=muted?0:.012;oscillator.connect(filter);filter.connect(gain);gain.connect(ctx.destination);oscillator.start();
   drone.current=oscillator;droneGain.current=gain;
  }catch{/* Game still works silently */}
  sound("start");setScreen("game");
 }
 function toggleMute(){setMuted(v=>{if(droneGain.current)droneGain.current.gain.value=!v?0:.012;return !v});}
 function viewDown(e:ReactPointerEvent<HTMLCanvasElement>){
  if(e.pointerType==="mouse"&&e.button!==0)return;
  pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);
 }
 function viewMove(e:ReactPointerEvent<HTMLCanvasElement>){
  const p=pointer.current;if(p?.id!==e.pointerId||overlay!=="none")return;
  world.current?.look(e.clientX-p.x,e.clientY-p.y);pointer.current={...p,x:e.clientX,y:e.clientY};
 }
 function viewUp(e:ReactPointerEvent<HTMLCanvasElement>){
  if(pointer.current?.id!==e.pointerId)return;pointer.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
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
  setFocus(t);
  setOverlay(t.id==="drawer"?"lock":t.id==="envelope"?"letter":"inspect");
  setShowNear(false);sound("click");
 }
 function closeInspect(){setOverlay("none");setFocus(null);setWrong(false);}
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
  if(focus.id in EVIDENCE){discover(focus.id as Ev);}
  else sound("click");
  closeInspect();
 }
 function wheel(index:number,step:number){setDigits(old=>old.map((v,i)=>i===index?(v+step+10)%10:v));sound("click")}
 function dialStart(e:ReactPointerEvent<HTMLDivElement>,i:number){
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
  setWrong(false);setDrawerOpen(true);flags.current.unlocked=true;world.current?.setFlags({unlocked:true});
  sound("unlock");navigator.vibrate?.([80,40,130]);closeInspect();setToast("¡EL CANDADO SE ABRIÓ! Acercate al cajón y tomá el sobre.");
 }
 function envelope(){
  setOpenedLetter(true);sound("clue");
 }
 function finish(){sound("celebrate");setScreen("final");setOverlay("none");drone.current?.stop();drone.current=null;}
 function extend(){setSeconds(60);setExpired(false);setToast("UNA ÚLTIMA OPORTUNIDAD · +01:00");sound("start")}
 function hint(){
  if(!seen.includes("calendar"))setToast("PISTA: MIRÁ EL CALENDARIO EN LA PARED DEL FONDO.");
  else if(!seen.includes("cassette"))setToast("PISTA: REVISÁ EL GRABADOR, SOBRE LA MESA.");
  else if(!seen.includes("memo"))setToast("PISTA: HAY UN INFORME JUNTO AL TELÉFONO.");
  else setToast("PISTA: UNÍ EL DÍA Y EL MES EN ESE ORDEN.");
  sound("click");
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
  {screen==="intro"&&<section className={styles.intro}>
    <div className={styles.noise}/>
    <span className={styles.classified}>EXPEDIENTE M·013 <i>◉</i> TRANSMISIÓN INTERCEPTADA</span>
    <span className={styles.radar} aria-hidden="true"><i/><i/><i/></span>
    <div className={styles.introText}>
      <span className={styles.red}>◉ PRIORIDAD MÁXIMA · MISIÓN FICTICIA</span>
      <h1>SECUESTRARON<br/><em>A MAURO.</em></h1>
      <p>Una última señal. Una habitación cerrada. Tres minutos para encontrar las pistas y descubrir dónde lo tienen.</p>
      <div className={styles.introCard}><span>ÚLTIMO MENSAJE RECIBIDO</span><p>«Si querés saber dónde está Mauro... abrí el cajón. Encontrá las cuatro cifras. El tiempo ya está corriendo».</p></div>
      <div className={styles.introTimer}>03<span>:</span>00 <small>PARA RESOLVER EL CASO</small></div>
      <button type="button" className={styles.start} onClick={start}>ACEPTAR MISIÓN <span>↗</span></button>
      <small className={styles.disclaimer}>Experiencia de ficción y entretenimiento · No se trata de una emergencia real</small>
    </div>
    <div className={styles.introFooter}>OPERACIÓN RESCATE · EXPERIENCIA 3D PARA CELULAR</div>
   </section>}
  {screen==="game"&&<>
    <canvas ref={canvas} className={styles.canvas} data-testid="rescate-webgl" onPointerDown={viewDown} onPointerMove={viewMove} onPointerUp={viewUp} onPointerCancel={viewUp} onLostPointerCapture={()=>{pointer.current=null}} aria-label="Habitación 3D: deslizá para mirar"/>
    <div className={styles.film} aria-hidden="true"/>
    <header className={styles.hud}>
      <div className={styles.hudTitle}><span>CASO 013 · OPERACIÓN RESCATE</span><strong>¿DÓNDE ESTÁ MAURO?</strong></div>
      <div className={styles.countdown} data-critical={seconds<=35?"yes":"no"} data-testid="rescate-timer"><small>TIEMPO RESTANTE</small><strong>{fmtTime(seconds)}</strong></div>
    </header>
    <div className={styles.topHints}>
      <span>PRUEBAS {seen.length}/3</span>
      <button type="button" onClick={hint}>¿UNA PISTA?</button>
      <button type="button" onClick={toggleMute}>{muted?"SONIDO OFF":"SONIDO ON"}</button>
    </div>
    {error&&<div className={styles.fallback}><h2>Modo 3D no disponible</h2><p>{error}</p><button onClick={()=>{setError("");setAvailable(false);setScreen("intro")}}>VOLVER</button><small>Podemos adaptar esta experiencia a 2.5D si tu teléfono no admite WebGL.</small></div>}
    {!available&&!error&&<div className={styles.load}>INICIANDO RECONSTRUCCIÓN TRIDIMENSIONAL...</div>}
    <div className={styles.reticle} data-has-target={active?"yes":"no"}><span>+</span></div>
    {active&&overlay==="none"&&<div className={styles.target}><span>OBJETO DETECTADO</span><strong>{active.label}</strong></div>}
    <div className={styles.objectives}><span>PRUEBAS RECUPERADAS</span>
      {(["calendar","cassette","memo"] as Ev[]).map(k=><div key={k} data-found={seen.includes(k)?"yes":"no"}>{seen.includes(k)?"◆":"◇"} <span>{seen.includes(k)?EVIDENCE[k].title+" · "+EVIDENCE[k].value:"EVIDENCIA POR ENCONTRAR"}</span></div>)}
    </div>
    <div className={styles.controlBar}>
      <div className={styles.joyColumn}>
       <div ref={joyBox} className={styles.joy} onPointerDown={joyStart} onPointerMove={joyMove} onPointerUp={joyEnd} onPointerCancel={joyEnd} onLostPointerCapture={()=>{joyId.current=null;joystick.current={x:0,y:0}}} data-testid="rescate-joystick" aria-label="Joystick para caminar">
        <i className={styles.joyRing}/><i data-knob className={styles.joyKnob}/><small>↑</small>
       </div><span>CAMINAR</span>
      </div>
      <div className={styles.actions}>
       <button className={styles.actionButton} type="button" onClick={touchObject}>◎ EXAMINAR</button>
       <button className={styles.scanButton} type="button" onClick={()=>{setNear(world.current?.nearby()||[]);setShowNear(x=>!x)}} aria-expanded={showNear}>⌕ EXPLORAR ALREDEDOR</button>
       <span>DESLIZÁ PARA MIRAR</span>
      </div>
    </div>
    {showNear&&<div className={styles.nearby} data-testid="rescate-nearby"><div>OBJETOS A TU ALCANCE <button onClick={()=>setShowNear(false)} aria-label="Cerrar objetos cercanos">✕</button></div>
     {near.length?near.map(t=><button key={t.id} onClick={()=>examine(t)}>{t.label} <span>↗</span></button>):<p>Caminá más cerca de los muebles.</p>}
    </div>}
    {toast&&<div className={styles.toast} role="status" onClick={()=>setToast("")}>{toast} <button type="button" aria-label="Cerrar aviso" onClick={()=>setToast("")}>✕</button></div>}
    {overlay==="inspect"&&focus&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label={"Examinar "+focus.label}><div className={styles.inspectCard}>
      <span>ARCHIVO / INSPECCIÓN</span><h2>{focus.label}</h2><p>{DESCRIPTIONS[focus.id]}</p>
      {focus.id in EVIDENCE?<div className={styles.evidence}><span>INDICIO ENCONTRADO</span><strong>{EVIDENCE[focus.id as Ev].value}</strong><p>{EVIDENCE[focus.id as Ev].body}</p></div>:<p className={styles.redHerring}>{focus.hint}</p>}
      <button className={styles.confirm} onClick={activate}>{focus.id in EVIDENCE?"GUARDAR EVIDENCIA EN EL EXPEDIENTE":"TERMINAR INSPECCIÓN"} →</button>
      <button className={styles.secondary} onClick={closeInspect}>VOLVER A LA SALA</button>
    </div></div>}
    {overlay==="lock"&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label="Candado de cuatro cifras"><div className={styles.lockCard}>
      <span className={styles.lockSerial}>CAJÓN N.º 013 · CERRADURA MECÁNICA</span>
      <h2>CUATRO CIFRAS.</h2><p>La combinación está escondida en esta sala. Girá cada rueda con el dedo.</p>
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
    {overlay==="letter"&&<div className={styles.modalShade} role="dialog" aria-modal="true" aria-label="Sobre del cajón"><div className={styles.letterCard} data-open={openedLetter?"yes":"no"}>
      {!openedLetter?<><span className={styles.letterCaption}>OBJETO RECUPERADO · ÚLTIMA PRUEBA</span><button className={styles.envelope} type="button" onClick={envelope} aria-label="Romper el sello del sobre y abrirlo"><i className={styles.flap}/><b>M</b><small>CONFIDENCIAL</small></button><p>El sobre está dirigido a vos. ¿Querés saber qué había dentro del cajón?</p></>
       :<><span className={styles.letterCaption}>EXPEDIENTE 013 · RESUELTO</span><h2>¿EN SERIO PENSASTE<br/>QUE HABÍA UN SECUESTRO?</h2><p>Tu misión no era encontrar a Mauro... era encontrar esta carta.</p><p className={styles.letterReveal}>¡TENÉS UNA INVITACIÓN!</p></>}
      <button className={styles.confirm} onClick={openedLetter?finish:envelope}>{openedLetter?"ABRIR LA INVITACIÓN DE CUMPLEAÑOS 🎉":"ROMPER EL SELLO ↗"}</button>
    </div></div>}
    {expired&&<div className={styles.timeout} role="dialog" aria-modal="true" aria-label="Tiempo agotado">
      <span>00:00 · CONEXIÓN PERDIDA</span><h2>SE TERMINÓ EL TIEMPO.</h2><p>Pero Mauro dejó una última oportunidad. La puerta sigue entreabierta...</p>
      <button onClick={extend}>RECIBIR 1 MINUTO EXTRA →</button>
    </div>}
    <footer className={styles.gameBottom}><span>WASD · JOYSTICK · ARRASTRÁ PARA MIRAR</span><span>EXPERIENCIA FICTICIA</span></footer>
   </>}
  {screen==="final"&&<section className={styles.finale} data-testid="rescate-invite-final">
    <div className={styles.confetti} aria-hidden="true">{particles.map((p,i)=><i key={i} style={{left:p.left,animationDelay:p.delay,animationDuration:p.duration,background:p.color}}/>)}</div>
    <span className={styles.finalKicker}>CASO 013 · RESUELTO CON ÉXITO</span>
    <h1>¡SORPRESA!<em>¡ESTÁS INVITADO!</em></h1>
    <div className={styles.invitationPaper}>
      <span>OPERACIÓN RESCATE · INFORME FINAL</span>
      <div className={styles.partyIcon}>✦</div>
      <h2>Mauro cumple años.</h2>
      <p>El secuestro era una excusa. La verdadera misión era conseguir que vengas a festejar conmigo.</p>
      <div className={styles.details}><div><small>FECHA</small><strong>{config.current.fecha}</strong></div><div><small>HORA</small><strong>{config.current.hora}</strong></div><div><small>LUGAR</small><strong>{config.current.lugar}</strong></div></div>
      <p className={styles.secret}>Queda prohibido revelar los códigos de esta misión. 🤫</p>
    </div>
    <div className={styles.finalActions}>
     <button onClick={copyInvite}>▣ COPIAR INVITACIÓN</button>
     <a href={"https://api.whatsapp.com/send?text="+encodeURIComponent(shareMessage())} target="_blank" rel="noopener noreferrer">COMPARTIR POR WHATSAPP ↗</a>
    </div>
    <button className={styles.replay} onClick={()=>{setScreen("intro");setSeconds(180);setExpired(false);setSeen([]);setDigits([0,0,0,0]);setDrawerOpen(false);flags.current.unlocked=false;setOpenedLetter(false);setToast("");setOverlay("none");setAvailable(false);setError("");void audio.current?.close();audio.current=null;audioRef.current=false;}}>↺ REPETIR MISIÓN</button>
    {toast&&<p className={styles.finalToast} role="status">{toast}</p>}
   </section>}
 </main>;
}

const mount=document.getElementById("rescate-root");
if(mount)createRoot(mount).render(<App/>);
