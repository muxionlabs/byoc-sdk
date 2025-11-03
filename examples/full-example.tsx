/**
 * Full Featured Example
 * 
 * This example demonstrates all SDK features:
 * - Stream publishing with camera/screen share
 * - Stream viewing
 * - Real-time data streaming
 * - Event streaming
 * - Stream updates
 */

import React, { useState, useRef } from 'react'
import {
  useStreamPublisher,
  useStreamViewer,
  useDataStream,
  useEventStream,
  StreamConfig
} from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  whipUrl: 'https://your-server.com/gateway/ai/stream/start',
  whepUrl: 'https://your-server.com/mediamtx',
  dataStreamUrl: 'https://your-server.com/gateway',
  kafkaEventsUrl: 'https://your-server.com/kafka/events',
  defaultPipeline: 'video-analysis'
}

export function FullExample() {
  const [streamName, setStreamName] = useState(`stream-${Date.now()}`)
  const [pipeline, setPipeline] = useState('video-analysis')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Publisher
  const publisher = useStreamPublisher({
    config,
    onStatusChange: (status) => console.log('Publisher:', status),
    onStatsUpdate: (stats) => console.log('Publisher stats:', stats)
  })

  // Viewer
  const viewer = useStreamViewer({
    config,
    videoRef,
    onStatusChange: (status) => console.log('Viewer:', status),
    onStatsUpdate: (stats) => console.log('Viewer stats:', stats)
  })

  // Data Stream
  const dataStream = useDataStream({
    config,
    streamName,
    autoConnect: publisher.isStreaming,
    onData: (event) => console.log('Data:', event)
  })

  // Event Stream
  const eventStream = useEventStream({
    config,
    streamName,
    autoConnect: publisher.isStreaming,
    onEvent: (event) => console.log('Event:', event)
  })

  // Publisher handlers
  const handleStartPublishing = async () => {
    try {
      await publisher.start({
        streamName,
        pipeline,
        width: 1280,
        height: 720,
        fpsLimit: 30,
        enableVideoIngress: true,
        enableAudioIngress: true
      })
    } catch (error) {
      console.error('Failed to start publishing:', error)
    }
  }

  const handleStopPublishing = async () => {
    try {
      await publisher.stop()
    } catch (error) {
      console.error('Failed to stop publishing:', error)
    }
  }

  // Viewer handlers
  const handleStartViewing = async () => {
    if (!publisher.streamInfo?.playbackUrl) {
      alert('No playback URL available. Start publishing first.')
      return
    }

    try {
      await viewer.start({
        playbackUrl: publisher.streamInfo.playbackUrl
      })
    } catch (error) {
      console.error('Failed to start viewing:', error)
    }
  }

  const handleStopViewing = async () => {
    try {
      await viewer.stop()
    } catch (error) {
      console.error('Failed to stop viewing:', error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Livepeer BYOC Stream SDK - Full Example</h1>

      {/* Configuration */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Configuration</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Stream Name:
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              disabled={publisher.isStreaming}
              style={{ marginLeft: '10px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Pipeline:
            <input
              type="text"
              value={pipeline}
              onChange={(e) => setPipeline(e.target.value)}
              disabled={publisher.isStreaming}
              style={{ marginLeft: '10px', width: '300px' }}
            />
          </label>
        </div>
      </div>

      {/* Publisher Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>📹 Publisher</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={handleStartPublishing}
            disabled={publisher.isStreaming}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            Start Publishing
          </button>
          <button
            onClick={handleStopPublishing}
            disabled={!publisher.isStreaming}
            style={{ padding: '10px 20px' }}
          >
            Stop Publishing
          </button>
        </div>
        <p>Status: <strong>{publisher.status}</strong></p>
        {publisher.stats && (
          <div>
            <p>Bitrate: {publisher.stats.bitrate} kbps</p>
            <p>FPS: {publisher.stats.fps}</p>
            <p>Resolution: {publisher.stats.resolution}</p>
          </div>
        )}
        {publisher.localStream && (
          <div style={{ marginTop: '10px' }}>
            <h3>Local Preview</h3>
            <video
              autoPlay
              muted
              playsInline
              ref={(video) => {
                if (video && publisher.localStream) {
                  video.srcObject = publisher.localStream
                }
              }}
              style={{ width: '100%', maxWidth: '640px', border: '1px solid #ccc' }}
            />
          </div>
        )}
      </div>

      {/* Viewer Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>📺 Viewer</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={handleStartViewing}
            disabled={viewer.isViewing || !publisher.streamInfo}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            Start Viewing
          </button>
          <button
            onClick={handleStopViewing}
            disabled={!viewer.isViewing}
            style={{ padding: '10px 20px' }}
          >
            Stop Viewing
          </button>
        </div>
        <p>Status: <strong>{viewer.status}</strong></p>
        {viewer.stats && (
          <div>
            <p>Bitrate: {viewer.stats.bitrate} kbps</p>
            <p>FPS: {viewer.stats.fps}</p>
            <p>Resolution: {viewer.stats.resolution}</p>
          </div>
        )}
        <div style={{ marginTop: '10px' }}>
          <h3>Remote Stream</h3>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '640px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* Data Stream Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>📊 Data Stream</h2>
        <p>Connected: <strong>{dataStream.isConnected ? 'Yes' : 'No'}</strong></p>
        <p>Logs: {dataStream.logs.length}</p>
        <button onClick={dataStream.clearLogs} style={{ padding: '5px 10px' }}>
          Clear Logs
        </button>
        <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
          {dataStream.logs.slice(-10).map(log => (
            <div key={log.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
              <strong>{log.type}:</strong> {JSON.stringify(log.data)}
            </div>
          ))}
        </div>
      </div>

      {/* Event Stream Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>📝 Event Stream</h2>
        <p>Connected: <strong>{eventStream.isConnected ? 'Yes' : 'No'}</strong></p>
        <p>Events: {eventStream.events.length}</p>
        <button onClick={eventStream.clearEvents} style={{ padding: '5px 10px' }}>
          Clear Events
        </button>
        <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
          {eventStream.events.slice(-10).map(event => (
            <div key={event.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
              <strong>[{event.level}]</strong> {event.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

