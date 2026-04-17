import { create } from 'zustand';
import { SequencerState, InstrumentParams, Pattern, Step } from '../types';
import { DEFAULT_INSTRUMENTS, defaultPattern, makePresetPatterns, makeStep, applySoundPack, getPresetInstruments } from '../audio/presets';
import {
  playInstrument, getAudioContext, setMasterVolume,
  setCompressorEnabled, getAnalyser,
} from '../audio/synth';

// ── Persistence key ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'chipbeat_v2';

const INITIAL_INSTRUMENTS = DEFAULT_INSTRUMENTS.map(i => ({ ...i }));
const INITIAL_PATTERN = defaultPattern(INITIAL_INSTRUMENTS, 16);
const INITIAL_SOUND_PACK: import('../types').SoundPack = 'default';

// ── Tap tempo state ──────────────────────────────────────────────────────────
let tapTimes: number[] = [];

// ── Scheduler state ──────────────────────────────────────────────────────────
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let nextStepTime = 0;
let internalStep = 0;
let previewLoopTimer: ReturnType<typeof setInterval> | null = null;
let previewLoopInstrumentId: string | null = null;

// ── Debounced save ───────────────────────────────────────────────────────────
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(state: SequencerState) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => { saveState(state); }, 300);
}

function getStepDuration(bpm: number, swing: number, step: number): number {
  const base = 60 / bpm / 4; // 16th note
  const clampedSwing = Math.max(0, Math.min(1, swing));
  const swingOffset = clampedSwing * base * 0.5;
  // Apply swing as delayed off-beat: short on the primary (even) steps, long on secondary (odd) steps
  return step % 2 === 0 ? base - swingOffset : base + swingOffset;
}

function _deepClonePatterns(patterns: Pattern[]): Pattern[] {
  return patterns.map(p => ({
    ...p,
    tracks: p.tracks.map(t => ({
      ...t,
      steps: t.steps.map(s => ({ ...s })),
    })),
  }));
}

// ── Load / save ───────────────────────────────────────────────────────────────
function loadState(): Partial<SequencerState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SequencerState>;
  } catch {
    return null;
  }
}

function saveState(state: SequencerState) {
  try {
    const { isPlaying, currentStep, past, future, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {}
}

// ── Store interface ───────────────────────────────────────────────────────────
interface Store extends SequencerState {
  // Transport
  play: () => void;
  pause: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  tapTempo: () => void;
  setMasterVolume: (v: number) => void;
  toggleCompressor: () => void;
  getAnalyser: () => AnalyserNode;

  // Pattern
  setCurrentPattern: (id: string) => void;
  addPattern: () => void;
  duplicatePattern: (id: string) => void;
  deletePattern: (id: string) => void;
  renamePattern: (id: string, name: string) => void;
  setStepCount: (count: number) => void;
  setSwing: (swing: number) => void;

  // Steps
  toggleStep: (trackIdx: number, stepIdx: number) => void;
  setStepVelocity: (trackIdx: number, stepIdx: number, vel: number) => void;
  setStepNote: (trackIdx: number, stepIdx: number, note: number) => void;
  toggleStepAccent: (trackIdx: number, stepIdx: number) => void;
  clearTrack: (trackIdx: number) => void;
  randomizeTrack: (trackIdx: number, density: number) => void;
  fillTrack: (trackIdx: number) => void;
  copyTrack: (trackIdx: number) => void;
  pasteTrack: (trackIdx: number) => void;
  shiftTrackLeft: (trackIdx: number) => void;
  shiftTrackRight: (trackIdx: number) => void;
  invertTrack: (trackIdx: number) => void;

  // Instruments
  setEditingInstrument: (id: string | null) => void;
  updateInstrument: (id: string, updates: Partial<InstrumentParams>) => void;
  addInstrument: (inst: InstrumentParams) => void;
  removeInstrument: (id: string) => void;
  previewInstrument: (id: string, repeat?: boolean) => boolean;
  setSoloTrack: (idx: number | null) => void;
  moveTrackUp: (idx: number) => void;
  moveTrackDown: (idx: number) => void;
  setSoundPack: (pack: import('../types').SoundPack) => void;

  // UI
  setShowEditor: (show: boolean) => void;
  setActiveEditorTab: (tab: 'edit' | 'add') => void;
  setThemeMode: (mode: import('../types').ThemeMode) => void;
  setPreviewOnStepToggle: (on: boolean) => void;
  setVisualizerVisible: (show: boolean) => void;
  setKeyboardEnabled: (enabled: boolean) => void;
  setKeyboardInstrument: (id: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  _snapshot: () => void;

  // Save / load
  saveToStorage: () => void;
  resetAll: () => void;
  loadPresetPatterns: () => void;
  applyPatternPreset: (presetId: string) => void;
  
  // Import / export
  importProject: (data: import('../utils/projectExport').ProjectExport) => void;
  getProjectExportData: () => import('../utils/projectExport').ProjectExport;
}

// ── Clipboard ────────────────────────────────────────────────────────────────
let _clipboardSteps: Step[] | null = null;

// ── Initial state ────────────────────────────────────────────────────────────
// ── Merge instruments: add new defaults while keeping saved custom ones ────
function mergeInstruments(saved: InstrumentParams[] | undefined): InstrumentParams[] {
  if (!saved) return INITIAL_INSTRUMENTS;
  // Add any instruments from INITIAL that aren't in saved
  const savedIds = new Set(saved.map(i => i.id));
  const newInstruments = INITIAL_INSTRUMENTS.filter(i => !savedIds.has(i.id));
  return [...saved, ...newInstruments];
}

function buildInitial(): Omit<SequencerState, never> {
  const saved = loadState();
  const mergedInstruments = mergeInstruments(saved?.instruments);
  return {
    bpm: saved?.bpm ?? 120,
    isPlaying: false,
    currentStep: -1,
    currentPatternId: saved?.currentPatternId ?? INITIAL_PATTERN.id,
    patterns: saved?.patterns ?? [INITIAL_PATTERN],
    instruments: mergedInstruments,
    baseSoundParams: mergedInstruments.map(i => ({ ...i })),
    currentSoundPack: saved?.currentSoundPack ?? 'default',
    masterVolume: saved?.masterVolume ?? 0.85,
    masterCompressor: saved?.masterCompressor ?? true,
    reverbEnabled: saved?.reverbEnabled ?? true,
    editingInstrumentId: null,
    soloedTrackIndex: null,
    showEditor: false,
    activeEditorTab: 'edit',
    themeMode: saved?.themeMode ?? 'retro',
    previewOnStepToggle: saved?.previewOnStepToggle ?? true,
    visualizerVisible: saved?.visualizerVisible ?? true,
    keyboardEnabled: saved?.keyboardEnabled ?? false,
    keyboardInstrumentId: saved?.keyboardInstrumentId ?? 'synth',
    past: [],
    future: [],
    chainedPatternIds: saved?.chainedPatternIds ?? [],
    chainPlaying: false,
    chainStep: 0,
    queuedPatternId: null,
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useSequencerStore = create<Store>((set, get) => ({
  ...buildInitial(),

  getAnalyser: () => getAnalyser(),

  // ── Transport ──────────────────────────────────────────────────────────────
  play: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const state = get();
    if (state.isPlaying) return;

    internalStep = state.currentStep > 0 ? state.currentStep : 0;
    nextStepTime = ctx.currentTime + 0.05;
    set({ isPlaying: true, currentStep: 0 });

    // Build instrument lookup map for O(1) access in hot loop
    let instMap = new Map<string, import('../types').InstrumentParams>();
    for (const inst of state.instruments) instMap.set(inst.id, inst);

    schedulerTimer = setInterval(() => {
      const s = get();
      const pattern = s.patterns.find(p => p.id === s.currentPatternId)!;
      if (!pattern) return;
      const lookahead = 0.12;
      const ctxNow = getAudioContext().currentTime;

      // Rebuild instrument map only when instruments change (reference check)
      if (s.instruments !== state.instruments) {
        instMap = new Map<string, import('../types').InstrumentParams>();
        for (const inst of s.instruments) instMap.set(inst.id, inst);
      }

      while (nextStepTime < ctxNow + lookahead) {
        const step = internalStep % pattern.stepCount;

        for (let tIdx = 0; tIdx < pattern.tracks.length; tIdx++) {
          const track = pattern.tracks[tIdx];
          const inst = instMap.get(track.instrumentId);
          if (!inst || inst.muted) continue;
          if (s.soloedTrackIndex !== null && s.soloedTrackIndex !== tIdx) continue;
          const stepData = track.steps[step];
          if (stepData?.active) {
            playInstrument(inst, stepData.velocity, stepData.accent, nextStepTime, stepData.note);
          }
        }

        const uiStep = step;
        const delay = Math.max(0, (nextStepTime - ctxNow) * 1000);
        setTimeout(() => { set({ currentStep: uiStep }); }, delay);

        const isEndOfPattern = step === pattern.stepCount - 1;
        nextStepTime += getStepDuration(s.bpm, pattern.swing, internalStep);
        internalStep++;

        if (isEndOfPattern) {
          const queued = get().queuedPatternId;
          if (queued) {
            set({ currentPatternId: queued, queuedPatternId: null, currentStep: -1 });
            internalStep = 0;
          }
        }
      }
    }, 25);
  },

  pause: () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
    set({ isPlaying: false });
  },

  stop: () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
    internalStep = 0;
    set({ isPlaying: false, currentStep: -1 });
  },

  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(300, bpm)) }),

  tapTempo: () => {
    const now = performance.now();
    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length < 2) return;
    // Discard taps older than 3 seconds
    const cutoff = now - 3000;
    tapTimes = tapTimes.filter(t => t >= cutoff);
    if (tapTimes.length < 2) return;
    const gaps: number[] = [];
    for (let i = 1; i < tapTimes.length; i++) gaps.push(tapTimes[i] - tapTimes[i - 1]);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const bpm = Math.round(60000 / avg);
    set({ bpm: Math.max(40, Math.min(300, bpm)) });
  },

  setMasterVolume: (v) => {
    setMasterVolume(v);
    set({ masterVolume: v });
  },

  toggleCompressor: () => {
    const on = !get().masterCompressor;
    setCompressorEnabled(on);
    set({ masterCompressor: on });
  },

  // ── Patterns ──────────────────────────────────────────────────────────────
  setCurrentPattern: (id) => {
    const s = get();

    // While playing: queue for next cycle
    if (s.isPlaying) {
      set({ queuedPatternId: id });
      return;
    }

    // While paused: switch instantly
    const selectedPattern = s.patterns.find(p => p.id === id);
    if (selectedPattern) {
      // Pattern presets should only fill the pattern (tracks/steps), not alter instruments.
      set({ currentPatternId: id, currentStep: -1, queuedPatternId: null });
    } else {
      set({ currentPatternId: id, currentStep: -1, queuedPatternId: null });
    }
  },

  addPattern: () => {
    get()._snapshot();
    const s = get();
    const newId = `pat_${Date.now()}`;
    const newPat: Pattern = {
      id: newId,
      name: `Pat ${s.patterns.length + 1}`,
      stepCount: s.patterns.find(p => p.id === s.currentPatternId)?.stepCount ?? 16,
      swing: 0,
      tracks: s.instruments.map(inst => ({
        instrumentId: inst.id,
        steps: Array.from({ length: 16 }, () => makeStep()),
      })),
    };
    set({ patterns: [...s.patterns, newPat], currentPatternId: newId });
    debouncedSave(get() as SequencerState);
  },

  duplicatePattern: (id) => {
    get()._snapshot();
    const s = get();
    const src = s.patterns.find(p => p.id === id);
    if (!src) return;
    const newId = `pat_${Date.now()}`;
    const clone: Pattern = {
      ...src,
      id: newId,
      name: src.name + ' copy',
      tracks: src.tracks.map(t => ({ ...t, steps: t.steps.map(st => ({ ...st })) })),
    };
    const idx = s.patterns.findIndex(p => p.id === id);
    const updated = [...s.patterns];
    updated.splice(idx + 1, 0, clone);
    set({ patterns: updated, currentPatternId: newId });
    debouncedSave(get() as SequencerState);
  },

  deletePattern: (id) => {
    const s = get();
    if (s.patterns.length <= 1) return;
    get()._snapshot();
    const remaining = s.patterns.filter(p => p.id !== id);
    set({
      patterns: remaining,
      currentPatternId: s.currentPatternId === id ? remaining[0].id : s.currentPatternId,
    });
    debouncedSave(get() as SequencerState);
  },

  renamePattern: (id, name) => {
    set(s => ({ patterns: s.patterns.map(p => p.id === id ? { ...p, name } : p) }));
    debouncedSave(get() as SequencerState);
  },

  setStepCount: (count) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          stepCount: count,
          tracks: p.tracks.map(t => ({
            ...t,
            steps: Array.from({ length: count }, (_, i) => t.steps[i] ?? makeStep()),
          })),
        };
      }),
    }));
    debouncedSave(get() as SequencerState);
  },

  setSwing: (swing) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => p.id === s.currentPatternId ? { ...p, swing } : p),
    }));
    debouncedSave(get() as SequencerState);
  },

  // ── Steps ─────────────────────────────────────────────────────────────────
  toggleStep: (trackIdx, stepIdx) => {
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map((st, si) => si !== stepIdx ? st : { ...st, active: !st.active }),
          }),
        };
      }),
    }));
  },

  setStepVelocity: (trackIdx, stepIdx, vel) => {
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map((st, si) => si !== stepIdx ? st : { ...st, velocity: vel }),
          }),
        };
      }),
    }));
  },

  setStepNote: (trackIdx, stepIdx, note) => {
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map((st, si) => si !== stepIdx ? st : { ...st, note }),
          }),
        };
      }),
    }));
  },

  toggleStepAccent: (trackIdx, stepIdx) => {
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map((st, si) => si !== stepIdx ? st : { ...st, accent: !st.accent }),
          }),
        };
      }),
    }));
  },

  clearTrack: (trackIdx) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map(() => makeStep()),
          }),
        };
      }),
    }));
  },

  randomizeTrack: (trackIdx, density = 0.3) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map(() => makeStep({
              active: Math.random() < density,
              velocity: 0.55 + Math.random() * 0.45,
              accent: Math.random() < 0.12,
              note: Math.floor(Math.random() * 13) - 6,
            })),
          }),
        };
      }),
    }));
  },

  fillTrack: (trackIdx) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map(() => makeStep({ active: true, velocity: 0.9 })),
          }),
        };
      }),
    }));
  },

  copyTrack: (trackIdx) => {
    const s = get();
    const pattern = s.patterns.find(p => p.id === s.currentPatternId);
    const track = pattern?.tracks[trackIdx];
    if (track) _clipboardSteps = track.steps.map(st => ({ ...st }));
  },

  pasteTrack: (trackIdx) => {
    if (!_clipboardSteps) return;
    get()._snapshot();
    const clip = _clipboardSteps;
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: Array.from({ length: t.steps.length }, (_, i) =>
              clip[i] ? { ...clip[i] } : makeStep()
            ),
          }),
        };
      }),
    }));
  },

  shiftTrackLeft: (trackIdx) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: [...t.steps.slice(1), t.steps[0]],
          }),
        };
      }),
    }));
  },

  shiftTrackRight: (trackIdx) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: [t.steps[t.steps.length - 1], ...t.steps.slice(0, -1)],
          }),
        };
      }),
    }));
  },

  invertTrack: (trackIdx) => {
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t, ti) => ti !== trackIdx ? t : {
            ...t,
            steps: t.steps.map(st => ({ ...st, active: !st.active })),
          }),
        };
      }),
    }));
  },

  // ── Instruments ───────────────────────────────────────────────────────────
  setEditingInstrument: (id) => set({ editingInstrumentId: id }),

  updateInstrument: (id, updates) => {
    set(s => ({
      instruments: s.instruments.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
    debouncedSave(get() as SequencerState);
  },

  addInstrument: (inst) => {
    get()._snapshot();
    set(s => {
      const newInst = { ...inst, id: `inst_${Date.now()}` };
      return {
        instruments: [...s.instruments, newInst],
        patterns: s.patterns.map(p => ({
          ...p,
          tracks: [
            ...p.tracks,
            {
              instrumentId: newInst.id,
              steps: Array.from({ length: p.stepCount }, () => makeStep()),
            },
          ],
        })),
      };
    });
    debouncedSave(get() as SequencerState);
  },

  removeInstrument: (id) => {
    const s = get();
    if (s.instruments.length <= 1) return;
    get()._snapshot();
    set(s => ({
      instruments: s.instruments.filter(i => i.id !== id),
      patterns: s.patterns.map(p => ({
        ...p,
        tracks: p.tracks.filter(t => t.instrumentId !== id),
      })),
      editingInstrumentId: s.editingInstrumentId === id ? null : s.editingInstrumentId,
    }));
    debouncedSave(get() as SequencerState);
  },

  previewInstrument: (id, repeat = false) => {
    const inst = get().instruments.find(i => i.id === id);
    if (!inst) return false;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    if (repeat) {
      if (previewLoopTimer !== null) {
        window.clearInterval(previewLoopTimer);
        previewLoopTimer = null;
        previewLoopInstrumentId = null;
        return false;
      }
      playInstrument(inst, 1, false);
      previewLoopInstrumentId = id;
      previewLoopTimer = window.setInterval(() => {
        const currentInst = get().instruments.find(i => i.id === previewLoopInstrumentId);
        if (currentInst) {
          playInstrument(currentInst, 1, false);
        }
      }, 250);
      return true;
    }
    if (previewLoopTimer !== null) {
      window.clearInterval(previewLoopTimer);
      previewLoopTimer = null;
      previewLoopInstrumentId = null;
    }
    playInstrument(inst, 1, false);
    return false;
  },

  setSoloTrack: (idx) => set({ soloedTrackIndex: idx }),

  moveTrackUp: (idx) => {
    if (idx <= 0) return;
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        const tracks = [...p.tracks];
        [tracks[idx - 1], tracks[idx]] = [tracks[idx], tracks[idx - 1]];
        return { ...p, tracks };
      }),
      instruments: (() => {
        const insts = [...s.instruments];
        [insts[idx - 1], insts[idx]] = [insts[idx], insts[idx - 1]];
        return insts;
      })(),
    }));
  },

  moveTrackDown: (idx) => {
    const s = get();
    if (idx >= s.instruments.length - 1) return;
    get()._snapshot();
    set(s => ({
      patterns: s.patterns.map(p => {
        if (p.id !== s.currentPatternId) return p;
        const tracks = [...p.tracks];
        [tracks[idx], tracks[idx + 1]] = [tracks[idx + 1], tracks[idx]];
        return { ...p, tracks };
      }),
      instruments: (() => {
        const insts = [...s.instruments];
        [insts[idx], insts[idx + 1]] = [insts[idx + 1], insts[idx]];
        return insts;
      })(),
    }));
  },

  setSoundPack: (pack) => {
    const adjustedInstruments = applySoundPack(DEFAULT_INSTRUMENTS.map(i => ({ ...i })), pack);
    set({ currentSoundPack: pack, instruments: adjustedInstruments });
    debouncedSave(get() as SequencerState);
  },

  // ── UI ───────────────────────────────────────────────────────────────────
  setShowEditor: (show) => set({ showEditor: show }),
  setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    debouncedSave(get() as SequencerState);
  },
  setPreviewOnStepToggle: (on) => {
    set({ previewOnStepToggle: on });
    debouncedSave(get() as SequencerState);
  },
  setVisualizerVisible: (show) => {
    set({ visualizerVisible: show });
    debouncedSave(get() as SequencerState);
  },
  setKeyboardEnabled: (enabled) => {
    set({ keyboardEnabled: enabled });
    debouncedSave(get() as SequencerState);
  },
  setKeyboardInstrument: (id) => {
    set({ keyboardInstrumentId: id });
    debouncedSave(get() as SequencerState);
  },

  // ── History ───────────────────────────────────────────────────────────────
  _snapshot: () => {
    const s = get();
    const entry = {
      patterns: _deepClonePatterns(s.patterns),
      instruments: s.instruments.map(i => ({ ...i })),
    };
    set(s => ({
      past: [...s.past.slice(-30), entry],
      future: [],
    }));
  },

  undo: () => {
    const s = get();
    if (s.past.length === 0) return;
    const prev = s.past[s.past.length - 1];
    const currentEntry = {
      patterns: _deepClonePatterns(s.patterns),
      instruments: s.instruments.map(i => ({ ...i })),
    };
    set({
      patterns: prev.patterns,
      instruments: prev.instruments,
      past: s.past.slice(0, -1),
      future: [currentEntry, ...s.future.slice(0, 30)],
    });
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    const currentEntry = {
      patterns: _deepClonePatterns(s.patterns),
      instruments: s.instruments.map(i => ({ ...i })),
    };
    set({
      patterns: next.patterns,
      instruments: next.instruments,
      past: [...s.past.slice(0, 30), currentEntry],
      future: s.future.slice(1),
    });
  },

  // ── Persistence ───────────────────────────────────────────────────────────
  saveToStorage: () => saveState(get() as SequencerState),

  resetAll: () => {
    const fresh = buildInitial();
    // Reset with fresh instruments and pattern
    const insts = DEFAULT_INSTRUMENTS.map(i => ({ ...i }));
    const pat = defaultPattern(insts, 16);
    set({
      ...fresh,
      instruments: insts,
      patterns: [pat],
      currentPatternId: pat.id,
      past: [],
      future: [],
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  loadPresetPatterns: () => {
    get()._snapshot();
    const s = get();
    const presets = makePresetPatterns(s.instruments);
    set({ patterns: [...s.patterns, ...presets] });
    debouncedSave(get() as SequencerState);
  },

  applyPatternPreset: (presetId: string) => {
    const s = get();
    const currentPatternId = s.currentPatternId;
    const activePatternIndex = s.patterns.findIndex(p => p.id === currentPatternId);
    if (activePatternIndex === -1) return;

    const preset = makePresetPatterns(s.instruments).find(p => p.id === presetId);
    if (!preset) return;

    get()._snapshot();

    const updatedPattern = {
      ...s.patterns[activePatternIndex],
      stepCount: preset.stepCount,
      swing: preset.swing,
      tracks: preset.tracks.map(track => ({
        instrumentId: track.instrumentId,
        steps: track.steps.map(step => ({ ...step })),
      })),
    };

    const newPatterns = [...s.patterns];
    newPatterns[activePatternIndex] = updatedPattern;

    set({ patterns: newPatterns });
    debouncedSave(get() as SequencerState);
  },

  // ── Import / Export ───────────────────────────────────────────────────────
  importProject: (data) => {
    get()._snapshot();
    set({
      bpm: data.bpm,
      patterns: data.patterns,
      instruments: data.instruments,
      masterVolume: data.masterVolume,
      masterCompressor: data.masterCompressor,
      reverbEnabled: data.reverbEnabled,
      chainedPatternIds: data.chainedPatternIds,
      currentPatternId: data.patterns[0]?.id ?? '',
      currentStep: -1,
      isPlaying: false,
    });
    debouncedSave(get() as SequencerState);
  },

  getProjectExportData: () => {
    const s = get();
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      name: `ChipBeat - ${s.patterns.find(p => p.id === s.currentPatternId)?.name ?? 'Project'}`,
      bpm: s.bpm,
      patterns: s.patterns,
      instruments: s.instruments,
      masterVolume: s.masterVolume,
      masterCompressor: s.masterCompressor,
      reverbEnabled: s.reverbEnabled,
      chainedPatternIds: s.chainedPatternIds,
    };
  },
}));

// ── Initialize audio settings from loaded state ─────────────────────────────
const initialState = useSequencerStore.getState();
setMasterVolume(initialState.masterVolume);
setCompressorEnabled(initialState.masterCompressor);
