# ChipBeats Development Commands Reference

## 🚀 Quick Start

### Web Development
```bash
npm install                # Install all dependencies
npm run dev                # Start dev server at http://localhost:5173
npm run build:web          # Build for web deployment
npm run preview            # Preview production build
```

### Desktop Development
```bash
npm run electron:dev       # Start with Electron (requires dev server running)
npm run build:electron:win # Build Windows installer and portable versions
npm run build:electron:portable  # Build only portable .exe
```

## 📦 Complete Build Process

### For Web Deployment
```bash
npm run build:web
# Output: dist/ folder ready to deploy
```

### For GitHub Release (automated)
```bash
npm version minor          # Bump version (or patch/major)
git push origin main --tags
# GitHub Actions automatically builds and creates release
```

### For Manual Desktop Build Testing
```bash
npm run build:electron:win
# Output: dist/ChipBeats-*.exe files in dist/ folder
```

## 🔍 Verification

### Test Web Build Locally
```bash
npm run build:web
npm run preview            # Serves on http://localhost:4173
```

### Test Electron Build
```bash
npm run build:electron:win
./dist/ChipBeats-1.0.0-portable.exe   # Run portable version
# Or run installer:
./dist/ChipBeats-1.0.0.exe
```

## 📋 Version Management

Current version commands:
```bash
npm version patch          # 1.0.0 → 1.0.1 (bugfixes)
npm version minor          # 1.0.0 → 1.1.0 (new features)
npm version major          # 1.0.0 → 2.0.0 (breaking changes)
```

## 🔄 Development Workflow

1. **Feature Development**
   ```bash
   npm run dev              # Continuous development
   ```

2. **Before Commit**
   ```bash
   npm run build:web        # Verify build succeeds
   ```

3. **Release**
   ```bash
   npm version minor
   git push origin main --tags
   # GitHub Actions handles the rest
   ```

## 🛠️ Troubleshooting Commands

### Clean and Reinstall
```bash
rm -r node_modules dist    # (on Linux/Mac) or del /s /q node_modules dist (Windows)
npm install
```

### Check Node/npm Versions
```bash
node --version
npm --version
```

### View Build Output
```bash
npm run build:web -- --debug  # Verbose build output
```

### Clear npm Cache
```bash
npm cache clean --force
```

## 📚 Documentation Files

- **DEPLOYMENT.md** - Detailed build and release instructions
- **PRODUCTION_CHECKLIST.md** - Pre-release checklist
- **ICON_SETUP.md** - Icon configuration
- **RELEASES.md** - Release history and templates
- **README.md** - Main project documentation

---

**Need help?** Check DEPLOYMENT.md for detailed instructions or create a GitHub Issue.
