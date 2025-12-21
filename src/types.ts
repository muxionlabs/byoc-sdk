/**
 * Core types and interfaces for Livepeer BYOC Stream SDK
 */

// ============================================================================
// Stream Configuration Types
// ============================================================================

export class StreamConfig {
  public readonly gatewayUrl: string
  public readonly defaultPipeline?: string
  public readonly iceServers?: RTCIceServer[]

  public location: string | "" = ""
  public playbackUrl: string | "" = ""
  public link: string | "" = ""
  public eTag: string | "" = ""

  // URLs from stream start response  
  public streamStartResponse: StreamStartResponse | null = null

  constructor(config: {
    /** Base URL of the gateway (e.g., 'https://gateway.example.com:8088') */
    gatewayUrl: string
    /** Default pipeline name */
    defaultPipeline?: string
    /** ICE servers for WebRTC connection (optional, uses defaults if not provided) */
    iceServers?: RTCIceServer[]
  }) {
    this.gatewayUrl = this.trimTrailingSlash(config.gatewayUrl)
    this.defaultPipeline = config.defaultPipeline
    this.iceServers = config.iceServers

    this.location = ""
    this.playbackUrl = ""
    this.link = ""
    this.eTag = ""
  }

  /**
   * Update the config with stream start response data
   */
  updateFromStreamStartResponse(response: StreamStartResponse): void {
    this.streamStartResponse = response
  }

  /**
   * Get Stream Start URL
   */
  getStreamStartUrl(): string | "" {
    return this.gatewayUrl + `/process/stream/start`
  }


  /**
   * Get Stream Stop URL
   */
  getStreamStopUrl(): string | "" {
    return this.streamStartResponse?.stopUrl ?? ""
  }

  /**
   * Get WHIP URL from stream start response
   */
  getWhipUrl(): string | "" {
    return this.streamStartResponse?.whipUrl ?? ""
  }

  /**
   * Get WHEP URL from stream start response
   */
  getWhepUrl(): string | "" {
    return this.streamStartResponse?.whepUrl ?? ""
  }

  /**
   * Get data URL from stream start response
   */
  getDataUrl(): string | "" {
    return this.streamStartResponse?.dataUrl ?? ""
  }

  /**
   * Get status URL from stream start response
   */
  getStatusUrl(): string | "" {
    return this.streamStartResponse?.statusUrl ?? ""
  }

  /**
   * Get update URL from stream start response
   */
  getUpdateUrl(): string | "" {
    return this.streamStartResponse?.updateUrl ?? ""
  }

  /**
   * Get RTMP URL from stream start response
   */
  getRtmpUrl(): string | "" {
    return this.streamStartResponse?.rtmpUrl ?? ""
  }

  /**
   * Get RTMP output URL from stream start response
   */
  getRtmpOutputUrl(): string | "" {
    return this.streamStartResponse?.rtmpOutputUrl ?? ""
  }

  /**
   * Generate a unique stream ID
   */
  generateStreamId(): string {
    return `stream-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`
  }
  /**
   * Remove all trailing slashes from a URL
   * @private
   */
  private trimTrailingSlash(url: string): string {
    let trimmed = url
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.slice(0, -1)
    }
    return trimmed
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
  /** WHEP URL for viewing the stream. Should be the full URL returned from gateway's whep_url field. */
  whepUrl?: string
}

// ============================================================================
// Stream Response Types
// ============================================================================

export interface StreamStartResponse {
  /** Stream ID assigned by the server */
  streamId: string
  /** WHIP URL for WebRTC publishing */
  whipUrl: string
  /** WHEP URL for WebRTC viewing */
  whepUrl: string
  /** RTMP URL for RTMP streaming */
  rtmpUrl: string
  /** RTMP output URL for RTMP streaming */
  rtmpOutputUrl: string
  /** Update URL for sending parameter updates */
  updateUrl: string
  /** Status URL for polling stream status */
  statusUrl: string
  /** Data stream URL for SSE */
  dataUrl: string
  /** Stop stream url  */
  stopUrl: string
}

export interface WhipOfferResponse {
  status: number
  answerSdp: string
  locationHeader: string | null
  eTagHeader: string | null
  linkHeader: string | null
  playbackUrl: string | null
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

export type StreamEventMap = {
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

