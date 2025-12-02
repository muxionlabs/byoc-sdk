# BYOC Stream SDK

Production-quality SDK for Livepeer BYOC video streaming with AI-powered insights.

## Highlights

- 🎥 **WebRTC streaming** with WHIP/WHEP endpoints and automatic ICE handling
- 🤖 **AI-ready** pipelines with custom params/state updates
- 📊 **SSE data streaming** for stats and text insights
- 📱 **Media device management** with permissions and device lists
- ⚛️ **React hooks** for publisher, viewer, data, and event flows
- 📦 **TypeScript-first** exports with ESM/CJS builds
- 🔄 **Robust retries** plus connection monitoring and stats

## Quick Start

```bash
git clone https://github.com/eliteprox/byoc-sdk.git
cd byoc-sdk
npm install
npm run build    # produces `dist/` for publishing or linking
npm run serve:examples    # opens `examples/simple-demo.html` on http://localhost:3005
```

The `serve:examples` script spins up `http-server` against the repo root and immediately serves `examples/simple-demo.html`. Open `http://localhost:3005` to try the new single-page demo and inspect the console log to see SDK events and stats.

## Example Preview

- `examples/simple-demo.html` is the only bundled example. It wires the SDK to the browser camera, logs events, and renders stats + config controls.
- Adjust the `prompts` input or the `StreamPublisher` start options inside that file to exercise different AI pipelines or resolutions.
- Use the `StreamPublisher`, `StreamViewer`, and `DataStreamClient` snippets below as the foundation for your own pages.

## Integrating the SDK

```ts
import { StreamPublisher, StreamConfig } from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  whipUrl: 'https://your-server/gateway/ai/stream/start',
  whepUrl: 'https://your-server/mediamtx',
  dataStreamUrl: 'https://your-server/gateway',
  kafkaEventsUrl: 'https://your-server/kafka/events',
  defaultPipeline: 'comfystream'
}

const publisher = new StreamPublisher(config)

await publisher.start({
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
```

Hook up a `StreamViewer` to the same `StreamConfig` to render the WHEP output, or create a `DataStreamClient` for SSE payloads to mirror real-time insights from the demo.

## Commands

- `npm run build` – emit `dist/` for publishing or linking
- `npm run serve:examples` – serve `examples/simple-demo.html` on port 3005
- `npm test` – run the Vitest suite
- `npm run demo:dev` – start the React demo webapp in `demo/`

## Linking locally

Use `npm link` if you need to consume the SDK from another project without publishing:

```bash
cd byoc-sdk
npm link
cd ../livepeer-app-pipelines/byoc-stream/webapp
npm link @eliteencoder/byoc-sdk
npm install
npm run dev
```

## Support

- File issues at https://github.com/eliteprox/byoc-sdk/issues
- Review the bundled `demo` directory for a full React + Vite example that mirrors production usage, including its own README.
- Contributions welcome – send PRs to the repository and reference this README for context.

## License

MIT

