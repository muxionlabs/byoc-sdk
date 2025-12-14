import { StreamStartResponse } from '@muxionlabs/byoc-sdk'

interface StreamInfoProps {
  streamInfo: StreamStartResponse | null
}

export function StreamInfo({ streamInfo }: StreamInfoProps) {
  return (
    <section className="section">
      <h2>Stream Information</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Playback URL</span>
          <span className="info-value">{streamInfo?.playbackUrl || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">WHEP URL</span>
          <span className="info-value">{streamInfo?.whepUrl || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Data URL</span>
          <span className="info-value">{streamInfo?.dataUrl || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Update URL</span>
          <span className="info-value">{streamInfo?.updateUrl || '-'}</span>
        </div>
      </div>
    </section>
  )
}

