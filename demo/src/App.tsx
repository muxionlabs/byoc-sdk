import { useState } from 'react'
import { StreamConfig } from '@eliteencoder/byoc-sdk'
import Publisher from './components/Publisher'
import Viewer from './components/Viewer'
import './App.css'

// Get config from environment or use defaults for local development
const host = (import.meta.env?.VITE_HOST as string) || window.location.hostname || 'localhost'
const isProduction = window.location.port === '8088' || window.location.port === '443'
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'

// In production (served from port 8088), use Caddy proxy paths
// In development (served from port 3005), connect directly to service ports
const config: StreamConfig = isProduction ? {
  whipUrl: `${protocol}//${host}:${window.location.port}/gateway/ai/stream/start`,
  whepUrl: `${protocol}//${host}:${window.location.port}/mediamtx`,
  dataStreamUrl: `${protocol}//${host}:${window.location.port}/gateway`,
  kafkaEventsUrl: `${protocol}//${host}:${window.location.port}/kafka/events`,
  defaultPipeline: 'comfystream'
} : {
  whipUrl: `${protocol}//${host}:7280/whip`,
  whepUrl: `${protocol}//${host}:8088/mediamtx`,
  dataStreamUrl: `${protocol}//${host}:5937`,
  kafkaEventsUrl: `${protocol}//${host}:7114`,
  defaultPipeline: 'comfystream'
}

type View = 'publisher' | 'viewer'

function App() {
  const [view, setView] = useState<View>('publisher')
  const [playbackUrl, setPlaybackUrl] = useState<string>('')

  return (
    <div className="app">
      <header className="header">
        <h1>🎥 BYOC SDK Demo</h1>
        <p className="subtitle">Live Video Streaming with AI Processing</p>
      </header>

      <div className="nav">
        <button
          className={view === 'publisher' ? 'active' : ''}
          onClick={() => setView('publisher')}
        >
          📹 Publisher
        </button>
        <button
          className={view === 'viewer' ? 'active' : ''}
          onClick={() => setView('viewer')}
        >
          👁️ Viewer
        </button>
      </div>

      <div className="container">
        {view === 'publisher' && (
          <Publisher config={config} onStreamStarted={setPlaybackUrl} />
        )}
        {view === 'viewer' && (
          <Viewer config={config} playbackUrl={playbackUrl} />
        )}
      </div>

      <footer className="footer">
        <p>
          Configuration: WHIP: <code>{config.whipUrl}</code> | WHEP: <code>{config.whepUrl}</code>
        </p>
      </footer>
    </div>
  )
}

export default App

