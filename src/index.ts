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

