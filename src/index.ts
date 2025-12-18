/**
 * Livepeer BYOC Stream SDK
 * Production-quality SDK for video streaming with AI processing
 */

// Core classes
export { Stream } from './core/Stream'
export { StreamViewer } from './core/StreamViewer'
export { DataStreamClient } from './core/StreamDataViewer'

// React hooks
export { useStream } from './react/useStream'
export { useStreamViewer } from './react/useStreamViewer'
export { useDataStream } from './react/useDataStream'

// Config
export { StreamConfig } from './types'

// Types
export type {
  StreamStartOptions,
  StreamUpdateOptions,
  ViewerStartOptions,
  DataStreamOptions,
  StreamStartResponse,
  WhipOfferResponse,
  WhepOfferResponse,
  ConnectionStatus,
  ConnectionStats,
  DataLog,
  DataStreamEvent,
  MediaDevice,
  MediaDevices,
  StreamEventMap,
  StreamViewerEventMap,
  DataStreamEventMap
} from './types'

export {
  StreamError,
  ConnectionError,
  MediaError
} from './types'

export { retryWithBackoff, sleep } from './utils/retry'

// Transcription utilities
export { TranscriptionHelper } from './utils/transcription'
export type { TranscriptionSegment, TranscriptionData } from './utils/transcription'

// Platform detection
export {
  detectPlatform,
  hasEventSource,
  hasRTCPeerConnection,
  getPlatformCapabilities,
  logPlatformInfo,
  checkRequiredFeatures
} from './utils/platform'

// React UI Components (optional, only imported if React is available)
export { TranscriptionOverlay } from './react/components/TranscriptionOverlay'
export type { TranscriptionOverlayProps } from './react/components/TranscriptionOverlay'

