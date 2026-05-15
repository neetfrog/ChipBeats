# ChipBeat Drum Machine App (v2)

A chiptune-inspired drum sequencer with both **web** and **desktop (Electron)** versions built with React + Vite + Tailwind + Web Audio API.

## 🚀 Overview

This project is a modular drum machine with track editing, step grid sequencing, synth/instrument controls, and performance optimizations (node pooling, low-power mode, lazy UI loading). It supports keyboard shortcuts, project export/import, theme switching, mute/solo, and auto-save.

**Available as:**
- 🌐 **Web App** - Run in any modern browser
- 🖥️ **Desktop App (Windows)** - Standalone Electron application with installer and portable versions

## ⚙️ Tech stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- Zustand stores
- Web Audio API synth and sequencer
- Electron (for desktop version)

## ▶️ Quick start

### Web Version (Development)

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Build for production:

```bash
npm run build:web
npm run preview
```

### Desktop Version (Development)

```bash
npm install
npm run electron:dev
```

This starts both the Vite dev server and Electron app with hot reload.

### Build & Release

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed build instructions.

**Quick build:**

```bash
# Web only
npm run build:web

# Electron (Windows)
npm run build:electron:win

# Or portable version
npm run build:electron:portable
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
- `src/main/main.ts` - Electron main process

## 🎨 Themes

- Retro
- Dark
- High-contrast

## 🧩 Notable behaviors

- Auto-save to browser storage
- Track selection via keyboard (1-9) opens editor
- Export includes patterns, instruments, effects, chain
- Import validates project structure

## 📦 Distribution

### Web
- Deploy to Netlify, Vercel, GitHub Pages, or any static host
- Single build from `npm run build:web`

### Windows Desktop
- NSIS Installer (`.exe`)
- Portable version (no installation)
- Available on GitHub Releases

### System Requirements (Desktop)
- Windows 10 or later (64-bit)
- 100 MB free disk space
- Modern audio hardware support

## 🐛 Troubleshooting

- If audio stutters, enable low-power mode.
- If theme fails to persist, ensure localStorage is enabled.
- If import fails, verify file came from this app version.
- For Electron issues, check [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 Setup for Icon (Desktop)

Add your app icon to `assets/icon.png` (256x256). See [ICON_SETUP.md](./ICON_SETUP.md) for details.

## 📌 Contribution

1. Fork repo
2. Create branch `feat/your-feature`
3. Submit PR

## 📄 License

MIT

---

Made with ❤️ by [nefas](https://nefas.tv).
