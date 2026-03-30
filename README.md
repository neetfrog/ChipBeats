# ChipBeat Drum Machine App (v2)

A browser-based, chiptune-inspired drum sequencer built with React + Vite + Tailwind + Web Audio API.

## 🚀 Overview

This project is a modular drum machine with track editing, step grid sequencing, synth/instrument controls, and performance optimizations (node pooling, low-power mode, lazy UI loading). It supports keyboard shortcuts, project export/import, theme switching, mute/solo, and auto-save.

## ⚙️ Tech stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- Zustand stores
- Web Audio API synth and sequencer

## ▶️ Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Build for production:

```bash
npm run build
npm run preview
```

## 🛠️ Features

- Step sequencer (multiple tracks)
- Track mute/solo
- BPM control and tempo tap
- Keyboard commands (1-9 select track, space play/pause, Esc stop, T tap tempo)
- Instrument editor per track
- Project export/import (`.json`)
- Persisted settings in localStorage (theme, bpm, patterns)
- Low-power mode for reduced CPU
- Visualizer optimized for visibility performance
- Undo/redo

## 🗂️ Files of interest

- `src/App.tsx` - main app
- `src/components/Transport.tsx` - playback and settings
- `src/components/StepGrid.tsx` / `StepGridCell.tsx` - pattern editing
- `src/audio/synth.ts` / `nodePool.ts` / `lowPowerMode.ts` - audio engine
- `src/utils/projectExport.ts` - save/load
- `src/store/sequencerStore.ts` - app state

## 🎨 Themes

- Retro
- Dark
- High-contrast

## 🧩 Notable behaviors

- Auto-save to browser storage
- Track selection via keyboard (1-9) opens editor
- Export includes patterns, instruments, effects, chain
- Import validates project structure

## 🐛 Troubleshooting

- If audio stutters, enable low-power mode.
- If theme fails to persist, ensure localStorage is enabled.
- If import fails, verify file came from this app version.

## 📌 Contribution

1. Fork repo
2. Create branch `feat/your-feature`
3. Submit PR

## 📄 License

MIT (or add a license file as needed)

---

Made with ❤️ by [nefas](https://nefas.tv).
