/**
 * Simple React Example
 * 
 * This example demonstrates how to use the BYOC SDK with React
 * to publish video and audio streams.
 * 
 * Server Configuration:
 * - Gateway (WHIP): https://eliteencoder.net:8088/gateway/ai/stream/start
 * - MediaMTX (WHEP): https://eliteencoder.net:8088/mediamtx
 * - Data Stream: https://eliteencoder.net:8088/gateway/ai/stream/{streamName}/data
 * - Events (Kafka): https://eliteencoder.net:8088/kafka/events
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  useStreamPublisher, 
  useDataStream,
  StreamConfig 
} from '@eliteencoder/byoc-sdk'

// Configure SDK with your server endpoints
const config: StreamConfig = {
  whipUrl: 'https://eliteencoder.net:8088/gateway/ai/stream/start',
  whepUrl: 'https://eliteencoder.net:8088/mediamtx',
  dataStreamUrl: 'https://eliteencoder.net:8088/gateway',
  kafkaEventsUrl: 'https://eliteencoder.net:8088/kafka/events',
  defaultPipeline: 'comfystream'
}

export function SimpleStreamApp() {
  // Generate unique stream name
  const [streamName] = useState(`stream-${Date.now()}`)
  const [prompts, setPrompts] = useState('Analyze this video stream')
  const [dataEvents, setDataEvents] = useState<any[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Setup stream publisher
  const {
    isStreaming,
    status,
    stats,
    streamInfo,
    localStream,
    error,
    start,
    stop,
    updateStream
  } = useStreamPublisher({
    config,
    onStatusChange: (status) => {
      console.log('📡 Status:', status)
    },
    onStatsUpdate: (stats) => {
      console.log('📊 Stats:', stats)
    },
    onError: (error) => {
      console.error('❌ Error:', error)
    },
    onStreamStarted: (response) => {
      console.log('✅ Stream started:', response)
    }
  })

  // Setup data stream to receive processed data
  const dataStream = useDataStream({
    config,
    streamName,
    autoConnect: isStreaming,
    onData: (event) => {
      console.log('📦 Data event:', event)
      setDataEvents(prev => [...prev.slice(-9), event])
    },
    onError: (error) => {
      console.error('❌ Data stream error:', error)
    }
  })

  // Display local video preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Start streaming
  const handleStart = async () => {
    try {
      await start({
        streamName,
        pipeline: 'comfystream',
        width: 1280,
        height: 720,
        fpsLimit: 30,
        enableVideoIngress: true,
        enableAudioIngress: true,
        enableVideoEgress: true,
        enableAudioEgress: true,
        enableDataOutput: true,
        customParams: {
          prompts
        }
      })
    } catch (error) {
      console.error('Failed to start stream:', error)
    }
  }

  // Stop streaming
  const handleStop = async () => {
    try {
      await stop()
      setDataEvents([])
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }

  // Update stream parameters
  const handleUpdatePrompts = async () => {
    try {
      await updateStream({
        params: { prompts }
      })
      console.log('✅ Stream updated with new prompts')
    } catch (error) {
      console.error('Failed to update stream:', error)
    }
  }

  // Format stats for display
  const formatStats = (stats: any) => {
    if (!stats) return null
    return {
      bitrate: `${(stats.bitrate / 1000).toFixed(2)} kbps`,
      fps: `${stats.fps} fps`,
      resolution: stats.resolution,
      latency: stats.latency ? `${stats.latency}ms` : 'N/A'
    }
  }

  return (
    <div style={styles.container}>
      <h1>🎥 Simple BYOC Stream App</h1>
      
      {/* Stream Controls */}
      <div style={styles.section}>
        <h2>Stream Controls</h2>
        <div style={styles.controls}>
          <input
            type="text"
            value={streamName}
            disabled
            placeholder="Stream Name"
            style={styles.input}
          />
          
          {!isStreaming ? (
            <button onClick={handleStart} style={styles.button}>
              ▶️ Start Stream
            </button>
          ) : (
            <button onClick={handleStop} style={styles.buttonStop}>
              ⏹️ Stop Stream
            </button>
          )}
        </div>

        {/* Status Display */}
        <div style={styles.statusBar}>
          <span style={styles.statusBadge(status)}>
            {status.toUpperCase()}
          </span>
          {isStreaming && (
            <span style={styles.statusInfo}>
              🔴 LIVE - Stream ID: {streamInfo?.streamId}
            </span>
          )}
        </div>

        {error && (
          <div style={styles.error}>
            ❌ {error.message}
          </div>
        )}
      </div>

      {/* Video Preview */}
      <div style={styles.section}>
        <h2>Video Preview</h2>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={styles.video}
        />
      </div>

      {/* Prompts Update */}
      {isStreaming && (
        <div style={styles.section}>
          <h2>Update Stream Parameters</h2>
          <div style={styles.controls}>
            <input
              type="text"
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              placeholder="Enter prompts..."
              style={styles.input}
            />
            <button onClick={handleUpdatePrompts} style={styles.button}>
              🔄 Update Prompts
            </button>
          </div>
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div style={styles.section}>
          <h2>Stream Statistics</h2>
          <div style={styles.stats}>
            {Object.entries(formatStats(stats) || {}).map(([key, value]) => (
              <div key={key} style={styles.statItem}>
                <span style={styles.statLabel}>{key}:</span>
                <span style={styles.statValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stream Info */}
      {streamInfo && (
        <div style={styles.section}>
          <h2>Stream Information</h2>
          <div style={styles.info}>
            <div><strong>Stream ID:</strong> {streamInfo.streamId}</div>
            <div><strong>WHEP URL:</strong> {streamInfo.whepUrl}</div>
            <div><strong>Data Stream:</strong> {streamInfo.dataUrl}</div>
          </div>
        </div>
      )}

      {/* Data Events */}
      {dataEvents.length > 0 && (
        <div style={styles.section}>
          <h2>Data Events (Last 10)</h2>
          <div style={styles.events}>
            {dataEvents.map((event, idx) => (
              <div key={idx} style={styles.event}>
                <pre>{JSON.stringify(event, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonStop: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    backgroundColor: 
      status === 'connected' ? '#28a745' :
      status === 'connecting' ? '#ffc107' :
      '#6c757d',
    color: 'white'
  }),
  statusInfo: {
    fontSize: '14px',
    color: '#666'
  },
  error: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px'
  },
  video: {
    width: '100%',
    maxWidth: '640px',
    backgroundColor: '#000',
    borderRadius: '8px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px'
  },
  statLabel: {
    fontWeight: 'bold' as const,
    textTransform: 'capitalize' as const
  },
  statValue: {
    color: '#007bff'
  },
  info: {
    fontSize: '14px',
    lineHeight: '1.8'
  },
  events: {
    maxHeight: '400px',
    overflowY: 'auto' as const
  },
  event: {
    marginBottom: '10px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '12px'
  }
}

export default SimpleStreamApp

