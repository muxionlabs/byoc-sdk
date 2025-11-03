# BYOC Stream SDK

Production-quality SDK for Livepeer BYOC video streaming with AI processing capabilities.

**Package:** `@eliteencoder/byoc-sdk`

## Features

- 🎥 **WebRTC Streaming** - Publish and view streams using WHIP/WHEP protocols
- 🤖 **AI Processing** - Seamless integration with AI pipelines
- 📊 **Real-time Data** - Server-Sent Events (SSE) for data and event streaming
- 📱 **Media Device Management** - Easy camera, microphone, and screen sharing
- ⚛️ **React Hooks** - First-class React support with hooks
- 📦 **TypeScript** - Full TypeScript support with comprehensive types
- 🔄 **Automatic Retry** - Built-in retry logic with exponential backoff
- 📈 **Stats Monitoring** - Real-time connection statistics

## Installation

```bash
npm install @eliteencoder/byoc-sdk
```

## Quick Start

### Publishing a Stream

```typescript
import { StreamPublisher, StreamConfig } from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  whipUrl: 'https://your-server.com/gateway/ai/stream/start',
  whepUrl: 'https://your-server.com/mediamtx',
  dataStreamUrl: 'https://your-server.com/gateway',
  kafkaEventsUrl: 'https://your-server.com/kafka/events',
  defaultPipeline: 'video-analysis'
}

const publisher = new StreamPublisher(config)

// Start streaming
const streamInfo = await publisher.start({
  streamName: 'my-stream',
  pipeline: 'video-analysis',
  width: 1280,
  height: 720,
  fpsLimit: 30,
  enableVideoIngress: true,
  enableAudioIngress: true,
  customParams: {
    prompts: 'analyze this video'
  }
})

// Update stream parameters
await publisher.updateStream({
  params: {
    prompts: 'new instructions'
  }
})

// Stop streaming
await publisher.stop()
```

### Viewing a Stream

```typescript
import { StreamViewer } from '@eliteencoder/byoc-sdk'

const viewer = new StreamViewer(config)

// Set video element
const videoElement = document.getElementById('video') as HTMLVideoElement
viewer.setVideoElement(videoElement)

// Start viewing
await viewer.start({
  playbackUrl: streamInfo.playbackUrl
})

// Stop viewing
await viewer.stop()
```

### Data Streaming

```typescript
import { DataStreamClient } from '@eliteencoder/byoc-sdk'

const dataClient = new DataStreamClient(config)

// Listen for data
dataClient.on('data', (event) => {
  console.log('Received data:', event.data)
})

// Connect
await dataClient.connect({
  streamName: 'my-stream',
  maxLogs: 1000
})

// Disconnect
dataClient.disconnect()
```

## React Hooks

### useStreamPublisher

```tsx
import { useStreamPublisher } from '@eliteencoder/byoc-sdk'

function PublisherComponent() {
  const {
    isStreaming,
    status,
    stats,
    streamInfo,
    localStream,
    start,
    stop,
    updateStream
  } = useStreamPublisher({
    config,
    onStatusChange: (status) => console.log('Status:', status),
    onStatsUpdate: (stats) => console.log('Stats:', stats)
  })

  const handleStart = async () => {
    await start({
      streamName: 'my-stream',
      pipeline: 'video-analysis',
      width: 1280,
      height: 720
    })
  }

  return (
    <div>
      <button onClick={handleStart} disabled={isStreaming}>
        Start Streaming
      </button>
      <button onClick={stop} disabled={!isStreaming}>
        Stop Streaming
      </button>
      <p>Status: {status}</p>
      <p>Bitrate: {stats?.bitrate} kbps</p>
      <p>FPS: {stats?.fps}</p>
    </div>
  )
}
```

### useStreamViewer

```tsx
import { useStreamViewer } from '@eliteencoder/byoc-sdk'
import { useRef } from 'react'

function ViewerComponent({ playbackUrl }: { playbackUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const {
    isViewing,
    status,
    stats,
    start,
    stop
  } = useStreamViewer({
    config,
    videoRef,
    onStatusChange: (status) => console.log('Viewer status:', status)
  })

  const handleStart = async () => {
    await start({ playbackUrl })
  }

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={handleStart} disabled={isViewing}>
        Start Viewing
      </button>
      <button onClick={stop} disabled={!isViewing}>
        Stop Viewing
      </button>
      <p>Status: {status}</p>
      <p>Bitrate: {stats?.bitrate} kbps</p>
    </div>
  )
}
```

### useDataStream

```tsx
import { useDataStream } from '@eliteencoder/byoc-sdk'

function DataStreamComponent({ streamName }: { streamName: string }) {
  const {
    isConnected,
    logs,
    connect,
    disconnect,
    clearLogs
  } = useDataStream({
    config,
    onData: (event) => console.log('Data:', event),
    autoConnect: true,
    streamName
  })

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <button onClick={() => connect({ streamName })}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={clearLogs}>Clear Logs</button>
      <div>
        {logs.map(log => (
          <div key={log.id}>
            {log.type}: {JSON.stringify(log.data)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

### StreamPublisher

#### Methods

- `start(options: StreamStartOptions): Promise<StreamStartResponse>` - Start publishing
- `stop(): Promise<void>` - Stop publishing
- `updateStream(options: StreamUpdateOptions): Promise<void>` - Update stream parameters
- `getMediaDevices(): Promise<MediaDevices>` - Get available media devices
- `requestPermissions(video?, audio?): Promise<void>` - Request media permissions

#### Events

- `statusChange` - Connection status changed
- `statsUpdate` - Connection statistics updated
- `error` - Error occurred
- `mediaStreamReady` - Local media stream is ready
- `streamStarted` - Stream started successfully
- `streamStopped` - Stream stopped

### StreamViewer

#### Methods

- `start(options: ViewerStartOptions): Promise<void>` - Start viewing
- `stop(): Promise<void>` - Stop viewing
- `setVideoElement(element: HTMLVideoElement): void` - Set video element

#### Events

- `statusChange` - Connection status changed
- `statsUpdate` - Connection statistics updated
- `error` - Error occurred
- `videoReady` - Video element is ready
- `viewingStarted` - Viewing started
- `viewingStopped` - Viewing stopped

### DataStreamClient

#### Methods

- `connect(options: DataStreamOptions): Promise<void>` - Connect to data stream
- `disconnect(): void` - Disconnect from data stream
- `getLogs(): DataLog[]` - Get all logs
- `clearLogs(): void` - Clear all logs

#### Events

- `connected` - Connected to data stream
- `disconnected` - Disconnected from data stream
- `data` - Data received
- `error` - Error occurred

## Configuration

```typescript
interface StreamConfig {
  whipUrl: string          // WHIP endpoint for publishing
  whepUrl: string          // WHEP endpoint for viewing
  dataStreamUrl: string    // Data stream SSE endpoint
  kafkaEventsUrl: string   // Kafka events SSE endpoint
  defaultPipeline?: string // Default AI pipeline
}
```

## Stream Options

```typescript
interface StreamStartOptions {
  streamName: string                  // Unique stream name
  pipeline: string                    // AI pipeline name
  width?: number                      // Video width
  height?: number                     // Video height
  enableVideoIngress?: boolean        // Enable video input
  enableVideoEgress?: boolean         // Enable video output
  enableAudioIngress?: boolean        // Enable audio input
  enableAudioEgress?: boolean         // Enable audio output
  enableDataOutput?: boolean          // Enable data output
  fpsLimit?: number                   // FPS limit
  customParams?: Record<string, any>  // Custom pipeline parameters
  streamId?: string                   // Optional stream ID
  cameraDeviceId?: string            // Camera device ID
  microphoneDeviceId?: string        // Microphone device ID
  useScreenShare?: boolean           // Use screen sharing
}
```

## Error Handling

The SDK provides specialized error classes:

```typescript
import { StreamError, ConnectionError, MediaError } from '@eliteencoder/byoc-sdk'

try {
  await publisher.start(options)
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Connection failed:', error.message)
  } else if (error instanceof MediaError) {
    console.error('Media access failed:', error.message)
  } else if (error instanceof StreamError) {
    console.error('Stream error:', error.message)
  }
}
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions, please open an issue on GitHub.

