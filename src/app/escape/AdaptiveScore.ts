/**
 * UMBRAL — original procedural cinematic score.
 *
 * An actual evolving composition (pads, motif, dissonance, ostinato and pulse)
 * written for this game, generated locally with Web Audio. No streaming, ads,
 * third-party music or loading screen. Shares the original foley's compressed,
 * mute-aware mixer, and ducks for dialogue / Eva's recovered film.
 */
import { getHorrorScoreBus } from "./SoundDirector";

export type ScoreEnding = "won" | "lost";
export type TensionTier = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ScoreState = {
  remaining: number;
  room: number;
  active: boolean;
  silent: boolean;
  duck: boolean;
};

export function tensionTier(remaining: number): TensionTier {
  if (remaining <= 10) return 6;
  if (remaining <= 60) return 5;
  if (remaining <= 120) return 4;
  if (remaining <= 300) return 3;
  if (remaining <= 600) return 2;
  if (remaining <= 900) return 1;
  return 0;
}

export const TENSION_TITLES = [
  "LA CASA OBSERVA",
  "ALGO SE ACERCA",
  "LA CASA DESPIERTA",
  "EL TIEMPO SE AGOTA",
  "NO HAY MARCHA ATRÁS",
  "ÚLTIMO MINUTO",
  "ÚLTIMOS SEGUNDOS",
] as const;

const BPM = [44, 49, 57, 69, 80, 96, 112];
const MUSIC_LEVEL = [0.50, 0.55, 0.61, 0.69, 0.76, 0.86, 0.9];
// A-minor / phrygian tension, with deliberate semitone movement.
const CHORDS = [
  [45, 52, 57, 60], // Am
  [41, 48, 53, 57], // Fmaj7
  [43, 50, 55, 58], // Gm: one unsettled pitch
  [40, 47, 53, 58], // E b9
  [45, 52, 56, 60], // A major third intrusion
  [43, 48, 52, 55], // suspended G
] as const;
const EVA_MOTIF = [76, 72, 81, 76, 77, 76, 72, 68] as const;
function pitch(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}
function clamp(value: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, value));
}

type ScoreEngine = {
  ctx: AudioContext;
  output: GainNode;
  drones: OscillatorNode[];
  timer: number;
  state: ScoreState;
  beat: number;
  nextBeat: number;
  lastTier: TensionTier;
  lastSecondHit: number;
  lastRoom: number;
};

let engine: ScoreEngine | null = null;

// The mix remains under -18 LUFS-ish when played alone, and all layers
// share the foley's dynamics compressor. Spectral bands leave voice room.
function instrument(
  target: ScoreEngine, midi: number, when: number, duration: number,
  gain: number, timbre: "pad" | "bell" | "low" | "pulse", pan = 0
) {
  const { ctx, output } = target;
  const start = Math.max(ctx.currentTime + .005, when);
  const time = Math.max(.09, duration);
  const envelope = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const stereo = ctx.createStereoPanner();
  stereo.pan.value = pan;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(timbre === "bell" ? 2300 : timbre === "pad" ? 980 : timbre === "low" ? 410 : 820, start);
  const attack = timbre === "pad" ? .50 : timbre === "bell" ? .018 : .025;
  const release = timbre === "pad" ? .68 : timbre === "bell" ? .68 : .16;
  const hold = Math.max(.04, time - release);
  envelope.gain.setValueAtTime(.0001, start);
  envelope.gain.linearRampToValueAtTime(gain, start + Math.min(attack, time * .32));
  envelope.gain.setValueAtTime(gain, start + hold);
  envelope.gain.exponentialRampToValueAtTime(.0001, start + time);
  envelope.connect(filter);
  filter.connect(stereo);
  stereo.connect(output);

  const voices = timbre === "pad" ? 2 : 1;
  for (let i = 0; i < voices; i++) {
    const osc = ctx.createOscillator();
    osc.type = timbre === "bell" ? "sine" : timbre === "pad" ? (i === 0 ? "triangle" : "sawtooth") : "sine";
    osc.frequency.setValueAtTime(pitch(midi) * (i ? 1.0033 : 1), start);
    osc.connect(envelope);
    osc.start(start);
    osc.stop(start + time + .01);
    osc.onended = () => {
      try { osc.disconnect(); } catch {}
    };
  }
  // The last voice owns cleanup, after the long reverb-like release.
  window.setTimeout(() => {
    try {envelope.disconnect();filter.disconnect();stereo.disconnect();} catch {}
  }, (Math.max(0, start - ctx.currentTime) + time + .3) * 1000);
}

function heartbeat(target: ScoreEngine, when: number, volume: number) {
  instrument(target, 30, when, .27, volume, "pulse");
  instrument(target, 26, when + .23, .31, volume * .64, "pulse");
}

function composeBeat(target: ScoreEngine, when: number) {
  const tier = target.lastTier;
  const beatSeconds = 60 / BPM[tier];
  const n = target.beat++;
  const measure = Math.floor(n / 4);
  const room = target.state.room;
  const chord = CHORDS[(Math.floor(measure / 2) + room) % CHORDS.length];

  if (n % 4 === 0) {
    // Layered string section changes every measure. The viola voice follows
    // a chromatic interval to make the environment subtly unsettling.
    const volume = (tier < 2 ? .016 : tier < 4 ? .022 : .029);
    chord.forEach((m, i) =>
      instrument(target, m + (i > 1 ? 12 : 0), when, beatSeconds * 3.8, volume * (i === 0 ? .78 : 1), "pad", i % 2 ? .32 : -.32)
    );
    if (tier >= 3) instrument(target, chord[0] - 12, when, beatSeconds * 1.8, .04, "low");
  }

  // Music-box memory, increasingly fragmented, follows Eva's melody.
  if (n % (tier < 2 ? 8 : tier < 4 ? 4 : 2) === 0) {
    const index = (Math.floor(n / (tier < 2 ? 8 : tier < 4 ? 4 : 2)) + room) % EVA_MOTIF.length;
    instrument(target, EVA_MOTIF[index], when, .7 + (tier < 3 ? .45 : 0), tier < 3 ? .016 : .026, "bell", index % 2 ? .52 : -.52);
  }

  // Driving repeated figure kicks in as time drops. Never a music file loop.
  if (tier >= 2 && n % (tier >= 5 ? 1 : 2) === 0) {
    const ostinato = chord[(Math.floor(n / 2) + room) % chord.length] + 12;
    instrument(target, ostinato, when, tier >= 4 ? .37 : .58, tier >= 5 ? .037 : .021, "low", n % 4 ? .23 : -.23);
  }

  if (tier >= 3 && n % (tier >= 5 ? 2 : 4) === 0) heartbeat(target, when, tier >= 5 ? .12 : .075);
  // Final 10 seconds are handled by setScoreState() at exactly one per second,
  // not by the musical beat grid, so thuds follow the clock rather than BPM.
}

function releaseEngine(withDecay: boolean) {
  const current = engine;
  if (!current) return;
  engine = null;
  window.clearInterval(current.timer);
  const now = current.ctx.currentTime;
  try {
    current.output.gain.cancelScheduledValues(now);
    current.output.gain.setTargetAtTime(0, now, withDecay ? .55 : .055);
    for (const drone of current.drones) {
      try { drone.stop(now + (withDecay ? 1.7 : .25)); } catch {}
    }
    window.setTimeout(() => {
      try { current.output.disconnect(); } catch {}
    }, withDecay ? 2100 : 600);
  } catch {}
}

function refreshMix(target: ScoreEngine) {
  const { ctx, state } = target;
  if (ctx.state !== "running") return;
  const active = state.active && !state.silent && !document.hidden;
  const level = active ? state.duck ? .11 : MUSIC_LEVEL[target.lastTier] : 0;
  const now = ctx.currentTime;
  target.output.gain.cancelScheduledValues(now);
  target.output.gain.setTargetAtTime(level, now, state.duck || !active ? .065 : 1.15);
}

function tick() {
  const target = engine;
  if (!target) return;
  const { ctx } = target;
  if (ctx.state !== "running" || !target.state.active || target.state.silent || target.state.duck || document.hidden) {
    if (ctx.state === "running") target.nextBeat = ctx.currentTime + .1;
    refreshMix(target);
    return;
  }
  // Very small lookahead: remains responsive when the player pauses,
  // enters dialogue, changes room or starts the 10-second countdown.
  const horizon = ctx.currentTime + .23;
  if (target.nextBeat < ctx.currentTime) target.nextBeat = ctx.currentTime + .08;
  let beats = 0;
  while (target.nextBeat < horizon && beats++ < 3) {
    composeBeat(target, target.nextBeat);
    target.nextBeat += 60 / BPM[target.lastTier];
  }
}

export function startAdaptiveScore(initial: ScoreState) {
  const bus = getHorrorScoreBus();
  if (!bus) return;
  if (engine) releaseEngine(false);
  const { audio, output } = bus;
  if (audio.state === "suspended") void audio.resume().catch(() => {});
  const mixer = audio.createGain();
  mixer.gain.value = 0;
  mixer.connect(output);

  const drones: OscillatorNode[] = [];
  const lowpass = audio.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 210;
  const bed = audio.createGain();
  bed.gain.value = .025;
  bed.connect(lowpass);
  lowpass.connect(mixer);
  for (const [frequency, type] of [[55, "sine"], [82.4, "triangle"], [57.5, "sine"]] as [number, OscillatorType][]) {
    const oscillator = audio.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(bed);
    oscillator.start();
    drones.push(oscillator);
  }
  // Gentle analogue-sounding wobble adds depth without bright transients.
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.frequency.value = .087;
  lfoGain.gain.value = 72;
  lfo.connect(lfoGain);
  lfoGain.connect(lowpass.frequency);
  lfo.start();
  drones.push(lfo);

  const current: ScoreEngine = {
    ctx: audio, output: mixer, drones, timer: 0,
    state: initial, beat: 0, nextBeat: audio.currentTime + .14,
    lastTier: tensionTier(initial.remaining), lastSecondHit: -1, lastRoom: initial.room
  };
  engine = current;
  current.timer = window.setInterval(tick, 105);
  refreshMix(current);
  tick();
}

/** Resume an existing score after a pause, or unlock a saved game after reload. */
export function resumeAdaptiveScore(next: ScoreState) {
  if (engine) {
    updateAdaptiveScore(next);
  } else {
    startAdaptiveScore(next);
  }
}

export function updateAdaptiveScore(next: ScoreState) {
  const current = engine;
  if (!current) return;
  const old = current.state;
  current.state = next;
  const tier = tensionTier(next.remaining);
  if (tier !== current.lastTier || next.room !== current.lastRoom) {
    current.lastTier = tier;
    current.lastRoom = next.room;
    current.nextBeat = current.ctx.currentTime + .14;
    current.beat = 0;
  }
  if (next.remaining <= 10 && next.remaining > 0 &&
      next.remaining !== current.lastSecondHit && next.active && !next.silent && !next.duck) {
    current.lastSecondHit = next.remaining;
    // A deep cinematic impact on every last second. Louder in the last three.
    heartbeat(current, current.ctx.currentTime + .02, next.remaining <= 3 ? .16 : .105);
  }
  if (!next.active || next.silent || next.duck || old.duck !== next.duck || old.active !== next.active || old.silent !== next.silent || tier !== tensionTier(old.remaining)) {
    refreshMix(current);
  }
}

export function finishAdaptiveScore(result: ScoreEnding) {
  const current = engine;
  if (!current) return;
  const audible = current.state.active && !current.state.silent;
  // On failure the room hits one last heavy note then goes quiet.
  // On victory a fragile resolved A-minor chord fades into the epilogue.
  if (audible && current.ctx.state === "running") {
    const at = current.ctx.currentTime + .035;
    if (result === "lost") {
      instrument(current, 31, at, .9, .19, "low");
      instrument(current, 30, at + .07, .75, .12, "low");
    } else {
      [57, 60, 64, 69].forEach((n, i) => instrument(current, n, at + i * .16, 2.4, .05, "bell", i % 2 ? .22 : -.22));
    }
  }
  releaseEngine(true);
}
export function stopAdaptiveScore() {
  releaseEngine(false);
}
