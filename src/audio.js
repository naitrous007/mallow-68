/* ------------------------------------------------------------------
   A tiny synthesized mechanical keyboard. No samples, no network.
------------------------------------------------------------------- */

let ctx = null;
let master = null;
let compressor = null;
let noiseBuffer = null;
let unlocked = false;

function createNoiseBuffer(context) {
  const length = Math.floor(context.sampleRate * 0.4);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    // A touch of smoothing makes the noise feel like a physical knock.
    last = last * 0.28 + white * 0.72;
    data[i] = last;
  }
  return buffer;
}

export function initAudio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 24;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.18;

  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(compressor);
  compressor.connect(ctx.destination);
  noiseBuffer = createNoiseBuffer(ctx);
  unlocked = true;
  return ctx;
}

export function unlockAudio() {
  const context = initAudio();
  if (context && context.state === "suspended") {
    context.resume().catch(() => {});
  }
}

function noiseSource(context, duration) {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const now = context.currentTime;
  source.start(now);
  source.stop(now + duration + 0.02);
  return source;
}

function envelopeGain(context, start, peak, decay, attack = 0.002) {
  const gain = context.createGain();
  const t = start;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return gain;
}

function playThock(context, time, velocity) {
  const pitch = 118 + Math.random() * 28;
  const body = context.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(pitch * 1.8, time);
  body.frequency.exponentialRampToValueAtTime(pitch * 0.72, time + 0.09);
  const bodyGain = envelopeGain(context, time, 0.22 * velocity, 0.16, 0.003);
  body.connect(bodyGain);
  bodyGain.connect(master);
  body.start(time);
  body.stop(time + 0.2);

  const knock = noiseSource(context, 0.12);
  const knockFilter = context.createBiquadFilter();
  knockFilter.type = "lowpass";
  knockFilter.frequency.setValueAtTime(920 + Math.random() * 260, time);
  knockFilter.frequency.exponentialRampToValueAtTime(320, time + 0.08);
  knockFilter.Q.value = 1.5;
  const knockGain = envelopeGain(context, time, 0.2 * velocity, 0.095, 0.001);
  knock.connect(knockFilter);
  knockFilter.connect(knockGain);
  knockGain.connect(master);

  const tick = context.createOscillator();
  tick.type = "sine";
  tick.frequency.setValueAtTime(2200 + Math.random() * 700, time);
  const tickGain = envelopeGain(context, time, 0.03 * velocity, 0.018, 0.001);
  tick.connect(tickGain);
  tickGain.connect(master);
  tick.start(time);
  tick.stop(time + 0.04);
}

function playClack(context, time, velocity) {
  const snap = noiseSource(context, 0.09);
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(2350 + Math.random() * 800, time);
  band.frequency.exponentialRampToValueAtTime(1450, time + 0.05);
  band.Q.value = 1.1;
  const snapGain = envelopeGain(context, time, 0.22 * velocity, 0.055, 0.001);
  snap.connect(band);
  band.connect(snapGain);
  snapGain.connect(master);

  const high = noiseSource(context, 0.04);
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 3300;
  const highGain = envelopeGain(context, time, 0.08 * velocity, 0.02, 0.001);
  high.connect(highpass);
  highpass.connect(highGain);
  highGain.connect(master);

  const body = context.createOscillator();
  body.type = "square";
  body.frequency.setValueAtTime(430 + Math.random() * 90, time);
  body.frequency.exponentialRampToValueAtTime(190, time + 0.035);
  const bodyGain = envelopeGain(context, time, 0.05 * velocity, 0.035, 0.001);
  const bodyFilter = context.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.value = 900;
  body.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(master);
  body.start(time);
  body.stop(time + 0.06);
}

export function playKey(mode = "thock", velocity = 0.8) {
  if (!unlocked) return;
  const context = initAudio();
  if (!context || context.state !== "running") {
    context?.resume().catch(() => {});
  }
  if (!context) return;
  const time = context.currentTime + 0.003;
  const v = 0.72 + Math.random() * 0.28 * velocity;
  if (mode === "clack") playClack(context, time, v);
  else playThock(context, time, v);
}

export function playPop() {
  if (!unlocked || !ctx) return;
  const time = ctx.currentTime + 0.002;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(540, time);
  osc.frequency.exponentialRampToValueAtTime(940, time + 0.055);
  const gain = envelopeGain(ctx, time, 0.045, 0.075, 0.002);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.1);
}
