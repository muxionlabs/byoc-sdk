# BYOC SDK Examples

This directory contains example applications demonstrating how to use the BYOC Stream SDK.

## Examples

### 1. Simple Vanilla TypeScript/JavaScript (`simple-vanilla.ts`)

A minimal example showing how to use the SDK without React. Perfect for:
- Node.js applications
- Plain JavaScript/TypeScript projects
- Understanding the core SDK API

**Features:**
- Video and audio streaming
- Event listeners for status and stats
- Automatic cleanup
- Console logging for debugging

**Run:**
```bash
npm install
npx tsx examples/simple-vanilla.ts
```

Or compile and run:
```bash
npx tsc examples/simple-vanilla.ts
node examples/simple-vanilla.js
```

---

### 2. Simple React App (`simple-react.tsx`)

A complete React component with a user interface. Perfect for:
- React applications
- Web applications with UI
- Learning the React hooks API

**Features:**
- Video preview
- Stream controls (start/stop)
- Real-time stats display
- Data stream events display
- Parameter updates
- Error handling

**Run:**
```bash
# Add to your React app
import SimpleStreamApp from './examples/simple-react'

function App() {
  return <SimpleStreamApp />
}
```

---

### 3. Basic Publisher (`basic-publisher.tsx`)

A more detailed React example with additional features like device selection and more control options.

---

### 4. Full Example (`full-example.tsx`)

Complete example demonstrating all SDK features:
- Stream publishing
- Stream viewing (WHEP)
- Data streaming (SSE)
- Event streaming (Kafka)
- Screen sharing
- Device management

---

## Server Configuration

All examples are pre-configured for the following endpoints:

- **Gateway (WHIP):** `https://eliteencoder.net:8088/gateway/ai/stream/start`
- **MediaMTX (WHEP):** `https://eliteencoder.net:8088/mediamtx`
- **Data Stream:** `https://eliteencoder.net:8088/gateway`
- **Kafka Events:** `https://eliteencoder.net:8088/kafka/events`

To use different endpoints, update the `config` object in each example:

```typescript
const config: StreamConfig = {
  whipUrl: 'https://your-server.com/gateway/ai/stream/start',
  whepUrl: 'https://your-server.com/mediamtx',
  dataStreamUrl: 'https://your-server.com/gateway',
  kafkaEventsUrl: 'https://your-server.com/kafka/events',
  defaultPipeline: 'comfystream'
}
```

---

## Common Use Cases

### Starting a Stream

```typescript
await publisher.start({
  streamName: 'my-stream',
  pipeline: 'comfystream',
  width: 1280,
  height: 720,
  fpsLimit: 30,
  enableVideoIngress: true,
  enableAudioIngress: true,
  customParams: {
    prompts: 'Analyze this video'
  }
})
```

### Updating Stream Parameters

```typescript
await publisher.updateStream({
  params: {
    prompts: 'New analysis instructions'
  }
})
```

### Listening to Data Events

```typescript
const dataStream = useDataStream({
  config,
  streamName,
  autoConnect: true,
  onData: (event) => {
    console.log('Received data:', event)
  }
})
```

---

## Output Streams

### WHEP (WebRTC Egress)

View the processed video/audio stream via WHEP:
```
https://eliteencoder.net:8088/mediamtx/{streamName}
```

### Kafka Data Stream

Access real-time data events:
```
https://eliteencoder.net:8088/gateway/ai/stream/{streamName}/data
```

The stream includes the active stream name as shown in the URL pattern:
```
https://eliteencoder.net:8088/gateway/ai/stream/stream-fcqst6-51dab956/data
```

---

## Troubleshooting

### Camera/Microphone Permissions

Make sure to request permissions before starting:
```typescript
await publisher.requestPermissions(true, true)
```

### HTTPS Requirement

WebRTC requires HTTPS in production. For local development, use:
- `localhost` (allowed over HTTP)
- Self-signed certificates
- Ngrok or similar tunneling services

### Connection Issues

Check the browser console for detailed error messages:
```typescript
publisher.on('error', (error) => {
  console.error('Error:', error)
})
```

---

## Next Steps

1. Try the simple vanilla example first to understand the basics
2. Move to the React example for UI integration
3. Explore the full example for advanced features
4. Customize the examples for your specific use case

For more information, see the [main README](../README.md) and [API documentation](../USAGE.md).

