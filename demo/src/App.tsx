import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  StreamConfig,
  useStreamPublisher,
  useStreamViewer,
  useDataStream
} from '@eliteencoder/byoc-sdk'
import type { ViewerStartOptions, DataStreamEvent } from '@eliteencoder/byoc-sdk'
import '../../examples/simple-demo.css'
import { VideoPreview, StreamControls, StreamInfo, ConsoleLog } from './components'
import type { LogEntry, LogLevel, SavedWorkflow, TextOverlay, StatsOverlay } from './types'
import { extractTextFromPayload } from './utils/text'

const PIPELINES = ['comfystream', 'comfystream-017', 'video-analysis', 'vtuber', 'passthrough', 'noop']
const STREAM_WIDTH = 1280
const STREAM_HEIGHT = 720
const STREAM_FPS = 30
const MAX_VIEWER_RETRIES = 5
const TEXT_OVERLAY_TTL = 6000

const baseFromEnv = (import.meta.env?.VITE_BYOC_BASE_URL as string) || 'https://eliteencoder.net:8088'
const BASE_URL = baseFromEnv.replace(/\/$/, '')

const demoConfig: StreamConfig = {
  whipUrl: `${BASE_URL}/gateway/ai/stream/start`,
  whepUrl: `${BASE_URL}/mediamtx`,
  dataStreamUrl: `${BASE_URL}/gateway`,
  kafkaEventsUrl: `${BASE_URL}/kafka/events`,
  defaultPipeline: 'comfystream'
}

const badgeByStatus: Record<string, string> = {
  connected: 'badge-connected',
  connecting: 'badge-connecting',
  disconnected: 'badge-disconnected',
  error: 'badge-error'
}


function App() {
  const [streamName] = useState(() => `stream-${Date.now()}`)
  const [pipeline, setPipeline] = useState(demoConfig.defaultPipeline ?? PIPELINES[0])
  const [prompts, setPrompts] = useState('')
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])

  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const outputVideoRef = useRef<HTMLVideoElement>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const lastViewerUrlRef = useRef<string>('')
  const viewerRetryTimeoutRef = useRef<number | null>(null)
  const viewerRetryAttemptsRef = useRef(0)
  const overlayTimeoutsRef = useRef<Record<string, number>>({})
  const dataStreamRequestRef = useRef(false)

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    setLogs(prev => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        level,
        message,
        timestamp: Date.now()
      }
      return [...prev.slice(-199), entry]
    })
  }, [])

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(note => note.id !== id))
    const timeoutId = overlayTimeoutsRef.current[id]
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      delete overlayTimeoutsRef.current[id]
    }
  }, [])

  const clearTextOverlays = useCallback(() => {
    Object.values(overlayTimeoutsRef.current).forEach(timeoutId => {
      window.clearTimeout(timeoutId)
    })
    overlayTimeoutsRef.current = {}
    setTextOverlays([])
  }, [])

  useEffect(() => {
    return () => {
      clearTextOverlays()
    }
  }, [clearTextOverlays])

  const addTextOverlay = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }
    const id = `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setTextOverlays(prev => [...prev.slice(-9), { id, text: trimmed, timestamp: Date.now() }])
    const timeoutId = window.setTimeout(() => removeTextOverlay(id), TEXT_OVERLAY_TTL)
    overlayTimeoutsRef.current[id] = timeoutId
  }, [removeTextOverlay])

  const {
    isViewing,
    status: viewerStatus,
    error: viewerError,
    start: startViewing,
    stop: stopViewing
  } = useStreamViewer({
    config: demoConfig,
    videoRef: outputVideoRef,
    onStatusChange: (nextStatus) => addLog(`👁️ Viewer status: ${nextStatus}`, 'info'),
    onViewingStarted: () => addLog('🎥 Output viewer started', 'info'),
    onViewingStopped: () => addLog('👁️ Viewer stopped', 'info'),
    onError: (err) => {
      setErrorBanner(err.message)
      addLog(`⚠️ Viewer error: ${err.message}`, 'warn')
    }
  })

  const handleDataEvent = useCallback((event: DataStreamEvent) => {
    const text = extractTextFromPayload(event?.data)
    if (text) {
      addTextOverlay(text)
    }
  }, [addTextOverlay])

  const {
    isConnected: isDataConnected,
    connect: connectDataStream,
    disconnect: disconnectDataStream
  } = useDataStream({
    config: demoConfig,
    onConnected: () => {
      dataStreamRequestRef.current = false
      addLog('🛰️ Data stream connected', 'info')
    },
    onDisconnected: () => {
      dataStreamRequestRef.current = false
      addLog('🛰️ Data stream disconnected', 'info')
    },
    onData: handleDataEvent,
    onError: (err) => {
      dataStreamRequestRef.current = false
      addLog(`⚠️ Data stream error: ${err.message}`, 'warn')
    }
  })

  const resetViewerRetry = useCallback(() => {
    if (viewerRetryTimeoutRef.current) {
      window.clearTimeout(viewerRetryTimeoutRef.current)
      viewerRetryTimeoutRef.current = null
    }
    viewerRetryAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      resetViewerRetry()
    }
  }, [resetViewerRetry])

  const startViewerWithRetry = useCallback((options: ViewerStartOptions) => {
    resetViewerRetry()

    const attemptStart = () => {
      const attemptNumber = viewerRetryAttemptsRef.current + 1
      viewerRetryAttemptsRef.current = attemptNumber

      startViewing(options)
        .then(() => {
          resetViewerRetry()
        })
        .catch(() => {
          if (attemptNumber < MAX_VIEWER_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 5000)
            viewerRetryTimeoutRef.current = window.setTimeout(attemptStart, delay)
            addLog(`⏳ Retrying viewer in ${(delay / 1000).toFixed(1)}s (attempt ${attemptNumber + 1}/${MAX_VIEWER_RETRIES})`, 'info')
          } else {
            const failureMessage = `Viewer failed to start after ${MAX_VIEWER_RETRIES} attempts.`
            setErrorBanner(failureMessage)
            addLog('❌ Viewer failed to start after multiple attempts. Try stopping and starting the stream again.', 'error')
          }
        })
    }

    attemptStart()
  }, [startViewing, addLog, resetViewerRetry, setErrorBanner])

  const {
    isStreaming,
    status: publisherStatus,
    stats,
    streamInfo,
    localStream,
    error: publisherError,
    start,
    stop,
    updateStream
  } = useStreamPublisher({
    config: demoConfig,
    onStatusChange: (nextStatus) => {
      setErrorBanner(null)
      addLog(`📡 Publisher status: ${nextStatus}`, 'info')
    },
    onStreamStarted: (response) => {
      addLog('✅ Stream started successfully', 'success')
      lastViewerUrlRef.current = response.whepUrl || response.playbackUrl || ''
    },
    onStreamStopped: () => {
      addLog('⏹️ Stream stopped', 'info')
      lastViewerUrlRef.current = ''
      clearTextOverlays()
      stopViewing().catch(() => undefined)
    },
    onError: (err) => {
      setErrorBanner(err.message)
      addLog(`❌ Publisher error: ${err.message}`, 'error')
    }
  })

  useEffect(() => {
    const preview = videoPreviewRef.current
    if (!preview) return
    preview.srcObject = localStream ?? null
  }, [localStream])

  useEffect(() => {
    let cancelled = false
    const loadWorkflows = async () => {
      try {
        const response = await fetch(`${BASE_URL}/workflows/`)
        if (!response.ok) throw new Error('Failed to load workflows')
        const data = await response.json()
        if (cancelled) return
        if (Array.isArray(data)) {
          setWorkflows(data)
          if (data.length > 0) {
            addLog(`✅ Loaded ${data.length} saved workflows`, 'success')
          }
        }
      } catch (error) {
        if (!cancelled) {
          addLog('⚠️ Could not load saved workflows', 'warn')
        }
      }
    }
    loadWorkflows()
    return () => {
      cancelled = true
    }
  }, [addLog])

  useEffect(() => {
    if (!isStreaming) {
      if (isViewing) {
        stopViewing().catch(() => undefined)
      }
      lastViewerUrlRef.current = ''
      resetViewerRetry()
      return
    }

    const targetUrl = streamInfo?.whepUrl || streamInfo?.playbackUrl
    if (!targetUrl) return
    if (lastViewerUrlRef.current === targetUrl && isViewing) {
      return
    }

    lastViewerUrlRef.current = targetUrl
    startViewerWithRetry({
      whepUrl: streamInfo?.whepUrl || undefined,
      playbackUrl: streamInfo?.playbackUrl || undefined
    })
  }, [
    isStreaming,
    isViewing,
    streamInfo?.whepUrl,
    streamInfo?.playbackUrl,
    startViewerWithRetry,
    stopViewing,
    addLog,
    resetViewerRetry
  ])

  useEffect(() => {
    const container = logContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    if (isStreaming && streamInfo?.streamId) {
      if (!isDataConnected && !dataStreamRequestRef.current) {
        dataStreamRequestRef.current = true
        connectDataStream({
          streamName,
          dataUrl: streamInfo?.dataUrl || undefined,
          maxLogs: 250
        }).catch((error) => {
          dataStreamRequestRef.current = false
          const message = error instanceof Error ? error.message : String(error)
          addLog(`⚠️ Failed to connect data stream: ${message}`, 'warn')
        })
      }
    } else {
      if (isDataConnected || dataStreamRequestRef.current) {
        disconnectDataStream()
      }
      dataStreamRequestRef.current = false
      clearTextOverlays()
    }
  }, [
    isStreaming,
    streamInfo?.streamId,
    streamInfo?.dataUrl,
    isDataConnected,
    streamName,
    connectDataStream,
    disconnectDataStream,
    addLog,
    clearTextOverlays
  ])

  const handleWorkflowChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const workflowId = event.target.value
    setSelectedWorkflowId(workflowId)
    if (!workflowId) {
      setPrompts('')
      return
    }
    const workflow = workflows.find((w) => w.id === workflowId)
    if (workflow) {
      setPrompts(workflow.prompts || '')
      const name = workflow.name || workflow.title || workflow.id
      addLog(`📋 Loaded workflow: ${name}`, 'info')
    }
  }

  const handlePipelineSelect = (value: string) => {
    setPipeline(value)
  }

  const handlePromptsChange = (value: string) => {
    setPrompts(value)
  }

  const handleStart = async () => {
    setErrorBanner(null)
    addLog('🎬 Starting stream...', 'info')
    try {
      await start({
        streamName,
        pipeline,
        width: STREAM_WIDTH,
        height: STREAM_HEIGHT,
        fpsLimit: STREAM_FPS,
        enableVideoIngress: true,
        enableAudioIngress: true,
        enableVideoEgress: true,
        enableAudioEgress: true,
        enableDataOutput: true,
        customParams: prompts ? { prompts } : {}
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorBanner(message)
      addLog(`❌ Failed to start: ${message}`, 'error')
    }
  }

  const handleStop = async () => {
    addLog('⏹️ Stopping stream...', 'info')
    try {
      await stop()
      await stopViewing()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorBanner(message)
      addLog(`⚠️ Failed to stop: ${message}`, 'warn')
    }
  }

  const handleUpdatePrompts = async () => {
    const trimmed = prompts.trim()
    if (!trimmed) {
      const message = 'Enter prompts before sending an update.'
      setErrorBanner(message)
      addLog('⚠️ Prompt update skipped (empty input)', 'warn')
      return
    }
    addLog('🔄 Updating prompts...', 'info')
    try {
      await updateStream({ params: { prompts: trimmed } })
      addLog('✅ Prompts updated successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorBanner(message)
      addLog(`❌ Failed to update prompts: ${message}`, 'error')
    }
  }

  const combinedError = errorBanner || publisherError?.message || viewerError?.message || null
  const badgeClass = `badge ${badgeByStatus[publisherStatus] || 'badge-disconnected'}`

  const statsOverlay = useMemo<StatsOverlay>(() => ({
    bitrate: stats ? `${stats.bitrate} kbps` : '0 kbps',
    fps: stats ? `${stats.fps}` : '0',
    resolution: stats?.resolution || '-',
    latency: stats?.latency !== undefined ? `${stats.latency} ms` : 'N/A'
  }), [stats])

  return (
    <div className="container">
      <div className="header">
        <h1>🎥 BYOC Stream SDK Demo</h1>
        <p>Simple video and audio streaming with AI processing</p>
      </div>

      <div className="content">
        <VideoPreview
          outputVideoRef={outputVideoRef}
          previewVideoRef={videoPreviewRef}
          stats={statsOverlay}
          hasStats={Boolean(stats)}
          textOverlays={textOverlays}
        />

        <StreamControls
          badgeClass={badgeClass}
          publisherStatus={publisherStatus}
          isStreaming={isStreaming}
          viewerStatus={viewerStatus}
          streamInfo={streamInfo}
          config={demoConfig}
          combinedError={combinedError}
          streamName={streamName}
          pipeline={pipeline}
          pipelines={PIPELINES}
          onPipelineChange={handlePipelineSelect}
          selectedWorkflowId={selectedWorkflowId}
          workflows={workflows}
          onWorkflowChange={handleWorkflowChange}
          prompts={prompts}
          onPromptChange={handlePromptsChange}
          onStart={handleStart}
          onStop={handleStop}
          onUpdatePrompts={handleUpdatePrompts}
        />

        <StreamInfo streamInfo={streamInfo} config={demoConfig} />
        <ConsoleLog logs={logs} containerRef={logContainerRef} />
      </div>
    </div>
  )
}

export default App

