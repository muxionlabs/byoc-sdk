/**
 * Livepeer BYOC Stream SDK
 * Production-quality SDK for video streaming with AI processing
 */

// Core classes
export { StreamPublisher } from './core/StreamPublisher'
export { StreamViewer } from './core/StreamViewer'
export { DataStreamClient } from './core/DataStreamClient'

// React hooks
export { useStreamPublisher } from './react/useStreamPublisher'
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
  StreamPublisherEventMap,
  StreamViewerEventMap,
  DataStreamEventMap
} from './types'

export {
  StreamError,
  ConnectionError,
  MediaError
} from './types'

// Utilities
export {
  generateStreamId,
  constructWhipUrl,
  constructWhepUrl,
  constructDataStreamUrl
} from './utils/urls'

export { retryWithBackoff, sleep } from './utils/retry'

