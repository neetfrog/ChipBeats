# Web Deployment Guide

ChipBeats web version can be deployed to any static hosting platform. Here are the options:

## 🚀 Deployment Platforms

### Netlify (Recommended for beginners)

1. Build locally:
   ```bash
   npm run build:web
   ```

2. In Netlify dashboard:
   - Connect your GitHub repo
   - Build command: `npm run build:web`
   - Publish directory: `dist`
   - Deploy!

Or use Netlify CLI:
```bash
npm run build:web
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   npm run build:web
   vercel --prod
   ```

### GitHub Pages

1. Update package.json:
   ```json
   "homepage": "https://yourusername.github.io/chipbeats"
   ```

2. Install gh-pages:
   ```bash
   npm install gh-pages --save-dev
   ```

3. Add scripts:
   ```json
   "predeploy": "npm run build:web",
   "deploy": "gh-pages -d dist"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Traditional Web Hosting

1. Build:
   ```bash
   npm run build:web
   ```

2. Upload `dist/` folder via FTP/SFTP to your server

3. Configure your web server to serve `index.html` for all routes

### Docker (For self-hosting)

Create `Dockerfile`:
```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:web

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t chipbeats .
docker run -p 80:80 chipbeats
```

## 📋 Pre-Deployment Checklist

- [ ] Code tested locally (`npm run dev`)
- [ ] Production build successful (`npm run build:web`)
- [ ] Build previewed (`npm run preview`)
- [ ] Audio works in target browser
- [ ] Theme/settings persist
- [ ] Project export/import works
- [ ] No console errors in DevTools
- [ ] Performance acceptable (<2s load)
- [ ] Mobile responsive (if needed)

## 🔒 Security Considerations

- No authentication in current version
- All data stored locally (no server)
- No analytics/tracking
- No ads
- Safe to run anywhere

## 📊 Performance Optimization

Already implemented:
- Minified production build
- Code splitting via Vite
- Lazy component loading
- Audio node pooling
- Low-power mode option

Additional options:
- Enable Gzip compression on server
- Add Service Worker for offline mode
- Use CDN for faster delivery

## 🌍 Domain Setup

If hosting on custom domain:

### Example: Netlify
1. Go to Domain management
2. Add custom domain
3. Update DNS records per Netlify instructions
4. Enable auto HTTPS

### Example: GitHub Pages
1. Go to repo Settings → Pages
2. Select branch to deploy
3. Choose custom domain (optional)
4. Add DNS records

## 🔄 Continuous Deployment

Recommended workflow:

1. Push code to `main` branch
2. GitHub Actions tests build
3. On successful test, auto-deploy via:
   - Netlify/Vercel (already connected)
   - Manual script with GitHub Actions
   - Webhook to your server

Example GitHub Actions workflow to auto-deploy:
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
    paths-ignore:
      - 'DEPLOYMENT.md'
      - 'README.md'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:web
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🆘 Troubleshooting

### Build fails
```bash
npm ci  # Clean install
npm run build:web
```

### App doesn't load
- Check browser console for errors
- Verify `index.html` is served for all routes
- Check that dist folder was created

### Audio not working
- Check browser permissions
- Test in another browser
- Verify audio context in DevTools

---

Choose a deployment platform above and follow its instructions. Most platforms offer free tier for open-source projects!
