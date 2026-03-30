import { useState, useRef, useCallback, useEffect } from 'react';
import { useSequencerStore } from '../store/sequencerStore';
import { playInstrument, getAudioContext } from '../audio/synth';

const GROUP = 4;

type EditMode = 'velocity' | 'note' | null;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function semitoneToName(n: number) {
  const octave = Math.floor((n + 60) / 12);
  const name = NOTE_NAMES[((n % 12) + 12) % 12];
  return `${name}${octave}`;
}

interface StepPopup {
  ti: number;
  si: number;
  x: number;
  y: number;
  mode: EditMode;
}

export default function StepGrid() {
  const {
    instruments, patterns, currentPatternId, currentStep, isPlaying,
    toggleStep, toggleStepAccent, setStepVelocity, setStepNote,
    clearTrack, randomizeTrack, fillTrack,
    copyTrack, pasteTrack, shiftTrackLeft, shiftTrackRight, invertTrack,
    moveTrackUp, moveTrackDown,
    setEditingInstrument, editingInstrumentId, setShowEditor, setActiveEditorTab,
    soloedTrackIndex, setSoloTrack,
    updateInstrument,
    previewInstrument,
  } = useSequencerStore();

  const pattern = patterns.find(p => p.id === currentPatternId)!;
  const [showTrackMenu, setShowTrackMenu] = useState<number | null>(null);
  const [popup, setPopup] = useState<StepPopup | null>(null);

  // Drag-paint state
  const dragState = useRef<{ painting: boolean; activating: boolean } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeAll = useCallback(() => {
    setShowTrackMenu(null);
    setPopup(null);
  }, []);

  // Global pointer-up to cancel drag
  useEffect(() => {
    const up = () => { dragState.current = null; };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const handleStepPointerDown = useCallback((
    e: React.PointerEvent,
    ti: number,
    si: number,
    isActive: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      // Long press = open popup
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setPopup({ ti, si, x: rect.left, y: rect.top, mode: 'velocity' });
    }, 380);

    // Start drag-paint
    dragState.current = { painting: true, activating: !isActive };
  }, []);

  const handleStepPointerEnter = useCallback((
    _e: React.PointerEvent,
    ti: number,
    si: number,
  ) => {
    if (!dragState.current?.painting) return;
    // cancel hold timer on drag
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    const s = useSequencerStore.getState();
    const pat = s.patterns.find(p => p.id === s.currentPatternId);
    const step = pat?.tracks[ti]?.steps[si];
    if (!step) return;
    if (step.active !== dragState.current.activating) {
      toggleStep(ti, si);
      // Preview sound when activating
      if (dragState.current.activating) {
        const inst = s.instruments.find(i => i.id === pat?.tracks[ti]?.instrumentId);
        if (inst) {
          const ctx = getAudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          playInstrument(inst, step.velocity, step.accent, 0, step.note);
        }
      }
    }
  }, [toggleStep]);

  const handleStepPointerUp = useCallback((
    _evt: React.PointerEvent,
    ti: number,
    si: number,
  ) => {
    dragState.current = null;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      // Short tap = toggle
      toggleStep(ti, si);
      // Preview
      const s = useSequencerStore.getState();
      const pat = s.patterns.find(p => p.id === s.currentPatternId);
      const step = pat?.tracks[ti]?.steps[si];
      const inst = s.instruments.find(i => i.id === pat?.tracks[ti]?.instrumentId);
      if (inst && step) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        if (!step.active) playInstrument(inst, step.velocity, step.accent, 0, step.note);
      }
    }
  }, [toggleStep]);

  const handleStepPointerCancel = useCallback(() => {
    dragState.current = null;
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }, []);

  const openTrackEdit = useCallback((instId: string) => {
    setEditingInstrument(instId);
    setShowEditor(true);
    setActiveEditorTab('edit');
    setShowTrackMenu(null);
  }, [setEditingInstrument, setShowEditor, setActiveEditorTab]);

  if (!pattern) return null;

  return (
    <div className="flex flex-col gap-0.5 sm:gap-1" onPointerDown={() => setShowTrackMenu(null)}>

      {/* ── Backdrop ── */}
      {(popup || showTrackMenu !== null) && (
        <div className="fixed inset-0 z-40" onPointerDown={closeAll} />
      )}

      {/* ── Step popup (velocity / note) ── */}
      {popup && (() => {
        const track = pattern.tracks[popup.ti];
        const step = track?.steps[popup.si];
        if (!step) return null;
        const inst = instruments.find(i => i.id === track.instrumentId);
        const winH = window.innerHeight;
        const winW = window.innerWidth;
        const popH = 180;
        const popW = 200;
        const top = Math.min(popup.y - 20, winH - popH - 20);
        const left = Math.min(Math.max(popup.x - 60, 8), winW - popW - 8);
        return (
          <div
            className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top, left, width: popW, border: `1px solid ${inst?.color}55`, background: '#1a2035' }}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Popup tabs */}
            <div className="flex border-b border-gray-800">
              {(['velocity', 'note'] as EditMode[]).map(m => (
                <button key={m}
                  onClick={() => setPopup(p => p ? { ...p, mode: m } : p)}
                  className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                    popup.mode === m ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >{m}</button>
              ))}
            </div>
            <div className="p-3 space-y-2">
              {popup.mode === 'velocity' && (
                <>
                  <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: inst?.color }}>Velocity</div>
                  {/* Visual velocity bar */}
                  <div className="relative h-6 bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const v = Math.max(0.05, Math.min(1, (e.clientX - rect.left) / rect.width));
                      setStepVelocity(popup.ti, popup.si, v);
                    }}
                  >
                    <div className="h-full rounded-lg transition-all" style={{ width: `${step.velocity * 100}%`, backgroundColor: inst?.color ?? '#8b5cf6' }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white font-bold">
                      {Math.round(step.velocity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range" min={0.05} max={1} step={0.01}
                    value={step.velocity}
                    onChange={e => setStepVelocity(popup.ti, popup.si, Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: inst?.color }}
                  />
                </>
              )}
              {popup.mode === 'note' && (
                <>
                  <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: inst?.color }}>Note offset</div>
                  <div className="text-center font-mono text-white text-lg font-bold">{semitoneToName(step.note)}</div>
                  <input
                    type="range" min={-24} max={24} step={1}
                    value={step.note}
                    onChange={e => setStepNote(popup.ti, popup.si, Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: inst?.color }}
                  />
                  <div className="text-center text-[9px] text-gray-500">{step.note >= 0 ? '+' : ''}{step.note} semitones</div>
                </>
              )}
              <button
                onClick={() => { toggleStepAccent(popup.ti, popup.si); }}
                className={`w-full py-1 rounded-lg text-[10px] font-bold transition-all ${
                  step.accent ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >{step.accent ? '★ ACCENTED' : '☆ ACCENT'}</button>
            </div>
          </div>
        );
      })()}

      {/* ── Step number header ── */}
      <div className="flex items-center mb-0.5">
        <div className="w-24 sm:w-28 shrink-0" />
        <div className="flex gap-0.5 flex-1 min-w-0">
          {Array.from({ length: pattern.stepCount }, (_, si) => {
            const isBar = si % GROUP === 0;
            const isCurrent = si === currentStep && isPlaying;
            return (
              <div
                key={si}
                className={`flex-1 text-center text-[8px] sm:text-[9px] font-mono leading-none py-0.5 transition-all ${
                  isBar ? 'ml-0.5 sm:ml-1' : ''
                } ${
                  isCurrent
                    ? 'text-white font-bold'
                    : isBar
                    ? 'text-gray-600'
                    : 'text-gray-800'
                }`}
              >
                {isBar ? (si / GROUP + 1) : '·'}
              </div>
            );
          })}
        </div>
        <div className="w-8 sm:w-10 shrink-0" />
      </div>

      {/* ── Tracks ── */}
      {pattern.tracks.map((track, ti) => {
        const inst = instruments.find(i => i.id === track.instrumentId);
        if (!inst) return null;
        const muted = inst.muted;
        const soloed = soloedTrackIndex === ti;
        const dimmed = soloedTrackIndex !== null && !soloed;
        const isEditing = editingInstrumentId === inst.id;

        return (
          <div
            key={track.instrumentId}
            className={`flex items-center gap-0.5 sm:gap-1 transition-opacity duration-200 ${dimmed ? 'opacity-20' : ''}`}
          >
            {/* Instrument label */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => openTrackEdit(inst.id)}
              className={`w-24 sm:w-28 shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-left transition-all active:scale-95 ${
                isEditing ? 'ring-1 ring-white/40 brightness-125' : 'hover:brightness-125'
              } ${muted ? 'opacity-40' : ''}`}
              style={{ backgroundColor: inst.color + '22', borderLeft: `3px solid ${inst.color}` }}
            >
              {muted && <span className="text-[9px]">🔇</span>}
              {soloed && <span className="text-[9px]">⚡</span>}
              <span className="text-[10px] sm:text-[11px] font-bold truncate leading-tight" style={{ color: inst.color }}>
                {inst.name}
              </span>
            </button>

            {/* Steps */}
            <div className="flex gap-0.5 flex-1 min-w-0">
              {track.steps.map((step, si) => {
                const isActive = step.active;
                const isCurrent = si === currentStep && isPlaying;
                const isGroupStart = si % GROUP === 0 && si !== 0;
                const velH = Math.round(step.velocity * 100);

                return (
                  <button
                    key={si}
                    onPointerDown={e => handleStepPointerDown(e, ti, si, isActive)}
                    onPointerEnter={e => handleStepPointerEnter(e, ti, si)}
                    onPointerUp={e => handleStepPointerUp(e, ti, si)}
                    onPointerCancel={handleStepPointerCancel}
                    className={`relative flex-1 h-8 sm:h-9 rounded-sm sm:rounded transition-all select-none touch-none ${
                      isGroupStart ? 'ml-0.5 sm:ml-1' : ''
                    } ${isCurrent && !isActive ? 'ring-1 ring-inset ring-white/30' : ''}`}
                    style={{
                      backgroundColor: isActive
                        ? inst.color
                        : (Math.floor(si / GROUP) % 2 === 0 ? '#1e293b' : '#172033'),
                      opacity: muted ? 0.3 : isActive ? Math.max(0.35, step.velocity) : 0.9,
                      boxShadow: isCurrent && isActive
                        ? `0 0 16px ${inst.color}cc, 0 0 5px ${inst.color}`
                        : isActive
                        ? `0 0 5px ${inst.color}66`
                        : undefined,
                      transform: isCurrent ? 'scaleY(1.08)' : undefined,
                    }}
                  >
                    {/* Velocity bar at bottom */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-b"
                        style={{
                          height: `${velH}%`,
                          background: `linear-gradient(to top, ${inst.color}cc, transparent)`,
                          opacity: 0.4,
                        }}
                      />
                    )}
                    {/* Accent star */}
                    {step.accent && isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/60 font-black pointer-events-none leading-none">★</span>
                    )}
                    {/* Note indicator (if non-zero) */}
                    {isActive && step.note !== 0 && (
                      <span
                        className="absolute bottom-0.5 right-0.5 text-[6px] font-mono font-bold text-black/50 leading-none pointer-events-none"
                      >{step.note > 0 ? `+${step.note}` : step.note}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Track menu button */}
            <div className="relative w-8 sm:w-10 shrink-0 z-30" onPointerDown={e => e.stopPropagation()}>
              <button
                onClick={e => { e.stopPropagation(); setShowTrackMenu(showTrackMenu === ti ? null : ti); }}
                className="w-8 sm:w-10 h-8 sm:h-9 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded transition-colors text-lg"
              >⋮</button>

              {showTrackMenu === ti && (
                <div
                  className="absolute right-0 top-10 z-50 rounded-xl shadow-2xl py-1 min-w-[164px]"
                  style={{ background: '#1a2035', border: `1px solid ${inst.color}44` }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Track info */}
                  <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold" style={{ color: inst.color }}>
                    {inst.name}
                  </div>
                  <div className="h-px bg-gray-800 mx-2" />

                  {/* Mute / Solo */}
                  <MenuItem color={muted ? inst.color : undefined}
                    onClick={() => { updateInstrument(inst.id, { muted: !muted }); setShowTrackMenu(null); }}>
                    {muted ? '🔊 Unmute' : '🔇 Mute'}
                  </MenuItem>
                  <MenuItem color={soloed ? '#fbbf24' : undefined}
                    onClick={() => { setSoloTrack(soloed ? null : ti); setShowTrackMenu(null); }}>
                    {soloed ? '⚡ Unsolo' : '⚡ Solo'}
                  </MenuItem>
                  <MenuItem onClick={() => { previewInstrument(inst.id); }}>▶ Preview</MenuItem>

                  <div className="h-px bg-gray-800 mx-2 my-1" />

                  {/* Edit */}
                  <MenuItem onClick={() => openTrackEdit(inst.id)}>🎛 Edit Sound</MenuItem>

                  <div className="h-px bg-gray-800 mx-2 my-1" />

                  {/* Pattern tools */}
                  <MenuItem onClick={() => { fillTrack(ti); setShowTrackMenu(null); }}>⬛ Fill All</MenuItem>
                  <MenuItem onClick={() => { invertTrack(ti); setShowTrackMenu(null); }}>↔ Invert</MenuItem>
                  <MenuItem onClick={() => { randomizeTrack(ti, 0.25); setShowTrackMenu(null); }}>🎲 Random 25%</MenuItem>
                  <MenuItem onClick={() => { randomizeTrack(ti, 0.5); setShowTrackMenu(null); }}>🎲 Random 50%</MenuItem>
                  <MenuItem onClick={() => { shiftTrackLeft(ti); setShowTrackMenu(null); }}>← Shift Left</MenuItem>
                  <MenuItem onClick={() => { shiftTrackRight(ti); setShowTrackMenu(null); }}>→ Shift Right</MenuItem>
                  <MenuItem onClick={() => { copyTrack(ti); setShowTrackMenu(null); }}>📋 Copy</MenuItem>
                  <MenuItem onClick={() => { pasteTrack(ti); setShowTrackMenu(null); }}>📌 Paste</MenuItem>
                  <MenuItem onClick={() => { clearTrack(ti); setShowTrackMenu(null); }}>🗑 Clear</MenuItem>

                  <div className="h-px bg-gray-800 mx-2 my-1" />

                  {/* Reorder */}
                  <MenuItem onClick={() => { moveTrackUp(ti); setShowTrackMenu(null); }}>↑ Move Up</MenuItem>
                  <MenuItem onClick={() => { moveTrackDown(ti); setShowTrackMenu(null); }}>↓ Move Down</MenuItem>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Hint */}
      <p className="text-gray-800 text-[9px] text-center pt-1 tracking-wide select-none">
        Tap · Drag to paint · Long-press for velocity/note · ⋮ for track options
      </p>
    </div>
  );
}

function MenuItem({ children, onClick, color }: {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      className="w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors font-mono"
      style={color ? { color } : undefined}
      onClick={onClick}
    >{children}</button>
  );
}
