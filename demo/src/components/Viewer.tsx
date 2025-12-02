import { useState, useRef } from 'react'
import { useStreamViewer, StreamConfig } from '@eliteencoder/byoc-sdk'
import './Viewer.css'

interface ViewerProps {
  config: StreamConfig
  playbackUrl: string
}

function Viewer({ config, playbackUrl: initialPlaybackUrl }: ViewerProps) {
  const [playbackUrl, setPlaybackUrl] = useState(initialPlaybackUrl)
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    isViewing,
    status,
    stats,
    error,
    start,
    stop,
  } = useStreamViewer({
    config,
    videoRef,
    onStatusChange: (status) => {
      console.log('Viewer status:', status)
    },
    onStatsUpdate: (stats) => {
      console.log('Viewer stats:', stats)
    },
    onError: (error) => {
      console.error('Viewer error:', error)
    },
    onViewingStarted: () => {
      console.log('Viewing started')
    }
  })

  const handleStart = async () => {
    if (!playbackUrl) {
      alert('Please enter a playback URL or start a stream from the Publisher tab')
      return
    }

    try {
      await start({ playbackUrl })
    } catch (error) {
      console.error('Failed to start viewing:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stop()
    } catch (error) {
      console.error('Failed to stop viewing:', error)
    }
  }

  return (
    <div className="viewer">
      <h2>👁️ Stream Viewer</h2>

      {/* Configuration Card */}
      <div className="card">
        <h3>Configuration</h3>
        <div className="form-group">
          <label>Playback URL</label>
          <input
            type="text"
            value={playbackUrl}
            onChange={(e) => setPlaybackUrl(e.target.value)}
            disabled={isViewing}
            placeholder="Enter WHEP playback URL or start stream from Publisher"
          />
          {initialPlaybackUrl && !playbackUrl && (
            <button
              onClick={() => setPlaybackUrl(initialPlaybackUrl)}
              className="btn-link"
            >
              Use URL from Publisher
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <h3>Controls</h3>
        <div className="button-group">
          <button
            onClick={handleStart}
            disabled={isViewing || !playbackUrl}
            className="btn-primary"
          >
            ▶️ Start Viewing
          </button>
          <button
            onClick={handleStop}
            disabled={!isViewing}
            className="btn-danger"
          >
            ⏹️ Stop Viewing
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="card">
        <h3>Status</h3>
        <div className="status-info">
          <div className="stat">
            <span className="label">Connection:</span>
            <span className={`value ${isViewing ? 'connected' : ''}`}>
              {status}
            </span>
          </div>
          <div className="stat">
            <span className="label">Viewing:</span>
            <span className={`value ${isViewing ? 'active' : ''}`}>
              {isViewing ? '🟢 Active' : '🔴 Inactive'}
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
            {(stats as any).packetsReceived !== undefined && (
              <div className="stat">
                <span className="label">Packets Received:</span>
                <span className="value">{(stats as any).packetsReceived}</span>
              </div>
            )}
            {(stats as any).jitter !== undefined && (
              <div className="stat">
                <span className="label">Jitter:</span>
                <span className="value">{(stats as any).jitter.toFixed(2)} ms</span>
              </div>
            )}
            {(stats as any).packetsLost !== undefined && (
              <div className="stat">
                <span className="label">Packets Lost:</span>
                <span className="value">{(stats as any).packetsLost}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="card">
        <h3>Video Player</h3>
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className="video-player"
          />
          {!isViewing && (
            <div className="video-placeholder">
              <p>No stream playing</p>
              <p className="hint">Enter a playback URL and click Start Viewing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Viewer

