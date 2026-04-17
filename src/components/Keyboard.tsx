import { useEffect, useState, useRef } from 'react';
import { playInstrument } from '../audio/synth';
import { useSequencerStore } from '../store/sequencerStore';
import { cn } from '../utils/cn';

// Map computer keyboard keys to semitone offsets from the base frequency
const KEY_MAP: Record<string, number> = {
  // Lower octave white keys
  'z': 0,   'KeyZ': 0,
  'x': 2,   'KeyX': 2,
  'c': 4,   'KeyC': 4,
  'v': 5,   'KeyV': 5,
  'b': 7,   'KeyB': 7,
  'n': 9,   'KeyN': 9,
  'm': 11,  'KeyM': 11,
  // Middle octave white keys
  'a': 12,  'KeyA': 12,
  's': 14,  'KeyS': 14,
  'd': 16,  'KeyD': 16,
  'f': 17,  'KeyF': 17,
  'g': 19,  'KeyG': 19,
  'h': 21,  'KeyH': 21,
  'j': 23,  'KeyJ': 23,
  // Upper octave white keys
  'q': 24,  'KeyQ': 24,
  'w': 26,  'KeyW': 26,
  'e': 28,  'KeyE': 28,
  'r': 29,  'KeyR': 29,
  't': 31,  'KeyT': 31,
  'y': 33,  'KeyY': 33,
  'u': 35,  'KeyU': 35,
};

const PIANO_WHITE_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'q', 'w', 'e', 'r', 't', 'y', 'u'];

const WHITE_KEY_WIDTH = 34;
const WHITE_KEY_GAP = 4;

const NOTE_NAMES_12 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteNameFromOffset(offset: number): string {
  const normalized = ((offset % 12) + 12) % 12;
  const octave = Math.floor(offset / 12);
  const noteName = NOTE_NAMES_12[normalized] ?? '?';
  return `${noteName}${octave}`;
}

interface ActiveNote {
  key: string;
  note: number;
}

export default function Keyboard() {
  const instruments = useSequencerStore(s => s.instruments);
  const keyboardEnabled = useSequencerStore(s => s.keyboardEnabled);
  const keyboardInstrumentId = useSequencerStore(s => s.keyboardInstrumentId);
  const setKeyboardEnabled = useSequencerStore(s => s.setKeyboardEnabled);
  const setKeyboardInstrument = useSequencerStore(s => s.setKeyboardInstrument);
  const [activeNotes, setActiveNotes] = useState<Map<string, ActiveNote>>(new Map());
  const activeNotesRef = useRef(activeNotes);
  const [pianoView, setPianoView] = useState(false);

  // Get the selected keyboard instrument, or pick any available one
  const synthInstrument = keyboardInstrumentId
    ? instruments.find(i => i.id === keyboardInstrumentId)
    : instruments.find(i => ['lead', 'bass', 'chord', 'blip'].includes(i.type)) || instruments[0];

  // Auto-set the keyboard instrument on first load
  useEffect(() => {
    if (!keyboardInstrumentId && synthInstrument) {
      setKeyboardInstrument(synthInstrument.id);
    }
  }, []);

  if (!synthInstrument) return null;

  useEffect(() => {
    activeNotesRef.current = activeNotes;
  }, [activeNotes]);

  const playKey = (key: string, noteOffset: number) => {
    const instrument = synthInstrument;
    if (!instrument) return;
    const newNote: ActiveNote = { key, note: noteOffset };
    setActiveNotes(map => new Map(map).set(key, newNote));
    playInstrument(instrument, 1, false, 0, noteOffset);
    setTimeout(() => {
      setActiveNotes(map => {
        const n = new Map(map);
        n.delete(key);
        return n;
      });
    }, 220);
  };

  useEffect(() => {
    if (!keyboardEnabled || !synthInstrument) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const rawKey = e.code || (e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if (!KEY_MAP.hasOwnProperty(rawKey)) return;
      const noteOffset = KEY_MAP[rawKey];
      const key = rawKey.startsWith('Key') ? rawKey.toLowerCase().slice(3) : rawKey.toLowerCase();
      if (activeNotesRef.current.has(key)) return; // Already playing

      const instrument = synthInstrument;
      if (!instrument) return;
      e.preventDefault();

      const newNote: ActiveNote = { key, note: noteOffset };
      setActiveNotes(map => new Map(map).set(key, newNote));
      playInstrument(instrument, 1, false, 0, noteOffset);
    }

    function handleKeyUp(e: KeyboardEvent) {
      const rawKey = e.code || (e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if (!KEY_MAP.hasOwnProperty(rawKey)) return;
      const key = rawKey.startsWith('Key') ? rawKey.toLowerCase().slice(3) : rawKey.toLowerCase();

      e.preventDefault();
      setActiveNotes(map => {
        const newMap = new Map(map);
        newMap.delete(key);
        return newMap;
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardEnabled, synthInstrument]);

  if (!keyboardEnabled) {
    return (
      <div className="flex items-center justify-center py-2 text-gray-600 text-xs">
        <button
          onClick={() => setKeyboardEnabled(true)}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition-colors text-[10px] font-bold"
        >
          ENABLE KEYBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-gray-800/80 shadow-xl" style={{ background: 'rgba(10,14,25,0.95)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 8px #a78bfa' }} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Live Keyboard
          </h2>
          <button
            type="button"
            onClick={() => setPianoView(value => !value)}
            className={cn(
              'px-2 py-1 rounded text-[9px] font-bold transition-colors',
              pianoView ? 'bg-white text-slate-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            {pianoView ? 'Keyboard View' : 'Piano View'}
          </button>
          {/* Instrument selector */}
          <select
            value={synthInstrument?.id || ''}
            onChange={(e) => setKeyboardInstrument(e.target.value)}
            className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-300 text-[9px] font-bold hover:bg-gray-600 transition-colors cursor-pointer"
          >
            {instruments.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setKeyboardEnabled(false)}
          className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-all"
        >
          CLOSE
        </button>
      </div>

      {/* Keys */}
      <div className="px-3 py-3 space-y-2">
        {pianoView ? (
          <div className="flex justify-center overflow-x-auto pb-1">
            <div className="relative bg-[#091321] rounded-xl p-3" style={{ width: `${PIANO_WHITE_KEYS.length * (WHITE_KEY_WIDTH + WHITE_KEY_GAP) - WHITE_KEY_GAP}px`, maxWidth: '100%', height: '128px' }}>
              {PIANO_WHITE_KEYS.map((lowerKey, idx) => {
                const isActive = activeNotes.has(lowerKey);
                const noteOffset = KEY_MAP[lowerKey];
                const noteName = getNoteNameFromOffset(noteOffset);
                return (
                  <button
                    key={lowerKey}
                    type="button"
                    onClick={() => playKey(lowerKey, noteOffset)}
                    className={cn(
                      'absolute bottom-0 flex flex-col items-center justify-end rounded-b-xl border border-slate-300 bg-white text-slate-900 transition-all',
                      isActive
                        ? 'bg-slate-800 text-white border-slate-600 shadow-[0_0_0_4px_rgba(15,23,42,0.3)]'
                        : 'hover:bg-slate-100'
                    )}
                    style={{
                      width: WHITE_KEY_WIDTH,
                      left: idx * (WHITE_KEY_WIDTH + WHITE_KEY_GAP),
                      height: 108,
                    }}
                  >
                    <div className="text-[8px] font-semibold uppercase tracking-[0.16em] mb-1 text-slate-500">{lowerKey.toUpperCase()}</div>
                    <div className="text-[10px] font-bold pb-2">{noteName}</div>
                  </button>
                );
              })}

            </div>
          </div>
        ) : (
          <>
            {/* Top row: Q-U */}
            <div className="flex gap-1.5 justify-center">
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U'].map((displayKey) => {
                const lowerKey = displayKey.toLowerCase();
                const noteOffset = KEY_MAP[lowerKey];
                const isActive = activeNotes.has(lowerKey);
                return (
                  <KeyButton
                    key={lowerKey}
                    displayKey={displayKey}
                    noteOffset={noteOffset}
                    isActive={isActive}
                    onClick={() => playKey(lowerKey, noteOffset)}
                  />
                );
              })}
            </div>

            {/* Middle row: A-J */}
            <div className="flex gap-1.5 justify-center">
              {['A', 'S', 'D', 'F', 'G', 'H', 'J'].map((displayKey) => {
                const lowerKey = displayKey.toLowerCase();
                const noteOffset = KEY_MAP[lowerKey];
                const isActive = activeNotes.has(lowerKey);
                return (
                  <KeyButton
                    key={lowerKey}
                    displayKey={displayKey}
                    noteOffset={noteOffset}
                    isActive={isActive}
                    onClick={() => playKey(lowerKey, noteOffset)}
                  />
                );
              })}
            </div>

            {/* Lower row: Z-M */}
            <div className="flex gap-1.5 justify-center">
              {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((displayKey) => {
                const lowerKey = displayKey.toLowerCase();
                const noteOffset = KEY_MAP[lowerKey];
                const isActive = activeNotes.has(lowerKey);
                return (
                  <KeyButton
                    key={lowerKey}
                    displayKey={displayKey}
                    noteOffset={noteOffset}
                    isActive={isActive}
                    onClick={() => playKey(lowerKey, noteOffset)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Info */}
      <div className="px-3 pb-2 text-[8px] text-gray-700 text-center">
        Use Z/X/C/V/B/N/M for lower white keys and Q/W/E/R/T/Y/U for upper white keys.
      </div>
    </div>
  );
}

function KeyButton({ displayKey, noteOffset, isActive, onClick }: { displayKey: string; noteOffset: number; isActive: boolean; onClick?: () => void }) {
  const noteName = getNoteNameFromOffset(noteOffset);
  
  return (
    <button
      className={cn(
        'w-9 h-14 rounded-lg border transition-all flex flex-col items-center justify-center',
        isActive
          ? 'bg-indigo-500 border-indigo-300 shadow-lg shadow-indigo-500/30 text-white cursor-pointer ring-2 ring-indigo-400/40'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 cursor-pointer'
      )}
      onClick={onClick}
      title={`${displayKey} = ${noteName} (click to play)`}
      type="button"
    >
      <div className="text-[10px] font-bold leading-none">{displayKey}</div>
      <div className="text-[7px] text-gray-500 leading-none mt-0.5">{noteName}</div>
    </button>
  );
}
