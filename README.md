# BYOC Stream SDK

Production-quality SDK for Livepeer BYOC video streaming with AI-powered insights.

## Highlights

- 🎥 **WebRTC streaming** with WHIP/WHEP endpoints and automatic ICE handling
- 🤖 **AI-ready** pipelines with custom params/state updates
- 📊 **SSE data streaming** for stats and text insights
- 📱 **Media device management** with permissions and device lists
- ⚛️ **React hooks** for stream, viewer, and data flows
- 📦 **TypeScript-first** exports with ESM/CJS builds
- 🔄 **Robust retries** plus connection monitoring and stats

## Quick Start

```bash
git clone https://github.com/muxionlabs/byoc-sdk.git
cd byoc-sdk
npm install
npm run build    # produces `dist/` for publishing or linking
npm run serve:examples    # opens `examples/html-demo.html` on http://localhost:3005
```

The `serve:examples` script spins up `http-server` against the repo root and immediately serves `examples/html-demo.html`. Open `http://localhost:3005` to try the new single-page demo and inspect the console log to see SDK events and stats.

## Example Preview

- `examples/html-demo.html` is the only bundled example. It wires the SDK to the browser camera, logs events, and renders stats + config controls.
- Adjust the `prompts` input or the `Stream` start options inside that file to exercise different AI pipelines or resolutions.
- Use the `Stream`, `StreamViewer`, and `DataStreamClient` snippets below as the foundation for your own pages.

## Integrating the SDK

```ts
import { Stream, StreamConfig } from '@muxionlabs/byoc-sdk'

// Define your gateway base URL
const GATEWAY_URL = 'https://your-gateway.example.com:8088'

// Simple configuration
const config = new StreamConfig({
  gatewayUrl: GATEWAY_URL
})

// With options
const config = new StreamConfig({
  gatewayUrl: GATEWAY_URL,
  defaultPipeline: 'comfystream'
})

const stream = new Stream(config)

await stream.start({
  streamName: 'my-stream',
  pipeline: 'comfystream',
  width: 1280,
  height: 720,
  fpsLimit: 30,
  enableVideoIngress: true,
  enableAudioIngress: true,
  enableDataOutput: true,
  customParams: { prompts: 'Analyze this frame' }
})

await stream.updateStream({
  params: { prompts: '{"1":{"inputs":{"images":["3",0]},"class_type":"SaveTensor"}}' },
  // Width/height changes require restarting the stream, so omit them here.
})

// Stop the stream using the stopUrl returned from startStream/StreamConfig
import { startStream, stopStream } from '@muxionlabs/byoc-sdk/api/start'

const startResponse = await startStream(config.getStreamStartUrl(), {
  streamName: 'my-stream',
  pipeline: 'comfystream'
})

// stopUrl is now part of the start response (PR #41)
await stopStream(startResponse.stopUrl)
```

Hook up a `StreamViewer` to the same `StreamConfig` to render the WHEP output, or create a `DataStreamClient` for SSE payloads to mirror real-time insights from the demo.

## Commands

- `npm run build` – emit `dist/` for publishing or linking
- `npm run serve:examples` – serve `examples/html-demo.html` on port 3005
- `npm test` – run the Vitest suite
- `npm run demo:dev` – start the React demo webapp in `demo/`

## Linking locally

Use `npm link` if you need to consume the SDK from another project without publishing:

```bash
cd byoc-sdk
npm link
cd ../livepeer-app-pipelines/byoc-stream/webapp
npm link @muxionlabs/byoc-sdk
npm install
npm run dev
```

## Support

- File issues at https://github.com/muxionlabs/byoc-sdk/issues
- Review the bundled `demo` directory for a full React + Vite example that mirrors production usage, including its own README.
- Contributions welcome – send PRs to the repository and reference this README for context.

## License

MIT

