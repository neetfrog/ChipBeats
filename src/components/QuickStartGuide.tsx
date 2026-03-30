import { useState } from 'react';

export default function QuickStartGuide() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-gray-700/80 bg-gray-900/70 p-3 text-xs text-gray-100">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold uppercase tracking-wider text-green-300">About / Quickstart</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-300 hover:text-white text-xs px-2 py-0.5 rounded bg-gray-800/60"
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 leading-tight text-gray-200">
          <p>Welcome to ChipBeat! A lightweight web-based drum machine and synth sequencer.</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
            <li>Press <strong>Play</strong> in the transport bar to start playback.</li>
            <li>Click <strong>+ TRACK</strong> to add a new instrument (kick, snare, hi-hat, synth).</li>
            <li>Toggle cells in the grid to program a sequence pattern.</li>
            <li>Use the keyboard at the bottom for live note input.</li>
            <li>Open the <strong>Instrument Editor</strong> to tweak sound parameters and effects.</li>
            <li>Adjust tempo, swing, and volume in transport for real-time changes.</li>
          </ol>
          <p className="text-gray-400">Tip: Save your pattern externally if you refresh the page.</p>
        </div>
      )}
    </div>
  );
}
