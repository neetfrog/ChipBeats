export type WaveShape = 'square' | 'sawtooth' | 'triangle' | 'sine' | 'noise' | 'pulse';
export type ThemeMode = 'retro' | 'dark' | 'high-contrast';
export type SoundPack = 'default' | 'ambient' | 'chiptune' | 'synthwave' | 'lo-fi' | 'hiphop';

export type InstrumentType =
  | 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap'
  | 'tom' | 'bass' | 'lead' | 'chord' | 'blip' | 'cymbal' | 'fx';

export interface InstrumentParams {
  id: string;
  name: string;
  type: InstrumentType;
  color: string;
  // Oscillator
  wave: WaveShape;
  pulseWidth: number;      // 0-1, only for 'pulse'
  frequency: number;       // Hz
  freqEnd: number;         // Hz (pitch sweep target)
  pitchSweepTime: number;  // seconds
  // Envelope
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  // Filter
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  filterEnvAmt: number;    // how much env modulates filter (-1 to 1)
  // FX
  bitCrush: number;        // 1-16 bits
  distortion: number;      // 0-1
  reverbMix: number;       // 0-1
  delayMix: number;        // 0-1
  delayTime: number;       // seconds
  delayFeedback: number;   // 0-0.95
  // Volume + pan
  volume: number;
  pan: number;             // -1 to 1
  // Arp
  arpNotes: number[];
  arpSpeed: number;
  // Vibrato / tremolo
  vibratoRate: number;
  vibratoDepth: number;
  tremoloRate: number;
  tremoloDepth: number;
  // State
  muted: boolean;
}

export interface Step {
  active: boolean;
  velocity: number;  // 0-1
  accent: boolean;
  note: number;      // semitone offset from base freq (for melodic tracks)
}

export interface Track {
  instrumentId: string;
  steps: Step[];
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Track[];
  stepCount: number;
  swing: number;
}

export interface HistoryEntry {
  patterns: Pattern[];
  instruments: InstrumentParams[];
}

export interface SequencerState {
  bpm: number;
  isPlaying: boolean;
  currentStep: number;
  currentPatternId: string;
  patterns: Pattern[];
  instruments: InstrumentParams[];
  baseSoundParams: InstrumentParams[];  // Original instrument params before sound packs
  currentSoundPack: SoundPack;
  masterVolume: number;
  masterCompressor: boolean;
  reverbEnabled: boolean;
  // UI state
  editingInstrumentId: string | null;
  soloedTrackIndex: number | null;
  showEditor: boolean;
  activeEditorTab: 'edit' | 'add';
  themeMode: ThemeMode;
  previewOnStepToggle: boolean;
  visualizerVisible: boolean;
  keyboardEnabled: boolean;
  keyboardInstrumentId: string | null;
  // History
  past: HistoryEntry[];
  future: HistoryEntry[];
  // Song chain
  chainedPatternIds: string[];
  chainPlaying: boolean;
  chainStep: number;
  queuedPatternId?: string | null;
}
