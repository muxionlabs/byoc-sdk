/**
 * Core types and interfaces for Livepeer BYOC Stream SDK
 */

import { constructDataStreamUrl, constructWhipUrl, constructWhepUrl } from './utils/urls'

// ============================================================================
// Stream Configuration Types
// ============================================================================

export class StreamConfig {
  public readonly gatewayUrl: string
  public readonly defaultPipeline?: string
  public readonly iceServers?: RTCIceServer[]

  private readonly whipPath: string
  private readonly whepPath: string
  private readonly dataPath: string
  private readonly whipBaseUrl: string
  private readonly whepBaseUrl: string
  private readonly dataBaseUrl: string

  constructor(config: {
    /** Base URL of the gateway (e.g., 'https://gateway.example.com:8088') */
    gatewayUrl: string
    /** Default pipeline name */
    defaultPipeline?: string
    /** ICE servers for WebRTC connection (optional, uses defaults if not provided) */
    iceServers?: RTCIceServer[]
    /** Custom path for WHIP endpoint (defaults to '/gateway/ai/stream/start') */
    whipPath?: string
    /** Custom path for WHEP endpoint (defaults to '/mediamtx') */
    whepPath?: string
    /** Custom base path for data streams (defaults to '/gateway/ai/stream/') */
    dataPath?: string
  }) {
    this.gatewayUrl = this.trimTrailingSlash(config.gatewayUrl)
    this.defaultPipeline = config.defaultPipeline
    this.iceServers = config.iceServers

    this.whipPath = this.normalizePath(config.whipPath ?? '/gateway/ai/stream/start')
    this.whepPath = this.normalizePath(config.whepPath ?? '/mediamtx')
    this.dataPath = this.normalizePath(config.dataPath ?? '/gateway/ai/stream/')

    this.whipBaseUrl = `${this.gatewayUrl}${this.whipPath}`
    this.whepBaseUrl = `${this.gatewayUrl}${this.whepPath}`
    this.dataBaseUrl = `${this.gatewayUrl}${this.dataPath}`
  }

  /**
   * Build a WHIP URL using configured gateway and path
   */
  getWhipUrl(params?: {
    pipeline?: string
    width?: number
    height?: number
    customParams?: Record<string, any>
    streamId?: string
  }): string {
    return constructWhipUrl(
      this.whipBaseUrl,
      params?.pipeline,
      params?.width,
      params?.height,
      params?.customParams,
      params?.streamId
    )
  }

  /**
   * Build a WHEP URL using configured gateway and path
   */
  getWhepUrl(playbackUrl?: string): string {
    return constructWhepUrl(this.whepBaseUrl, playbackUrl)
  }

  /**
   * Build a data URL for a given stream
   */
  getDataUrl(streamName: string, customDataUrl?: string): string {
    return constructDataStreamUrl(this.dataBaseUrl, streamName, customDataUrl)
  }

  private trimTrailingSlash(url: string): string {
    let trimmed = url
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.slice(0, -1)
    }
    return trimmed
  }

  private normalizePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`
  }
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
  /** Playback URL path from gateway (e.g., '/stream/abc-123/whep'). SDK will construct full WHEP URL. */
  playbackUrl?: string
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

// ============================================================================
// Utility Types
// ============================================================================

export type EventCallback<T> = (data: T) => void

export interface EventEmitter<EventMap extends Record<string, any>> {
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void
}

