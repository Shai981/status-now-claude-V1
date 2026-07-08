# Status Now — עכשיו קורה

A Hebrew-first, RTL, location-based real-time status network for Israel.
Mobile-first React app (Vite). Front-end prototype with mock data, structured to connect to a real backend later.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

To preview a production build:

```bash
npm run build
npm run preview
```

The build output goes to `dist/`.

---

## Deploy to get a public web link

Both hosts below give you a free `https://…` URL. Push this folder to a **GitHub repo** first (recommended), or use the CLI options.

### Option A — Vercel (recommended)

**Via GitHub (easiest):**
1. Create a new repo on GitHub and push this folder to it.
2. Go to https://vercel.com → "Add New… → Project" → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output dir `dist`. (Vercel auto-detects these.)
4. Click **Deploy**. You get a live URL like `https://status-now.vercel.app`.

**Via CLI (no GitHub):**
```bash
npm i -g vercel
vercel        # follow prompts; accept the Vite defaults
vercel --prod # promote to your public production URL
```

### Option B — Netlify

**Via GitHub:**
1. Push this folder to a GitHub repo.
2. https://app.netlify.com → "Add new site → Import an existing project" → pick the repo.
3. Build command: `npm run build` — Publish directory: `dist`.
4. Deploy → you get a URL like `https://status-now.netlify.app`.

**Via CLI:**
```bash
npm i -g netlify-cli
npm run build
netlify deploy --dir=dist --prod
```

A `netlify.toml` is included so the settings are picked up automatically.

---

## Next steps toward a real product
- **Backend:** swap `seedData()` and the create/like/comment/answer functions in `src/App.jsx` for real API calls (auth, DB, storage).
- **Media:** uploads currently use in-session `URL.createObjectURL`. Replace with real file upload → store the returned URL on each status.
- **Map:** the map is a stylized SVG of Israel. For real tiles, drop in Leaflet or MapLibre and keep the existing lat/lng markers.
- **Installable mobile app:** add a PWA manifest + service worker (installable via "Add to Home Screen"), or wrap with Capacitor/Expo for native iOS/Android builds.

## Tech
- React 18 + Vite
- lucide-react (icons)
- No CSS framework — styling is inline + a small `<style>` block inside the component.
