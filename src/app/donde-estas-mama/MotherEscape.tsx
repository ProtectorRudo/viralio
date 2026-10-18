"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import type {PointerEvent as ReactPointerEvent} from "react";
import {MotherWorld,type MotherStage} from "./MotherWorld";
import {BOOK_SEQUENCE,GEAR_SEQUENCE,rotatePhotoPiece,photoComplete,enterOrderedItem,timeRemaining,dueMotherBeats,type MotherGear} from "./MotherRules";
import "./mother-escape.css";

type Mode="intro"|"playing"|"revealing"|"failed"|"won"|"unsupported";
type Inspect=null|"phone"|"portrait"|"books"|"music";
type Gear=MotherGear;
const START=300;
function formatTime(s:number){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
function clean(value:string,max:number){return value.trim().replace(/[<>]/g,"").slice(0,max);}
function vibrate(pattern:number|number[]){if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(pattern);}
class MotherSound {
  private ctx:AudioContext|null=null;
  private enabled=true;
  setEnabled(enabled:boolean){
    this.enabled=enabled;
    if(!enabled)this.stop();
  }
  private drone:OscillatorNode|null=null;
  private level:GainNode|null=null;
  async start(){
    if(!this.enabled)return;
    if(!this.ctx)this.ctx=new AudioContext();
    if(this.ctx.state==="suspended")await this.ctx.resume();
    if(this.drone)return;
    const osc=this.ctx.createOscillator(), gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
    osc.type="sawtooth";osc.frequency.value=46;
    filter.type="lowpass";filter.frequency.value=145;
    gain.gain.value=.016;osc.connect(filter);filter.connect(gain);gain.connect(this.ctx.destination);osc.start();
    this.drone=osc;this.level=gain;
  }
  private pulse(freq:number,duration=.15,volume=.10,position=0){
    if(!this.ctx||!this.enabled)return;
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),panner=this.ctx.createPanner();
    osc.type="sine";osc.frequency.setValueAtTime(freq,this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25,freq*.58),this.ctx.currentTime+duration);
    gain.gain.setValueAtTime(volume,this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);
    panner.panningModel="equalpower";panner.positionX.value=position;panner.positionZ.value=-2;
    osc.connect(gain);gain.connect(panner);panner.connect(this.ctx.destination);
    osc.start();osc.stop(this.ctx.currentTime+duration+.01);
  }
  tick(){this.pulse(240,.06,.035);}
  knock(){this.pulse(82,.3,.28,-2);window.setTimeout(()=>this.pulse(65,.23,.24,2),185);}
  message(){this.pulse(740,.14,.075);window.setTimeout(()=>this.pulse(880,.23,.075),170);}
  click(){this.pulse(510,.09,.04);}
  error(){this.pulse(125,.23,.10);}
  unlock(){this.pulse(620,.32,.075);window.setTimeout(()=>this.pulse(950,.45,.07),120);}
  final(){
    this.drone?.stop();this.drone=null;
    this.level?.disconnect();this.level=null;
    this.pulse(523,.8,.09);
    window.setTimeout(()=>this.pulse(659,.85,.07),150);
    window.setTimeout(()=>this.pulse(784,1.2,.07),350);
  }
  stop(){try{this.drone?.stop();}catch{}this.drone=null;this.level?.disconnect();this.level=null;}
  dispose(){this.stop();void this.ctx?.close();this.ctx=null;}
}
type Notice={title:string;body:string;tone:"warning"|"danger"|"success"};
const HINTS=[
 "Explorá el teléfono y la mochila. La llave está cerca de donde se cuelgan los abrigos.",
 "Tocá la fotografía. Girá sus cuatro partes hasta recomponerla y después observá los colores.",
 "Revisá tres muebles para recuperar los engranajes; la caja musical debe volver a funcionar."
];
export default function MotherEscape(){
  const host=useRef<HTMLDivElement>(null);
  const world=useRef<MotherWorld|null>(null);
  const sound=useRef(new MotherSound());
  const endAt=useRef(0);
  const eventsSeen=useRef(new Set<number>());
  const lastSecond=useRef(-1);
  const clueTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const revealTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const moving=useRef({forward:0,strafe:0});
  const actionRef=useRef<(id:string)=>void>(()=>{});
  const [mode,setMode]=useState<Mode>("intro");
  const [seconds,setSeconds]=useState(START);
  const [stage,setStage]=useState<MotherStage>(0);
  const [inspect,setInspect]=useState<Inspect>(null);
  const [focus,setFocus]=useState("");
  const [message,setMessage]=useState<Notice|null>(null);
  const [clue,setClue]=useState("");
  const [key1,setKey1]=useState(false);
  const [portrait,setPortrait]=useState([1,3,2,1]);
  const [portraitDone,setPortraitDone]=useState(false);
  const [bookOrder,setBookOrder]=useState<string[]>([]);
  const [booksDone,setBooksDone]=useState(false);
  const [gears,setGears]=useState<Gear[]>([]);
  const [gearOrder,setGearOrder]=useState<Gear[]>([]);
  const [musicDone,setMusicDone]=useState(false);
  const [recipient,setRecipient]=useState("Mamá");
  const [sender,setSender]=useState("tu hijo");
  const [dedication,setDedication]=useState("");
  const [muted,setMuted]=useState(false);
  const completed=useRef(0);
  const [showHint,setShowHint]=useState(false);
  const tell=useCallback((title:string,body:string,tone:Notice["tone"]="warning")=>{
    setMessage({title,body,tone});
    vibrate(tone==="danger"?[85,45,125]:45);
  },[]);
  const prompt=useCallback((s:string)=>{
    setClue(s);
    if(clueTimer.current)clearTimeout(clueTimer.current);
    clueTimer.current=setTimeout(()=>setClue(""),4500);
  },[]);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const mama=params.get("mama"),hijo=params.get("hijo"),msg=params.get("mensaje");
    // URL personalization is intentionally applied only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(mama)setRecipient(clean(mama,46));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(hijo)setSender(clean(hijo,46));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(msg)setDedication(clean(msg,420));
  },[]);
  useEffect(()=>{
    if(!host.current)return;
    if(!document.createElement("canvas").getContext("webgl2")){
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("unsupported");return;
    }
    let game:MotherWorld;
    try{game=new MotherWorld(host.current);}catch(error){console.error("WebGL2 no disponible",error);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("unsupported");return;}
    world.current=game;
    game.onFocus=setFocus;
    game.onInteract=(id)=>actionRef.current(id);
    game.onNotice=(msg)=>console.warn(msg);
    return ()=>{
      game.dispose();
      world.current=null;
      if(clueTimer.current)clearTimeout(clueTimer.current);
      if(revealTimer.current)clearTimeout(revealTimer.current);
      sound.current.dispose();
    };
  },[]);
  const advance=useCallback((next:MotherStage)=>{
    setInspect(null);setStage(next);world.current?.setStage(next);
    sound.current.unlock();
    completed.current=Date.now();
    tell("PUERTA ABIERTA",next===1?"Entraste a la sala. Algo se movió detrás de vos.":"La habitación está vacía... pero escuchás golpes dentro del armario.","warning");
  },[tell]);
  const winning=useCallback(()=>{
    setInspect(null);setMode("revealing");setMessage(null);
    world.current?.win();sound.current.final();vibrate([80,120,150,100,280]);
    if(revealTimer.current)clearTimeout(revealTimer.current);
    revealTimer.current=setTimeout(()=>setMode("won"),3600);
  },[]);
  const act=useCallback((id:string)=>{
    if(mode!=="playing"||inspect)return;
    sound.current.click();
    if(stage===0){
      if(id==="telefono"){setInspect("phone");return;}
      if(id==="caja"){prompt("Dentro de la mochila hay una nota: «Donde dejamos los abrigos, dejé lo que necesitás».");return;}
      if(id==="perchero"){
        if(!key1){world.current?.collect("key1");setKey1(true);tell("ENCONTRASTE UNA LLAVE","Una pequeña llave de bronce estaba escondida entre los abrigos.","success");sound.current.unlock();completed.current=Date.now();}
        else prompt("Ya recuperaste la llave del perchero.");
        return;
      }
      if(id==="puerta"){if(key1)advance(1);else prompt("La puerta está cerrada. Necesitás encontrar una llave.");return;}
    }
    if(stage===1){
      if(id==="foto"){setInspect("portrait");return;}
      if(id==="libros"){if(!portraitDone)prompt("Tres libros tienen lomos de colores. ¿Habrá una pista en la fotografía?");else setInspect("books");return;}
      if(id==="puerta"){if(booksDone)advance(2);else prompt("La puerta requiere un mecanismo oculto. Revisá la biblioteca.");return;}
    }
    if(stage===2){
      const places:Record<string,Gear>={juguetes:"grande",cajon:"mediano",estante:"pequeño"};
      if(places[id]){
        const g=places[id];
        if(!gears.includes(g)){world.current?.collect(id);setGears(p=>[...p,g]);completed.current=Date.now();sound.current.unlock();tell("PIEZA ENCONTRADA","Recuperaste un engranaje "+g+".","success");}
        else prompt("Ya revisaste este lugar.");
        return;
      }
      if(id==="cajamusical"){if(gears.length<3)prompt("Faltan "+(3-gears.length)+" engranajes. Revisá la caja de juguetes, la mesa de luz y el estante.");else setInspect("music");return;}
      if(id==="armario"){if(musicDone)winning();else {prompt("El armario sigue bloqueado. La caja musical parece controlar su cierre.");sound.current.knock();}return;}
    }
  },[mode,inspect,stage,key1,portraitDone,booksDone,gears,musicDone,tell,prompt,advance,winning]);
  actionRef.current=act;
  const begin=()=>{
    setMode("playing");setSeconds(START);
    setStage(0);world.current?.setStage(0);setInspect(null);
    endAt.current=performance.now()+START*1000;
    lastSecond.current=-1;eventsSeen.current.clear();
    setMessage({title:"MENSAJE DE TU HIJO",body:"«Mamá, estoy encerrado. No puedo abrir la puerta. Por favor, vení a buscarme. Tenés cinco minutos.»",tone:"danger"});
    completed.current=Date.now();
    if(!muted)void sound.current.start().then(()=>sound.current.message()).catch(()=>{});
  };
  useEffect(()=>{
    if(!message)return;
    const id=window.setTimeout(()=>setMessage(null),6500);
    return ()=>window.clearTimeout(id);
  },[message]);
  useEffect(()=>{
    if(mode!=="playing")return;
    const timer=window.setInterval(()=>{
      const s=timeRemaining(endAt.current,performance.now());
      setSeconds(s);
      const elapsed=START-s;
      world.current?.setSuspense(elapsed);
      if(s!==lastSecond.current){
        lastSecond.current=s;
        if(s<=45&&!muted)sound.current.tick();
      }
      for(const ev of dueMotherBeats(elapsed,eventsSeen.current)){
        eventsSeen.current.add(ev.at);
        tell(ev.title,ev.text,ev.tone);
        if(!muted){if(ev.at===12||ev.at===170||ev.at===240)sound.current.knock();else sound.current.message();}
      }
      if(s===0){setMode("failed");setInspect(null);sound.current.stop();tell("TIEMPO AGOTADO","La última puerta sigue cerrada. Podés volver a intentar el rescate.","danger");}
      if(Date.now()-completed.current>23000)setShowHint(true);
    },180);
    return ()=>clearInterval(timer);
  },[mode,tell,muted]);
  const turnPiece=(index:number)=>{
    if(portraitDone)return;
    const next=rotatePhotoPiece(portrait,index);
    setPortrait(next);sound.current.click();
    if(photoComplete(next)){
      setPortraitDone(true);setInspect(null);completed.current=Date.now();
      tell("FOTOGRAFÍA RECONSTRUIDA","Detrás aparece una pista: ROJO → DORADO → AZUL. La biblioteca está junto a vos.","success");
      sound.current.unlock();
    }
  };
  const chooseBook=(color:string)=>{
    if(booksDone)return;
    const result=enterOrderedItem(bookOrder,color,BOOK_SEQUENCE);
    if(result.error){setBookOrder([]);prompt("El mecanismo retrocedió. Observá nuevamente el orden de colores.");sound.current.error();return;}
    setBookOrder(result.next);sound.current.click();
    if(result.complete){
      setBooksDone(true);setInspect(null);completed.current=Date.now();
      tell("COMPARTIMIENTO ABIERTO","Una segunda llave acaba de caer detrás de los libros. ¡La puerta del dormitorio está abierta!","success");
      sound.current.unlock();
    }
  };
  const placeGear=(g:Gear)=>{
    if(musicDone||!gears.includes(g))return;
    const result=enterOrderedItem(gearOrder,g,GEAR_SEQUENCE);
    if(result.error){setGearOrder([]);prompt("Los engranajes se trabaron. Colocalos del más grande al más pequeño.");sound.current.error();return;}
    setGearOrder(result.next);sound.current.click();
    if(result.complete){
      setMusicDone(true);setInspect(null);completed.current=Date.now();
      tell("LA CAJA MUSICAL FUNCIONA","Una melodía empieza a sonar. Oíste cómo se soltó el cierre del armario.","success");
      sound.current.unlock();
    }
  };
  const retry=()=>window.location.reload();
  const move=useCallback((dir:"forward"|"back"|"left"|"right",on:boolean)=>{
    if(dir==="forward"||dir==="back")moving.current.forward=on?(dir==="forward"?1:-1):0;
    else moving.current.strafe=on?(dir==="right"?1:-1):0;
    world.current?.setMotion(moving.current.forward,moving.current.strafe);
  },[]);
  const buttonProps=(dir:"forward"|"back"|"left"|"right")=>({
    onPointerDown:(e:ReactPointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);move(dir,true);},
    onPointerUp:()=>move(dir,false),
    onPointerCancel:()=>move(dir,false),
    onLostPointerCapture:()=>move(dir,false)
  });
  useEffect(()=>{
    const dirs:Record<string,"forward"|"back"|"left"|"right">={KeyW:"forward",ArrowUp:"forward",KeyS:"back",ArrowDown:"back",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right"};
    const down=(e:KeyboardEvent)=>{
      if(mode!=="playing"||inspect)return;
      if(e.code==="KeyE"||e.code==="Space"){e.preventDefault();world.current?.interactFocus();}
      const dir=dirs[e.code];if(dir){e.preventDefault();move(dir,true);}
    };
    const up=(e:KeyboardEvent)=>{const dir=dirs[e.code];if(dir)move(dir,false);};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);world.current?.setMotion(0,0);};
  },[mode,inspect,move]);
  const objective=stage===0?"ENCONTRÁ LA LLAVE":stage===1?"RECOMPONÉ LA FOTO Y ABRÍ LA BIBLIOTECA":"REPARÁ LA CAJA MUSICAL";
  return <main className={"mom-game mom-"+mode}>
    <div ref={host} className="mom-world" aria-label="Exploración en primera persona de una casa familiar"/>
    <div className="mom-vignette" aria-hidden="true"/>
    {mode==="playing"&&<>
      <header className="mom-hud">
        <div><span className="mom-brand">VIRALIO / ESCAPE</span><span className="mom-location">{["01 · PASILLO","02 · SALA FAMILIAR","03 · DORMITORIO"][stage]}</span></div>
        <div className={"mom-time"+(seconds<=45?" urgent":"")} aria-live={seconds<=20?"assertive":"off"}>{formatTime(seconds)}</div>
        <button className="mom-sound" onClick={()=>{const enabling=muted;sound.current.setEnabled(enabling);setMuted(!enabling);if(enabling)void sound.current.start();}} aria-label={muted?"Activar sonido":"Silenciar"}>{muted?"SONIDO OFF":"♫ ON"}</button>
      </header>
      <div className="mom-objective"><span>OBJETIVO ACTUAL</span><strong>{objective}</strong></div>
      {message&&<div className={"mom-notice mom-notice-"+message.tone} role="status"><div><span>● {message.title}</span><button onClick={()=>setMessage(null)} aria-label="Cerrar aviso">×</button></div><p>{message.body}</p></div>}
      {clue&&<div className="mom-toast" role="status">{clue}</div>}
      <div className="mom-reticle" aria-hidden="true">+</div>
      {focus&&<button className="mom-focus" onClick={()=>world.current?.interactFocus()}>◈ {focus} — TOCAR</button>}
      <div className="mom-bottom">
        <div className="mom-pad" aria-label="Moverse">
          <button className="up" aria-label="Avanzar" {...buttonProps("forward")}>↑</button>
          <button className="left" aria-label="Izquierda" {...buttonProps("left")}>←</button>
          <button className="down" aria-label="Retroceder" {...buttonProps("back")}>↓</button>
          <button className="right" aria-label="Derecha" {...buttonProps("right")}>→</button>
        </div>
        <div className="mom-tools">
          <div className="mom-inventory">{key1&&stage===0?"🔑 Llave":""}{stage===1&&portraitDone?"◈ Fotografía completa":""}{stage===1&&booksDone?"🔑 Segunda llave":""}{stage===2?"⚙ "+gears.length+"/3 piezas":""}</div>
          <button className="mom-hint-button" onClick={()=>{setShowHint(false);prompt(HINTS[stage]);}}>¿PISTA? {showHint?"✦":""}</button>
          <div className="mom-control-label">ARRASTRÁ PARA MIRAR · TOCÁ LOS OBJETOS BRILLANTES</div>
        </div>
      </div>
    </>}
    {mode==="revealing"&&<section className="mom-reveal" aria-live="polite"><div className="mom-reveal-line">LA ÚLTIMA PUERTA SE ABRE...</div><div className="mom-reveal-message">«¿Mamá?...»<br/><strong>¡Sorpresa!</strong></div></section>}
    {mode==="intro"&&<section className="mom-screen mom-intro">
      <div className="mom-mark">VIRALIO ORIGINALS <span> / EXPERIENCIA ESPECIAL</span></div>
      <div className="mom-pretitle">UN RESCATE · UNA CASA · CINCO MINUTOS</div>
      <h1>¿DÓNDE ESTÁS,<br/><em>MAMÁ?</em></h1>
      <p>Tu hijo desapareció en algún lugar de la casa. Su último mensaje fue interrumpido. Las puertas están cerradas y el tiempo empieza a correr.</p>
      <div className="mom-dossier"><span>◷ 05:00</span><span>◇ 3 HABITACIONES</span><span>✦ 1 OPORTUNIDAD</span></div>
      <button className="mom-primary" onClick={begin}>ENTRAR A LA CASA <span>↗</span></button>
      <small>Usá auriculares · Tocá para explorar · Deslizá para mirar · Recomendado a partir de 10 años</small>
    </section>}
    {mode==="unsupported"&&<section className="mom-screen mom-failure"><span className="mom-pretitle">DISPOSITIVO NO COMPATIBLE</span><h1>Necesitamos<br/><em>WebGL2.</em></h1><p>Este navegador no permite mostrar la casa en 3D. Probá con Chrome, Safari o Firefox actualizado en un dispositivo compatible.</p><a className="mom-primary" href="/">VOLVER A VIRALIO ↗</a></section>}
    {mode==="failed"&&<section className="mom-screen mom-failure">
      <span className="mom-pretitle">00:00 / LA CASA QUEDÓ EN SILENCIO</span><h1>Se acabó<br/><em>el tiempo.</em></h1>
      <p>La puerta no se abrió. Los golpes cesaron. A veces hay que volver a intentar aquello que más importa.</p>
      <button className="mom-primary" onClick={retry}>VOLVER A INTENTAR ↻</button>
    </section>}
    {mode==="won"&&<section className="mom-screen mom-ending">
      <span className="mom-pretitle">LA ÚLTIMA PUERTA SE ABRE...</span>
      <div className="mom-ending-glow" aria-hidden="true">✧</div>
      <h1>¡Feliz día,<br/><em>{recipient}!</em></h1>
      <p className="mom-quote">«¿Viste que siempre me encontrás? Cuando tengo miedo, cuando estoy triste o cuando necesito un abrazo... siempre estás ahí.»</p>
      <div className="mom-letter"><span>UNA CARTA PARA VOS</span><p>{dedication||"Hoy quería hacer algo diferente para agradecerte todo lo que hacés por mí. Gracias por cada abrazo, cada noche de paciencia y cada vez que me acompañás. Sos mi lugar seguro y mi persona favorita. ¡Te amo muchísimo!"}</p><strong>Con todo mi amor,<br/>{sender} ♡</strong></div>
      <button className="mom-outline" onClick={retry}>VOLVER A JUGAR</button>
    </section>}
    {inspect&&mode==="playing"&&<div className="mom-inspect-cover" role="presentation">
      <section className="mom-inspect" role="dialog" aria-modal="true" aria-label="Examinar objeto">
        <button className="mom-inspect-close" onClick={()=>setInspect(null)} aria-label="Volver a la habitación">✕</button>
        {inspect==="phone"&&<><span className="mom-pretitle">MENSAJE · 01 RECIBIDO</span><h2>Un mensaje de tu hijo</h2><div className="mom-phone"><span>📱 DESCONOCIDO</span><p>«Mamá, no puedo salir. No sé cuánto tiempo tengo. Por favor, vení a buscarme...»</p><small>Entregado hace unos segundos</small></div><p>Antes de cortarse, se escucharon tres golpes desde el fondo de la casa.</p></>}
        {inspect==="portrait"&&<><span className="mom-pretitle">OBJETO 02 / MARCO FAMILIAR</span><h2>Una fotografía rota</h2><p>Girás las cuatro partes para reconstruir el recuerdo. Tocá cada fragmento para rotarlo.</p><div className="mom-photo-grid">{portrait.map((rotation,i)=><button key={i} onClick={()=>turnPiece(i)} aria-label={"Girar pieza "+(i+1)} className="mom-photo-tile"><span style={{transform:"rotate("+(rotation*90)+"deg)"}} className={"mom-photo-art mom-piece-"+i} aria-hidden="true"/></button>)}</div><small>Las cuatro piezas deben quedar derechas. En el reverso hay una secuencia de colores.</small></>}
        {inspect==="books"&&<><span className="mom-pretitle">OBJETO 03 / LIBROS DE COLORES</span><h2>La combinación secreta</h2><p>La fotografía tenía escrito: <strong>ROJO → DORADO → AZUL</strong>. Presioná los libros en ese orden.</p><div className="mom-books">{["azul","rojo","dorado"].map(c=><button key={c} className={"mom-book "+c} onClick={()=>chooseBook(c)} aria-label={"Presionar libro "+c}>{c.toUpperCase()}</button>)}</div><small>Secuencia ingresada: {bookOrder.length}/3</small></>}
        {inspect==="music"&&<><span className="mom-pretitle">OBJETO 04 / CAJA MUSICAL</span><h2>Tres piezas, una melodía</h2><p>Los engranajes deben encajar del más grande al más pequeño. Elegí qué pieza colocar a continuación.</p><div className="mom-gear-slots"><span>{gearOrder[0]?"⚙":"◯"}</span><span>{gearOrder[1]?"⚙":"◯"}</span><span>{gearOrder[2]?"⚙":"◯"}</span></div><div className="mom-gear-buttons">{["pequeño","grande","mediano"].map(g=><button key={g} disabled={gearOrder.includes(g as Gear)} onClick={()=>placeGear(g as Gear)}>⚙ {g}</button>)}</div><small>{gearOrder.length}/3 engranajes colocados</small></>}
        <button className="mom-back" onClick={()=>setInspect(null)}>← REGRESAR A LA HABITACIÓN</button>
      </section>
    </div>}
  </main>;
}
