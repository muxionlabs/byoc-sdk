# Quick Start Guide

Get up and running with the BYOC SDK in minutes!

## Your Server Configuration

Your endpoints are pre-configured in all examples:

- **Gateway (Start Stream):** `https://eliteencoder.net:8088/gateway/ai/stream/start`
- **MediaMTX (WHEP):** `https://eliteencoder.net:8088/mediamtx`
- **Data Stream:** `https://eliteencoder.net:8088/gateway/ai/stream/{streamName}/data`
- **Kafka Events:** `https://eliteencoder.net:8088/kafka/events`

## Running the Examples

### Option 1: HTML Demo (Easiest!)

You can run the HTML demo directly using npm:

```bash
npm run serve:examples
```

This will:
1. Start a local web server on port 8080
2. Automatically open your default browser to the demo page
3. Allow you to start streaming immediately

Or manually:

```bash
npx http-server examples -o simple-demo.html -p 8080
```

**Features:**
- ✅ No build step required
- ✅ Beautiful UI with real-time stats
- ✅ Works in any modern browser
- ✅ Console logging for debugging

---

### Option 2: React App

For web applications with React:

```typescript
// In your React app
import SimpleStreamApp from './examples/simple-react'

function App() {
  return <SimpleStreamApp />
}
```

---

### Option 3: Vanilla TypeScript (Browser only)

Note: The vanilla example (`simple-vanilla.ts`) is designed for browser environments as it uses `navigator.mediaDevices` and `RTCPeerConnection`. It cannot be run directly in Node.js without polyfills.

---

## What Each Example Does

All examples perform the same basic workflow:

1. **Request Permissions** - Access camera and microphone
2. **Start Stream** - Begin streaming video and audio to your server
3. **Monitor Stats** - Display real-time connection statistics
4. **Update Parameters** - Send new prompts/parameters to the AI pipeline
5. **Receive Data** - Get processed data from Kafka stream
6. **Stop Stream** - Clean up and disconnect

## Output Streams

### WHEP (Video/Audio Output)

Your processed stream is available via WHEP at:
```
https://eliteencoder.net:8088/mediamtx/{streamName}
```

Example:
```
https://eliteencoder.net:8088/mediamtx/stream-1733164800000
```

### Kafka Data Stream (JSON Output)

Real-time data events are sent to:
```
https://eliteencoder.net:8088/gateway/ai/stream/{streamName}/data
```

Example:
```
https://eliteencoder.net:8088/gateway/ai/stream/stream-fcqst6-51dab956/data
```

The stream includes the active stream name as a key in the URL.

## Troubleshooting

### Camera/Microphone Not Working

1. Make sure you're using HTTPS or localhost
2. Check browser permissions
3. Try requesting permissions explicitly:

```typescript
await publisher.requestPermissions(true, true)
```

### Connection Fails

1. Check that your server is running
2. Verify the URLs in the config
3. Check browser console for CORS errors
4. Make sure WebRTC is not blocked by firewall

### No Data Stream Events

1. Make sure `enableDataOutput: true` is set
2. Check that your pipeline supports data output
3. Verify the Kafka endpoint is accessible
4. Check for SSE connection errors in the console

## Support

- **Documentation:** See [USAGE.md](../USAGE.md)
- **Examples:** All examples in this directory
- **API Reference:** See TypeScript definitions in `src/types.ts`
- **Issues:** Open an issue on GitHub

---

Happy streaming! 🎥✨
