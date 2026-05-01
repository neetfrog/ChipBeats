import { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import Transport from './components/Transport';
import StepGrid from './components/StepGrid';
import Keyboard from './components/Keyboard';
import { useSequencerStore } from './store/sequencerStore';
import { getTheme } from './theme';

// Lazy load heavy components
const Visualizer = lazy(() => import('./components/Visualizer'));
const InstrumentEditor = lazy(() => import('./components/InstrumentEditor'));

function LoadingPlaceholder() {
  return <div className="flex items-center justify-center py-4 text-gray-600 text-sm">Loading...</div>;
}

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const showEditor = useSequencerStore(s => s.showEditor);
  const isPlaying = useSequencerStore(s => s.isPlaying);
  const editingInstrumentId = useSequencerStore(s => s.editingInstrumentId);
  const setShowEditor = useSequencerStore(s => s.setShowEditor);
  const setActiveEditorTab = useSequencerStore(s => s.setActiveEditorTab);
  const setEditingInstrument = useSequencerStore(s => s.setEditingInstrument);
  const visualizerVisible = useSequencerStore(s => s.visualizerVisible);
  const themeMode = useSequencerStore(s => s.themeMode);

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  // Apply CSS vars for theme
  useEffect(() => {
    document.documentElement.style.setProperty('--cb-bg', theme.colors.bg);
    document.documentElement.style.setProperty('--cb-bg-secondary', theme.colors.bgSecondary);
    document.documentElement.style.setProperty('--cb-border', theme.colors.border);
    document.documentElement.style.setProperty('--cb-text', theme.colors.text);
    document.documentElement.style.setProperty('--cb-text-secondary', theme.colors.textSecondary);
    document.documentElement.style.setProperty('--cb-accent', theme.colors.accent);
  }, [theme]);

  // Auto-open editor when instrument is selected
  useEffect(() => {
    if (editingInstrumentId) {
      setShowEditor(true);
      setActiveEditorTab('edit');
    }
  }, [editingInstrumentId]);

  return (
    <div
      className="min-h-screen select-none overflow-x-hidden"
      style={{
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        backgroundColor: theme.colors.bg,
        color: theme.colors.text,
      }}
    >
      {/* CRT Scanlines - lightweight */}
      {theme.scanlines && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            opacity: 0.018,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.7) 0px, rgba(0,0,0,0.9) 1px, transparent 1px, transparent 3px)',
            willChange: 'auto',
          }}
        />
      )}

      {/* Ambient glow background - simplified */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full ${
            isPlaying ? 'opacity-25' : 'opacity-8'
          }`}
          style={{
            background: 'radial-gradient(ellipse, #6d28d9 0%, #0e7490 50%, transparent 70%)',
            filter: 'blur(130px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[200px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(ellipse, #ec4899 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Sticky Transport ── */}
        <div
          className="sticky top-0 z-30 shadow-2xl"
          style={{
            backgroundColor: theme.colors.bgSecondary + 'f8',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="max-w-5xl mx-auto px-2 py-1.5">
            <Transport />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-2 py-2 space-y-2.5 pb-8">

          {/* ── Visualizer ── */}
          {visualizerVisible && (
            <div
              className="rounded-2xl overflow-hidden border border-gray-800/60"
              style={{ background: 'rgba(9,14,26,0.9)' }}
            >
              <Suspense fallback={<LoadingPlaceholder />}>
                <Visualizer />
              </Suspense>
            </div>
          )}

          {/* ── Sequencer + optional editor in a responsive layout ── */}
          <div className={`flex flex-col ${showEditor ? 'lg:flex-row lg:items-start' : ''} gap-3`}>

            {/* ── Sequencer + Keyboard wrapper ── */}
            <div className={`flex flex-col gap-3 ${showEditor ? 'lg:flex-1 min-w-0' : 'w-full'}`}>
              {/* ── Step Grid ── */}
              <div
                className="rounded-2xl border border-gray-800/80 shadow-xl w-full"
                style={{ background: 'rgba(10,14,25,0.95)' }}
              >
                {/* Grid header */}
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800/60">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full transition-colors ${isPlaying ? 'bg-green-400' : 'bg-gray-700'}`}
                      style={isPlaying ? { boxShadow: '0 0 8px #4ade80' } : undefined}
                    />
                    <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      Sequencer
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Add track shortcut */}
                    <button
                      onClick={() => { setShowEditor(true); setActiveEditorTab('add'); }}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-gray-800 text-gray-400 hover:text-green-400 hover:bg-gray-700 transition-all"
                    >+ TRACK</button>
                  </div>
                </div>

                <div className="px-2 py-2 overflow-x-auto">
                  <div className="min-w-0">
                    <StepGrid />
                  </div>
                </div>
              </div>

              {/* ── Live Keyboard ── */}
              <Keyboard />
            </div>

            {/* ── Instrument Editor panel ── */}
            {showEditor && (
              <div className="lg:w-80 xl:w-96 shrink-0 animate-slide-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] uppercase tracking-widest text-gray-600">Instrument Editor</span>
                  <button
                    onClick={() => { setShowEditor(false); setEditingInstrument(null); }}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >✕</button>
                </div>
                <Suspense fallback={<LoadingPlaceholder />}>
                  <InstrumentEditor />
                </Suspense>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="space-y-2 text-center">
            <button
              onClick={() => setShowModal(true)}
              className="text-[10px] font-semibold uppercase tracking-wider text-green-300 hover:text-green-100"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
            >
              About
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-slate-900 p-4 text-sm text-gray-100">
                <div className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black tracking-tight text-green-400" style={{ textShadow: '0 0 8px #4ade80aa' }}>
                      CHIP
                    </span>
                    <span className="text-xl font-black tracking-tight text-purple-400" style={{ textShadow: '0 0 10px #a78bfaaa' }}>
                      BEAT
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold uppercase tracking-wider">Quickstart</h2>
                    <button onClick={() => setShowModal(false)} className="text-sm font-bold text-gray-300 hover:text-white">✕</button>
                  </div>
                </div>
                <p className="pb-2 text-[11px] text-gray-300">A quick intro to get started with the drum machine. Visit <a href="https://nefas.tv" target="_blank" rel="noreferrer" className="text-green-300 hover:text-green-400">nefas.tv</a> for more info.</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-200">
                  <li>Press Play in the transport bar to start playback.</li>
                  <li>Click + TRACK to add an instrument track.</li>
                  <li>Toggle grid cells to program your pattern.</li>
                  <li>Use the keyboard at the bottom for live input.</li>
                  <li>Open Instrument Editor for sound shaping.</li>
                </ol>
                <div className="mt-3 text-right">
                  <button onClick={() => setShowModal(false)} className="rounded-md bg-gray-700 px-2 py-1 text-[10px] font-bold text-gray-100 hover:bg-gray-600">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
