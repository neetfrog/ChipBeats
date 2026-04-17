import { useEffect, useState, useRef } from 'react';
import { playInstrument } from '../audio/synth';
import { useSequencerStore } from '../store/sequencerStore';
import { cn } from '../utils/cn';

// Map computer keyboard keys to semitone offsets from the base frequency
const KEY_MAP: Record<string, number> = {
  // Lower row (one octave lower): C D E F G A B
  'z': -12,   'KeyZ': -12,
  'x': -10,   'KeyX': -10,
  'c': -8,    'KeyC': -8,
  'v': -7,    'KeyV': -7,
  'b': -5,    'KeyB': -5,
  'n': -3,    'KeyN': -3,
  'm': -1,    'KeyM': -1,
  // Bottom row (C major): C D E F G A B
  'a': 0,     'KeyA': 0,
  's': 2,     'KeyS': 2,
  'd': 4,     'KeyD': 4,
  'f': 5,     'KeyF': 5,
  'g': 7,     'KeyG': 7,
  'h': 9,     'KeyH': 9,
  'j': 11,    'KeyJ': 11,
  // Top row (one octave higher): C D E F G A B
  'q': 12,    'KeyQ': 12,
  'w': 14,    'KeyW': 14,
  'e': 16,    'KeyE': 16,
  'r': 17,    'KeyR': 17,
  't': 19,    'KeyT': 19,
  'y': 21,    'KeyY': 21,
  'u': 23,    'KeyU': 23,
};

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function getNoteNameFromOffset(offset: number): string {
  const normalized = ((offset % 12) + 12) % 12;
  const octave = Math.floor(offset / 12);
  const noteIdx = [0, 2, 4, 5, 7, 9, 11].indexOf(normalized);
  return noteIdx >= 0 ? NOTE_NAMES[noteIdx] + octave : '?';
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
    if (!synthInstrument) return;
    const newNote: ActiveNote = { key, note: noteOffset };
    setActiveNotes(map => new Map(map).set(key, newNote));
    playInstrument(synthInstrument, 1, false, 0, noteOffset);
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
      const rawKey = e.key.length === 1 ? e.key.toLowerCase() : e.code;
      if (!KEY_MAP.hasOwnProperty(rawKey)) return;
      const noteOffset = KEY_MAP[rawKey];
      const key = rawKey.startsWith('Key') ? rawKey.toLowerCase().slice(3) : rawKey;
      if (activeNotesRef.current.has(key)) return; // Already playing

      e.preventDefault();

      const newNote: ActiveNote = { key, note: noteOffset };
      setActiveNotes(map => new Map(map).set(key, newNote));
      playInstrument(synthInstrument, 1, false, 0, noteOffset);
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (!KEY_MAP.hasOwnProperty(key)) return;

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
      </div>

      {/* Info */}
      <div className="px-3 pb-2 text-[8px] text-gray-700 text-center">
        Press Z-M for lower octave, A-J for middle, and Q-U for higher octave • Three octaves of C major scale
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
          ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50 text-white cursor-pointer'
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
