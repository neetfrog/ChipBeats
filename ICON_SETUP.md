# Icon Setup for ChipBeats

## Creating App Icons

The Electron app requires icons. Place them in the `assets/` directory:

### Required Icon Files

- `assets/icon.png` (256x256) - Main app icon
- `assets/icon.ico` (256x256) - Windows icon
- `assets/icon.icns` (512x512) - macOS icon (optional)

### Quick Setup

1. Create an `assets/` folder in the project root if it doesn't exist
2. Place your icon files there

### Creating Icons from Scratch

#### Option 1: Using a design tool
1. Create a 256x256 PNG with your logo
2. Export as `icon.png`
3. Convert PNG to ICO using a tool like:
   - [convertio.co](https://convertio.co)
   - [icoconvert.com](https://icoconvert.com)
   - ImageMagick: `convert icon.png icon.ico`

#### Option 2: Using IconLand or similar
- Search for "drum machine icon" or create custom design
- Export as PNG (256x256)
- Convert to ICO

#### Option 3: Programmatic with sharp (Node.js)

```bash
npm install sharp --save-dev
```

Create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');

sharp('icon.png')
  .resize(256, 256)
  .png()
  .toFile('assets/icon.png');

sharp('icon.png')
  .resize(256, 256)
  .toFormat('ico')
  .toFile('assets/icon.ico');
```

Run: `node scripts/generate-icons.js`

### If Icon is Missing

The app will still work without icons (won't crash), but:
- No taskbar icon
- No desktop icon
- Less professional appearance

### Updating electron-builder Config

The `package.json` already includes icon paths. If using different paths, update:

```json
"win": {
  "icon": "assets/icon.ico"
}
```

### Testing Icons

After building, check:
- `dist/ChipBeats-*.exe` has icon in Windows Explorer
- Installed app has icon in Start Menu
- Portable version has icon
