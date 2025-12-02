/**
 * Core types and interfaces for Livepeer BYOC Stream SDK
 */

// ============================================================================
// Stream Configuration Types
// ============================================================================

export interface StreamConfig {
  /** Base URL for the WHIP endpoint (stream start) */
  whipUrl: string
  /** Base URL for the WHEP endpoint (stream viewing) */
  whepUrl: string
  /** Base URL for data streaming (SSE) */
  dataStreamUrl: string
  /** Base URL for Kafka events (SSE) */
  kafkaEventsUrl: string
  /** Default pipeline name */
  defaultPipeline?: string
  /** ICE servers for WebRTC connection (optional, uses defaults if not provided) */
  iceServers?: RTCIceServer[]
}

export interface StreamStartOptions {
  /** Unique name for the stream */
  streamName: string
  /** Pipeline to use for processing (e.g., 'comfystream', 'video-analysis') */
  pipeline: string
  /** Video resolution width */
  width?: number
  /** Video resolution height */
  height?: number
  /** Enable video input */
  enableVideoIngress?: boolean
  /** Enable video output */
  enableVideoEgress?: boolean
  /** Enable audio input */
  enableAudioIngress?: boolean
  /** Enable audio output */
  enableAudioEgress?: boolean
  /** Enable data output stream */
  enableDataOutput?: boolean
  /** FPS limit */
  fpsLimit?: number
  /** Custom parameters to pass to the pipeline */
  customParams?: Record<string, any>
  /** Stream ID (optional, will be generated if not provided) */
  streamId?: string
  /** Media constraints for getUserMedia */
  mediaConstraints?: MediaStreamConstraints
  /** Selected camera device ID */
  cameraDeviceId?: string
  /** Selected microphone device ID */
  microphoneDeviceId?: string
  /** Use screen share instead of camera */
  useScreenShare?: boolean
}

export interface StreamUpdateOptions {
  /** Custom parameters to update (width/height require restarting the stream) */
  params: Record<string, any>
}

export interface ViewerStartOptions {
  /** Playback URL (optional if using WHEP URL from stream start) */
  playbackUrl?: string
  /** WHEP URL override (optional, uses config if not provided) */
  whepUrl?: string
}

// ============================================================================
// Stream Response Types
// ============================================================================

export interface StreamStartResponse {
  /** Stream ID assigned by the server */
  streamId: string
  /** Playback URL for viewing the stream */
  playbackUrl: string | null
  /** WHEP URL for WebRTC viewing */
  whepUrl: string | null
  /** Data stream URL for SSE */
  dataUrl: string | null
  /** Status URL for polling stream status */
  statusUrl: string | null
  /** Update URL for sending parameter updates */
  updateUrl: string | null
  /** RTMP URL for RTMP streaming (if applicable) */
  rtmpUrl: string | null
  /** Location header from WHIP response */
  locationHeader: string | null
}

export interface WhipOfferResponse {
  status: number
  answerSdp: string
  streamId: string | null
  playbackUrl: string | null
  locationHeader: string | null
}

export interface WhepOfferResponse {
  status: number
  answerSdp: string
  locationHeader: string | null
}

// ============================================================================
// Connection Status Types
// ============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ConnectionStats {
  bitrate: number
  fps: number
  resolution: string
  latency?: number
  streamId?: string | null
}

// ============================================================================
// Data Stream Types
// ============================================================================

export interface DataStreamOptions {
  /** Stream name to subscribe to */
  streamName: string
  /** Data URL override (uses config if not provided) */
  dataUrl?: string
  /** Maximum number of logs to keep in memory */
  maxLogs?: number
  /** Auto-scroll to latest data */
  autoScroll?: boolean
}

export interface DataLog {
  id: string
  type: string
  data: any
  timestamp?: number
  expanded?: boolean
}

export interface DataStreamEvent {
  type: string
  data: any
  timestamp: number
}

// ============================================================================
// Event Stream Types
// ============================================================================

export interface EventStreamOptions {
  /** Stream name to subscribe to */
  streamName: string
  /** Kafka events URL override (uses config if not provided) */
  kafkaEventsUrl?: string
  /** Maximum number of events to keep in memory */
  maxEvents?: number
}

export interface EventLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: number
  data?: any
}

// ============================================================================
// Media Device Types
// ============================================================================

export interface MediaDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

export interface MediaDevices {
  cameras: MediaDevice[]
  microphones: MediaDevice[]
  speakers: MediaDevice[]
}

// ============================================================================
// Error Types
// ============================================================================

export class StreamError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'StreamError'
  }
}

export class ConnectionError extends StreamError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details)
    this.name = 'ConnectionError'
  }
}

export class MediaError extends StreamError {
  constructor(message: string, details?: any) {
    super(message, 'MEDIA_ERROR', details)
    this.name = 'MediaError'
  }
}

// ============================================================================
// Event Types
// ============================================================================

export type StreamPublisherEventMap = {
  statusChange: ConnectionStatus
  statsUpdate: ConnectionStats
  error: StreamError
  mediaStreamReady: MediaStream
  streamStarted: StreamStartResponse
  streamStopped: void
  streamUpdated: void
}

export type StreamViewerEventMap = {
  statusChange: ConnectionStatus
  statsUpdate: ConnectionStats
  error: StreamError
  videoReady: HTMLVideoElement
  viewingStarted: void
  viewingStopped: void
}

export type DataStreamEventMap = {
  connected: void
  disconnected: void
  data: DataStreamEvent
  error: Error
}

export type EventStreamEventMap = {
  connected: void
  disconnected: void
  event: EventLog
  error: Error
}

// ============================================================================
// Utility Types
// ============================================================================

export type EventCallback<T> = (data: T) => void

export interface EventEmitter<EventMap extends Record<string, any>> {
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void
}

