/**
 * Livepeer BYOC Stream SDK
 * Production-quality SDK for video streaming with AI processing
 */

// Core classes
export { StreamPublisher } from './core/StreamPublisher'
export { StreamViewer } from './core/StreamViewer'
export { DataStreamClient } from './core/DataStreamClient'
export { EventStreamClient } from './core/EventStreamClient'

// React hooks
export { useStreamPublisher } from './react/useStreamPublisher'
export { useStreamViewer } from './react/useStreamViewer'
export { useDataStream } from './react/useDataStream'
export { useEventStream } from './react/useEventStream'

// Types
export type {
  StreamConfig,
  StreamStartOptions,
  StreamUpdateOptions,
  ViewerStartOptions,
  DataStreamOptions,
  EventStreamOptions,
  StreamStartResponse,
  WhipOfferResponse,
  WhepOfferResponse,
  ConnectionStatus,
  ConnectionStats,
  DataLog,
  DataStreamEvent,
  EventLog,
  MediaDevice,
  MediaDevices,
  StreamPublisherEventMap,
  StreamViewerEventMap,
  DataStreamEventMap,
  EventStreamEventMap
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
  constructDataStreamUrl,
  constructKafkaEventsUrl
} from './utils/urls'

export { retryWithBackoff, sleep } from './utils/retry'

