import { useState, useEffect, useRef } from 'react';
import { useSequencerStore } from '../store/sequencerStore';
import { downloadProject, loadProjectFile } from '../utils/projectExport';

const BPM_MIN = 40;
const BPM_MAX = 300;

export default function Transport() {
  const {
    bpm, isPlaying, masterVolume, masterCompressor, themeMode,
    previewOnStepToggle, setPreviewOnStepToggle, visualizerVisible, setVisualizerVisible,
    play, pause, stop, setBpm, tapTempo, setMasterVolume, toggleCompressor,
    patterns, currentPatternId, setCurrentPattern,
    addPattern, duplicatePattern, deletePattern, renamePattern,
    setStepCount, setSwing, setThemeMode,
    undo, redo, past, future,
    resetAll, saveToStorage,
    showEditor, setShowEditor,
    instruments, setEditingInstrument, setActiveEditorTab,
    importProject, getProjectExportData,
  } = useSequencerStore();

  const currentPattern = patterns.find(p => p.id === currentPatternId)!;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const bpmInputRef = useRef<HTMLInputElement>(null);

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameVal(name);
  };
  const commitRename = () => {
    if (renamingId) renamePattern(renamingId, renameVal.trim() || 'Pattern');
    setRenamingId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? pause() : play();
      }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
      if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveToStorage(); }
      if (e.code === 'ArrowUp') { e.preventDefault(); setBpm(Math.min(BPM_MAX, bpm + 1)); }
      if (e.code === 'ArrowDown') { e.preventDefault(); setBpm(Math.max(BPM_MIN, bpm - 1)); }
      if (e.code === 'KeyT') tapTempo();
      
      // Track selection shortcuts (1-9)
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const trackIdx = parseInt(e.code[5]) - 1;
        if (trackIdx < currentPattern.tracks.length) {
          const track = currentPattern.tracks[trackIdx];
          const inst = instruments.find(i => i.id === track.instrumentId);
          if (inst) {
            e.preventDefault();
            setEditingInstrument(inst.id);
            setShowEditor(true);
            setActiveEditorTab('edit');
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, bpm, play, pause, stop, setBpm, tapTempo, undo, redo, saveToStorage, currentPattern.tracks, instruments, setEditingInstrument, setShowEditor, setActiveEditorTab]);

  // BPM scroll wheel
  const handleBpmWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, bpm + (e.deltaY < 0 ? 1 : -1))));
  };

  return (
    <div className="flex flex-col gap-1.5">

      {/* ── Row 1: Logo + Transport + BPM + Volume ── */}
      <div className="flex items-center gap-1 flex-wrap">

        {/* Logo */}
        <div className="flex items-baseline gap-1 mr-1">
          <span className="text-lg font-black tracking-tight text-green-400" style={{ textShadow: '0 0 10px #4ade80aa' }}>
            CHIP
          </span>
          <span className="text-xl font-black tracking-tight text-purple-400" style={{ textShadow: '0 0 12px #a78bfaaa' }}>
            BEAT
          </span>
        </div>

        {/* Play / Pause */}
        <div className="flex gap-1.5">
          <button
            onClick={isPlaying ? pause : play}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-widest transition-all active:scale-95 ${
              isPlaying
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                : 'bg-green-500 text-black shadow-lg shadow-green-400/30 hover:bg-green-400'
            }`}
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
        </div>

        {/* BPM */}
        <div
          className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2 py-1 cursor-ns-resize"
          onWheel={handleBpmWheel}
        >
          <button
            onClick={() => setBpm(Math.max(BPM_MIN, bpm - 1))}
            className="text-gray-500 hover:text-white font-bold text-sm w-4 text-center leading-none"
          >−</button>
          <div className="text-center min-w-[52px]">
            <input
              ref={bpmInputRef}
              type="number"
              min={BPM_MIN} max={BPM_MAX}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full bg-transparent text-green-400 font-mono font-bold text-lg leading-none text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <button
            onClick={() => setBpm(Math.min(BPM_MAX, bpm + 1))}
            className="text-gray-500 hover:text-white font-bold text-sm w-4 text-center leading-none"
          >+</button>
        </div>

        {/* Tap tempo */}
        <button
          onClick={tapTempo}
          className="px-2 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-green-400 hover:bg-gray-700 font-bold text-[9px] tracking-widest transition-all active:scale-90 active:bg-gray-600"
          title="Tap Tempo (T)"
        >TAP</button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2 py-1">
          <span className="text-gray-400 text-[8px] uppercase tracking-widest">VOL</span>
          <input
            type="range" min={0} max={1} step={0.01} value={masterVolume}
            onChange={e => setMasterVolume(Number(e.target.value))}
            className="w-16 sm:w-20 accent-purple-500"
          />
          <span className="text-purple-400 text-[9px] font-mono w-7">{Math.round(masterVolume * 100)}%</span>
        </div>

        {/* Undo / Redo */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gray-800 text-gray-400 hover:text-white disabled:opacity-25 transition-all active:scale-90"
            title="Undo (Ctrl+Z)"
          >↩</button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="px-2.5 py-2 rounded-lg text-[10px] font-bold bg-gray-800 text-gray-400 hover:text-white disabled:opacity-25 transition-all active:scale-90"
            title="Redo (Ctrl+Shift+Z)"
          >↪</button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
              showSettings ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Settings"
          >⚙</button>
        </div>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="flex flex-wrap gap-1 items-center py-1.5 px-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <span className="text-[8px] uppercase tracking-widest text-gray-500">Settings</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={masterCompressor}
              onChange={toggleCompressor}
              className="accent-green-400"
            />
            <span className="text-[10px] text-gray-300">Compressor</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={previewOnStepToggle}
              onChange={e => setPreviewOnStepToggle(e.target.checked)}
              className="accent-blue-400"
            />
            <span className="text-[10px] text-gray-300">Preview on step toggle</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={visualizerVisible}
              onChange={e => setVisualizerVisible(e.target.checked)}
              className="accent-indigo-400"
            />
            <span className="text-[10px] text-gray-300">Show visualizer</span>
          </label>
          
          {/* Theme selector */}
          <select
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value as any)}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-600 outline-none cursor-pointer"
            title="Color Theme"
          >
            <option value="retro">🎮 Retro</option>
            <option value="dark">🌙 Dark</option>
            <option value="high-contrast">⚡ HC</option>
          </select>

          <button
            onClick={() => downloadProject(getProjectExportData())}
            className="px-3 py-1 rounded-lg text-[9px] font-bold bg-gray-700 text-blue-400 hover:bg-gray-600 transition-all"
            title="Download project as JSON"
          >⬇ Export</button>
          <button
            onClick={async () => {
              try {
                const project = await loadProjectFile();
                if (window.confirm(`Load "${project.name}"? This will replace your current project.`)) {
                  importProject(project);
                }
              } catch (e) {
                window.alert(`Failed to import: ${e instanceof Error ? e.message : 'Unknown error'}`);
              }
            }}
            className="px-3 py-1 rounded-lg text-[9px] font-bold bg-gray-700 text-blue-400 hover:bg-gray-600 transition-all"
            title="Load project from JSON file"
          >⬆ Import</button>
          
          <button
            onClick={() => { saveToStorage(); }}
            className="px-3 py-1 rounded-lg text-[9px] font-bold bg-gray-700 text-green-400 hover:bg-gray-600 transition-all"
          >💾 Save</button>
          <button
            onClick={() => {
              if (window.confirm('Reset everything? This cannot be undone.')) resetAll();
            }}
            className="px-3 py-1 rounded-lg text-[9px] font-bold bg-gray-700 text-red-400 hover:bg-red-900 transition-all"
          >🗑 Reset All</button>
          <div className="text-[8px] text-gray-600 tracking-widest">
            Space=play · T=tap · ↑↓=BPM · Ctrl+Z=undo · 1-9=track
          </div>
        </div>
      )}

      {/* ── Row 2: Patterns + Steps + Swing ── */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-gray-500 text-[8px] uppercase tracking-widest">PAT:</span>

        {/* Pattern buttons */}
        <div className="flex gap-1 flex-wrap flex-1 min-w-0">
          {patterns.map(p => (
            <div key={p.id} className="relative group">
              {renamingId === p.id ? (
                <input
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-24 px-2 py-1 rounded-lg bg-gray-800 text-white text-[10px] border border-purple-500 outline-none"
                />
              ) : (
                <button
                  onClick={() => setCurrentPattern(p.id)}
                  onDoubleClick={() => startRename(p.id, p.name)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-wide transition-all active:scale-95 ${
                    p.id === currentPatternId
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >{p.name}</button>
              )}
              {/* Context actions on hover */}
              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                <button
                  onClick={() => duplicatePattern(p.id)}
                  className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-[8px] leading-none hover:bg-blue-500"
                  title="Duplicate"
                >⧉</button>
                {patterns.length > 1 && (
                  <button
                    onClick={() => deletePattern(p.id)}
                    className="w-4 h-4 flex items-center justify-center bg-red-600 rounded-full text-white text-[9px] leading-none hover:bg-red-500"
                    title="Delete"
                  >×</button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addPattern}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-green-400 transition-all"
          >+ PAT</button>
        </div>

        {/* Step count */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-[8px] uppercase tracking-widest hidden sm:inline">Steps:</span>
          {[8, 16, 32].map(n => (
            <button
              key={n}
              onClick={() => setStepCount(n)}
              className={`w-7 py-1 rounded-lg text-[9px] font-bold transition-all active:scale-95 ${
                currentPattern?.stepCount === n
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'
              }`}
            >{n}</button>
          ))}
        </div>

        {/* Swing */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
          <span className="text-gray-400 text-[8px] uppercase tracking-widest">Swing</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={currentPattern?.swing ?? 0}
            onChange={e => setSwing(Number(e.target.value))}
            className="w-14 sm:w-20 accent-yellow-400"
          />
          <span className="text-yellow-400 text-[9px] font-mono w-8">
            {Math.round((currentPattern?.swing ?? 0) * 100)}%
          </span>
        </div>

        {/* Editor toggle removed from header (compact mode) */}
      </div>
    </div>
  );
}
