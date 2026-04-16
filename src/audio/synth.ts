import { InstrumentParams } from '../types';
import { NodePool } from './nodePool';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let nodePool: NodePool | null = null;

let analyserNode: AnalyserNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _buildGraph();
  }
  return audioCtx;
}

function _buildGraph() {
  const ctx = audioCtx!;

  // Master chain: gainNode → compressor → analyser → destination
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.88;

  masterCompressor = ctx.createDynamicsCompressor();
  masterCompressor.threshold.value = -10;
  masterCompressor.knee.value = 3;
  masterCompressor.ratio.value = 5;
  masterCompressor.attack.value = 0.002;
  masterCompressor.release.value = 0.12;

  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.8;

  // Reverb (impulse response generated synthetically)
  reverbNode = ctx.createConvolver();
  reverbNode.buffer = _makeReverbIR(ctx, 1.2, 4.2);
  reverbGain = ctx.createGain();
  reverbGain.gain.value = 0;

  masterGain.connect(masterCompressor);
  masterCompressor.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  // Reverb send
  masterGain.connect(reverbGain);
  reverbGain.connect(reverbNode);
  reverbNode.connect(analyserNode);
  nodePool = new NodePool(ctx, 48);
}

/** Synthetic exponential decay reverb IR */
function _makeReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export function getMasterGain(): GainNode {
  getAudioContext();
  return masterGain!;
}

export function getAnalyser(): AnalyserNode {
  getAudioContext();
  return analyserNode!;
}

export function setMasterVolume(vol: number) {
  const ctx = getAudioContext();
  masterGain!.gain.setTargetAtTime(vol, ctx.currentTime, 0.01);
}

export function setCompressorEnabled(on: boolean) {
  // Can't truly bypass in WebAudio easily, so we just set ratio
  if (masterCompressor) {
    masterCompressor.ratio.value = on ? 4 : 1;
    masterCompressor.threshold.value = on ? -12 : 0;
  }
}

// ─── Bit-crusher wave shaper ─────────────────────────────────────────────────
const _crusherCache = new Map<number, Float32Array<ArrayBuffer>>();
function getBitCrusherCurve(bits: number): Float32Array<ArrayBuffer> {
  const key = Math.round(bits);
  if (_crusherCache.has(key)) return _crusherCache.get(key)!;
  const steps = Math.pow(2, key);
  const buf = new ArrayBuffer(256 * 4);
  const curve = new Float32Array(buf);
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  _crusherCache.set(key, curve);
  return curve;
}

// ─── Distortion wave shaper ──────────────────────────────────────────────────
const _distortionCache = new Map<number, Float32Array>();
function getDistortionCurve(amount: number): Float32Array {
  const key = Math.round(amount * 1000);
  if (_distortionCache.has(key)) return _distortionCache.get(key)!;
  const n = 256;
  const buf = new ArrayBuffer(n * 4);
  const curve = new Float32Array(buf);
  const k = amount * 200;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 2 - 1;
    curve[i] = k > 0 ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x)) : x;
  }
  _distortionCache.set(key, curve);
  return curve;
}

// ─── Noise buffer pool ───────────────────────────────────────────────────────
let _noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (_noiseBuffer && _noiseBuffer.sampleRate === ctx.sampleRate) return _noiseBuffer;
  const sr = ctx.sampleRate;
  const len = sr * 2;
  _noiseBuffer = ctx.createBuffer(1, len, sr);
  const d = _noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return _noiseBuffer;
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function semisToFreq(semis: number, base: number): number {
  return base * Math.pow(2, semis / 12);
}

// ─── Main play function ───────────────────────────────────────────────────────
export function playInstrument(
  inst: InstrumentParams,
  velocity = 1,
  accent = false,
  when = 0,
  noteOffset = 0,   // semitone offset for melodic note
) {
  const ctx = getAudioContext();
  const mg = getMasterGain();
  if (!when) when = ctx.currentTime;

  const accentMul = accent ? 1.35 : 1;
  const vol = Math.min(1, inst.volume * velocity * accentMul);

  const t0 = when;
  const t1 = t0 + Math.max(inst.attack, 0.001);            // end of attack
  const t2 = t1 + Math.max(inst.decay, 0.001);             // end of decay
  const t3 = t2 + Math.max(inst.release, 0.001);           // end of release

  const env = nodePool?.getGain() ?? ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(vol, t1);
  env.gain.linearRampToValueAtTime(vol * Math.max(inst.sustain, 0.0001), t2);
  env.gain.setValueAtTime(vol * Math.max(inst.sustain, 0.0001), t2);
  env.gain.exponentialRampToValueAtTime(0.0001, t3);

  // ── Pan ──
  const panner = nodePool?.getPanner() ?? ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, inst.pan));

  // ── Filter ──
  const filter = nodePool?.getFilter() ?? ctx.createBiquadFilter();
  filter.type = inst.filterType;
  const baseFilterFreq = Math.max(20, Math.min(20000, inst.filterFreq));
  filter.frequency.setValueAtTime(baseFilterFreq, t0);
  // Filter envelope modulation
  if (inst.filterEnvAmt !== 0) {
    const modAmt = inst.filterEnvAmt * 8000;
    const fPeak = Math.max(20, Math.min(20000, baseFilterFreq + modAmt));
    filter.frequency.linearRampToValueAtTime(fPeak, t1);
    filter.frequency.linearRampToValueAtTime(baseFilterFreq, t2);
  }
  filter.Q.value = Math.max(0.0001, inst.filterQ);

  // ── Bit crusher ──
  const crusher = nodePool?.getWaveShaper() ?? ctx.createWaveShaper();
  crusher.curve = getBitCrusherCurve(Math.max(1, Math.min(16, inst.bitCrush)));
  crusher.oversample = '2x';

  // ── Distortion ──
  const distortion = inst.distortion > 0.01 ? (nodePool?.getWaveShaper() ?? ctx.createWaveShaper()) : null;
  if (distortion) {
    distortion.curve = getDistortionCurve(inst.distortion);
    distortion.oversample = '4x';
  }

  // ── Per-instrument reverb send ──
  let revSend: GainNode | null = null;
  if (reverbGain && inst.reverbMix > 0) {
    revSend = nodePool?.getGain() ?? ctx.createGain();
    revSend.gain.value = inst.reverbMix;
    env.connect(revSend);
    revSend.connect(reverbGain);
  }

  // ── Per-instrument delay ──
  let dly: DelayNode | null = null;
  let dlyFb: GainNode | null = null;
  let dlySend: GainNode | null = null;
  if (inst.delayMix > 0.01) {
    dly = nodePool?.getDelay() ?? ctx.createDelay(1.0);
    dly.delayTime.value = Math.max(0.01, inst.delayTime);
    dlyFb = nodePool?.getGain() ?? ctx.createGain();
    dlyFb.gain.value = Math.min(0.92, inst.delayFeedback);
    dlySend = nodePool?.getGain() ?? ctx.createGain();
    dlySend.gain.value = inst.delayMix;
    env.connect(dlySend);
    dlySend.connect(dly);
    dly.connect(dlyFb);
    dlyFb.connect(dly);
    dly.connect(filter);
  }

  // ── Build signal chain ──
  // env → filter → crusher → distortion → panner → masterGain
  env.connect(filter);
  filter.connect(crusher);
  crusher.connect(distortion ? distortion : panner);
  if (distortion) distortion.connect(panner);
  panner.connect(mg);

  const stopAll = (nodes: AudioScheduledSourceNode[]) => {
    nodes.forEach(n => { try { n.stop(t3 + 0.05); } catch {} });
  };

  const releaseNodes = () => {
    const cleanupDelay = Math.max(0, (t3 - ctx.currentTime) * 1000 + 120);
    const keepAlive: AudioNode[] = [env, panner, filter, crusher];
    if (distortion) keepAlive.push(distortion);
    if (revSend) keepAlive.push(revSend);
    if (dly) keepAlive.push(dly);
    if (dlyFb) keepAlive.push(dlyFb);
    if (dlySend) keepAlive.push(dlySend);

    setTimeout(() => {
      keepAlive.forEach(node => { try { node.disconnect(); } catch {} });
      if (nodePool) {
        nodePool.returnGain(env);
        nodePool.returnPanner(panner);
        nodePool.returnFilter(filter);
        nodePool.returnWaveShaper(crusher);
        if (distortion) nodePool.returnWaveShaper(distortion);
        if (revSend) nodePool.returnGain(revSend);
        if (dlyFb) nodePool.returnGain(dlyFb);
        if (dlySend) nodePool.returnGain(dlySend);
        if (dly) nodePool.returnDelay(dly);
      }
    }, cleanupDelay);
  };

  // ── Source(s) ──
  if (inst.wave === 'noise') {
    const nBuf = getNoiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = nBuf;
    src.loop = true;
    src.connect(env);
    src.start(t0);
    src.stop(t3 + 0.05);
    releaseNodes();
  } else if (inst.wave === 'pulse') {
    // Pulse wave = square with detune trick using two saws cancelling
    _playPulse(ctx, inst, noteOffset, t0, t3, env, vol);
    releaseNodes();
  } else {
    const notes = inst.arpNotes.length > 0 ? inst.arpNotes : [noteOffset];
    const sources: OscillatorNode[] = [];

    if (inst.arpNotes.length > 0 && inst.arpSpeed > 0) {
      // Arpeggiated
      notes.forEach((semi, idx) => {
        const nt = t0 + idx * inst.arpSpeed;
        if (nt >= t3) return;
        const osc = ctx.createOscillator();
        osc.type = inst.wave as OscillatorType;
        const freq = semisToFreq(semi + noteOffset, inst.frequency);
        osc.frequency.setValueAtTime(freq, nt);
        if (inst.freqEnd !== inst.frequency) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(semisToFreq(semi + noteOffset, inst.freqEnd), 1),
            nt + inst.pitchSweepTime
          );
        }
        _applyVibrato(ctx, osc, inst, nt, t3);
        const noteGate = nodePool?.getGain() ?? ctx.createGain();
        noteGate.gain.setValueAtTime(1, nt);
        noteGate.gain.setValueAtTime(0.001, nt + inst.arpSpeed * 0.85);
        osc.connect(noteGate);
        noteGate.connect(env);
        osc.start(nt);
        sources.push(osc);
        if (nodePool) {
          setTimeout(() => { try { noteGate.disconnect(); nodePool?.returnGain(noteGate); } catch {} }, Math.max(0, (t3 - ctx.currentTime) * 1000 + 120));
        }
      });
      stopAll(sources);
      releaseNodes();
    } else {
      // Possibly stacked oscillators (chord = arpNotes played simultaneously)
      const playNotes = inst.arpNotes.length > 0 ? inst.arpNotes : [noteOffset];
      playNotes.forEach(semi => {
        const osc = ctx.createOscillator();
        osc.type = inst.wave as OscillatorType;
        const freq = semisToFreq(semi + (inst.arpNotes.length > 0 ? noteOffset : 0), inst.frequency);
        osc.frequency.setValueAtTime(freq, t0);
        if (inst.freqEnd !== inst.frequency) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(semisToFreq(semi + noteOffset, inst.freqEnd), 1),
            t0 + inst.pitchSweepTime
          );
        }
        _applyVibrato(ctx, osc, inst, t0, t3);
        // Slight detune between chord notes for richness
        if (playNotes.length > 1) osc.detune.value = (semi % 3) * 2;
        osc.connect(env);
        osc.start(t0);
        sources.push(osc);
      });
      stopAll(sources);
      releaseNodes();
    }
  }

  // ── Tremolo ──
  if (inst.tremoloDepth > 0 && inst.tremoloRate > 0) {
    const tremoloLFO = ctx.createOscillator();
    const tremoloGain = nodePool?.getGain() ?? ctx.createGain();
    tremoloLFO.frequency.value = inst.tremoloRate;
    tremoloGain.gain.value = inst.tremoloDepth * vol * 0.5;
    tremoloLFO.connect(tremoloGain);
    tremoloGain.connect(env.gain);
    tremoloLFO.start(t0);
    tremoloLFO.stop(t3 + 0.05);
    if (nodePool) {
      setTimeout(() => { try { tremoloGain.disconnect(); nodePool?.returnGain(tremoloGain); } catch {} }, Math.max(0, (t3 - ctx.currentTime) * 1000 + 120));
    }
  }
}

function _playPulse(
  ctx: AudioContext,
  inst: InstrumentParams,
  noteOffset: number,
  t0: number,
  t3: number,
  dest: AudioNode,
  _vol: number
) {
  // Pulse wave via two sawtooths phase-shifted
  const freq = semisToFreq(noteOffset, inst.frequency);
  const pw = Math.max(0.05, Math.min(0.95, inst.pulseWidth));

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, t0);
  osc2.frequency.setValueAtTime(freq, t0);
  osc2.detune.value = pw * 100;

  const inv = ctx.createGain();
  inv.gain.value = -1;

  osc1.connect(dest);
  osc2.connect(inv);
  inv.connect(dest);

  osc1.start(t0); osc1.stop(t3 + 0.05);
  osc2.start(t0); osc2.stop(t3 + 0.05);
}

function _applyVibrato(
  ctx: AudioContext,
  osc: OscillatorNode,
  inst: InstrumentParams,
  t0: number,
  t3: number
) {
  if (inst.vibratoDepth <= 0 || inst.vibratoRate <= 0) return;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = inst.vibratoRate;
  lfoGain.gain.value = inst.frequency * (Math.pow(2, inst.vibratoDepth / 12) - 1);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(t0);
  lfo.stop(t3 + 0.05);
}
