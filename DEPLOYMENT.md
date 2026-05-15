# Production Deployment Guide

## ChipBeats - Build & Release Instructions

### Prerequisites

- Node.js 18+ and npm
- Git with GitHub access
- Windows 10+ for building Windows installers

### Local Development

```bash
npm install
npm run electron:dev
```

This starts both Vite dev server and Electron app in dev mode.

### Building for Production

#### Web Version (Deployment)

```bash
npm run build:web
```

Output: `dist/` directory ready to deploy to any static host (Netlify, Vercel, GitHub Pages, etc.)

#### Electron Desktop App (Windows)

```bash
npm run build:electron:win
```

This creates:
- `ChipBeats-X.X.X.exe` - NSIS installer
- `ChipBeats-X.X.X-portable.exe` - Portable executable
- `ChipBeats-X.X.X.zip` - Portable archive

### Creating a Release

1. **Update version in package.json:**
   ```bash
   npm version minor  # or major/patch
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions** automatically:
   - Builds both web and Electron versions
   - Creates a release with binaries
   - Uploads installers and portable versions
   - Publishes release notes

### Manual Release Process

If you need to manually create a release:

```bash
# Build everything
npm run build

# Test locally
npm run preview  # Web
npm run electron:dev  # Electron with dev tools

# Create GitHub release manually with the files from:
# - dist/ (web version)
# - dist/ChipBeats-*.exe (executables)
```

### Environment Variables

Create `.env` if needed (optional for production):

```
VITE_API_URL=https://api.example.com
```

### Testing Before Release

1. **Test web build locally:**
   ```bash
   npm run build:web
   npm run preview
   ```

2. **Test Electron build locally:**
   ```bash
   npm run build:electron
   ./dist/ChipBeats-*-portable.exe
   ```

3. **Test installer:**
   ```bash
   ./dist/ChipBeats-*.exe
   # Follow installation wizard
   # Verify shortcuts and functionality
   ```

### Deployment Options

#### Web Version

- **Netlify:** Connect GitHub repo, set build command to `npm run build:web`
- **Vercel:** Same as Netlify
- **GitHub Pages:** Push to `gh-pages` branch or use Actions
- **Traditional hosting:** Upload `dist/` to any web server

#### Desktop Version

- **GitHub Releases:** Files auto-uploaded via GitHub Actions
- **Custom hosting:** Host `.exe` files on your server and link from website
- **Auto-update:** Can be added with electron-updater (future enhancement)

### Version Numbering

Uses semantic versioning (MAJOR.MINOR.PATCH):

- **PATCH** - Bug fixes: `npm version patch`
- **MINOR** - New features: `npm version minor`
- **MAJOR** - Breaking changes: `npm version major`

### Troubleshooting

**Build fails with "electron not found":**
```bash
npm install electron --save-dev
```

**Code signing issues on Windows:**
Currently unsigned. For production, consider:
- Obtaining a code signing certificate
- Updating electron-builder config with certificate paths

**App doesn't start:**
- Check if port 5173 is available (dev mode)
- Verify all dependencies installed: `npm ci`
- Check Electron DevTools for errors (opened in dev mode)

### Rollback

If a release has issues:

1. Delete the release on GitHub
2. Remove the tag: `git tag -d vX.X.X && git push origin :vX.X.X`
3. Fix the issue and re-release with bumped version

### Performance Optimization

Already implemented:
- Minified builds
- Audio node pooling
- Low-power mode
- Lazy component loading

Monitor app performance with DevTools in dev mode.

### Security

Current setup includes:
- Context isolation in Electron
- Sandbox enabled
- No remote code execution
- Limited IPC surface

For production, consider:
- Code signing
- Auto-updater with signature verification
- Security audit of dependencies

---

**Questions?** Check the [README.md](./README.md) or GitHub Issues.
