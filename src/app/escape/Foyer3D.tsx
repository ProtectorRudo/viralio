"use client";

import {useCallback,useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {createFoyerWorld,FOYER_TARGETS,type FoyerFlags,type FoyerItem,type FoyerTarget,type FoyerWorld} from "./Foyer3DWorld";
import styles from "./Foyer3D.module.css";

export type Foyer3DProgress={drawer:boolean;key:boolean;box:boolean;clock:boolean};
const EMPTY:Foyer3DProgress={drawer:false,key:false,box:false,clock:false};
const NOTES:Record<FoyerItem,string>={
  drawer:"Está hinchado por la humedad. Quizás tirando con fuerza...",
  "bronze-key":"Hay una letra E en el metal. La llave no corresponde a la puerta principal.",
  lockbox:"Una cerradura diminuta. La tapa parece pesada.",
  clock:"Detenido a las 03:13. Un mecanismo interno gira aún sin corriente.",
  elias:"1891. Elías. El hombre que ordenó cerrar las habitaciones de la casa.",
  mara:"1902. Mara. Una flor amarilla asoma entre los pliegues del vestido.",
  nora:"1918. Nora. Los ojos parecen seguir tus movimientos.",
  stairs:"Las escaleras suben hacia un corredor cerrado. Hay marcas en el pasamanos.",
  sconce:"El aplique emite luz sin estar conectado. Algo en esta casa desafía a la electricidad.",
  door:"Cerrada desde el exterior. No es por aquí.",
  letter:"El papel está firmado por E.V.: «La edad revela más que las caras».",
};
type Props={progress?:Foyer3DProgress;onChange?:(next:Foyer3DProgress)=>void;onClose:()=>void;onSound?:(good:boolean)=>void};
export default function Foyer3D({progress=EMPTY,onChange,onClose,onSound}:Props){
  const canvas=useRef<HTMLCanvasElement>(null);
  const world=useRef<FoyerWorld|null>(null);
  const keys=useRef(new Set<string>());
  const joystick=useRef({x:0,y:0});
  const joystickPointer=useRef<number|null>(null);
  const stickFrame=useRef<HTMLDivElement|null>(null);
  const lookPointer=useRef<{id:number;x:number;y:number}|null>(null);
  const frameId=useRef(0);
  const lastTime=useRef(0);
  const liveState=useRef(progress);
  const [current,setCurrent]=useState<FoyerTarget|null>(null);
  const currentRef=useRef<FoyerTarget|null>(null);
  const [inspection,setInspection]=useState<FoyerItem|null>(null);
  const [uiPose,setUiPose]=useState({x:0,z:4.0});
  const [failure,setFailure]=useState("");
  const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState("");
  const [nearby,setNearby]=useState<FoyerTarget[]>([]);
  const [showNearby,setShowNearby]=useState(false);
  const [soundOn,setSoundOn]=useState(true);
  useEffect(()=>{liveState.current=progress;world.current?.setFlags(progress)},[progress]);
  const onChangeRef=useRef(onChange);
  const onSoundRef=useRef(onSound);
  useEffect(()=>{onChangeRef.current=onChange;onSoundRef.current=onSound},[onChange,onSound]);
  const notify=useCallback((s:string,good=false)=>{setNotice(s);onSoundRef.current?.(good)},[]);
  useEffect(()=>{
    const surface=canvas.current;if(!surface)return;
    let disposed=false;
    try{
      const engine=createFoyerWorld(surface,liveState.current,(pose,target)=>{
        if(disposed)return;
        if(currentRef.current?.id!==target?.id){currentRef.current=target;setCurrent(target)}
        setUiPose({x:pose.x,z:pose.z});
      });
      world.current=engine;window.queueMicrotask(()=>{if(!disposed)setReady(true)});
    }catch(e){const reason=e instanceof Error?e.message:"El motor 3D no pudo iniciarse.";window.queueMicrotask(()=>{if(!disposed)setFailure(reason)});}
    const down=(e:KeyboardEvent)=>{
      if(e.repeat&&e.key.toLowerCase()==="e")return;
      if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","shift"].includes(e.key.toLowerCase())){keys.current.add(e.key.toLowerCase());e.preventDefault();}
      if(e.key.toLowerCase()==="e"){const t=world.current?.aim();if(t){setInspection(t.id);onSoundRef.current?.(false)}}
      if(e.key==="Escape")setInspection(null);
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    const heldKeys=keys.current;
    const frame=(timestamp:number)=>{
      if(disposed)return;
      const dt=Math.min(.058,(timestamp-(lastTime.current||timestamp))/1000);
      lastTime.current=timestamp;
      const k=keys.current,forward=(k.has("w")||k.has("arrowup")?1:0)-(k.has("s")||k.has("arrowdown")?1:0);
      const side=(k.has("d")||k.has("arrowright")?1:0)-(k.has("a")||k.has("arrowleft")?1:0);
      const pad=joystick.current;
      world.current?.move(forward-pad.y,side+pad.x,dt);
      frameId.current=requestAnimationFrame(frame);
    };
    frameId.current=requestAnimationFrame(frame);
    return ()=>{disposed=true;cancelAnimationFrame(frameId.current);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);world.current?.destroy();world.current=null;heldKeys.clear()};
  },[]);
  const object=inspection?FOYER_TARGETS.find(t=>t.id===inspection):null;
  function viewStart(e:ReactPointerEvent<HTMLCanvasElement>){
    if(e.pointerType==="mouse"&&e.button!==0)return;
    lookPointer.current={id:e.pointerId,x:e.clientX,y:e.clientY};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function viewMove(e:ReactPointerEvent<HTMLCanvasElement>){
    const p=lookPointer.current;if(!p||p.id!==e.pointerId)return;
    world.current?.look(e.clientX-p.x,e.clientY-p.y);
    lookPointer.current={...p,x:e.clientX,y:e.clientY};
  }
  function viewEnd(e:ReactPointerEvent<HTMLCanvasElement>){
    if(lookPointer.current?.id!==e.pointerId)return;
    lookPointer.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function padMove(e:ReactPointerEvent<HTMLDivElement>){
    if(joystickPointer.current!==e.pointerId)return;
    const box=stickFrame.current?.getBoundingClientRect();if(!box)return;
    const px=(e.clientX-(box.left+box.width/2))/(box.width*.34),py=(e.clientY-(box.top+box.height/2))/(box.height*.34);
    const dist=Math.max(1,Math.hypot(px,py));
    joystick.current={x:px/dist,y:py/dist};
    const dot=e.currentTarget.querySelector<HTMLElement>('[data-stick="dot"]');
    if(dot)dot.style.transform=`translate(calc(-50% + ${joystick.current.x*34}px),calc(-50% + ${joystick.current.y*34}px))`;
  }
  function padStart(e:ReactPointerEvent<HTMLDivElement>){
    if(joystickPointer.current!==null)return;
    e.preventDefault();
    joystickPointer.current=e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);padMove(e);
  }
  function padEnd(e:ReactPointerEvent<HTMLDivElement>){
    if(joystickPointer.current!==e.pointerId)return;
    joystickPointer.current=null;joystick.current={x:0,y:0};
    const dot=e.currentTarget.querySelector<HTMLElement>('[data-stick="dot"]');
    if(dot)dot.style.transform="translate(-50%,-50%)";
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function change(flags:Partial<FoyerFlags>){
    const next={...liveState.current,...flags};
    liveState.current=next;
    world.current?.setFlags(next);
    onChangeRef.current?.(next);
  }
  function act(id:FoyerItem){
    setInspection(null);
    switch(id){
      case "drawer":
        if(!liveState.current.drawer){change({drawer:true});notify("El cajón se desliza. Algo brilla en el interior.",true)}
        else notify("El cajón está abierto. Mirá dentro, cerca de la superficie.");
        break;
      case "bronze-key":
        if(!liveState.current.drawer){notify("Primero tenés que abrir el cajón.");break;}
        if(!liveState.current.key){change({key:true});notify("Guardaste la llave de bronce en tu inventario.",true)}
        break;
      case "lockbox":
        if(liveState.current.box){notify("La caja ya está abierta. Dentro hay una inscripción: «EDADES, NO NOMBRES»");break;}
        if(!liveState.current.key){notify("La caja está cerrada. Tal vez haya una llave en algún lugar.");break;}
        change({box:true});notify("La llave gira. Dentro hay una placa con tres números: 4 · 2 · 7.",true);
        break;
      case "clock":
        change({clock:true});notify("Hiciste girar el mecanismo del reloj. Las agujas siguen en 03:13.",true);
        break;
      default:notify(NOTES[id]);break;
    }
  }
  function interact(){
    const t=currentRef.current;
    if(!t)return notify("Acercate a un objeto y apuntalo con la mira.");
    setInspection(t.id);onSoundRef.current?.(false);
  }
  return <section className={styles.shell} data-testid="umbral-real-3d" role="dialog" aria-modal="true" aria-label="Vestíbulo tridimensional jugable">
    <div className={styles.viewport}>
      <canvas ref={canvas} className={styles.canvas} data-testid="umbral-webgl-canvas" aria-label="Escenario 3D del vestíbulo; desplazá el dedo sobre la imagen para mirar" onPointerDown={viewStart} onPointerMove={viewMove} onPointerUp={viewEnd} onPointerCancel={viewEnd} onLostPointerCapture={()=>{lookPointer.current=null}}/>
      <div className={styles.colorGrade} aria-hidden="true"/>
      <div className={styles.top}>
        <div className={styles.brand}><span>UMBRAL / 3D</span><strong>VESTÍBULO</strong><small>PROTOTIPO JUGABLE · GEOMETRÍA REAL</small></div>
        <button type="button" className={styles.exit} aria-label="Salir del vestíbulo 3D" onClick={onClose}>✕ <span>SALIR</span></button>
      </div>
      {failure&&<div className={styles.failure}><strong>No se pudo iniciar la escena WebGL.</strong><p>{failure}</p><button onClick={onClose} type="button">VOLVER AL JUEGO</button></div>}
      {!failure&&<div className={styles.reticle} aria-hidden="true" data-focused={current?"yes":"no"}><i/><i/></div>}
      <div className={styles.mission}><strong>EXPEDIENTE 013</strong><span>Encontrá el cajón, recogé la llave y abrí la caja familiar.</span></div>
      {current&&!inspection&&<div className={styles.target} data-testid="umbral-3d-target"><small>◈ OBJETO EN LA MIRA</small><strong>{current.name}</strong><span>ACERCATE O PRESIONÁ INTERACTUAR</span></div>}
      {!ready&&!failure&&<div className={styles.loading}>RECONSTRUYENDO LA CASA EN TRES DIMENSIONES…</div>}
      <div className={styles.controlBar}>
        <div className={styles.padBlock}>
          <div className={styles.pad} ref={stickFrame} data-testid="umbral-3d-joystick" aria-label="Joystick para caminar" onPointerDown={padStart} onPointerMove={padMove} onPointerUp={padEnd} onPointerCancel={padEnd} onLostPointerCapture={()=>{joystickPointer.current=null;joystick.current={x:0,y:0}}}>
            <span className={styles.ring}/><span data-stick="dot" className={styles.dot}/><span className={styles.arrowTop}>↑</span><span className={styles.arrowBottom}>↓</span>
          </div><span>CAMINAR</span>
        </div>
        <div className={styles.actionBlock}>
          <button className={styles.inspect} type="button" onClick={interact} disabled={!current||Boolean(inspection)} data-testid="umbral-3d-inspect">◎ EXAMINAR</button>
          <button type="button" className={styles.nearbyToggle} aria-expanded={showNearby} onClick={()=>{setNearby(world.current?.nearby()??[]);setShowNearby(v=>!v)}}>⌕ OBJETOS CERCANOS</button>
          <span className={styles.lookTip}>DESLIZÁ SOBRE LA ESCENA PARA MIRAR</span>
        </div>
      </div>
      <div className={styles.status}><span>POSICIÓN {uiPose.x.toFixed(1)} / {uiPose.z.toFixed(1)}</span><span>W A S D · MOUSE · JOYSTICK</span></div>
      {showNearby&&<div className={styles.nearby} aria-label="Objetos cercanos"><strong>EN TU ENTORNO</strong>{nearby.length?nearby.map(t=><button type="button" key={t.id} onClick={()=>{setInspection(t.id);setShowNearby(false)}}>{t.name} ↗</button>):<span>No hay objetos a tu alcance. Caminá hacia la habitación.</span>}</div>}
      {notice&&!inspection&&<div role="status" className={styles.notice} onClick={()=>setNotice("")}>{notice}<button type="button" aria-label="Cerrar mensaje" onClick={()=>setNotice("")}>✕</button></div>}
      {object&&<div className={styles.inspectOverlay} data-testid="umbral-3d-inspection" data-object={object.id}>
        <div className={styles.inspection}>
          <span>OBJETO ENCONTRADO · INTERACCIÓN TRIDIMENSIONAL</span>
          <h3>{object.name}</h3>
          <p>{NOTES[object.id]}</p>
          {(object.id==="drawer"&&!progress.drawer)&&<button className={styles.action} type="button" onClick={()=>act(object.id)}>⇢ TIRAR DEL CAJÓN</button>}
          {(object.id==="bronze-key"&&!progress.key)&&<button className={styles.action} type="button" onClick={()=>act(object.id)}>＋ TOMAR LA LLAVE DE BRONCE</button>}
          {(object.id==="lockbox"&&!progress.box)&&<button className={styles.action} type="button" onClick={()=>act(object.id)}>{progress.key?"⚿ INSERTAR Y GIRAR LA LLAVE":"⚿ INTENTAR ABRIR LA CAJA"}</button>}
          {object.id==="clock"&&<button className={styles.action} type="button" onClick={()=>act(object.id)}>⟳ GIRAR EL MECANISMO</button>}
          {["elias","mara","nora","stairs","sconce","door","letter"].includes(object.id)&&<button className={styles.action} type="button" onClick={()=>act(object.id)}>◈ ANOTAR EN EL EXPEDIENTE</button>}
          {object.id==="drawer"&&progress.drawer&&<p className={styles.reveal}>El cajón está abierto. Mirá dentro para recoger la llave.</p>}
          {object.id==="lockbox"&&progress.box&&<p className={styles.reveal}>4 · 2 · 7 — Un código que parece unir tres generaciones.</p>}
          <button type="button" className={styles.dismiss} onClick={()=>setInspection(null)}>VOLVER A EXPLORAR ↗</button>
        </div>
      </div>}
    </div>
    <div className={styles.inventory} data-testid="umbral-3d-inventory"><strong>MOCHILA DE INVESTIGACIÓN</strong><span>{progress.key?"♢ LLAVE DE BRONCE":"Sin objetos"} {progress.box?"· PLACA FAMILIAR":""}</span><button type="button" onClick={()=>setSoundOn(v=>!v)} aria-label="Cambiar sonido en vestíbulo 3D">{soundOn?"◉ SONIDO":"◎ SILENCIO"}</button></div>
  </section>;
}
