# BYOC SDK Demo App

This React + Vite demo app walks through the BYOC SDK’s publisher, viewer, and data-stream workflows with real-time stats and logging.

## Features

- **Publisher** – start a WHIP stream, adjust resolution/FPS, and push custom prompts
- **Viewer** – play WHEP playback URLs directly inside the same UI
- **DataStream logs** – monitor SSE/text outputs exactly like the SDK clients
- **Configurable inputs** – control stream name, pipeline, prompts, and more

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

The app honors these environment variables:

- `VITE_HOST` – base hostname for the demo (defaults to `localhost`)
- `VITE_WORKFLOW_API_KEY` – API key when the workflow UI is enabled

Set `VITE_HOST` and `VITE_WORKFLOW_API_KEY` before `npm run dev` to override defaults.

## Project layout

```
demo/
├── src/
│   ├── components/
│   │   ├── Publisher.tsx
│   │   └── Viewer.tsx
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

## Usage checklist

1. Start the publisher section and configure the stream name, resolution, FPS, and AI prompts.
2. Use the viewer section to paste a WHEP playback URL or reuse the stream generated above.
3. Observe stats, logs, and SSE output rendered alongside the video feeds.

