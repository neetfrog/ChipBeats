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

// ─── Preset Songs ────────────────────────────────────────────────────────────
export function makePresetPatterns(instruments: InstrumentParams[]) {
  const getInst = (id: string) => instruments.find(i => i.id === id);

  // Preset 1: Classic 4-on-the-floor
  const preset1 = {
    id: 'preset_classic',
    name: '4-on-the-Floor',
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
        // Bass line
        [0, 2, 4, 5, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85, note: i % 2 === 0 ? 0 : 7 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 2: Synth Lead Melody
  const preset2 = {
    id: 'preset_synth',
    name: 'Synth Lead',
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
        // Melodic line: C E G E C D E
        const melody = [0, 4, 7, 4, 0, 2, 4, 0, 0, 4, 7, 4, 0, 2, 4, 5];
        melody.forEach((note, i) => {
          steps[i] = makeStep({ active: true, velocity: 0.8, note });
        });
      } else if (inst.id === 'bass') {
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 3: Chiptune Adventure
  const preset3 = {
    id: 'preset_adventure',
    name: 'Adventure',
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
        // Rising melody
        const melody = [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0, -2];
        melody.forEach((note, i) => {
          steps[i] = makeStep({ active: true, velocity: 0.75, note });
        });
      } else if (inst.id === 'bass') {
        [0, 3, 8, 11].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.8, note: i % 4 < 2 ? 0 : 5 });
        });
      } else if (inst.id === 'blip') {
        [2, 6, 10, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.7 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 4: Tech Beat
  const preset4 = {
    id: 'preset_tech',
    name: 'Tech Beat',
    stepCount: 16,
    swing: 0,
    tracks: instruments.map(inst => {
      const steps = Array.from({ length: 16 }, () => makeStep());
      
      if (inst.id === 'kick') {
        [0, 4, 8, 10, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: i === 10 ? 0.7 : 0.95 });
        });
      } else if (inst.id === 'snare') {
        [3, 7, 11, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.85 });
        });
      } else if (inst.id === 'hihat') {
        [1, 3, 5, 7, 9, 11, 13, 15].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.65 });
        });
      } else if (inst.id === 'clap') {
        [5, 13].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.75 });
        });
      } else if (inst.id === 'chord') {
        [0, 4, 8, 12].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.7 });
        });
      } else if (inst.id === 'synth') {
        const melody = [0, 0, 0, 0, 5, 5, 5, 5, 7, 7, 7, 7, 3, 3, 3, 3];
        melody.forEach((note, i) => {
          if ([0, 2, 4, 6, 8, 10, 12, 14].includes(i)) {
            steps[i] = makeStep({ active: true, velocity: 0.8, note });
          }
        });
      } else if (inst.id === 'noise') {
        [2, 6, 10, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.6 });
        });
      }
      
      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 5: DnB Groove
  const preset5 = {
    id: 'preset_dnb',
    name: 'DnB Groove',
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
        [0, 1, 4, 7, 8, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.88, note: i % 4 === 0 ? 0 : 5 });
        });
      } else if (inst.id === 'synth') {
        [2, 10].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.65, note: 7 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 6: Hip-Hop Beat
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
        [0, 2, 5, 7, 10, 13].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.86, note: i % 4 === 0 ? 0 : 2 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  // Preset 7: Dub Rhythm
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
        [1, 5, 9, 13].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.62, note: 3 });
        });
      } else if (inst.id === 'bass') {
        [0, 3, 7, 10, 12, 14].forEach(i => {
          steps[i] = makeStep({ active: true, velocity: 0.82, note: 0 });
        });
      }

      return { instrumentId: inst.id, steps };
    }),
  };

  return [preset1, preset2, preset3, preset4, preset5, preset6, preset7];
}
