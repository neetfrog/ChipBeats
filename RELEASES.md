# ChipBeats Release History

## [Unreleased]

### Added
- Electron desktop app support (Windows)
- GitHub Actions for automated releases
- NSIS installer with uninstaller
- Portable executable version
- Auto-generated release notes

### Changed
- Upgraded build tooling for production

---

## Planned Releases

### [1.1.0] - Future
- Auto-update functionality
- macOS support
- Linux support
- Code signing

### [2.0.0] - Future
- VST plugin support
- MIDI controller integration
- Advanced effects chain
- Preset cloud sync

---

## Release Notes Template

When creating a release, use this template in the release description:

```markdown
# ChipBeats X.X.X

## 🎵 What's New

- Feature 1
- Feature 2

## 🐛 Bug Fixes

- Fix 1
- Fix 2

## 📦 Downloads

### Windows
- **Installer (.exe)** - Full installer with uninstaller
- **Portable (.exe)** - No installation required
- **Portable (.zip)** - Archive version

### Web
- Deploy to your hosting platform from `dist/` folder

## System Requirements
- Windows 10 or later (64-bit)
- 100 MB free disk space
- Modern audio hardware

## Known Issues
- None at this time

## Upgrading
- Installer: Run new installer, old version auto-replaced
- Portable: Just download and run the new .exe
- Web: Clear browser cache if experiencing issues

**Thank you for using ChipBeats! 🎉**
```

---

For detailed release and build instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
