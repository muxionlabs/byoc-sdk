import { RefObject } from 'react'
import { StatsOverlay, TextOverlay } from '../types'

interface VideoPreviewProps {
  outputVideoRef: RefObject<HTMLVideoElement | null>
  previewVideoRef: RefObject<HTMLVideoElement | null>
  stats: StatsOverlay
  hasStats: boolean
  textOverlays: TextOverlay[]
}

export function VideoPreview({
  outputVideoRef,
  previewVideoRef,
  stats,
  hasStats,
  textOverlays
}: VideoPreviewProps) {
  return (
    <section className="section">
      <div className="video-container">
        <video ref={outputVideoRef} autoPlay playsInline controls />
        <video ref={previewVideoRef} className="pip-preview" autoPlay playsInline muted />
        <div className={`video-stats-overlay ${hasStats ? 'visible' : ''}`}>
          <div className="stat-line">
            <strong>Bitrate:</strong> <span>{stats.bitrate}</span>
          </div>
          <div className="stat-line">
            <strong>FPS:</strong> <span>{stats.fps}</span>
          </div>
          <div className="stat-line">
            <strong>Res:</strong> <span>{stats.resolution}</span>
          </div>
          <div className="stat-line">
            <strong>Latency:</strong> <span>{stats.latency}</span>
          </div>
        </div>
        {textOverlays.length > 0 && (
          <div className="video-overlay-toasts">
            {textOverlays.map((toast) => (
              <div key={toast.id} className="video-overlay-toast">
                {toast.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

