"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IsolationWorld, type Chamber, type Focus } from "./IsolationWorld";
import { IsolationSound } from "./IsolationSound";
import "./isolation.css";

type Mode = "intro" | "playing" | "failed" | "won";
type Panel = null | "terminal" | "record" | "voice" | "help";
const SECONDS = 900;
const PHASES = [
  { name: "URGENCIAS", subtitle: "Restaurá la seguridad", quote: "El edificio está vacío. Eso dice el registro." },
  { name: "AISLAMIENTO", subtitle: "Restaurá la presión", quote: "La respiración que escuchás no es la tuya." },
  { name: "CONTENCIÓN", subtitle: "Identificá la voz", quote: "No todas las instrucciones quieren salvarte." }
] as const;

function format(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}
function hintText(w: IsolationWorld | null, chamber: Chamber) {
  if (!w) return "";
  if (chamber === 0) {
    if (!w.hasFuse) return "El panel auxiliar requiere un fusible. Buscá en el mostrador.";
    if (!w.fusePlaced) return "Instalá el fusible F-08 en el tablero lateral.";
    if (!w.hasBadge) return "La consola necesita una tarjeta del personal médico.";
    if (!w.firstDoor) return "La clave está escrita en la pizarra de triaje: P1, P2, P3.";
    return "La puerta está abierta. Entrá al pasillo de aislamiento.";
  }
  if (chamber === 1) {
    if (w.valves.length < 3) return "Leé la secuencia de purga en la pared. Girá las válvulas en ese orden.";
    if (!w.secondDoor) return "La purga está lista: accioná el extractor al fondo.";
    return "Se abrió el acceso a contención. No te detengas.";
  }
  if (!w.foundLog) return "Buscá el registro de identidad cerca del muro izquierdo.";
  if (w.breakers.join(",") !== "true,false,true") return "Configurá los tres interruptores según la inscripción del muro.";
  return "Usá el intercomunicador y decidí si confiar o no en la voz.";
}

export default function IsolationGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<IsolationWorld | null>(null);
  const audioRef = useRef<IsolationSound | null>(null);
  const interactRef = useRef<() => void>(() => {});
  const modeRef = useRef<Mode>("intro");
  const timeRef = useRef(SECONDS);
  const startAtRef = useRef(0);
  const penaltyRef = useRef(0);
  const hasVoiceRef = useRef(false);
  const spokenAtRef = useRef(-1);
  const lookRef = useRef(new Map<number, { x: number; y: number; moved: number }>());
  const [mode, setMode] = useState<Mode>("intro");
  const [chamber, setChamber] = useState<Chamber>(0);
  const [remaining, setRemaining] = useState(SECONDS);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("PROTOCOLO DE AISLAMIENTO ACTIVADO");
  const [flash, setFlash] = useState(false);
  const [revision, setRevision] = useState(0);
  const [hints, setHints] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [joy, setJoy] = useState({ x: 0, y: 0 });

  const notify = useCallback((message: string, danger = false) => {
    setNotice(message);
    if (danger) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 440);
    }
    window.setTimeout(() => setNotice(current => current === message ? "" : current), 5700);
  }, []);
  const refresh = () => setRevision(n => n + 1);
  const closePanel = () => setPanel(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = new IsolationSound();
    audioRef.current = sound;
    let world: IsolationWorld;
    try {
      world = new IsolationWorld(canvas, {
        onChamber: (next) => {
          setChamber(next);
          sound.door();
          notify(next === 1 ? "ACCESO A AISLAMIENTO. NO ESTÁS SOLO." : "SECTOR FINAL. LA VOZ CONOCE TU NOMBRE.", true);
        },
        onCaught: () => {
          penaltyRef.current += 22;
          notify("TE ENCONTRÓ. PERDISTE 22 SEGUNDOS. ESCAPÁ.", true);
          sound.scare();
        },
        onThreat: (s) => { notify(s, true); sound.scare(); }
      });
    } catch {
      notify("No se pudo iniciar WebGL2. Probá con otro navegador o dispositivo.");
      return;
    }
    worldRef.current = world;
    let req = 0;
    let last = performance.now();
    let lastUI = 0;
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      const playing = modeRef.current === "playing";
      const elapsed = playing ? (Date.now() - startAtRef.current) / 1000 + penaltyRef.current : SECONDS - timeRef.current;
      const left = Math.max(0, SECONDS - elapsed);
      if (playing) {
        timeRef.current = left;
        if (left <= 0) {
          modeRef.current = "failed";
          setMode("failed");
          world.running = false;
          sound.scare();
        }
        if (elapsed > 61 && spokenAtRef.current < 1) {
          spokenAtRef.current = 1;
          notify("FALLO DE ENERGÍA. LA ENTIDAD ESTÁ DENTRO.", true);
          sound.scare();
        }
        if (elapsed > 280 && spokenAtRef.current < 2) {
          spokenAtRef.current = 2;
          notify("NO CONFÍES EN LO QUE ESCUCHÁS POR EL ALTAVOZ.", true);
          sound.message();
        }
        if (left <= 120 && spokenAtRef.current < 3) {
          spokenAtRef.current = 3;
          notify("DOS MINUTOS. SELLADO AUTOMÁTICO IRREVERSIBLE.", true);
          sound.scare();
        }
      }
      world.tick(dt, SECONDS - left, 1 - left / SECONDS);
      if (playing) {
        const dist = world.room > 0 ? Math.hypot(world.player.x - 4.5, world.player.z - (world.roomCenters[world.room] - 4)) : 99;
        sound.update(left, dist, SECONDS - left);
      }
      if (now - lastUI > 130) {
        lastUI = now;
        setRemaining(left);
        const next = playing ? world.getFocus() : null;
        setFocus(prev => prev?.id === next?.id ? prev : next);
      }
      req = requestAnimationFrame(frame);
    };
    req = requestAnimationFrame(frame);
    const onResize = () => world.resize();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
      world.keys.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") { e.preventDefault(); interactRef.current(); }
      if (e.code === "KeyH") setPanel("help");
    };
    const onKeyUp = (e: KeyboardEvent) => world.keys.delete(e.code);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      cancelAnimationFrame(req);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      world.destroy();
      sound.destroy();
      worldRef.current = null;
      audioRef.current = null;
    };
  }, [notify]);

  function start() {
    const w = worldRef.current;
    if (!w) return;
    audioRef.current?.start();
    modeRef.current = "playing";
    startAtRef.current = Date.now();
    penaltyRef.current = 0;
    w.running = true;
    setMode("playing");
    setNotice("BUSCÁ EL FUSIBLE. RESTAURÁ LA SEGURIDAD. ESCAPÁ.");
    window.setTimeout(() => setNotice(""), 7000);
  }

  function interactWith(id: string) {
    const w = worldRef.current, sound = audioRef.current;
    if (!w || modeRef.current !== "playing" || panel) return;
    sound?.click();
    switch (id) {
      case "fuse":
        if (!w.hasFuse) { w.hasFuse = true; w.markTaken(id); notify("FUSIBLE F-08 ADQUIRIDO. BUSCÁ EL TABLERO."); sound?.success(); }
        break;
      case "badge":
        if (!w.hasBadge) { w.hasBadge = true; w.markTaken(id); notify("CREDENCIAL ADQUIRIDA. NIVEL: SEGURIDAD."); sound?.success(); }
        break;
      case "fusebox":
        if (!w.hasFuse) notify("SIN ALIMENTACIÓN. FALTA EL FUSIBLE F-08.");
        else if (!w.fusePlaced) { w.fusePlaced = true; notify("ENERGÍA RESTAURADA. CONSOLA EN LÍNEA."); sound?.success(); }
        else notify("SUMINISTRO AUXILIAR ESTABLE.");
        break;
      case "terminal":
        if (!w.fusePlaced) notify("TERMINAL APAGADA. RESTAURÁ LA ENERGÍA.");
        else if (!w.hasBadge) notify("ACCESO DENEGADO. NECESITÁS UNA CREDENCIAL.");
        else if (!w.firstDoor) { setCode(""); setPanel("terminal"); }
        else notify("PUERTA 01 DESBLOQUEADA. AVANZÁ.");
        break;
      case "valve-blue":
      case "valve-green":
      case "valve-red": {
        const key = id.split("-")[1];
        if (w.valves.length === 3) { notify("PURGA COMPLETADA. ACTIVÁ EL EXTRACTOR."); break; }
        if (w.valves.includes(key)) { notify("ESTA VÁLVULA YA FUE ACCIONADA."); break; }
        const expected = ["blue", "green", "red"][w.valves.length];
        if (key !== expected) {
          w.valves = [];
          notify("ERROR DE PRESIÓN. SECUENCIA REINICIADA. MOVIMIENTO DETECTADO.", true);
          sound?.mistake();
          w.enemy.position.set(2.8, 0, w.roomCenters[w.room] - 2.5);
        } else {
          w.valves.push(key);
          notify("VÁLVULA " + w.valves.length + "/3 CONFIRMADA.");
          sound?.success();
        }
        break;
      }
      case "extractor":
        if (w.valves.length < 3) notify("PRESIÓN INESTABLE. FALTAN " + (3 - w.valves.length) + " VÁLVULAS.");
        else if (!w.secondDoor) { w.ventReady = true; w.openDoor(1); notify("PRESIÓN NORMALIZADA. COMPUERTA 02 ABIERTA.", true); sound?.door(); }
        else notify("EXTRACTOR OPERATIVO. COMPUERTA ABIERTA.");
        break;
      case "hide":
        w.hide(); notify("TE OCULTASTE. LA ENTIDAD SE ALEJA DURANTE UNOS SEGUNDOS."); break;
      case "log":
        w.foundLog = true; setPanel("record"); sound?.message(); break;
      case "breaker-0":
      case "breaker-1":
      case "breaker-2": {
        const n = Number(id.slice(-1));
        w.breakers[n] = !w.breakers[n];
        notify("INTERRUPTOR " + ["A", "B", "C"][n] + ": " + (w.breakers[n] ? "ENCENDIDO" : "APAGADO"));
        break;
      }
      case "speaker":
        if (!w.foundLog) { notify("IDENTIDAD DESCONOCIDA. LOCALIZÁ LA GRABACIÓN ORIGINAL."); break; }
        if (w.breakers.join(",") !== "true,false,true") { notify("SIN ENERGÍA DE EVACUACIÓN. AJUSTÁ LOS INTERRUPTORES."); break; }
        if (hasVoiceRef.current) notify("PROCEDIMIENTO CORRECTO. ACTIVÁ LA SALIDA.");
        else setPanel("voice");
        break;
      case "escape":
        if (!hasVoiceRef.current) notify("EVACUACIÓN NO AUTORIZADA. VERIFICÁ LA VOZ.");
        else {
          w.won = true; w.running = false; modeRef.current = "won"; setMode("won");
          sound?.finale();
          try { const prev = Number(localStorage.getItem("viralio-isolation-best") || "9999"); const duration = SECONDS - timeRef.current; if (duration < prev) localStorage.setItem("viralio-isolation-best", String(Math.ceil(duration))); } catch {}
        }
        break;
    }
    refresh();
  }

  function interact() {
    const w = worldRef.current;
    const f = w?.getFocus();
    if (f) interactWith(f.id);
    else notify("APUNTÁ A UN OBJETO Y ACERCATE PARA INTERACTUAR.");
  }
  interactRef.current = interact;

  function sendCode() {
    const w = worldRef.current;
    if (!w || code.length < 3) return;
    if (code === "427") {
      w.openDoor(0); setPanel(null); notify("CREDENCIAL VALIDADA. PUERTA 01 DESBLOQUEADA.", true); audioRef.current?.door();
    } else {
      penaltyRef.current += 8; setCode(""); notify("CÓDIGO INCORRECTO. PENALIZACIÓN: 8 SEGUNDOS.", true); audioRef.current?.mistake();
    }
    refresh();
  }

  function chooseVoice(choice: "trust" | "refuse") {
    setPanel(null);
    if (choice === "trust") {
      penaltyRef.current += 25;
      notify("ERROR. LA VOZ NO PERTENECE A UN OPERADOR. -25 SEGUNDOS.", true);
      audioRef.current?.scare();
    } else {
      hasVoiceRef.current = true;
      notify("IDENTIDAD RECHAZADA. PROTOCOLO HUMANO RESTABLECIDO. EVACUÁ.");
      audioRef.current?.success();
    }
    refresh();
  }

  function canvasDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (modeRef.current !== "playing" || panel) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lookRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: 0 });
  }
  function canvasMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = lookRef.current.get(e.pointerId);
    if (!p || panel) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.moved += Math.abs(dx) + Math.abs(dy);
    p.x = e.clientX; p.y = e.clientY;
    const factor = e.pointerType === "touch" ? .77 : 1;
    worldRef.current?.rotate(dx * factor, dy * factor);
  }
  function canvasUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = lookRef.current.get(e.pointerId);
    if (p && p.moved < 9 && e.pointerType === "touch" && modeRef.current === "playing" && !panel) {
      const w = worldRef.current;
      if (w) {
        const r = e.currentTarget.getBoundingClientRect();
        const hit = w.hitAt(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
        if (hit) interactWith(hit.id);
      }
    }
    lookRef.current.delete(e.pointerId);
  }

  function updateJoy(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const x = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * .35)));
    const y = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * .35)));
    setJoy({ x, y }); worldRef.current?.moveJoystick(x, y);
  }
  function joyDown(e: React.PointerEvent<HTMLDivElement>) { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); updateJoy(e); }
  function joyMove(e: React.PointerEvent<HTMLDivElement>) { if (e.currentTarget.hasPointerCapture(e.pointerId)) updateJoy(e); }
  function joyUp() { setJoy({ x: 0, y: 0 }); worldRef.current?.moveJoystick(0, 0); }

  const progress = chamber === 0 ? [worldRef.current?.hasFuse, worldRef.current?.fusePlaced, worldRef.current?.firstDoor]
    : chamber === 1 ? [!!worldRef.current?.valves.length, worldRef.current?.valves.length === 3, worldRef.current?.secondDoor]
    : [worldRef.current?.foundLog, worldRef.current?.breakers.join(",") === "true,false,true", hasVoiceRef.current];
  const danger = remaining < 120;
  const elapsed = SECONDS - remaining;
  const rank = elapsed < 480 ? "S" : elapsed < 660 ? "A" : elapsed < 780 ? "B" : "C";

  return <main className={"isolation " + (flash ? "isolation--flash " : "") + (danger ? "isolation--danger" : "")}>
    <canvas ref={canvasRef} className="iso-viewport" aria-label="Hospital tridimensional interactivo"
      onPointerDown={canvasDown} onPointerMove={canvasMove} onPointerUp={canvasUp} onPointerCancel={canvasUp}
      onWheel={e => { worldRef.current?.setZoom((worldRef.current?.zoom || 72) + Math.sign(e.deltaY) * 2); }} />
    <div className="iso-film-grain" aria-hidden="true" />
    <div className="iso-vignette" aria-hidden="true" />

    {mode === "playing" && <>
      <header className="iso-hud" aria-label="Estado de la partida">
        <div className="iso-brand"><a href="/" title="Volver a Viralio">V<span>.</span></a><div><strong>AISLAMIENTO <i>15</i></strong><small>VIRALIO / EXPERIMENT 004</small></div></div>
        <div className="iso-timer" role="timer" aria-label={"Tiempo restante " + format(remaining)}>
          <span><i className="iso-led" /> SELLADO INMINENTE</span>
          <strong>{format(remaining)}</strong>
        </div>
        <div className="iso-hud-tools">
          <button onClick={() => { const next = !soundOn; setSoundOn(next); audioRef.current?.mute(!next); }} aria-label={soundOn ? "Silenciar sonido" : "Activar sonido"}>{soundOn ? "♫" : "♪̸"}</button>
          <button onClick={() => setPanel("help")} title="Ayuda">?</button>
        </div>
      </header>
      <div className="iso-progress">
        {PHASES.map((p, i) => <div key={p.name} className={(chamber === i ? "active " : "") + (chamber > i ? "completed" : "")}><span>0{i + 1}</span><strong>{p.name}</strong></div>)}
      </div>
      <div className="iso-objective">
        <span>OBJETIVO ACTUAL <i>●</i></span>
        <strong>{PHASES[chamber].subtitle}</strong>
        <div className="iso-checks">{progress.map((done, i) => <span key={i} className={done ? "done" : ""} />)}</div>
      </div>
      <div className="iso-crosshair" aria-hidden="true"><i /></div>
      {notice && <div className="iso-broadcast" role="status"><span>■ TRANSMISIÓN DE EMERGENCIA</span><strong>{notice}</strong></div>}
      {focus && !panel && <div className="iso-focus" aria-live="off"><span>OBJETO INTERACTIVO</span><strong>{focus.label}</strong><small>TOCÁ EL OBJETO O PULSÁ INTERACTUAR</small></div>}
      <div className="iso-bottom">
        <div className="iso-joystick" aria-label="Control de movimiento" onPointerDown={joyDown} onPointerMove={joyMove} onPointerUp={joyUp} onPointerCancel={joyUp}>
          <span className="iso-joystick-ring" /><span className="iso-joystick-knob" style={{ transform: "translate(" + joy.x * 34 + "px," + joy.y * 34 + "px)" }} />
        </div>
        <div className="iso-bottom-center">
          <button className="iso-hint-button" onClick={() => { setHints(n => n + 1); setPanel("help"); }}>◈ PISTA <span>{hints > 0 ? "CONSULTADA" : "DISPONIBLE"}</span></button>
          <small>MOVÉ: WASD / JOYSTICK · MIRÁ: ARRASTRÁ · INTERACTUÁ: E</small>
        </div>
        <button className={"iso-action " + (focus ? "iso-action--active" : "")} onClick={interact} disabled={!focus}><span>✋</span> INTERACTUAR</button>
      </div>
      <div className="iso-zoom">
        <button onClick={() => worldRef.current?.setZoom((worldRef.current?.zoom || 72) - 5)} aria-label="Acercar cámara">＋</button>
        <button onClick={() => worldRef.current?.setZoom((worldRef.current?.zoom || 72) + 5)} aria-label="Alejar cámara">−</button>
      </div>
    </>}

    {mode === "intro" && <div className="iso-intro">
      <div className="iso-intro-side"><span>VIRALIO ORIGINALS</span><span>EPISODIO / 004</span></div>
      <div className="iso-intro-content">
        <span className="iso-eyebrow"><i /> TRANSMISIÓN RECIBIDA · 02:17 AM</span>
        <h1>AISLAMIENTO <em>15</em></h1>
        <p className="iso-tagline">No todos los que entran necesitan una salida.</p>
        <div className="iso-letter">
          <span>HOSPITAL DE AISLAMIENTO / REGISTRO 015</span>
          <p>Despertaste dentro de un hospital sellado. Un protocolo de emergencia destruirá todo lo que permanece adentro en <strong>quince minutos</strong>. Para escapar tendrás que atravesar Urgencias, Aislamiento y Contención.</p>
          <p>Una voz asegura que puede ayudarte. Algo recorre los pasillos. <strong>Las dos cosas parecen conocerte.</strong></p>
        </div>
        <div className="iso-intro-meta"><span>◷ 15 MIN</span><span>◇ 3 SECTORES</span><span>▣ 3D REAL</span><span>♬ AURICULARES</span></div>
        <button className="iso-start" onClick={start}><span>COMENZAR AISLAMIENTO</span><b>↗</b></button>
        <p className="iso-devices">Exploración libre · Celular: control izquierdo para caminar y arrastrar para mirar · PC: WASD + mouse · Sonido y efectos de susto · Requiere WebGL2.</p>
      </div>
      <div className="iso-intro-coordinate">UNIDAD MÉDICA 15 — ACCESO RESTRINGIDO / 00.15</div>
    </div>}

    {mode === "failed" && <div className="iso-end iso-failed">
      <span className="iso-end-kicker">PROTOCOLO 015 / EJECUTADO</span>
      <h2>EL TIEMPO<br /><em>SE TERMINÓ.</em></h2>
      <p>Las compuertas de seguridad sellaron el edificio. La última voz que escuchaste fue la tuya.</p>
      <div className="iso-end-stat"><span>SUPERVIVENCIA</span><strong>15:00</strong></div>
      <button onClick={() => window.location.reload()} className="iso-start">VOLVER A INTENTARLO <b>↗</b></button>
      <a href="/">Volver a Viralio</a>
    </div>}

    {mode === "won" && <div className="iso-end iso-won">
      <span className="iso-end-kicker">ARCHIVO 015 / EVACUACIÓN CONFIRMADA</span>
      <h2>ESTÁS<br /><em>AFUERA.</em></h2>
      <p>La puerta se abrió. Sobreviviste al aislamiento, pero tu expediente sigue figurando como «paciente ingresado».</p>
      <div className="iso-score"><div><span>TIEMPO UTILIZADO</span><strong>{format(elapsed)}</strong></div><div><span>CLASIFICACIÓN</span><strong>{rank}</strong></div><div><span>PISTAS</span><strong>{hints}</strong></div></div>
      <p className="iso-replay-hook">¿Podés escapar más rápido? Los errores, la ruta y la persecución cambian tu resultado.</p>
      <button onClick={() => { if (navigator.share) { void navigator.share({ title: "AISLAMIENTO 15 · VIRALIO", text: "Escapé de AISLAMIENTO 15 en " + format(elapsed) + ". ¿Podés superarme?", url: location.href }); } else { void navigator.clipboard?.writeText(location.href); notify("ENLACE COPIADO"); } }} className="iso-start">DESAFIAR A UN AMIGO <b>↗</b></button>
      <button className="iso-again" onClick={() => window.location.reload()}>VOLVER A JUGAR ↻</button>
      <a href="/">Explorar más salas Viralio</a>
    </div>}

    {panel && mode === "playing" && <div className="iso-panel-scrim" onClick={closePanel} role="presentation"><div className="iso-panel" role="dialog" aria-modal="true" aria-label="Interacción con objeto" onClick={e => e.stopPropagation()}>
      <div className="iso-panel-head"><span>◈ INTERFAZ DE INSTALACIÓN / {PHASES[chamber].name}</span><button onClick={closePanel} aria-label="Cerrar ventana">×</button></div>
      {panel === "terminal" && <>
        <span className="iso-panel-sub">ACCESO A COMPUERTA · NIVEL 01</span><h2>CONTROL DE SEGURIDAD</h2>
        <p>Ingresá las tres cifras correspondientes a las prioridades P1, P2 y P3 del registro de triaje.</p>
        <div className="iso-display" aria-label={"Código ingresado: " + code}>{code.padEnd(3, "•")}</div>
        <div className="iso-keypad">{["1","2","3","4","5","6","7","8","9","BORRAR","0","CONFIRMAR"].map(key => <button key={key} onClick={() => key === "BORRAR" ? setCode("") : key === "CONFIRMAR" ? sendCode() : setCode(c => (c + key).slice(0, 3))}>{key}</button>)}</div>
      </>}
      {panel === "record" && <>
        <span className="iso-panel-sub">TRANSCRIPCIÓN · ARCHIVO 015</span><h2>REGISTRO DE IDENTIDAD</h2>
        <div className="iso-transcript"><p><b>[00:02]</b> — Operador: ¿Quién está en el pabellón?</p><p><b>[00:06]</b> — Registro biométrico: NO SE DETECTA PERSONAL AUTORIZADO.</p><p><b>[00:09]</b> — Operador: Entonces... ¿quién está hablando por mis altavoces?</p><p><b>[00:14]</b> — Sistema: La imitación vocal se considera síntoma de la anomalía. <strong>NO OBEDECER LA VOZ.</strong></p></div>
        <button className="iso-confirm" onClick={closePanel}>HE ENTENDIDO ↗</button>
      </>}
      {panel === "voice" && <>
        <span className="iso-panel-sub">ORIGEN DE VOZ / NO VERIFICADO</span><h2>¿A QUIÉN LE CREÉS?</h2>
        <p>«Hola, soy el médico a cargo. Para activar la salida, autorizame a abrir el sistema de contención. Confiá en mí».</p>
        <div className="iso-decisions"><button onClick={() => chooseVoice("trust")}>CONFIAR EN LA VOZ <span>→</span></button><button onClick={() => chooseVoice("refuse")}>RECHAZAR COMUNICACIÓN <span>→</span></button></div>
      </>}
      {panel === "help" && <>
        <span className="iso-panel-sub">ASISTENCIA / {PHASES[chamber].name}</span><h2>REGISTRO DE PISTAS</h2>
        <p>{hintText(worldRef.current, chamber)}</p>
        <div className="iso-help-controls"><b>DESPLAZAMIENTO</b><span>PC: WASD / flechas. Celular: círculo izquierdo.</span><b>CÁMARA</b><span>Arrastrá sobre la escena. Zoom: botones + y − o rueda.</span><b>OBJETOS</b><span>Apuntá y tocá INTERACTUAR, o tocá directamente el objeto en celular.</span><b>PERSECUCIÓN</b><span>Los escondites separan por unos segundos al perseguidor.</span></div>
        <button className="iso-confirm" onClick={closePanel}>VOLVER A LA SALA ↗</button>
      </>}
    </div></div>}
    <div className="iso-watermark">© VIRALIO ORIGINALS · PERSONAJE GLB: CESIUM / CC BY 4.0</div>
  </main>;
}
