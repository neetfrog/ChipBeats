import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
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

// ── Memoized step cell to prevent re-render when siblings change ────────────
const StepButton = memo<{
  ti: number;
  si: number;
  isActive: boolean;
  velocity: number;
  accent: boolean;
  note: number;
  isCurrent: boolean;
  instColor: string;
  muted: boolean;
  onPointerDown: (e: React.PointerEvent, ti: number, si: number, isActive: boolean) => void;
  onPointerEnter: (e: React.PointerEvent, ti: number, si: number) => void;
  onPointerUp: (e: React.PointerEvent, ti: number, si: number) => void;
  onPointerCancel: () => void;
}>(({
  ti, si, isActive, velocity, accent, note, isCurrent, instColor, muted,
  onPointerDown, onPointerEnter, onPointerUp, onPointerCancel,
}) => {
  const velH = Math.round(velocity * 100);
  const isGroupStart = si % GROUP === 0 && si !== 0;

  return (
    <button
      onPointerDown={e => onPointerDown(e, ti, si, isActive)}
      onPointerEnter={e => onPointerEnter(e, ti, si)}
      onPointerUp={e => onPointerUp(e, ti, si)}
      onPointerCancel={onPointerCancel}
      className={`relative flex-1 h-8 sm:h-9 rounded-sm sm:rounded select-none touch-none ${
        isGroupStart ? 'ml-0.5 sm:ml-1' : ''
      } ${isCurrent && !isActive ? 'ring-1 ring-inset ring-white/30' : ''}`}
      style={{
        backgroundColor: isActive
          ? instColor
          : (Math.floor(si / GROUP) % 2 === 0 ? '#1e293b' : '#172033'),
        opacity: muted ? 0.3 : isActive ? Math.max(0.35, velocity) : 0.9,
        boxShadow: isCurrent && isActive
          ? `0 0 12px ${instColor}aa`
          : undefined,
        transform: isCurrent ? 'scaleY(1.08)' : undefined,
      }}
    >
      {isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b"
          style={{
            height: `${velH}%`,
            background: `linear-gradient(to top, ${instColor}cc, transparent)`,
            opacity: 0.4,
          }}
        />
      )}
      {accent && isActive && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/60 font-black pointer-events-none leading-none">★</span>
      )}
      {isActive && note !== 0 && (
        <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono font-bold text-black/50 leading-none pointer-events-none">
          {note > 0 ? `+${note}` : note}
        </span>
      )}
    </button>
  );
}, (prev, next) => (
  prev.isActive === next.isActive &&
  prev.velocity === next.velocity &&
  prev.accent === next.accent &&
  prev.note === next.note &&
  prev.isCurrent === next.isCurrent &&
  prev.muted === next.muted &&
  prev.instColor === next.instColor
));
StepButton.displayName = 'StepButton';

// ── Memoized step header indicator ──────────────────────────────────────────
const StepHeader = memo<{ stepCount: number; currentStep: number }>(
  ({ stepCount, currentStep }) => (
    <div className="flex items-center mb-0.5">
      <div className="w-24 sm:w-28 shrink-0" />
      <div className="flex gap-0.5 flex-1 min-w-0">
        {Array.from({ length: stepCount }, (_, si) => {
          const isBar = si % GROUP === 0;
          const isCurrent = si === currentStep;
          return (
            <div
              key={si}
              className={`flex-1 text-center text-[8px] sm:text-[9px] font-mono leading-none py-0.5 ${
                isBar ? 'ml-0.5 sm:ml-1' : ''
              } ${
                isCurrent ? 'text-white font-bold' : isBar ? 'text-gray-600' : 'text-gray-800'
              }`}
            >
              {isBar ? (si / GROUP + 1) : '·'}
            </div>
          );
        })}
      </div>
      <div className="w-8 sm:w-10 shrink-0" />
    </div>
  )
);
StepHeader.displayName = 'StepHeader';

export default function StepGrid() {
  // Split selectors to minimize re-renders
  const instruments = useSequencerStore(s => s.instruments);
  const patterns = useSequencerStore(s => s.patterns);
  const currentPatternId = useSequencerStore(s => s.currentPatternId);
  const currentStep = useSequencerStore(s => s.currentStep);
  const isPlaying = useSequencerStore(s => s.isPlaying);
  const editingInstrumentId = useSequencerStore(s => s.editingInstrumentId);
  const soloedTrackIndex = useSequencerStore(s => s.soloedTrackIndex);

  // Stable action references (these don't change)
  const toggleStep = useSequencerStore(s => s.toggleStep);
  const toggleStepAccent = useSequencerStore(s => s.toggleStepAccent);
  const setStepVelocity = useSequencerStore(s => s.setStepVelocity);
  const setStepNote = useSequencerStore(s => s.setStepNote);
  const clearTrack = useSequencerStore(s => s.clearTrack);
  const randomizeTrack = useSequencerStore(s => s.randomizeTrack);
  const fillTrack = useSequencerStore(s => s.fillTrack);
  const copyTrack = useSequencerStore(s => s.copyTrack);
  const pasteTrack = useSequencerStore(s => s.pasteTrack);
  const shiftTrackLeft = useSequencerStore(s => s.shiftTrackLeft);
  const shiftTrackRight = useSequencerStore(s => s.shiftTrackRight);
  const invertTrack = useSequencerStore(s => s.invertTrack);
  const moveTrackUp = useSequencerStore(s => s.moveTrackUp);
  const moveTrackDown = useSequencerStore(s => s.moveTrackDown);
  const setEditingInstrument = useSequencerStore(s => s.setEditingInstrument);
  const setShowEditor = useSequencerStore(s => s.setShowEditor);
  const setActiveEditorTab = useSequencerStore(s => s.setActiveEditorTab);
  const setSoloTrack = useSequencerStore(s => s.setSoloTrack);
  const updateInstrument = useSequencerStore(s => s.updateInstrument);
  const previewInstrument = useSequencerStore(s => s.previewInstrument);

  // Build instrument lookup map for O(1) access
  const instMap = useMemo(() => {
    const map = new Map<string, typeof instruments[0]>();
    for (const inst of instruments) map.set(inst.id, inst);
    return map;
  }, [instruments]);

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
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setPopup({ ti, si, x: rect.left, y: rect.top, mode: 'velocity' });
    }, 380);

    dragState.current = { painting: true, activating: !isActive };
  }, []);

  const handleStepPointerEnter = useCallback((
    _e: React.PointerEvent,
    ti: number,
    si: number,
  ) => {
    if (!dragState.current?.painting) return;
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    const s = useSequencerStore.getState();
    const pat = s.patterns.find(p => p.id === s.currentPatternId);
    const step = pat?.tracks[ti]?.steps[si];
    if (!step) return;
    if (step.active !== dragState.current.activating) {
      toggleStep(ti, si);
      if (dragState.current.activating && s.previewOnStepToggle) {
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
      toggleStep(ti, si);
      const s = useSequencerStore.getState();
      const pat = s.patterns.find(p => p.id === s.currentPatternId);
      const step = pat?.tracks[ti]?.steps[si];
      const inst = s.instruments.find(i => i.id === pat?.tracks[ti]?.instrumentId);
      if (inst && step && s.previewOnStepToggle) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        if (step.active) playInstrument(inst, step.velocity, step.accent, 0, step.note);
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
    <div className="flex flex-col gap-0.5 sm:gap-1">

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
      <StepHeader stepCount={pattern.stepCount} currentStep={currentStep} />

      {/* ── Tracks ── */}
      {pattern.tracks.map((track, ti) => {
        const inst = instMap.get(track.instrumentId);
        if (!inst) return null;
        const muted = inst.muted;
        const soloed = soloedTrackIndex === ti;
        const dimmed = soloedTrackIndex !== null && !soloed;
        const isEditing = editingInstrumentId === inst.id;

        return (
          <div
            key={track.instrumentId}
            className={`flex items-center gap-0.5 sm:gap-1 ${dimmed ? 'opacity-20' : ''}`}
          >
            {/* Instrument label */}
            <div className="w-24 sm:w-28 shrink-0 flex items-center gap-1">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => updateInstrument(inst.id, { muted: !muted })}
                className={`rounded-md px-1 py-1 text-[9px] leading-none transition-all ${muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-100 hover:bg-gray-600'}`}
                title={muted ? 'Unmute track' : 'Mute track'}
              >
                {muted ? '🔊' : '🔇'}
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setSoloTrack(soloed ? null : ti)}
                className={`rounded-md px-1 py-1 text-[9px] leading-none transition-all ${soloed ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-100 hover:bg-gray-600'}`}
                title={soloed ? 'Unsolo track' : 'Solo track'}
              >
                ⚡
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => openTrackEdit(inst.id)}
                className={`flex-1 h-8 flex items-center px-2 rounded-lg text-[10px] text-left transition-all active:scale-95 ${
                  isEditing ? 'ring-1 ring-white/40 brightness-125' : 'hover:brightness-125'
                } ${muted ? 'opacity-50' : ''}`}
                style={{ backgroundColor: inst.color + '22', borderLeft: `3px solid ${inst.color}` }}
              >
                <span className="truncate font-bold" style={{ color: inst.color }}>
                  {inst.name}
                </span>
              </button>
            </div>

            {/* Steps */}
            <div className="flex gap-0.5 flex-1 min-w-0">
              {track.steps.map((step, si) => (
                <StepButton
                  key={si}
                  ti={ti}
                  si={si}
                  isActive={step.active}
                  velocity={step.velocity}
                  accent={step.accent}
                  note={step.note}
                  isCurrent={si === currentStep}
                  instColor={inst.color}
                  muted={muted}
                  onPointerDown={handleStepPointerDown}
                  onPointerEnter={handleStepPointerEnter}
                  onPointerUp={handleStepPointerUp}
                  onPointerCancel={handleStepPointerCancel}
                />
              ))}
            </div>

            {/* Track menu button */}
            <div className="relative w-8 sm:w-10 shrink-0" onPointerDown={e => e.stopPropagation()}>
              <button
                onClick={e => { e.stopPropagation(); setShowTrackMenu(showTrackMenu === ti ? null : ti); }}
                className="w-8 sm:w-10 h-8 sm:h-9 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded transition-colors text-lg"
              >⋮</button>

              {showTrackMenu === ti && (
                <div
                  className="absolute right-0 top-10 z-50 rounded-xl shadow-2xl py-1 min-w-[164px]"
                  style={{ background: '#1a2035', border: `1px solid ${inst.color}44` }}
                  onPointerDown={e => e.stopPropagation()}
                  onPointerUp={e => e.stopPropagation()}
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
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
      onClick={onClick}
    >{children}</button>
  );
}
