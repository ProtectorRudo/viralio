"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IsolationWorld, type Chamber, type Focus } from "./IsolationWorld";
import { IsolationSound } from "./IsolationSound";
import { earlyHint } from "./IsolationHints";
import { LocalPlaytest, type QualityOutcome } from "./LocalPlaytest";
import "./isolation.css";

type Mode = "intro" | "playing" | "failed" | "won";
type Panel = null | "terminal" | "triage" | "record" | "voice" | "help" | "sign";
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
    if (!w.hasBadge) return "La consola requiere una credencial. Revisá la camilla derecha.";
    if (!w.readTriage) return "Encontrá el archivo de triaje junto a la camilla: las tres prioridades dan la clave.";
    if (w.relays.length < 3) return "Accioná los tres relés de la pared derecha en el orden indicado en la pizarra del fondo.";
    if (!w.firstDoor) return "Las prioridades P1, P2 y P3 del archivo clínico forman la clave de la terminal." ;
    return "La puerta está abierta. Entrá al pasillo de aislamiento.";
  }
  if (chamber === 1) {
    if (w.oxygenCells.length < 2) return "Recuperá las dos celdas de oxígeno cerca de los módulos de aislamiento.";
    if (!w.oxygenInstalled) return "Insertá las celdas en el regulador situado junto a la puerta.";
    if (w.valves.length < 3) return "El panel del fondo indica el orden de colores. Repetilo exactamente en las tres válvulas.";
    if (!w.secondDoor) return "La purga está lista: accioná el extractor al fondo.";
    return "Se abrió el acceso a contención. No te detengas.";
  }
  if (!w.foundLog) return "Buscá el registro de identidad cerca del muro izquierdo.";
  if (w.breakers.join(",") !== "true,false,true") return "Configurá los tres interruptores según la inscripción del muro.";
  return "Usá el intercomunicador y decidí si confiar o no en la voz.";
}

function tieredHint(w: IsolationWorld, room: Chamber, level: number) {
  return level >= 3 ? hintText(w, room) : earlyHint(w, room, level === 2 ? 2 : 1);
}
const HINT_PROMPT = "Cada objetivo tiene tres niveles de ayuda. La primera pista orienta sin revelar la respuesta.";
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
  const backgroundAtRef = useRef<number | null>(null);
  const backgroundGraceUsedRef = useRef(0);
  const soundEnabledRef = useRef(true);
  const lookRef = useRef(new Map<number, { x: number; y: number; moved: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const fpsFrames = useRef<number[]>([]);
  const hintStagesRef = useRef(new Map<string, number>());
  const testMetricsRef = useRef(new LocalPlaytest());
  const hintCountRef = useRef(0);
  const [mode, setMode] = useState<Mode>("intro");
  const [compatibilityError, setCompatibilityError] = useState("");
  const [playtestReport, setPlaytestReport] = useState("");
  const [copiedReport, setCopiedReport] = useState(false);
  const [chamber, setChamber] = useState<Chamber>(0);
  const [remaining, setRemaining] = useState(SECONDS);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [code, setCode] = useState("");
  const [triageCode, setTriageCode] = useState("427");
  const [notice, setNotice] = useState("PROTOCOLO DE AISLAMIENTO ACTIVADO");
  const [flash, setFlash] = useState(false);
  const [progress, setProgress] = useState<boolean[]>([false, false, false, false]);
  const [objective, setObjective] = useState("Buscá el fusible F-08");
  const [dangerLevel, setDangerLevel] = useState(0);
  const [chapterCard,setChapterCard] = useState<Chamber | null>(null);
  const [chapterKey,setChapterKey] = useState(0);
  const [briefAlert, setBriefAlert] = useState(false);
  const [helpCopy, setHelpCopy] = useState("");
  const [signCopy, setSignCopy] = useState<string[]>([]);
  const [benchmark, setBenchmark] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, dpr: 1, drawCalls: 0, triangles: 0, webgl2: false, software: false, chamber: 1 });
  const [hints, setHints] = useState(0);
  const [hintStage, setHintStage] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [joy, setJoy] = useState({ x: 0, y: 0 });

  function buildTestReport(outcome: QualityOutcome, elapsedSeconds: number) {
    const w=worldRef.current;
    if(!w)return "";
    return testMetricsRef.current.report({
      outcome, elapsed:Math.max(0,elapsedSeconds),hints:hintCountRef.current,
      render:w.getPerformanceSnapshot(),
      viewport:{width:window.innerWidth,height:window.innerHeight}
    });
  }
  async function copyTestReport() {
    if(!playtestReport)return;
    try {
      await navigator.clipboard.writeText(playtestReport);
      setCopiedReport(true);
    } catch {
      setCopiedReport(false);
      notify("NO SE PUDO COPIAR. EL NAVEGADOR REQUIERE PERMISO DE PORTAPAPELES.");
    }
  }
  const notify = useCallback((message: string, danger = false) => {
    setNotice(message);
    if (danger) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 440);
    }
    window.setTimeout(() => setNotice(current => current === message ? "" : current), 5700);
  }, []);
  const refresh = () => {
    const w = worldRef.current;
    if (!w) return;
    const next = w.room === 0 ? [w.hasFuse && w.fusePlaced, w.hasBadge && w.readTriage, w.relays.length === 3, w.firstDoor]
      : w.room === 1 ? [w.oxygenCells.length === 2, w.oxygenInstalled, w.valves.length === 3, w.secondDoor]
      : [w.foundLog, w.breakers.join(",") === "true,false,true", hasVoiceRef.current, w.won];
    setProgress(next);
    setObjective(w.room === 0
      ? (!w.hasFuse ? "Buscá el fusible F-08" : !w.fusePlaced ? "Alimentá el tablero auxiliar" : !w.hasBadge ? "Recuperá la credencial" : !w.readTriage ? "Examiná el archivo de triaje" : w.relays.length < 3 ? "Sincronizá los tres relés" : !w.firstDoor ? "Descifrá el código de seguridad" : "Atravesá la primera compuerta")
      : w.room === 1
        ? (w.oxygenCells.length < 2 ? "Recuperá las celdas de oxígeno" : !w.oxygenInstalled ? "Restaurá el regulador" : w.valves.length < 3 ? "Ejecutá la purga de presión" : !w.secondDoor ? "Activá el extractor" : "Ingresá a Contención")
        : (!w.foundLog ? "Encontrá el expediente 015" : w.breakers.join(",") !== "true,false,true" ? "Configurá los interruptores" : !hasVoiceRef.current ? "Identificá la voz que te llama" : "Activá la evacuación"));
  };
  const closePanel = () => setPanel(null);
  useEffect(() => {
    // Reading a document protects against off-screen attacks; time still runs.
    worldRef.current?.setInspecting(panel !== null);
  }, [panel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = new IsolationSound();
    audioRef.current = sound;
    let world: IsolationWorld;
    try {
      world = new IsolationWorld(canvas, {
        onChamber: (next) => {
          testMetricsRef.current.enter(next, SECONDS-timeRef.current);
          setChamber(next);
          setChapterCard(next);
          setChapterKey(v => v+1);
          window.setTimeout(()=>setChapterCard(null),2700);
          setProgress([false, false, false, false]);
          setObjective(next === 1 ? "Recuperá las celdas de oxígeno" : "Encontrá el expediente 015");
          sound.door();
          notify(next === 1 ? "ACCESO A AISLAMIENTO. NO ESTÁS SOLO." : "SECTOR FINAL. LA VOZ CONOCE TU NOMBRE.", true);
        },
        onCaught: () => {
          testMetricsRef.current.caught();
          penaltyRef.current += 16;
          notify("TE ALCANZÓ. PERDISTE 16 SEGUNDOS. ESCAPÁ.", true);
          sound.scare();
        },
        onThreat: (s) => { notify(s, true); sound.scare(); },
        onMoment: (kind, message) => {
          notify(message, kind === "lights" || kind === "reactor");
          sound.cinematic(kind);
        }
      });
    } catch {
      const message="Tu dispositivo o navegador no pudo iniciar el entorno 3D WebGL. Probá con Chrome, Safari actualizado u otro equipo compatible.";
      setCompatibilityError(message);
      return;
    }
    worldRef.current = world;
    let req = 0;
    let last = performance.now();
    let lastUI = 0;
    let lastPerformanceUpdate = 0;
    const frame = (now: number) => {
      const realFrameMs = now - last;
      const dt = Math.min(.05, realFrameMs / 1000);
      last = now;
      // Some mobile browsers still fire throttled RAF callbacks while hidden.
      // Do not run the clock or a failure transition before applying grace.
      if (backgroundAtRef.current !== null) {
        req = requestAnimationFrame(frame);
        return;
      }
      if (realFrameMs > 0 && realFrameMs < 1000) {
        const frames = fpsFrames.current;
        frames.push(realFrameMs);
        if (frames.length > 90) frames.shift();
      }
      const playing = modeRef.current === "playing";
      const elapsed = playing ? (Date.now() - startAtRef.current) / 1000 + penaltyRef.current : SECONDS - timeRef.current;
      const left = Math.max(0, SECONDS - elapsed);
      if (playing) {
        timeRef.current = left;
        if (left <= 0) {
          modeRef.current = "failed";
          setPlaytestReport(buildTestReport("sellado", SECONDS));
          setMode("failed");
          world.running = false;
          sound.scare();
        }
        if (elapsed > 61 && spokenAtRef.current < 1) {
          spokenAtRef.current = 1;
          notify("CORTE GENERAL. ALGO APARECIÓ ESCRITO EN EL MURO.", true);
          world.setAlert(1.45);
          setBriefAlert(true);
          window.setTimeout(() => setBriefAlert(false), 1450);
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
        const dist = world.room > 0 ? Math.hypot(world.player.x - world.enemy.position.x, world.player.z - world.enemy.position.z) : 99;
        const lateral = Math.sin(world.yaw) * (world.enemy.position.z - world.player.z) + Math.cos(world.yaw) * (world.enemy.position.x - world.player.x);
        sound.update(left, dist, SECONDS - left, Math.max(-1, Math.min(1, lateral / Math.max(dist, 1))));
        if (now - lastUI > 130) setDangerLevel(world.room === 0 ? 0 : Math.max(0, 100 * (1 - Math.min(dist, 8) / 8)));
      }
      if (now - lastUI > 130) {
        lastUI = now;
        setRemaining(left);
        const next = playing ? world.getFocus() : null;
        setFocus(prev => prev?.id === next?.id ? prev : next);
      }
      if (now - lastPerformanceUpdate > 1300 && playing && fpsFrames.current.length > 10) {
        lastPerformanceUpdate = now;
        const samples = fpsFrames.current;
        const average = samples.reduce((total, value) => total + value, 0) / samples.length;
        const metrics = world.getPerformanceSnapshot();
        const fps=Math.round(1000/average);
        testMetricsRef.current.fps(fps);
        setPerformanceStats({ fps, ...metrics });
      }
      req = requestAnimationFrame(frame);
    };
    req = requestAnimationFrame(frame);
    const onResize = () => world.resize();
    const onVisibility = () => {
      if (document.hidden) {
        if (modeRef.current !== "playing") return;
        backgroundAtRef.current = Date.now();
        world.running = false;
        sound.mute(true);
        world.keys.clear();
        world.moveJoystick(0, 0);
        return;
      }
      const hiddenAt = backgroundAtRef.current;
      backgroundAtRef.current = null;
      if (hiddenAt === null || modeRef.current !== "playing") return;
      const awayMs = Math.max(0, Date.now() - hiddenAt);
      // Exactly 45 seconds of courtesy across the ENTIRE run, never per
      // interruption. Repeated app switching must not invalidate rankings.
      const remainingGrace = Math.max(0, 45_000 - backgroundGraceUsedRef.current);
      const graceMs = Math.min(remainingGrace, awayMs);
      backgroundGraceUsedRef.current += graceMs;
      testMetricsRef.current.courtesy(graceMs);
      startAtRef.current += graceMs;
      fpsFrames.current = [];
      last = performance.now();
      world.running = true;
      sound.mute(!soundEnabledRef.current);
      notify(awayMs <= remainingGrace
        ? "PARTIDA REANUDADA. RESTAN " + Math.ceil((45_000 - backgroundGraceUsedRef.current) / 1000) + " SEGUNDOS DE PAUSA DE CORTESÍA."
        : "PARTIDA REANUDADA. LOS 45 SEGUNDOS DE PAUSA TOTAL SE AGOTARON.");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
      world.keys.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") { e.preventDefault(); interactRef.current(); }
      if (e.code === "KeyH" && modeRef.current === "playing") {
        const key = world.room + ":" + hintText(world, world.room);
        const level = hintStagesRef.current.get(key) ?? 0;
        setHintStage(level);
        setHelpCopy(level ? tieredHint(world, world.room, level) : HINT_PROMPT);
        setPanel("help");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => world.keys.delete(e.code);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      cancelAnimationFrame(req);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
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
    testMetricsRef.current.reset();
    hintCountRef.current=0;
    setPlaytestReport("");
    setCopiedReport(false);
    hintStagesRef.current.clear();
    setHints(0);
    setTriageCode(w.triageDigits.join(""));
    modeRef.current = "playing";
    startAtRef.current = Date.now();
    penaltyRef.current = 0;
    backgroundAtRef.current = null;
    backgroundGraceUsedRef.current = 0;
    w.running = true;
    setMode("playing");
    setNotice("BUSCÁ EL FUSIBLE. RESTAURÁ LA SEGURIDAD. ESCAPÁ.");
    window.setTimeout(() => setNotice(""), 7000);
  }

  function interactWith(id: string) {
    const w = worldRef.current, sound = audioRef.current;
    if (!w || modeRef.current !== "playing" || panel) return;
    sound?.click();
    if (id.startsWith("sign-")) {
      const text = w.getSignText(id);
      if (text) {
        setSignCopy(text);
        setPanel("sign");
        sound?.message();
      }
      return;
    }
    switch (id) {
      case "fuse":
        if (!w.hasFuse) { w.hasFuse = true; w.markTaken(id); notify("FUSIBLE F-08 ADQUIRIDO. BUSCÁ EL TABLERO."); sound?.success(); }
        break;
      case "triage":
        w.readTriage = true;
        w.holdAtPanel(10);
        setPanel("triage"); sound?.message(); break;
      case "relay-0":
      case "relay-1":
      case "relay-2": {
        const n = Number(id.slice(-1));
        if (!w.fusePlaced) { notify("LOS RELÉS NO TIENEN ENERGÍA. INSTALÁ EL FUSIBLE."); break; }
        if (w.relays.length === 3) { notify("RED DE SEGURIDAD ESTABLE. VOLVÉ A LA TERMINAL."); break; }
        if (w.relays.includes(n)) { notify("ESTE RELÉ YA FUE ACCIONADO."); break; }
        if (n !== w.relayPattern[w.relays.length]) {
          w.relays = []; penaltyRef.current += 5; testMetricsRef.current.penalize(5); w.setAlert(.75);
          w.resetRelays();
          notify("ERROR DE SINCRONIZACIÓN. REINICIO AUTOMÁTICO. -5 SEGUNDOS.", true); sound?.mistake();
        } else {
          w.relays.push(n); w.rotateRelay(id);
          notify("RELÉ " + w.relays.length + "/3 EN SERVICIO."); sound?.success();
        }
        break;
      }
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
        else if (!w.readTriage) notify("FALTAN LAS PRIORIDADES DE TRIAJE. REVISÁ LOS EXPEDIENTES.");
        else if (w.relays.length !== 3) notify("SINCRONIZACIÓN INCOMPLETA. ACCIONÁ LOS RELÉS EN ORDEN.");
        else if (!w.firstDoor) { w.holdAtPanel(10); setCode(""); setPanel("terminal"); }
        else notify("PUERTA 01 DESBLOQUEADA. AVANZÁ.");
        break;
      case "cell-alpha":
      case "cell-beta": {
        const cell = id.split("-")[1];
        if (!w.oxygenCells.includes(cell)) {
          w.oxygenCells.push(cell); w.markTaken(id);
          notify("CELDA DE OXÍGENO " + w.oxygenCells.length + "/2 RECUPERADA."); sound?.success();
        }
        break;
      }
      case "regulator":
        if (w.oxygenCells.length < 2) notify("EL REGULADOR NECESITA DOS CELDAS CRIOGÉNICAS.");
        else if (!w.oxygenInstalled) { w.oxygenInstalled = true; notify("OXÍGENO ESTABLE. AHORA EJECUTÁ LA PURGA.", true); sound?.door(); }
        else notify("OXÍGENO ESTABLE. PURGA MANUAL DISPONIBLE.");
        break;
      case "valve-blue":
      case "valve-green":
      case "valve-red": {
        const key = id.split("-")[1];
        if (!w.oxygenInstalled) { notify("ALERTA DE PRESIÓN. PRIMERO INSTALÁ LAS CELDAS DE OXÍGENO."); break; }
        if (w.valves.length === 3) { notify("PURGA COMPLETADA. ACTIVÁ EL EXTRACTOR."); break; }
        if (w.valves.includes(key)) { notify("ESTA VÁLVULA YA FUE ACCIONADA."); break; }
        const expected = w.valvePattern[w.valves.length];
        if (key !== expected) {
          w.valves = [];
          notify("ERROR DE PRESIÓN. SECUENCIA REINICIADA. MOVIMIENTO DETECTADO.", true);
          sound?.mistake();
          w.enemy.position.set(2.8, 0, w.roomCenters[w.room] - 2.5);
        } else {
          w.valves.push(key);
          w.rotateValve(id);
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
        w.foundLog = true; w.holdAtPanel(12); setPanel("record"); sound?.message(); break;
      case "breaker-0":
      case "breaker-1":
      case "breaker-2": {
        const n = Number(id.slice(-1));
        w.breakers[n] = !w.breakers[n];
        w.updateBreaker(n, w.breakers[n]);
        notify("INTERRUPTOR " + ["A", "B", "C"][n] + ": " + (w.breakers[n] ? "ENCENDIDO" : "APAGADO"));
        break;
      }
      case "speaker":
        if (!w.foundLog) { notify("IDENTIDAD DESCONOCIDA. LOCALIZÁ LA GRABACIÓN ORIGINAL."); break; }
        if (w.breakers.join(",") !== "true,false,true") { notify("SIN ENERGÍA DE EVACUACIÓN. AJUSTÁ LOS INTERRUPTORES."); break; }
        if (hasVoiceRef.current) notify("PROCEDIMIENTO CORRECTO. ACTIVÁ LA SALIDA.");
        else { w.holdAtPanel(12); setPanel("voice"); }
        break;
      case "escape":
        if (!hasVoiceRef.current) notify("EVACUACIÓN NO AUTORIZADA. VERIFICÁ LA VOZ.");
        else {
          w.won = true; w.running = false; modeRef.current = "won";
           setPlaytestReport(buildTestReport("evacuacion", SECONDS-timeRef.current));
           setCopiedReport(false); setMode("won");
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
  useEffect(() => { interactRef.current = interact; });

  function sendCode() {
    const w = worldRef.current;
    if (!w || code.length < 3) return;
    if (code === w.triageDigits.join("")) {
      w.openDoor(0); setPanel(null); notify("CREDENCIAL VALIDADA. PUERTA 01 DESBLOQUEADA.", true); audioRef.current?.door();
    } else {
      penaltyRef.current += 8; testMetricsRef.current.penalize(8); setCode(""); notify("CÓDIGO INCORRECTO. PENALIZACIÓN: 8 SEGUNDOS.", true); audioRef.current?.mistake();
    }
    refresh();
  }

  function chooseVoice(choice: "trust" | "refuse") {
    setPanel(null);
    if (choice === "trust") {
      penaltyRef.current += 25;
      testMetricsRef.current.penalize(25);
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
    if (lookRef.current.size === 2) {
      const [a, b] = [...lookRef.current.values()];
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: worldRef.current?.zoom ?? 72
      };
      for (const pointer of lookRef.current.values()) pointer.moved = 100;
    }
  }
  function canvasMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = lookRef.current.get(e.pointerId);
    if (!p || panel) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.moved += Math.abs(dx) + Math.abs(dy);
    p.x = e.clientX; p.y = e.clientY;
    if (pinchRef.current && lookRef.current.size >= 2) {
      const [a, b] = [...lookRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const initial = pinchRef.current;
      worldRef.current?.setZoom(initial.zoom - (distance - initial.distance) * .105);
      return;
    }
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
    if (pinchRef.current) {
      for (const pointer of lookRef.current.values()) pointer.moved = 100;
      pinchRef.current = null;
    }
  }

  function openHelp() {
    const w = worldRef.current;
    const key = w ? w.room + ":" + hintText(w, w.room) : "";
    const level = hintStagesRef.current.get(key) ?? 0;
    setHintStage(level);
    setHelpCopy(w && level ? tieredHint(w, w.room, level) : HINT_PROMPT);
    setPanel("help");
  }

  function requestHint() {
    const w = worldRef.current;
    if (!w || modeRef.current !== "playing") return;
    const key = w.room + ":" + hintText(w, w.room);
    const previous = hintStagesRef.current.get(key) ?? 0;
    const next = Math.min(3, previous + 1);
    if (previous < 3) {
      hintCountRef.current++;
      setHints(value => value + 1);
    }
    hintStagesRef.current.set(key, next);
    setHintStage(next);
    setHelpCopy(tieredHint(w, w.room, next));
    setPanel("help");
    audioRef.current?.message();
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
        <div className="iso-brand"><a href="https://viralio.net/" title="Volver a Viralio">V<span>.</span></a><div><strong>AISLAMIENTO <i>15</i></strong><small>VIRALIO / EXPERIMENT 004</small></div></div>
        <div className="iso-timer" role="timer" aria-label={"Tiempo restante " + format(remaining)}>
          <span><i className="iso-led" /> SELLADO INMINENTE</span>
          <strong>{format(remaining)}</strong>
        </div>
        <div className="iso-hud-tools">
          <button onClick={() => { const next = !soundOn; soundEnabledRef.current = next; setSoundOn(next); audioRef.current?.mute(!next); }} aria-label={soundOn ? "Silenciar sonido" : "Activar sonido"}>{soundOn ? "♫" : "♪̸"}</button>
          <button onClick={openHelp} title="Ayuda">?</button>
        </div>
      </header>
      <div className="iso-progress">
        {PHASES.map((p, i) => <div key={p.name} className={(chamber === i ? "active " : "") + (chamber > i ? "completed" : "")}><span>0{i + 1}</span><strong>{p.name}</strong></div>)}
      </div>
      <div className="iso-objective">
        <span>OBJETIVO ACTUAL <i>●</i></span>
        <strong>{objective}</strong>
        <div className="iso-checks">{progress.map((done, i) => <span key={i} className={done ? "done" : ""} />)}</div>
      </div>
      <div className="iso-crosshair" aria-hidden="true"><i /></div>
      {briefAlert && <div className="iso-blackout" aria-hidden="true"><span>SIN SEÑAL · PROTOCOLO 015</span></div>}
      {chapterCard !== null && <div className="iso-chapter-card" key={chapterKey} aria-live="polite">
        <span className="iso-chapter-index">ESTACIÓN DE CONTENCIÓN // 0{chapterCard+1}</span>
        <strong>{PHASES[chapterCard].name}</strong>
        <small>{PHASES[chapterCard].quote}</small>
      </div>}
      {chamber>0 && <div className="iso-edge-threat" style={{opacity: Math.min(.44,Math.max(0,(dangerLevel-63)/95))}} aria-hidden="true" />}
      {chamber > 0 && <div className="iso-threat-meter" aria-label={"Proximidad de amenaza " + Math.round(dangerLevel) + " por ciento"}><span>◉ PRESENCIA DETECTADA</span><div><i style={{ width: dangerLevel + "%" }} /></div></div>}
      {benchmark && <aside className="iso-device-performance" aria-label="Diagnóstico gráfico en este dispositivo">
        <span>DIAGNÓSTICO WEBGL · EN VIVO</span>
        <strong>{performanceStats.fps} <small>FPS</small></strong>
        <div>Escala: {performanceStats.dpr.toFixed(2)}× · Sector {performanceStats.chamber}</div>
        <div>Draw calls: {performanceStats.drawCalls} · Triángulos: {performanceStats.triangles.toLocaleString("es-AR")}</div>
        <div>{performanceStats.software ? "Renderizado por software" : "Renderizado WebGL"}{!performanceStats.webgl2 ? " · Compatibilidad" : "2"}</div>
        <button onClick={() => setBenchmark(false)} aria-label="Cerrar diagnóstico de rendimiento">Cerrar ×</button>
      </aside>}
      {notice && <div className="iso-broadcast" role="status"><span>■ TRANSMISIÓN DE EMERGENCIA</span><strong>{notice}</strong></div>}
      {focus && !panel && <div className="iso-focus" aria-live="off"><span>OBJETO INTERACTIVO</span><strong>{focus.label}</strong><small>TOCÁ EL OBJETO O PULSÁ INTERACTUAR</small></div>}
      <div className="iso-bottom">
        <div className="iso-joystick" aria-label="Control de movimiento" onPointerDown={joyDown} onPointerMove={joyMove} onPointerUp={joyUp} onPointerCancel={joyUp}>
          <span className="iso-joystick-ring" /><span className="iso-joystick-knob" style={{ transform: "translate(" + joy.x * 34 + "px," + joy.y * 34 + "px)" }} />
        </div>
        <div className="iso-bottom-center">
          <button className="iso-hint-button" onClick={requestHint}>◈ PISTA <span>{hints > 0 ? "CONSULTADA" : "DISPONIBLE"}</span></button>
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
        {compatibilityError && <p className="iso-compat-error" role="alert">{compatibilityError}</p>}
         <button className="iso-start" onClick={start} disabled={!!compatibilityError}><span>{compatibilityError?"WEBGL NO DISPONIBLE":"COMENZAR AISLAMIENTO"}</span><b>↗</b></button>
        <p className="iso-devices">Exploración libre · Celular: control izquierdo para caminar y arrastrar para mirar · PC: WASD + mouse · Sonido y efectos de susto · Requiere WebGL2. Las interrupciones del celular comparten hasta 45 segundos de pausa de cortesía durante toda la partida.</p>
      </div>
      <div className="iso-intro-coordinate">UNIDAD MÉDICA 15 — ACCESO RESTRINGIDO / 00.15</div>
    </div>}

    {mode === "failed" && <div className="iso-end iso-failed">
      <span className="iso-end-kicker">PROTOCOLO 015 / EJECUTADO</span>
      <h2>EL TIEMPO<br /><em>SE TERMINÓ.</em></h2>
      <p>Las compuertas de seguridad sellaron el edificio. La última voz que escuchaste fue la tuya.</p>
      <div className="iso-end-stat"><span>SUPERVIVENCIA</span><strong>15:00</strong></div>
      <button onClick={() => window.location.reload()} className="iso-start">VOLVER A INTENTARLO <b>↗</b></button>
       {playtestReport && <button className="iso-report-copy" onClick={() => void copyTestReport()}>{copiedReport?"INFORME COPIADO ✓":"COPIAR INFORME DE PRUEBA"} <span>↗</span></button>}
      <a href="https://viralio.net/">Volver a Viralio</a>
    </div>}

    {mode === "won" && <div className="iso-end iso-won">
      <span className="iso-end-kicker">ARCHIVO 015 / EVACUACIÓN CONFIRMADA</span>
      <h2>ESTÁS<br /><em>AFUERA.</em></h2>
      <p>La puerta se abrió. Sobreviviste al aislamiento, pero tu expediente sigue figurando como «paciente ingresado».</p>
      <div className="iso-score"><div><span>TIEMPO UTILIZADO</span><strong>{format(elapsed)}</strong></div><div><span>CLASIFICACIÓN</span><strong>{rank}</strong></div><div><span>PISTAS</span><strong>{hints}</strong></div></div>
      <p className="iso-replay-hook">¿Podés escapar más rápido? Los errores, la ruta y la persecución cambian tu resultado.</p>
      <button onClick={() => { if (navigator.share) { void navigator.share({ title: "AISLAMIENTO 15 · VIRALIO", text: "Escapé de AISLAMIENTO 15 en " + format(elapsed) + ". ¿Podés superarme?", url: location.href }); } else { void navigator.clipboard?.writeText(location.href); notify("ENLACE COPIADO"); } }} className="iso-start">DESAFIAR A UN AMIGO <b>↗</b></button>
      <button className="iso-again" onClick={() => window.location.reload()}>VOLVER A JUGAR ↻</button>
       {playtestReport && <button className="iso-report-copy" onClick={() => void copyTestReport()}>{copiedReport?"INFORME COPIADO ✓":"COPIAR INFORME DE PRUEBA"} <span>↗</span></button>}
      <a href="https://viralio.net/">Explorar más salas Viralio</a>
    </div>}

    {panel && mode === "playing" && <div className="iso-panel-scrim" onClick={closePanel} role="presentation"><div className="iso-panel" role="dialog" aria-modal="true" aria-label="Interacción con objeto" onClick={e => e.stopPropagation()}>
      <div className="iso-panel-head"><span>◈ INTERFAZ DE INSTALACIÓN / {PHASES[chamber].name}</span><button onClick={closePanel} aria-label="Cerrar ventana">×</button></div>
      {panel === "terminal" && <>
        <span className="iso-panel-sub">ACCESO A COMPUERTA · NIVEL 01</span><h2>CONTROL DE SEGURIDAD</h2>
        <p>Ingresá las tres cifras correspondientes a las prioridades P1, P2 y P3 del registro de triaje.</p>
        <div className="iso-display" aria-label={"Código ingresado: " + code}>{code.padEnd(3, "•")}</div>
        <div className="iso-keypad">{["1","2","3","4","5","6","7","8","9","BORRAR","0","CONFIRMAR"].map(key => <button key={key} onClick={() => key === "BORRAR" ? setCode("") : key === "CONFIRMAR" ? sendCode() : setCode(c => (c + key).slice(0, 3))}>{key}</button>)}</div>
      </>}
      {panel === "triage" && <>
        <span className="iso-panel-sub">HOSPITAL / ARCHIVO DE CLASIFICACIÓN</span>
        <h2>FICHAS DE TRIAJE</h2>
        <p>Las prioridades de emergencia se registran en orden P1, P2 y P3. Usá sus cifras para ingresar a la terminal de seguridad.</p>
        <div className="iso-transcript"><p><b>P1 · PRIORIDAD CRÍTICA</b> — Habitación {triageCode[0]}, paciente sin identificar.</p><p><b>P2 · PRIORIDAD URGENTE</b> — Habitación {triageCode[1]}, identificación anulada.</p><p><b>P3 · PRIORIDAD CONTROLADA</b> — Habitación {triageCode[2]}, expediente «015».</p></div>
        <p className="iso-panel-warning">Nota manuscrita: «El registro fue falsificado. La voz sigue llamándose doctor».</p>
        <button className="iso-confirm" onClick={closePanel}>MEMORIZAR PRIORIDADES ↗</button>
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
      {panel === "sign" && <>
        <span className="iso-panel-sub">INSPECCIÓN CLÍNICA / HÉLIX 015</span>
        <h2>REGISTRO DE INSTALACIÓN</h2>
        <div className="iso-sign-transcription">
          {signCopy.map((line, i) => <p key={i} className={i === 0 ? "iso-sign-title" : ""}>{line}</p>)}
        </div>
        <p>Transcripción ampliada del cartel que estás examinando. No modifica el funcionamiento del mecanismo.</p>
        <button className="iso-confirm" onClick={closePanel}>VOLVER AL HOSPITAL ↗</button>
      </>}
      {panel === "help" && <>
        <span className="iso-panel-sub">ASISTENCIA / {PHASES[chamber].name}</span><h2>REGISTRO DE PISTAS</h2>
        <span className="iso-panel-sub">{hintStage ? "PISTA " + hintStage + " DE 3 PARA ESTE OBJETIVO" : "AYUDA GRADUAL · PRIMERO ORIENTACIÓN, DESPUÉS DETALLES"}</span>
        <p>{helpCopy}</p>
        {hintStage < 3 && <button className="iso-diagnostic-button" onClick={requestHint}>◈ {hintStage ? "REVELAR UNA PISTA MÁS CLARA" : "SOLICITAR PRIMERA PISTA"} <span>↗</span></button>}
        <div className="iso-help-controls"><b>DESPLAZAMIENTO</b><span>PC: WASD / flechas. Celular: círculo izquierdo.</span><b>CÁMARA</b><span>Arrastrá para mirar. Acercá dos dedos para hacer zoom; en PC usá la rueda.</span><b>OBJETOS Y CARTELERÍA</b><span>Tocá objetos y carteles para examinarlos o usá INTERACTUAR cuando aparezca el indicador.</span><b>PERSECUCIÓN</b><span>Podés perder de vista al Celador escondiéndote detrás del mobiliario.</span></div>
        <button className="iso-diagnostic-button" onClick={() => { setBenchmark(true); closePanel(); }}>MEDIR FPS EN MI DISPOSITIVO <span>↗</span></button>
        <button className="iso-confirm" onClick={closePanel}>VOLVER A LA SALA ↗</button>
      </>}
    </div></div>}
    <div className="iso-watermark">VIRALIO ORIGINALS · HÉLIX 015 · MODELOS CLÍNICOS CC0</div>
  </main>;
}
