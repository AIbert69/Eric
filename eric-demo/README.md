# Eric's Assistant — Mobile Demo

Mobile-first, app-like walkthrough of the Phase 1 WhatsApp assistant concept for Eric Morgan (Peplogix).

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag this folder in
3. Click Deploy — you get a live URL

Or via CLI:
```bash
npm install -g vercel
vercel
```

## How Eric views it

- **On mobile:** Opens directly into the app experience — fullscreen, no browser chrome feel
- **On desktop:** Shows a "view on mobile" screen with instructions to open on phone
- **Add to Home Screen:** On iPhone, Share → Add to Home Screen makes it feel like a native app

## Audio

Three clips in `/public/audio/`:
- `01_morning_brief.mp3` — 15s, Scene 2
- `02_draft_ready.mp3` — 5s, Scene 4
- `03_handled.mp3` — 6s, Scene 6

Autoplay is gated by the "Begin the morning" button (browser requirement).

## Local dev

```bash
npm install
npm run dev
```
