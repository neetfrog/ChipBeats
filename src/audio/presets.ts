import { InstrumentParams, InstrumentType, Step } from '../types';

let _id = 0;
const uid = () => `inst_${++_id}`;

export function makeStep(overrides?: Partial<Step>): Step {
  return { active: false, velocity: 0.9, accent: false, note: 0, ...overrides };
}

function base(
  overrides: Partial<InstrumentParams> & { name: string; type: InstrumentType; color: string }
): InstrumentParams {
  return {
    id: uid(),
    wave: 'square',
    pulseWidth: 0.5,
    frequency: 440,
    freqEnd: 440,
    attack: 0.001,
    decay: 0.15,
    sustain: 0,
    release: 0.05,
    pitchSweepTime: 0.1,
    filterType: 'lowpass',
    filterFreq: 8000,
    filterQ: 1,
    filterEnvAmt: 0,
    bitCrush: 16,
    distortion: 0,
    reverbMix: 0,
    delayMix: 0,
    delayTime: 0.25,
    delayFeedback: 0.3,
    volume: 0.8,
    pan: 0,
    arpNotes: [],
    arpSpeed: 0.05,
    vibratoRate: 0,
    vibratoDepth: 0,
    tremoloRate: 0,
    tremoloDepth: 0,
    muted: false,
    ...overrides,
  };
}

export const DEFAULT_INSTRUMENTS: InstrumentParams[] = [
  base({
    id: 'kick',
    name: 'KICK',
    type: 'kick',
    color: '#ef4444',
    wave: 'sine',
    frequency: 180,
    freqEnd: 38,
    pitchSweepTime: 0.07,
    attack: 0.001,
    decay: 0.38,
    sustain: 0,
    release: 0.12,
    volume: 0.95,
    filterFreq: 180,
    filterType: 'lowpass',
    filterQ: 0.8,
    bitCrush: 6,
    distortion: 0.25,
  }),
  base({
    id: 'snare',
    name: 'SNARE',
    type: 'snare',
    color: '#f97316',
    wave: 'noise',
    frequency: 200,
    freqEnd: 100,
    attack: 0.001,
    decay: 0.20,
    sustain: 0,
    release: 0.07,
    volume: 0.75,
    filterType: 'bandpass',
    filterFreq: 2200,
    filterQ: 2,
    bitCrush: 4,
    distortion: 0.2,
  }),
  base({
    id: 'hihat',
    name: 'HI-HAT',
    type: 'hihat',
    color: '#eab308',
    wave: 'noise',
    frequency: 8000,
    freqEnd: 8000,
    attack: 0.0005,
    decay: 0.055,
    sustain: 0,
    release: 0.02,
    volume: 0.55,
    filterType: 'highpass',
    filterFreq: 8500,
    filterQ: 1.2,
    bitCrush: 3,
    distortion: 0.15,
  }),
  base({
    id: 'openhat',
    name: 'OPEN HAT',
    type: 'openhat',
    color: '#84cc16',
    wave: 'noise',
    frequency: 8000,
    freqEnd: 8000,
    attack: 0.0005,
    decay: 0.38,
    sustain: 0.08,
    release: 0.25,
    volume: 0.48,
    filterType: 'highpass',
    filterFreq: 7200,
    filterQ: 1.2,
    bitCrush: 3,
    distortion: 0.12,
    pan: 0.15,
  }),
  base({
    id: 'clap',
    name: 'CLAP',
    type: 'clap',
    color: '#22c55e',
    wave: 'noise',
    frequency: 1000,
    freqEnd: 1000,
    attack: 0.002,
    decay: 0.14,
    sustain: 0,
    release: 0.09,
    volume: 0.78,
    filterType: 'bandpass',
    filterFreq: 3800,
    filterQ: 3,
    bitCrush: 4,
    distortion: 0.22,
    pan: -0.15,
    reverbMix: 0.08,
  }),
  base({
    id: 'tom',
    name: 'TOM',
    type: 'tom',
    color: '#06b6d4',
    wave: 'square',
    frequency: 230,
    freqEnd: 75,
    pitchSweepTime: 0.08,
    attack: 0.0008,
    decay: 0.25,
    sustain: 0,
    release: 0.09,
    volume: 0.85,
    filterType: 'lowpass',
    filterFreq: 3000,
    filterQ: 1.5,
    bitCrush: 5,
    distortion: 0.18,
  }),
  base({
    id: 'bass',
    name: 'BASS',
    type: 'bass',
    color: '#8b5cf6',
    wave: 'square',
    frequency: 55,
    freqEnd: 55,
    attack: 0.001,
    decay: 0.16,
    sustain: 0.3,
    release: 0.08,
    volume: 0.88,
    filterType: 'lowpass',
    filterFreq: 800,
    filterQ: 2.5,
    filterEnvAmt: 0.6,
    bitCrush: 5,
    distortion: 0.3,
    arpNotes: [0, 7, 12, 7],
    arpSpeed: 0.06,
  }),
  base({
    id: 'lead',
    name: 'LEAD',
    type: 'lead',
    color: '#ec4899',
    wave: 'pulse',
    pulseWidth: 0.25,
    frequency: 440,
    freqEnd: 440,
    attack: 0.003,
    decay: 0.10,
    sustain: 0.55,
    release: 0.12,
    volume: 0.68,
    filterType: 'lowpass',
    filterFreq: 4200,
    filterQ: 5,
    filterEnvAmt: 0.5,
    bitCrush: 4,
    distortion: 0.35,
    vibratoRate: 6,
    vibratoDepth: 0.35,
    reverbMix: 0.05,
  }),
  base({
    id: 'chord',
    name: 'CHORD',
    type: 'chord',
    color: '#14b8a6',
    wave: 'square',
    frequency: 220,
    freqEnd: 220,
    attack: 0.04,
    decay: 0.20,
    sustain: 0.6,
    release: 0.25,
    volume: 0.52,
    filterType: 'lowpass',
    filterFreq: 2800,
    filterQ: 2,
    filterEnvAmt: 0.35,
    bitCrush: 5,
    distortion: 0.25,
    arpNotes: [0, 4, 7],
    arpSpeed: 0,
    reverbMix: 0.1,
  }),
  base({
    id: 'blip',
    name: 'BLIP',
    type: 'blip',
    color: '#f43f5e',
    wave: 'square',
    frequency: 880,
    freqEnd: 1760,
    pitchSweepTime: 0.03,
    attack: 0.0005,
    decay: 0.065,
    sustain: 0,
    release: 0.025,
    volume: 0.65,
    filterType: 'lowpass',
    filterFreq: 6000,
    filterQ: 1.2,
    bitCrush: 3,
    distortion: 0.2,
  }),
  base({
    id: 'synth',
    name: 'SYNTH',
    type: 'lead',
    color: '#00d9ff',
    wave: 'square',
    frequency: 220,
    freqEnd: 220,
    attack: 0.008,
    decay: 0.07,
    sustain: 0.72,
    release: 0.18,
    volume: 0.78,
    filterType: 'lowpass',
    filterFreq: 4800,
    filterQ: 6,
    filterEnvAmt: 0.7,
    bitCrush: 4,
    distortion: 0.32,
    reverbMix: 0.08,
    delayMix: 0.06,
    delayTime: 0.28,
    delayFeedback: 0.35,
    vibratoRate: 7,
    vibratoDepth: 0.25,
    tremoloRate: 0,
    tremoloDepth: 0,
  }),
  base({
    id: 'noise',
    name: 'NOISE',
    type: 'hihat',
    color: '#a855f7',
    wave: 'noise',
    frequency: 10000,
    freqEnd: 10000,
    attack: 0.0003,
    decay: 0.12,
    sustain: 0,
    release: 0.04,
    volume: 0.62,
    filterType: 'highpass',
    filterFreq: 5000,
    filterQ: 1.5,
    bitCrush: 2,
    distortion: 0.28,
  }),
];

// ─── Sound Pack Adjustments ──────────────────────────────────────────────────
export function getSoundPackAdjustments(soundPack: string): Record<string, Partial<InstrumentParams>> {
  switch(soundPack) {
    case 'ambient':
      return {
        kick: { wave: 'sine', frequency: 170, freqEnd: 50, attack: 0.008, decay: 0.45, sustain: 0.2, release: 0.2, filterType: 'lowpass', filterFreq: 900, reverbMix: 0.45, delayMix: 0.24, volume: 0.72 },
        snare: { wave: 'noise', attack: 0.002, decay: 0.26, sustain: 0.08, release: 0.1, filterType: 'bandpass', filterFreq: 2200, reverbMix: 0.46, delayMix: 0.22, volume: 0.58 },
        hihat: { wave: 'noise', attack: 0.0005, decay: 0.08, sustain: 0, release: 0.04, filterType: 'highpass', filterFreq: 9800, reverbMix: 0.37, delayMix: 0.12, volume: 0.42 },
        openhat: { wave: 'noise', attack: 0.0005, decay: 0.34, sustain: 0.1, release: 0.2, filterType: 'highpass', filterFreq: 8200, reverbMix: 0.35, delayMix: 0.15, volume: 0.48 },
        clap: { wave: 'noise', attack: 0.0025, decay: 0.23, sustain: 0.06, release: 0.12, filterType: 'bandpass', filterFreq: 3000, reverbMix: 0.4, delayMix: 0.18, volume: 0.54 },
        tom: { wave: 'square', attack: 0.002, decay: 0.26, sustain: 0.06, release: 0.18, filterType: 'lowpass', filterFreq: 750, reverbMix: 0.3, delayMix: 0.12, volume: 0.66 },
        bass: { wave: 'sawtooth', frequency: 50, attack: 0.008, decay: 0.5, sustain: 0.4, release: 0.3, filterType: 'lowpass', filterFreq: 600, reverbMix: 0.32, delayMix: 0.12, volume: 0.8 },
        lead: { wave: 'sine', attack: 0.024, decay: 0.22, sustain: 0.55, release: 0.28, reverbMix: 0.44, delayMix: 0.2, volume: 0.54 },
        chord: { wave: 'triangle', attack: 0.04, decay: 0.35, sustain: 0.6, release: 0.3, reverbMix: 0.5, delayMix: 0.22, filterType: 'lowpass', filterFreq: 800, volume: 0.6 },
        blip: { wave: 'pulse', attack: 0.006, decay: 0.28, sustain: 0.2, release: 0.2, reverbMix: 0.35, delayMix: 0.15, volume: 0.5 },
        synth: { wave: 'triangle', attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.28, reverbMix: 0.42, delayMix: 0.23, filterType: 'lowpass', filterFreq: 850, volume: 0.76 },
        noise: { wave: 'noise', attack: 0.0003, decay: 0.18, sustain: 0, release: 0.08, reverbMix: 0.44, delayMix: 0.18, volume: 0.46 },
      };
    case 'chiptune':
      return {
        kick: { wave: 'sine', frequency: 140, freqEnd: 45, pitchSweepTime: 0.14, attack: 0.001, decay: 0.22, sustain: 0, release: 0.08, bitCrush: 12, distortion: 0.18, volume: 0.96, reverbMix: 0.02, delayMix: 0.01 },
        snare: { wave: 'noise', filterType: 'bandpass', filterFreq: 2300, filterQ: 3.2, attack: 0.0007, decay: 0.14, sustain: 0, release: 0.06, bitCrush: 8, distortion: 0.16, volume: 0.74, reverbMix: 0, delayMix: 0 },
        hihat: { wave: 'noise', filterType: 'highpass', filterFreq: 9800, attack: 0.0002, decay: 0.035, sustain: 0, release: 0.007, bitCrush: 7, distortion: 0.12, volume: 0.56, reverbMix: 0, delayMix: 0 },
        openhat: { wave: 'noise', filterType: 'highpass', filterFreq: 9500, attack: 0.0003, decay: 0.14, sustain: 0, release: 0.055, bitCrush: 7, distortion: 0.1, volume: 0.48, reverbMix: 0, delayMix: 0 },
        clap: { wave: 'noise', filterType: 'bandpass', filterFreq: 2800, attack: 0.0009, decay: 0.11, sustain: 0, release: 0.07, bitCrush: 6, distortion: 0.1, volume: 0.66, reverbMix: 0, delayMix: 0 },
        tom: { wave: 'square', frequency: 224, freqEnd: 68, pitchSweepTime: 0.06, attack: 0.0009, decay: 0.15, sustain: 0, release: 0.07, bitCrush: 7, distortion: 0.12, volume: 0.74, reverbMix: 0, delayMix: 0 },
        bass: { wave: 'square', frequency: 56, freqEnd: 56, attack: 0.0009, decay: 0.1, sustain: 0.24, release: 0.08, filterType: 'lowpass', filterFreq: 680, filterQ: 3.2, bitCrush: 10, distortion: 0.24, volume: 0.9, reverbMix: 0, delayMix: 0 },
        lead: { wave: 'square', frequency: 680, attack: 0.0012, decay: 0.055, sustain: 0.5, release: 0.085, bitCrush: 6, distortion: 0.22, vibratoRate: 9, vibratoDepth: 0.2, reverbMix: 0, delayMix: 0.02 },
        blip: { wave: 'triangle', frequency: 950, attack: 0.0008, decay: 0.055, sustain: 0, release: 0.03, bitCrush: 8, distortion: 0.18, volume: 0.84, reverbMix: 0, delayMix: 0 },
        synth: { wave: 'square', frequency: 340, attack: 0.005, decay: 0.08, sustain: 0.68, release: 0.095, filterType: 'lowpass', filterFreq: 1750, filterQ: 2, bitCrush: 7, distortion: 0.22, volume: 0.77, reverbMix: 0, delayMix: 0 },
        noise: { wave: 'noise', frequency: 11800, attack: 0.0003, decay: 0.08, sustain: 0, release: 0.025, bitCrush: 4, distortion: 0.13, volume: 0.66, reverbMix: 0, delayMix: 0 },
      };

    case 'synthwave':
      return {
        kick: { frequency: 200, freqEnd: 30, pitchSweepTime: 0.1, decay: 0.4, distortion: 0.3, volume: 1, reverbMix: 0.08, bitCrush: 16 },
        snare: { filterFreq: 2000, decay: 0.2, sustain: 0.02, reverbMix: 0.15, volume: 0.8, bitCrush: 16, distortion: 0.1 },
        hihat: { filterFreq: 8500, volume: 0.5, decay: 0.035, bitCrush: 16, distortion: 0.05 },
        openhat: { decay: 0.25, sustain: 0.05, reverbMix: 0.1, bitCrush: 16, distortion: 0 },
        clap: { decay: 0.13, reverbMix: 0.12, delayMix: 0.08, volume: 0.82, bitCrush: 16, distortion: 0 },
        tom: { decay: 0.23, reverbMix: 0.08, bitCrush: 16, distortion: 0 },
        bass: { frequency: 45, decay: 0.15, filterFreq: 700, filterEnvAmt: 0.7, reverbMix: 0.1, delayMix: 0.08, bitCrush: 16, distortion: 0.15 },
        lead: { attack: 0.004, decay: 0.1, sustain: 0.55, vibratoRate: 6, vibratoDepth: 0.3, reverbMix: 0.12, delayMix: 0.08, bitCrush: 16, distortion: 0.15 },
        chord: { attack: 0.04, decay: 0.22, sustain: 0.65, reverbMix: 0.2, delayMix: 0.06, bitCrush: 16, distortion: 0.1 },
        blip: { decay: 0.07, reverbMix: 0.08, delayMix: 0.05, bitCrush: 16, distortion: 0.08 },
        synth: { frequency: 220, attack: 0.008, decay: 0.07, sustain: 0.72, vibratoRate: 7, vibratoDepth: 0.25, reverbMix: 0.12, delayMix: 0.1, bitCrush: 16, distortion: 0.25 },
        noise: { decay: 0.12, reverbMix: 0.08, bitCrush: 16, distortion: 0.15 },
      };
    case 'lo-fi':
      return {
        kick: { frequency: 170, freqEnd: 45, pitchSweepTime: 0.08, decay: 0.32, bitCrush: 10, distortion: 0.2, volume: 0.9, reverbMix: 0.1, delayMix: 0.05 },
        snare: { filterFreq: 2200, decay: 0.19, bitCrush: 8, distortion: 0.18, reverbMix: 0.1, delayMix: 0.04 },
        hihat: { filterFreq: 8600, decay: 0.05, bitCrush: 8, distortion: 0.12, volume: 0.56, reverbMix: 0.07, delayMix: 0.03 },
        openhat: { decay: 0.28, bitCrush: 8, distortion: 0.1, reverbMix: 0.08, delayMix: 0.04 },
        clap: { decay: 0.14, bitCrush: 8, distortion: 0.15, reverbMix: 0.1, delayMix: 0.05 },
        tom: { decay: 0.22, bitCrush: 8, distortion: 0.12, reverbMix: 0.08, delayMix: 0.03 },
        bass: { frequency: 52, attack: 0.002, decay: 0.13, sustain: 0.28, filterFreq: 800, bitCrush: 10, distortion: 0.22, reverbMix: 0.08, delayMix: 0.06 },
        lead: { attack: 0.003, decay: 0.09, sustain: 0.52, bitCrush: 8, distortion: 0.18, vibratoRate: 5, vibratoDepth: 0.22, reverbMix: 0.1, delayMix: 0.07 },
        chord: { attack: 0.045, decay: 0.25, sustain: 0.62, bitCrush: 8, distortion: 0.15, reverbMix: 0.12, delayMix: 0.08 },
        blip: { bitCrush: 8, distortion: 0.16, volume: 0.68, reverbMix: 0.06, delayMix: 0.04 },
        synth: { attack: 0.007, decay: 0.07, sustain: 0.7, bitCrush: 8, distortion: 0.2, reverbMix: 0.1, delayMix: 0.07 },
        noise: { decay: 0.11, bitCrush: 8, distortion: 0.16, reverbMix: 0.07, delayMix: 0.03 },
      };
    case 'hiphop':
      return {
        kick: { frequency: 175, freqEnd: 40, pitchSweepTime: 0.09, decay: 0.32, bitCrush: 6, distortion: 0.34, volume: 0.95, reverbMix: 0.08, delayMix: 0.06 },
        snare: { filterFreq: 2300, filterQ: 2.2, decay: 0.19, bitCrush: 5, distortion: 0.26, reverbMix: 0.15, delayMix: 0.08 },
        hihat: { filterFreq: 8900, decay: 0.045, bitCrush: 4, distortion: 0.16, volume: 0.58, reverbMix: 0.1, delayMix: 0.05 },
        openhat: { decay: 0.25, bitCrush: 4, distortion: 0.12, volume: 0.5, reverbMix: 0.08, delayMix: 0.04 },
        clap: { decay: 0.13, bitCrush: 5, distortion: 0.18, reverbMix: 0.12, delayMix: 0.05, volume: 0.85 },
        tom: { frequency: 220, freqEnd: 72, decay: 0.2, bitCrush: 4, distortion: 0.2, reverbMix: 0.1, delayMix: 0.05 },
        bass: { frequency: 55, attack: 0.002, decay: 0.14, sustain: 0.25, filterFreq: 850, filterEnvAmt: 0.55, bitCrush: 6, distortion: 0.18, reverbMix: 0.08, delayMix: 0.06 },
        lead: { wave: 'pulse', frequency: 200, attack: 0.004, decay: 0.08, sustain: 0.5, release: 0.15, bitCrush: 10, distortion: 0.24, reverbMix: 0.12, delayMix: 0.1 },
        chord: { wave: 'sawtooth', frequency: 210, attack: 0.05, decay: 0.22, sustain: 0.55, release: 0.12, reverbMix: 0.15, delayMix: 0.1 },
        blip: { wave: 'triangle', frequency: 500, attack: 0.004, decay: 0.08, sustain: 0.2, release: 0.1, bitCrush: 5, distortion: 0.16, volume: 0.75 },
        synth: { frequency: 330, attack: 0.008, decay: 0.1, sustain: 0.65, release: 0.12, reverbMix: 0.15, delayMix: 0.08 },
        noise: { decay: 0.12, bitCrush: 6, distortion: 0.2, reverbMix: 0.1, delayMix: 0.05 },
      };
    default:
      return {};  // 'default' returns no adjustments
  }
}

// ─── Preset instrument set (full replacement) ───────────────────────────────
export function getPresetInstruments(presetId: string): InstrumentParams[] {
  const adjustments = getPresetInstrumentAdjustments(presetId);
  return DEFAULT_INSTRUMENTS.map(inst => ({ ...inst, ...(adjustments[inst.id] ?? {}) }));
}

// ─── Apply Sound Pack ────────────────────────────────────────────────────────
export function applySoundPack(instruments: InstrumentParams[], soundPack: string): InstrumentParams[] {
  const adjustments = getSoundPackAdjustments(soundPack);
  
  return instruments.map(inst => {
    const adjustment = adjustments[inst.id];
    if (!adjustment) return inst;
    
    return { ...inst, ...adjustment };
  });
}

export function defaultPattern(instruments: InstrumentParams[], stepCount = 16) {
  return {
    id: 'pat_1',
    name: 'Pattern 1',
    stepCount,
    swing: 0,
    tracks: instruments.map(inst => ({
      instrumentId: inst.id,
      steps: Array.from({ length: stepCount }, () => makeStep()),
    })),
  };
}

// ─── Preset Instrument Adjustments ───────────────────────────────────────────
export function getPresetInstrumentAdjustments(preset: string): Record<string, Partial<InstrumentParams>> {
  switch(preset) {
    case 'preset_house':
      return {
        kick: { frequency: 160, freqEnd: 45, pitchSweepTime: 0.08, decay: 0.35, volume: 0.98 },
        snare: { filterFreq: 2400, filterQ: 2.2, decay: 0.18, bitCrush: 4 },
        hihat: { filterFreq: 9000, attack: 0.0003, decay: 0.04, volume: 0.6 },
        bass: { frequency: 50, attack: 0.0015, decay: 0.12, sustain: 0.35, filterFreq: 750 },
      };
    case 'preset_synthwave':
      return {
        kick: { frequency: 200, freqEnd: 30, pitchSweepTime: 0.1, decay: 0.4, distortion: 0.3, volume: 1 },
        snare: { filterFreq: 2000, decay: 0.2, sustain: 0.02, reverbMix: 0.12, volume: 0.8 },
        hihat: { filterFreq: 8500, volume: 0.5, decay: 0.035 },
        synth: { frequency: 440, vibratoRate: 5, vibratoDepth: 0.4, reverbMix: 0.15, delayMix: 0.12 },
        bass: { frequency: 45, decay: 0.15, filterFreq: 700, filterEnvAmt: 0.7 },
      };
    case 'preset_chiptune':
      return {
        kick: { frequency: 140, freqEnd: 50, pitchSweepTime: 0.1, decay: 0.3, bitCrush: 8, volume: 0.92 },
        snare: { filterFreq: 2200, filterQ: 2.5, decay: 0.16, bitCrush: 3, distortion: 0.15 },
        hihat: { filterFreq: 9200, decay: 0.05, bitCrush: 2, volume: 0.55 },
        lead: { wave: 'square', frequency: 440, attack: 0.002, decay: 0.08, sustain: 0.5, bitCrush: 4, vibratoRate: 5, vibratoDepth: 0.25 },
        blip: { bitCrush: 2, distortion: 0.1, volume: 0.7 },
      };
    case 'preset_ambient':
      return {
        kick: { frequency: 180, freqEnd: 40, decay: 0.45, relief: 0.05, volume: 0.75, reverbMix: 0.15 },
        snare: { filterFreq: 2000, decay: 0.22, sustain: 0.05, reverbMix: 0.2, volume: 0.65 },
        hihat: { filterFreq: 8800, decay: 0.08, sustain: 0.02, reverbMix: 0.1, volume: 0.45 },
        clap: { decay: 0.16, sustain: 0.03, reverbMix: 0.25, volume: 0.55 },
        chord: { filterFreq: 2400, attack: 0.05, decay: 0.3, sustain: 0.5, reverbMix: 0.25, volume: 0.6 },
        synth: { frequency: 330, attack: 0.01, decay: 0.2, sustain: 0.6, reverbMix: 0.2, volume: 0.62 },
        noise: { decay: 0.15, sustain: 0.08, reverbMix: 0.15, volume: 0.45 },
      };
    case 'preset_dnb':
      return {
        kick: { frequency: 190, freqEnd: 35, pitchSweepTime: 0.06, decay: 0.25, distortion: 0.2, volume: 0.98 },
        snare: { filterFreq: 2600, filterQ: 2.3, decay: 0.15, distortion: 0.25, volume: 0.85 },
        clap: { decay: 0.12, distortion: 0.2, volume: 0.82 },
        hihat: { filterFreq: 9500, decay: 0.03, volume: 0.65 },
        openhat: { decay: 0.2, volume: 0.55 },
        bass: { frequency: 60, attack: 0.001, decay: 0.1, sustain: 0.2, filterFreq: 800, filterEnvAmt: 0.5 },
      };
    case 'preset_hiphop':
      return {
        kick: { frequency: 175, freqEnd: 40, pitchSweepTime: 0.09, decay: 0.32, distortion: 0.28, volume: 0.95 },
        snare: { filterFreq: 2300, filterQ: 2.1, decay: 0.19, distortion: 0.22, volume: 0.88 },
        clap: { decay: 0.13, distortion: 0.18, reverbMix: 0.1, volume: 0.85 },
        hihat: { filterFreq: 8900, decay: 0.045, volume: 0.58 },
        openhat: { decay: 0.25, volume: 0.5 },
        bass: { frequency: 55, attack: 0.002, decay: 0.14, sustain: 0.25, filterFreq: 850, filterEnvAmt: 0.55 },
      };
    case 'preset_dub':
      return {
        kick: { frequency: 210, freqEnd: 25, pitchSweepTime: 0.12, decay: 0.5, distortion: 0.25, reverbMix: 0.2, volume: 0.92 },
        snare: { filterFreq: 2100, decay: 0.24, sustain: 0.08, reverbMix: 0.25, volume: 0.8 },
        clap: { decay: 0.2, sustain: 0.05, reverbMix: 0.25, volume: 0.78 },
        hihat: { filterFreq: 8600, decay: 0.06, reverbMix: 0.12, volume: 0.5 },
        openhat: { decay: 0.35, sustain: 0.1, reverbMix: 0.15, volume: 0.6 },
        chord: { frequency: 220, decay: 0.3, sustain: 0.4, reverbMix: 0.3, volume: 0.65 },
        bass: { frequency: 50, attack: 0.002, decay: 0.2, sustain: 0.3, filterFreq: 700, reverbMix: 0.15, delayMix: 0.1 },
      };
    default:
      return {};
  }
}

// ─── Preset Songs ────────────────────────────────────────────────────────────
export function makePresetPatterns(instruments: InstrumentParams[]) {
  const getInst = (id: string) => instruments.find(i => i.id === id);

  // Preset 1: House
  const preset1 = {
    id: 'preset_house',
    name: 'House',
    stepCount: 16,
    swing: 0,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());
      
      if (inst.id === 'kick') {
        // Kick on 1, 5, 9, 13
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.95 });
        });
      } else if (inst.id === 'snare') {
        // Snare on 4, 12
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85 });
        });
      } else if (inst.id === 'hihat') {
        // HiHat every other
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6 });
        });
      } else if (inst.id === 'bass') {
        // Simple bass line
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85, note: 0 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 2: Synthwave
  const preset2 = {
    id: 'preset_synthwave',
    name: 'Synthwave',
    stepCount: 16,
    swing: 0.15,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());
      
      if (inst.id === 'kick') {
        [0, 8].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 1, accent: true });
        });
      } else if (inst.id === 'snare') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.9 });
        });
      } else if (inst.id === 'hihat') {
        [1, 3, 5, 7, 9, 11, 13, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.5 });
        });
      } else if (inst.id === 'synth') {
        // Minimal melodic line
        const melody = [0, -1, 0, -1, 0, -1, 0, 7, 0, -1, 0, -1, 0, -1, 0, 12];
        [0, 2, 4, 6, 8, 10, 12, 14].forEach((i, idx) => {
          steps[i] = makeStep({ active: true, velocity: 0.8, note: melody[idx] });
        });
      } else if (inst.id === 'bass') {
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 3: Chiptune
  const preset3 = {
    id: 'preset_chiptune',
    name: 'Chiptune',
    stepCount: 16,
    swing: 0.08,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());
      
      if (inst.id === 'kick') {
        [0, 6, 8, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.9 });
        });
      } else if (inst.id === 'snare') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85, accent: true });
        });
      } else if (inst.id === 'hihat') {
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.55 });
        });
      } else if (inst.id === 'openhat') {
        [7, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6 });
        });
      } else if (inst.id === 'lead') {
        // Simple rising melody
        const melody = [0, 2, 4, 7, 9, 11, 12, 14, 16, 14, 12, 11, 9, 7, 4, 2];
        [0, 2, 4, 6, 8, 10, 12, 14].forEach((i, idx) => {
          steps[i] = makeStep({ active: true, velocity: 0.75, note: melody[idx] });
        });
      } else if (inst.id === 'bass') {
        [0, 8].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.8, note: 0 });
        });
      } else if (inst.id === 'blip') {
        [2, 10].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.7 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 4: Ambient
  const preset4 = {
    id: 'preset_ambient',
    name: 'Ambient',
    stepCount: 16,
    swing: 0,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());
      
      if (inst.id === 'kick') {
        [0, 8].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.7 });
        });
      } else if (inst.id === 'snare') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6 });
        });
      } else if (inst.id === 'hihat') {
        [1, 3, 5, 7, 9, 11, 13, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.4 });
        });
      } else if (inst.id === 'clap') {
        [5, 13].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.5 });
        });
      } else if (inst.id === 'chord') {
        [0, 8].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.5 });
        });
      } else if (inst.id === 'synth') {
        [2, 10].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6, note: 7 });
        });
      } else if (inst.id === 'noise') {
        [6, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.4 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 5: Drum & Bass
  const preset5 = {
    id: 'preset_dnb',
    name: 'Drum & Bass',
    stepCount: 16,
    swing: 0.18,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());

      if (inst.id === 'kick') {
        [0, 4, 6, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.95 });
        });
      } else if (inst.id === 'snare' || inst.id === 'clap') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.9, accent: true });
        });
      } else if (inst.id === 'hihat') {
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.62 });
        });
      } else if (inst.id === 'openhat') {
        [7, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6 });
        });
      } else if (inst.id === 'bass') {
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.88, note: 0 });
        });
      } else if (inst.id === 'synth') {
        [2, 10].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.65, note: 7 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 6: Hip-Hop
  const preset6 = {
    id: 'preset_hiphop',
    name: 'Hip-Hop',
    stepCount: 16,
    swing: 0.22,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());

      if (inst.id === 'kick') {
        [0, 3, 8, 11, 13].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.9 });
        });
      } else if (inst.id === 'snare' || inst.id === 'clap') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.92, accent: true });
        });
      } else if (inst.id === 'hihat') {
        [1, 3, 5, 7, 9, 11, 13, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.55 });
        });
      } else if (inst.id === 'openhat') {
        [6, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.5 });
        });
      } else if (inst.id === 'bass') {
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.86, note: 0 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 7: Dub
  const preset7 = {
    id: 'preset_dub',
    name: 'Dub',
    stepCount: 16,
    swing: 0.12,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());

      if (inst.id === 'kick') {
        [0, 6, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.93 });
        });
      } else if (inst.id === 'snare' || inst.id === 'clap') {
        [4, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.86 });
        });
      } else if (inst.id === 'hihat') {
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.45 });
        });
      } else if (inst.id === 'openhat') {
        [7, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.55 });
        });
      } else if (inst.id === 'chord') {
        [1, 9].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.62, note: 3 });
        });
      } else if (inst.id === 'bass') {
        [0, 8].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.82, note: 0 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  return [preset1, preset2, preset3, preset4, preset5, preset6, preset7];
}

// ─── Apply Preset Sound Adjustments ──────────────────────────────────────────
export function applyPresetInstrumentAdjustments(instruments: InstrumentParams[], presetId: string): InstrumentParams[] {
  const adjustments = getPresetInstrumentAdjustments(presetId);
  
  return instruments.map(inst => {
    const adjustment = adjustments[inst.id];
    if (!adjustment) return inst;
    
    return { ...inst, ...adjustment };
  });
}
