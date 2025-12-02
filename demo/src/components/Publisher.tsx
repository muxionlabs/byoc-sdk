import { useState, useRef } from 'react'
import { useStreamPublisher, StreamConfig } from '@eliteencoder/byoc-sdk'
import './Publisher.css'

interface PublisherProps {
  config: StreamConfig
  onStreamStarted: (playbackUrl: string) => void
}

function Publisher({ config, onStreamStarted }: PublisherProps) {
  const [streamName, setStreamName] = useState(`stream-${Date.now()}`)
  const [pipeline, setPipeline] = useState('comfystream')
  const [prompts, setPrompts] = useState('')
  const [width, setWidth] = useState(1280)
  const [height, setHeight] = useState(720)
  const [fps, setFps] = useState(30)
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    isStreaming,
    status,
    stats,
    streamInfo,
    localStream,
    error,
    start,
    stop,
    updateStream,
  } = useStreamPublisher({
    config,
    onStatusChange: (status) => {
      console.log('Publisher status:', status)
    },
    onStatsUpdate: (stats) => {
      console.log('Stats:', stats)
    },
    onError: (error) => {
      console.error('Publisher error:', error)
    },
    onStreamStarted: (response) => {
      console.log('Stream started:', response)
      if (response.playbackUrl) {
        onStreamStarted(response.playbackUrl)
      }
    }
  })

  // Update video element when localStream changes
  if (videoRef.current && localStream) {
    videoRef.current.srcObject = localStream
  }

  const handleStart = async () => {
    try {
      await start({
        streamName,
        pipeline,
        width,
        height,
        fpsLimit: fps,
        enableVideoIngress: true,
        enableAudioIngress: true,
        enableVideoEgress: true,
        enableAudioEgress: true,
        customParams: prompts ? { prompts } : {}
      })
    } catch (error) {
      console.error('Failed to start stream:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stop()
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }

  const handleUpdatePrompts = async () => {
    try {
      await updateStream({
        params: { prompts }
      })
      alert('Prompts updated successfully!')
    } catch (error) {
      console.error('Failed to update stream:', error)
      alert('Failed to update prompts')
    }
  }

  return (
    <div className="publisher">
      <h2>📹 Stream Publisher</h2>

      {/* Configuration Card */}
      <div className="card">
        <h3>Configuration</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Stream Name</label>
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              disabled={isStreaming}
              placeholder="Enter unique stream name"
            />
          </div>

          <div className="form-group">
            <label>Pipeline</label>
            <input
              type="text"
              value={pipeline}
              onChange={(e) => setPipeline(e.target.value)}
              disabled={isStreaming}
              placeholder="comfystream"
            />
          </div>

          <div className="form-group">
            <label>Width</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              disabled={isStreaming}
            />
          </div>

          <div className="form-group">
            <label>Height</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              disabled={isStreaming}
            />
          </div>

          <div className="form-group">
            <label>FPS Limit</label>
            <input
              type="number"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              disabled={isStreaming}
            />
          </div>
        </div>

        <div className="form-group">
          <label>AI Prompts</label>
          <textarea
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            placeholder="Enter AI processing prompts..."
            rows={3}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <h3>Controls</h3>
        <div className="button-group">
          <button
            onClick={handleStart}
            disabled={isStreaming}
            className="btn-primary"
          >
            ▶️ Start Streaming
          </button>
          <button
            onClick={handleStop}
            disabled={!isStreaming}
            className="btn-danger"
          >
            ⏹️ Stop Streaming
          </button>
          <button
            onClick={handleUpdatePrompts}
            disabled={!isStreaming}
            className="btn-secondary"
          >
            🔄 Update Prompts
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="card">
        <h3>Status</h3>
        <div className="status-info">
          <div className="stat">
            <span className="label">Connection:</span>
            <span className={`value ${isStreaming ? 'connected' : ''}`}>
              {status}
            </span>
          </div>
          <div className="stat">
            <span className="label">Streaming:</span>
            <span className={`value ${isStreaming ? 'active' : ''}`}>
              {isStreaming ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        </div>
        {error && <div className="error">⚠️ {error.message}</div>}
      </div>

      {/* Stats */}
      {stats && (
        <div className="card">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="label">Bitrate:</span>
              <span className="value">{stats.bitrate} kbps</span>
            </div>
            <div className="stat">
              <span className="label">FPS:</span>
              <span className="value">{stats.fps}</span>
            </div>
            <div className="stat">
              <span className="label">Resolution:</span>
              <span className="value">{stats.resolution}</span>
            </div>
            {(stats as any).packetsSent !== undefined && (
              <div className="stat">
                <span className="label">Packets Sent:</span>
                <span className="value">{(stats as any).packetsSent}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stream Info */}
      {streamInfo && (
        <div className="card">
          <h3>Stream Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Stream ID:</span>
              <code>{streamInfo.streamId}</code>
            </div>
            {streamInfo.playbackUrl && (
              <div className="info-item">
                <span className="label">Playback URL:</span>
                <code>{streamInfo.playbackUrl}</code>
              </div>
            )}
            {streamInfo.dataUrl && (
              <div className="info-item">
                <span className="label">Data URL:</span>
                <code>{streamInfo.dataUrl}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Preview */}
      {localStream && (
        <div className="card">
          <h3>Local Preview</h3>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="video-preview"
          />
        </div>
      )}
    </div>
  )
}

export default Publisher

