# SDK Usage Guide

## Quick Start

### For Local Development

#### 1. Install Dependencies and Build

```bash
cd /home/elite/repos/byoc-sdk
npm install
npm run build
```

This will generate the compiled SDK in the `dist/` directory.

#### 2. Link SDK to Your Project

**Option A: Using npm link**

```bash
# In the SDK directory
npm link

# In your project directory
cd /home/elite/repos/livepeer-app-pipelines/byoc-stream/webapp
npm link @eliteencoder/byoc-sdk
npm install
```

**Option B: Using file path in package.json**

Add to your project's `package.json`:

```json
{
  "dependencies": {
    "@eliteencoder/byoc-sdk": "file:../../../byoc-sdk"
  }
}
```

#### 3. Run Your Application

```bash
cd /home/elite/repos/livepeer-app-pipelines/byoc-stream/webapp
npm run dev
```

### For Production

Install from npm:

```bash
npm install @eliteencoder/byoc-sdk
```

## Testing the SDK

Run tests in the SDK directory:

```bash
cd /home/elite/repos/byoc-sdk
npm test
```

## Migration from Legacy Code

If you're migrating from direct API calls to the SDK, here's how the code changes:

### Before (Legacy API calls)

```tsx
import { sendWhipOffer, constructWhipUrl } from './api'

const handleStart = async () => {
  const whipUrl = constructWhipUrl(baseUrl, streamName, pipeline, width, height, customParams)
  const pc = new RTCPeerConnection(config)
  // ... manual WebRTC setup
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  const response = await sendWhipOffer(whipUrl, pc.localDescription.sdp)
  // ... more manual handling
}
```

### After (Using SDK)

```tsx
import { useStreamPublisher, StreamConfig } from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  whipUrl: 'https://your-server.com/gateway/ai/stream/start',
  whepUrl: 'https://your-server.com/mediamtx',
  dataStreamUrl: 'https://your-server.com/gateway',
  kafkaEventsUrl: 'https://your-server.com/kafka/events'
}

function MyComponent() {
  const { isStreaming, start, stop } = useStreamPublisher({ config })

  const handleStart = async () => {
    await start({
      streamName: 'my-stream',
      pipeline: 'video-analysis',
      width: 1280,
      height: 720
    })
  }

  return <button onClick={handleStart}>Start</button>
}
```

### Key Benefits

1. **Simplified API**: No manual WebRTC setup
2. **Type Safety**: Full TypeScript support
3. **Error Handling**: Built-in error handling and retry logic
4. **State Management**: Automatic connection state tracking
5. **React Integration**: Easy-to-use hooks
6. **Consistent Interface**: Same patterns for publishing, viewing, and data streaming

## SSE Text Data Retrieval

The SDK's `DataStreamClient` retrieves SSE text data from the server exactly as the demo app does. Here's how to use it:

### Basic Usage

```typescript
import { DataStreamClient, StreamConfig } from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  dataStreamUrl: 'https://your-server.com/gateway',
  // ... other config
}

const client = new DataStreamClient(config)

// Listen for data events
client.on('data', (event) => {
  console.log('Received SSE data:', event.data)
  
  // Extract specific fields
  if (event.data.timestamp) {
    console.log('Frame timestamp:', event.data.timestamp)
  }
  if (event.data.delay) {
    console.log('Processing delay:', event.data.delay)
  }
  if (event.data.text) {
    console.log('Text output:', event.data.text)
  }
})

// Connect to stream
await client.connect({
  streamName: 'my-stream',
  maxLogs: 1000
})

// Get all logs
const logs = client.getLogs()

// Disconnect
client.disconnect()
```

### React Hook Usage

```typescript
import { useDataStream } from '@eliteencoder/byoc-sdk'

function MyComponent({ streamName }: { streamName: string }) {
  const {
    isConnected,
    logs,
    connect,
    disconnect
  } = useDataStream({
    config,
    streamName,
    autoConnect: true,
    onData: (event) => {
      // Process each data event
      console.log('Data received:', event.data)
      
      // Access timestamp, delay, text, or any other fields
      const { timestamp, delay, text, ...rest } = event.data
    }
  })

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Total logs: {logs.length}</p>
      
      {/* Display recent logs */}
      {logs.slice(-10).map(log => (
        <div key={log.id}>
          <strong>{log.type}:</strong>
          <pre>{JSON.stringify(log.data, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
}
```

### Data Structure

The SDK preserves the complete data structure from SSE events:

```typescript
interface DataStreamEvent {
  type: string          // Event type (e.g., 'data', 'frame', 'text')
  data: any            // Raw data object from SSE
  timestamp: number    // SDK-added timestamp of when received
}

interface DataLog {
  id: string           // Unique log ID
  type: string         // Event type
  data: any           // The actual data payload
  timestamp?: number  // When the data was received
  expanded?: boolean  // For UI expansion state
}
```

### Extracting Specific Fields

```typescript
// Listen for specific data types
client.on('data', (event) => {
  // Video frame data
  if (event.type === 'frame') {
    const frameData = event.data
    console.log('Frame timestamp:', frameData.timestamp)
    console.log('Frame number:', frameData.frame_number)
  }
  
  // Text analysis results
  if (event.type === 'text' || event.data.text) {
    console.log('Text output:', event.data.text)
  }
  
  // Processing metrics
  if (event.data.delay) {
    console.log('Processing delay:', event.data.delay, 'seconds')
  }
  
  // Custom fields from your pipeline
  if (event.data.custom_field) {
    console.log('Custom data:', event.data.custom_field)
  }
})
```

## Examples

The SDK includes several example implementations:

1. **Basic Publisher** (`examples/basic-publisher.tsx`)
   - Simple stream publishing
   - Parameter updates
   - Stats monitoring

2. **Full Example** (`examples/full-example.tsx`)
   - Complete application with all features
   - Publisher + Viewer + Data Stream
   - Error handling

3. **Webapp Examples** (`webapp/src/examples/`)
   - `SimplePublisherWithSDK.tsx` - Refactored publisher
   - `DataStreamWithSDK.tsx` - SSE data streaming
   - `FullAppWithSDK.tsx` - Complete integrated app

## API Reference

See [README.md](./README.md) for complete API documentation.

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
cd /home/elite/repos/byoc-sdk
rm -rf node_modules dist
npm install
npm run build
```

### Link Issues

If linking doesn't work:

```bash
# Unlink
npm unlink @eliteencoder/byoc-sdk -g

# Re-link
cd /home/elite/repos/byoc-sdk
npm link

cd /home/elite/repos/livepeer-app-pipelines/byoc-stream/webapp
npm link @eliteencoder/byoc-sdk
```

### Type Errors in Webapp

Make sure the webapp's `tsconfig.json` includes the SDK:

```json
{
  "compilerOptions": {
    "types": ["@eliteencoder/byoc-sdk"]
  }
}
```

## Development Workflow

1. Make changes to SDK source in `/home/elite/repos/byoc-sdk/src`
2. Run `npm run build` to rebuild
3. Changes will be reflected in linked webapp
4. Test in webapp with `npm run dev`
5. Run SDK tests with `npm test`

