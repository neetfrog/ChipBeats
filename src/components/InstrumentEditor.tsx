import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { useSequencerStore } from '../store/sequencerStore';
import { InstrumentParams, WaveShape, InstrumentType } from '../types';
import { DEFAULT_INSTRUMENTS } from '../audio/presets';

const WAVES: WaveShape[] = ['square', 'sawtooth', 'triangle', 'sine', 'noise', 'pulse'];
const WAVE_ICONS: Record<WaveShape, string> = {
  square: '⊓',
  sawtooth: '⋀',
  triangle: '∧',
  sine: '∿',
  noise: '⁓',
  pulse: '⊓̣',
};
const WAVE_LABELS: Record<WaveShape, string> = {
  square: 'SQR',
  sawtooth: 'SAW',
  triangle: 'TRI',
  sine: 'SIN',
  noise: 'NSE',
  pulse: 'PLS',
};

const FILTER_TYPES: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass', 'peaking', 'notch', 'allpass'];
const FILTER_ABBR: Record<string, string> = {
  lowpass: 'LP', highpass: 'HP', bandpass: 'BP', peaking: 'PK', notch: 'NT', allpass: 'AP'
};

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
const INSTRUMENT_TYPES: InstrumentType[] = [
  'kick', 'snare', 'hihat', 'openhat', 'clap', 'tom',
  'bass', 'lead', 'chord', 'blip', 'cymbal', 'fx',
];

// ── ADSR Envelope Preview ────────────────────────────────────────────────────
const ADSRPreview = memo(function ADSRPreview({ attack, decay, sustain, release, color }: {
  attack: number; decay: number; sustain: number; release: number; color: string;
}) {
  const W = 200, H = 56;
  const pad = 6;
  const total = attack + decay + 0.15 + release;
  const scale = (t: number) => (t / total) * (W - pad * 2);
  const aX = pad + scale(attack);
  const dX = aX + scale(decay);
  const sX = dX + scale(0.15);
  const rX = sX + scale(release);
  const sY = H - pad - (H - pad * 2) * sustain;

  const d = [
    `M${pad},${H - pad}`,
    `L${aX},${pad}`,
    `L${dX},${sY}`,
    `L${sX},${sY}`,
    `L${rX},${H - pad}`,
  ].join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg overflow-hidden">
      <rect width={W} height={H} fill="#111827" />
      <defs>
        <linearGradient id="adsr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={`${d} L${rX},${H - pad} L${pad},${H - pad} Z`} fill="url(#adsr-grad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Labels */}
      {[['A', pad + scale(attack / 2)], ['D', aX + scale(decay / 2)], ['S', dX + scale(0.075)], ['R', sX + scale(release / 2)]].map(([lbl, x]) => (
        <text key={lbl as string} x={x as number} y={H - 1} textAnchor="middle" fontSize="7" fill={color} opacity="0.6">{lbl}</text>
      ))}
    </svg>
  );
});

// ── Wave shape preview ───────────────────────────────────────────────────────
const WavePreview = memo(function WavePreview({ wave, color, pulseWidth = 0.5, frequency = 440 }: { wave: WaveShape; color: string; pulseWidth?: number; frequency: number }) {
  const W = 80, H = 32;
  const cycles = Math.max(1, Math.min(18, Math.round(frequency / 250)));
  const pts: [number, number][] = [];
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = t * W;
    let y = 0;
    const phase = (t * cycles) % 1;
    switch (wave) {
      case 'sine': y = Math.sin(phase * Math.PI * 2); break;
      case 'square': y = phase < 0.5 ? 1 : -1; break;
      case 'sawtooth': y = phase * 2 - 1; break;
      case 'triangle': y = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4; break;
      case 'noise': y = (Math.random() * 2 - 1) * 0.8; break;
      case 'pulse': y = phase < pulseWidth ? 1 : -1; break;
    }
    pts.push([x, H / 2 - y * (H / 2 - 3)]);
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rounded">
      <rect width={W} height={H} fill="#0f172a" />
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#1f2937" strokeWidth="1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});

// ── Knob ─────────────────────────────────────────────────────────────────────
interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
  unit?: string;
  onChange: (v: number) => void;
  color?: string;
  fullWidth?: boolean;
  defaultValue?: number;
}

const Knob = memo(function Knob({ label, value, min, max, step = 0.01, decimals = 2, unit = '', onChange, color = '#8b5cf6', fullWidth, defaultValue }: KnobProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const dragRef = useRef<{ startX: number; startY: number; startVal: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const flushPending = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (pendingValueRef.current !== null) {
      onChange(pendingValueRef.current);
      pendingValueRef.current = null;
    }
  }, [onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startVal: displayValue };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [displayValue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const dx = e.clientX - dragRef.current.startX;
    const range = max - min;
    const delta = ((dy + dx) / 100) * range;
    const rawValue = Math.max(min, Math.min(max, dragRef.current.startVal + delta));
    const quantized = Math.round(rawValue / step) * step;
    if (quantized === displayValue) return;

    setDisplayValue(quantized);
    pendingValueRef.current = quantized;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        if (pendingValueRef.current !== null) {
          onChange(pendingValueRef.current);
          pendingValueRef.current = null;
        }
        frameRef.current = null;
      });
    }
  }, [min, max, step, onChange, displayValue]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    flushPending();
  }, [flushPending]);

  const handleDoubleClick = useCallback(() => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  }, [defaultValue, onChange]);

  // Arc rendering
  const r = 18, cx = 22, cy = 22;
  const startAngle = 220 * (Math.PI / 180);
  const endAngle = -40 * (Math.PI / 180);
  const pct = (displayValue - min) / (max - min);
  const angle = startAngle + pct * (endAngle - startAngle + Math.PI * 2);
  const bgArc = describeArc(cx, cy, r, -220, 40);
  const fillArc = describeArc(cx, cy, r, -220, -220 + pct * 280);
  const dotX = cx + (r - 4) * Math.cos(angle);
  const dotY = cy + (r - 4) * Math.sin(angle);

  return (
    <div className={`flex flex-col items-center gap-0.5 cursor-ew-resize select-none ${fullWidth ? 'w-full' : 'min-w-[64px] sm:min-w-[52px]'} touch-none p-1`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      title={defaultValue !== undefined ? `Double-click to reset to ${defaultValue.toFixed(decimals)}` : undefined}
    >
      <svg width={44} height={44} viewBox="0 0 44 44" style={{ touchAction: 'none' }}>
        <path d={bgArc} fill="none" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <path d={fillArc} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={dotX} cy={dotY} r={2.5} fill={color} />
        <circle cx={cx} cy={cy} r={8} fill="#1f2937" stroke={color} strokeWidth="1" opacity="0.5" />
      </svg>
      <span className="text-[8px] uppercase tracking-wider text-gray-400 leading-none text-center">{label}</span>
      <span className="text-[9px] font-mono text-white leading-none">
        {displayValue.toFixed(decimals)}{unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={e => onChange(Number(e.target.value))}
        className="mt-2 w-full sm:hidden accent-transparent"
        style={{ accentColor: color }}
        aria-label={label}
      />
    </div>
  );
});

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => d * Math.PI / 180;
  const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const e = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
  const large = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${large},1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({ title, children, color = '#8b5cf6', defaultOpen = true }: {
  title: string; children: React.ReactNode; color?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}33` }}>
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
        style={{ background: `${color}18`, color }}
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <span className="text-sm opacity-60">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="p-3 flex flex-wrap gap-3 justify-around">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InstrumentEditor() {
  const instruments = useSequencerStore(state => state.instruments);
  const editingInstrumentId = useSequencerStore(state => state.editingInstrumentId);
  const inst = useSequencerStore(state => state.instruments.find(i => i.id === state.editingInstrumentId));
  const updateInstrument = useSequencerStore(state => state.updateInstrument);
  const addInstrument = useSequencerStore(state => state.addInstrument);
  const removeInstrument = useSequencerStore(state => state.removeInstrument);
  const setEditingInstrument = useSequencerStore(state => state.setEditingInstrument);
  const previewInstrument = useSequencerStore(state => state.previewInstrument);
  const activeEditorTab = useSequencerStore(state => state.activeEditorTab);
  const setActiveEditorTab = useSequencerStore(state => state.setActiveEditorTab);
  const [newInstBase, setNewInstBase] = useState<InstrumentType>('blip');

  const defaultInst = useMemo(() => inst ? DEFAULT_INSTRUMENTS.find(d => d.type === inst.type) : null, [inst]);
  const [previewRepeatMode, setPreviewRepeatMode] = useState(false);
  const [previewLoopActive, setPreviewLoopActive] = useState(false);

  const upd = useCallback((k: keyof InstrumentParams, v: unknown) => {
    if (!inst) return;
    updateInstrument(inst.id, { [k]: v } as Partial<InstrumentParams>);
  }, [inst, updateInstrument]);

  const knobHandlers = useMemo(() => {
    if (!editingInstrumentId) return {} as Record<string, (v: number) => void>;
    return {
      pulseWidth: (v: number) => updateInstrument(editingInstrumentId, { pulseWidth: v }),
      frequency: (v: number) => updateInstrument(editingInstrumentId, { frequency: v }),
      freqEnd: (v: number) => updateInstrument(editingInstrumentId, { freqEnd: v }),
      pitchSweepTime: (v: number) => updateInstrument(editingInstrumentId, { pitchSweepTime: v }),
      attack: (v: number) => updateInstrument(editingInstrumentId, { attack: v }),
      decay: (v: number) => updateInstrument(editingInstrumentId, { decay: v }),
      sustain: (v: number) => updateInstrument(editingInstrumentId, { sustain: v }),
      release: (v: number) => updateInstrument(editingInstrumentId, { release: v }),
      filterFreq: (v: number) => updateInstrument(editingInstrumentId, { filterFreq: v }),
      filterQ: (v: number) => updateInstrument(editingInstrumentId, { filterQ: v }),
      filterEnvAmt: (v: number) => updateInstrument(editingInstrumentId, { filterEnvAmt: v }),
      bitCrush: (v: number) => updateInstrument(editingInstrumentId, { bitCrush: v }),
      distortion: (v: number) => updateInstrument(editingInstrumentId, { distortion: v }),
      volume: (v: number) => updateInstrument(editingInstrumentId, { volume: v }),
      pan: (v: number) => updateInstrument(editingInstrumentId, { pan: v }),
      reverbMix: (v: number) => updateInstrument(editingInstrumentId, { reverbMix: v }),
      delayMix: (v: number) => updateInstrument(editingInstrumentId, { delayMix: v }),
      delayTime: (v: number) => updateInstrument(editingInstrumentId, { delayTime: v }),
      delayFeedback: (v: number) => updateInstrument(editingInstrumentId, { delayFeedback: v }),
      arpSpeed: (v: number) => updateInstrument(editingInstrumentId, { arpSpeed: v }),
      vibratoRate: (v: number) => updateInstrument(editingInstrumentId, { vibratoRate: v }),
      vibratoDepth: (v: number) => updateInstrument(editingInstrumentId, { vibratoDepth: v }),
      tremoloRate: (v: number) => updateInstrument(editingInstrumentId, { tremoloRate: v }),
      tremoloDepth: (v: number) => updateInstrument(editingInstrumentId, { tremoloDepth: v }),
    };
  }, [editingInstrumentId, updateInstrument]);

  const handleResetToDefault = () => {
    if (!inst || !defaultInst) return;
    // Update all instrument params to default
    const updates: Partial<InstrumentParams> = {};
    (Object.keys(defaultInst) as (keyof InstrumentParams)[]).forEach(key => {
      if (key !== 'id' && key !== 'name' && key !== 'color') {
        updates[key] = defaultInst[key] as any;
      }
    });
    updateInstrument(inst.id, updates);
  };

  const handleAddPreset = () => {
    const preset = DEFAULT_INSTRUMENTS.find(d => d.type === newInstBase);
    if (preset) {
      addInstrument({ ...preset });
      setActiveEditorTab('edit');
    }
  };

  return (
    <div className="rounded-2xl bg-gray-900/95 border border-gray-700/80 overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveEditorTab('edit')}
          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            activeEditorTab === 'edit' ? 'bg-gray-800 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >🎛 Edit Sound</button>
        <button
          onClick={() => setActiveEditorTab('add')}
          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            activeEditorTab === 'add' ? 'bg-gray-800 text-white border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >＋ Add Track</button>
      </div>

      <div className="p-3 max-h-[75vh] overflow-y-auto overscroll-contain space-y-3">

        {/* ── ADD TAB ── */}
        {activeEditorTab === 'add' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Choose preset type:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {INSTRUMENT_TYPES.map(t => {
                const preset = DEFAULT_INSTRUMENTS.find(d => d.type === t);
                return (
                  <button
                    key={t}
                    onClick={() => setNewInstBase(t)}
                    className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                      newInstBase === t ? 'ring-2 ring-white/60 scale-95' : 'hover:brightness-125'
                    }`}
                    style={{
                      backgroundColor: (preset?.color ?? '#666') + '28',
                      color: preset?.color ?? '#aaa',
                      borderLeft: `2px solid ${preset?.color ?? '#666'}`,
                    }}
                  >{t}</button>
                );
              })}
            </div>
            <button
              onClick={handleAddPreset}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all active:scale-95"
            >＋ Add {newInstBase.toUpperCase()}</button>
          </div>
        )}

        {/* ── EDIT TAB – no selection ── */}
        {activeEditorTab === 'edit' && !inst && (
          <div className="py-4">
            <p className="text-center text-gray-500 text-xs mb-3">Select an instrument to edit:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {instruments.map(i => (
                <button
                  key={i.id}
                  onClick={() => setEditingInstrument(i.id)}
                  className="px-3 py-2 rounded-lg text-[11px] font-bold text-left transition-all hover:brightness-125 active:scale-95"
                  style={{ backgroundColor: i.color + '22', color: i.color, borderLeft: `3px solid ${i.color}` }}
                >{i.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── EDIT TAB – instrument selected ── */}
        {activeEditorTab === 'edit' && inst && (
          <div className="space-y-3">

            {/* Header: name + actions */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inst.name}
                onChange={e => upd('name', e.target.value.toUpperCase())}
                className="w-full max-w-[180px] min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-bold text-sm outline-none focus:border-purple-500"
                maxLength={12}
              />
              <button
                onClick={() => {
                  const active = previewInstrument(inst.id, previewRepeatMode);
                  setPreviewLoopActive(active);
                }}
                className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-all active:scale-90"
                title="Preview"
              >▶</button>
              <button
                type="button"
                onClick={() => {
                  const next = !previewRepeatMode;
                  setPreviewRepeatMode(next);
                  if (!next && previewLoopActive && inst) {
                    previewInstrument(inst.id, false);
                    setPreviewLoopActive(false);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${previewRepeatMode ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                title="Toggle repeat preview"
              >
                {previewRepeatMode ? 'LOOP' : 'ONE'}
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-3 py-2 rounded-lg bg-orange-950 hover:bg-orange-800 text-orange-400 text-sm font-bold transition-all"
                title="Reset to default settings"
              >⟲</button>
              <button
                onClick={() => {
                  if (window.confirm(`Remove "${inst.name}"?`)) {
                    removeInstrument(inst.id);
                  }
                }}
                className="px-3 py-2 rounded-lg bg-red-950 hover:bg-red-800 text-red-400 text-sm font-bold transition-all"
              >✕</button>
            </div>

            {/* Color picker */}
            <div className="w-full flex justify-center overflow-x-auto py-1">
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => upd('color', c)}
                    className={`w-6 h-6 rounded-full flex-shrink-0 transition-all active:scale-90 ${inst.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* ── Oscillator ── */}
            <Section title="Oscillator" color={inst.color}>
              {/* Wave selector with mini preview */}
              <div className="w-full">
                <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1.5">Waveform</p>
                <div className="flex gap-1 flex-wrap">
                  {WAVES.map(w => (
                    <button
                      key={w}
                      onClick={() => upd('wave', w)}
                      className={`flex-1 min-w-[40px] py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                        inst.wave === w
                          ? 'text-white ring-1 ring-white/50'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                      style={inst.wave === w ? { backgroundColor: inst.color + '33' } : undefined}
                      title={w}
                    >
                      <span className="text-base leading-none">{WAVE_ICONS[w]}</span>
                      <span>{WAVE_LABELS[w]}</span>
                    </button>
                  ))}
                </div>
                {/* Wave preview */}
                <div className="mt-2 flex justify-center">
                  <WavePreview wave={inst.wave} color={inst.color} pulseWidth={inst.pulseWidth} frequency={inst.frequency} />
                </div>
              </div>
              {inst.wave === 'pulse' && (
                <Knob label="Pulse W" value={inst.pulseWidth} min={0.05} max={0.95} step={0.01} decimals={2} onChange={knobHandlers.pulseWidth} color={inst.color} defaultValue={defaultInst?.pulseWidth} />
              )}
              <Knob label="Freq" value={inst.frequency} min={20} max={8000} step={1} decimals={0} unit="Hz" onChange={knobHandlers.frequency} color={inst.color} defaultValue={defaultInst?.frequency} />
              <Knob label="Freq End" value={inst.freqEnd} min={20} max={8000} step={1} decimals={0} unit="Hz" onChange={knobHandlers.freqEnd} color={inst.color} defaultValue={defaultInst?.freqEnd} />
              <Knob label="Sweep" value={inst.pitchSweepTime} min={0.001} max={2} step={0.001} decimals={3} unit="s" onChange={knobHandlers.pitchSweepTime} color={inst.color} defaultValue={defaultInst?.pitchSweepTime} />
            </Section>

            {/* ── Envelope ── */}
            <Section title="Envelope" color="#22c55e">
              <div className="w-full mb-3">
                <ADSRPreview
                  attack={inst.attack}
                  decay={inst.decay}
                  sustain={inst.sustain}
                  release={inst.release}
                  color={inst.color}
                />
              </div>
              <Knob label="Attack" value={inst.attack} min={0.001} max={2} step={0.001} decimals={3} unit="s" onChange={knobHandlers.attack} color="#22c55e" defaultValue={defaultInst?.attack} />
              <Knob label="Decay" value={inst.decay} min={0.001} max={3} step={0.001} decimals={3} unit="s" onChange={knobHandlers.decay} color="#22c55e" defaultValue={defaultInst?.decay} />
              <Knob label="Sustain" value={inst.sustain} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.sustain} color="#22c55e" defaultValue={defaultInst?.sustain} />
              <Knob label="Release" value={inst.release} min={0.001} max={3} step={0.001} decimals={3} unit="s" onChange={knobHandlers.release} color="#22c55e" defaultValue={defaultInst?.release} />
            </Section>

            {/* ── Filter ── */}
            <Section title="Filter" color="#06b6d4" defaultOpen={false}>
              <div className="w-full">
                <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1.5">Type</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {FILTER_TYPES.map(ft => (
                    <button
                      key={ft}
                      onClick={() => upd('filterType', ft)}
                      className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                        inst.filterType === ft
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >{FILTER_ABBR[ft]}</button>
                  ))}
                </div>
              </div>
              <Knob label="Cutoff" value={inst.filterFreq} min={20} max={18000} step={10} decimals={0} unit="Hz" onChange={knobHandlers.filterFreq} color="#06b6d4" defaultValue={defaultInst?.filterFreq} />
              <Knob label="Resonance" value={inst.filterQ} min={0.1} max={20} step={0.1} decimals={1} onChange={knobHandlers.filterQ} color="#06b6d4" defaultValue={defaultInst?.filterQ} />
              <Knob label="Env Amt" value={inst.filterEnvAmt} min={-1} max={1} step={0.01} decimals={2} onChange={knobHandlers.filterEnvAmt} color="#06b6d4" defaultValue={defaultInst?.filterEnvAmt} />
            </Section>

            {/* ── FX ── */}
            <Section title="FX" color="#f97316" defaultOpen={false}>
              <Knob label="BitCrush" value={inst.bitCrush} min={1} max={16} step={1} decimals={0} unit="b" onChange={knobHandlers.bitCrush} color="#f97316" defaultValue={defaultInst?.bitCrush} />
              <Knob label="Distort" value={inst.distortion} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.distortion} color="#f97316" defaultValue={defaultInst?.distortion} />
              <Knob label="Volume" value={inst.volume} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.volume} color="#f97316" defaultValue={defaultInst?.volume} />
              <Knob label="Pan" value={inst.pan} min={-1} max={1} step={0.01} decimals={2} onChange={knobHandlers.pan} color="#f97316" defaultValue={defaultInst?.pan} />
            </Section>

            {/* ── Reverb / Delay ── */}
            <Section title="Space" color="#a78bfa" defaultOpen={false}>
              <Knob label="Reverb" value={inst.reverbMix} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.reverbMix} color="#a78bfa" defaultValue={defaultInst?.reverbMix} />
              <Knob label="Delay" value={inst.delayMix} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.delayMix} color="#a78bfa" defaultValue={defaultInst?.delayMix} />
              <Knob label="Dly Time" value={inst.delayTime} min={0.01} max={1} step={0.01} decimals={2} unit="s" onChange={knobHandlers.delayTime} color="#a78bfa" defaultValue={defaultInst?.delayTime} />
              <Knob label="Dly Fbk" value={inst.delayFeedback} min={0} max={0.92} step={0.01} decimals={2} onChange={knobHandlers.delayFeedback} color="#a78bfa" defaultValue={defaultInst?.delayFeedback} />
            </Section>

            {/* ── Arpeggio ── */}
            <Section title="Arpeggio" color="#eab308" defaultOpen={false}>
              <div className="w-full space-y-2">
                <p className="text-[8px] uppercase tracking-widest text-gray-500">Semitone offsets (e.g. 0,4,7,12)</p>
                <input
                  type="text"
                  value={inst.arpNotes.join(',')}
                  onChange={e => {
                    const vals = e.target.value
                      .split(',')
                      .map(s => parseInt(s.trim(), 10))
                      .filter(n => !isNaN(n));
                    upd('arpNotes', vals);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs font-mono outline-none focus:border-yellow-500"
                  placeholder="0,4,7,12"
                />
                {/* Quick chord presets */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Off', v: [] },
                    { label: 'Oct', v: [0, 12] },
                    { label: 'Maj', v: [0, 4, 7] },
                    { label: 'Min', v: [0, 3, 7] },
                    { label: 'Dom7', v: [0, 4, 7, 10] },
                    { label: 'Dim', v: [0, 3, 6] },
                    { label: 'Sus4', v: [0, 5, 7] },
                  ].map(({ label, v }) => (
                    <button
                      key={label}
                      onClick={() => upd('arpNotes', v)}
                      className="px-2 py-0.5 text-[9px] font-bold rounded bg-gray-800 text-yellow-400 hover:bg-yellow-900 transition-all"
                    >{label}</button>
                  ))}
                </div>
              </div>
              <Knob label="Arp Spd" value={inst.arpSpeed} min={0} max={0.5} step={0.005} decimals={3} unit="s" onChange={knobHandlers.arpSpeed} color="#eab308" defaultValue={defaultInst?.arpSpeed} />
            </Section>

            {/* ── Vibrato / Tremolo ── */}
            <Section title="Modulation" color="#f472b6" defaultOpen={false}>
              <Knob label="Vib Rate" value={inst.vibratoRate} min={0} max={20} step={0.1} decimals={1} unit="Hz" onChange={knobHandlers.vibratoRate} color="#f472b6" defaultValue={defaultInst?.vibratoRate} />
              <Knob label="Vib Depth" value={inst.vibratoDepth} min={0} max={3} step={0.01} decimals={2} unit="st" onChange={knobHandlers.vibratoDepth} color="#f472b6" defaultValue={defaultInst?.vibratoDepth} />
              <Knob label="Trem Rate" value={inst.tremoloRate} min={0} max={20} step={0.1} decimals={1} unit="Hz" onChange={knobHandlers.tremoloRate} color="#f472b6" defaultValue={defaultInst?.tremoloRate} />
              <Knob label="Trem Dep" value={inst.tremoloDepth} min={0} max={1} step={0.01} decimals={2} onChange={knobHandlers.tremoloDepth} color="#f472b6" defaultValue={defaultInst?.tremoloDepth} />
            </Section>

            {/* Preview button */}
            <button
              onClick={() => previewInstrument(inst.id)}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 hover:brightness-110 tracking-widest"
              style={{ backgroundColor: inst.color, color: '#000' }}
            >▶ PREVIEW</button>
          </div>
        )}
      </div>
    </div>
  );
}
