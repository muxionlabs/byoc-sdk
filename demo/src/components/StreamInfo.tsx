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
          <span className="info-label">WHIP URL</span>
          <span className="info-value">{streamInfo?.whipUrl || '-'}</span>
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
        <div className="info-item">
          <span className="info-label">Status URL</span>
          <span className="info-value">{streamInfo?.statusUrl || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">RTMP Output</span>
          <span className="info-value">{streamInfo?.rtmpOutputUrl || '-'}</span>
        </div>
      </div>
    </section>
  )
}

