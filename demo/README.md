# BYOC SDK Demo App

This Vite + React demo mirrors the plain HTML example in `examples/simple-demo.html` while showcasing the idiomatic “install the npm package and call the hooks” workflow.

## Features

- **Single-page publisher + viewer** – start WHIP ingest and automatically play the processed WHEP output in one layout.
- **Prompt management** – reuse saved workflows from `/workflows/`, edit prompts inline, and send live prompt updates that respect the SDK’s immutable resolution rules.
- **Live stats & logs** – bitrate/FPS overlays, connection badges, and a console-style log that mirrors the reference HTML sample.
- **SDK-first usage** – demonstrates `useStreamPublisher`/`useStreamViewer` along with the latest update URL handling fixes.
- **Shared styling** – both this app and `examples/simple-demo.html` import `examples/simple-demo.css`, so UI tweaks only need to be done once.

## Running locally

```bash
cd demo
npm install
npm run dev
```

Visit [http://localhost:3005](http://localhost:3005) after starting the dev server.

For production builds:

```bash
npm run build
```

The optimized output lands in `demo/dist/`.

## Configuration

The demo reads a single environment variable:

- `VITE_BYOC_BASE_URL` – base URL for the gateway (defaults to `https://eliteencoder.net:8088`). The app derives WHIP/WHEP/data/update paths from this value and also uses it for the `/workflows/` helper.

Set the variable before running `npm run dev` or `npm run build` to target a different environment.

## Project layout

```
demo/
├── src/
│   ├── App.tsx          # combined publisher/viewer experience
│   ├── index.css        # root-specific tweaks (shared CSS lives in examples/simple-demo.css)
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

## Usage checklist

1. Generate the default stream name, pick a pipeline, and optionally select a saved workflow to populate prompts.
2. Click **Start Stream** – the publisher starts, the viewer attaches automatically, and stats/logs update in real time.
3. Modify prompts and press **Update Prompts** to send a sanitized update payload that mirrors the working cURL example.
4. Use **Stop Stream** to tear everything down, which also stops the viewer session.

