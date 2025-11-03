/**
 * React hook for StreamPublisher
 */

import { useState, useEffect, useCallback } from 'react'
import { StreamPublisher } from '../core/StreamPublisher'
import {
  StreamConfig,
  StreamStartOptions,
  StreamUpdateOptions,
  StreamStartResponse,
  ConnectionStatus,
  ConnectionStats,
  StreamError
} from '../types'

export interface UseStreamPublisherOptions {
  config: StreamConfig
  onStatusChange?: (status: ConnectionStatus) => void
  onStatsUpdate?: (stats: ConnectionStats) => void
  onError?: (error: StreamError) => void
  onStreamStarted?: (response: StreamStartResponse) => void
  onStreamStopped?: () => void
}

export interface UseStreamPublisherReturn {
  publisher: StreamPublisher | null
  isStreaming: boolean
  status: ConnectionStatus
  stats: ConnectionStats | null
  streamInfo: StreamStartResponse | null
  localStream: MediaStream | null
  error: StreamError | null
  start: (options: StreamStartOptions) => Promise<StreamStartResponse | undefined>
  stop: () => Promise<void>
  updateStream: (options: StreamUpdateOptions) => Promise<void>
  getMediaDevices: () => Promise<any>
  requestPermissions: (video?: boolean, audio?: boolean) => Promise<void>
}

export function useStreamPublisher(options: UseStreamPublisherOptions): UseStreamPublisherReturn {
  const [publisher] = useState(() => new StreamPublisher(options.config))
  const [isStreaming, setIsStreaming] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [stats, setStats] = useState<ConnectionStats | null>(null)
  const [streamInfo, setStreamInfo] = useState<StreamStartResponse | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<StreamError | null>(null)

  // Setup event listeners
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus)
      setIsStreaming(newStatus === 'connected')
      options.onStatusChange?.(newStatus)
    }

    const handleStatsUpdate = (newStats: ConnectionStats) => {
      setStats(newStats)
      options.onStatsUpdate?.(newStats)
    }

    const handleError = (err: StreamError) => {
      setError(err)
      options.onError?.(err)
    }

    const handleMediaStreamReady = (stream: MediaStream) => {
      setLocalStream(stream)
    }

    const handleStreamStarted = (response: StreamStartResponse) => {
      setStreamInfo(response)
      options.onStreamStarted?.(response)
    }

    const handleStreamStopped = () => {
      setStreamInfo(null)
      setLocalStream(null)
      options.onStreamStopped?.()
    }

    publisher.on('statusChange', handleStatusChange)
    publisher.on('statsUpdate', handleStatsUpdate)
    publisher.on('error', handleError)
    publisher.on('mediaStreamReady', handleMediaStreamReady)
    publisher.on('streamStarted', handleStreamStarted)
    publisher.on('streamStopped', handleStreamStopped)

    return () => {
      publisher.off('statusChange', handleStatusChange)
      publisher.off('statsUpdate', handleStatsUpdate)
      publisher.off('error', handleError)
      publisher.off('mediaStreamReady', handleMediaStreamReady)
      publisher.off('streamStarted', handleStreamStarted)
      publisher.off('streamStopped', handleStreamStopped)
    }
  }, [publisher, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      publisher.stop().catch(console.error)
    }
  }, [publisher])

  const start = useCallback(async (startOptions: StreamStartOptions) => {
    try {
      setError(null)
      const response = await publisher.start(startOptions)
      return response
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [publisher])

  const stop = useCallback(async () => {
    try {
      setError(null)
      await publisher.stop()
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [publisher])

  const updateStream = useCallback(async (updateOptions: StreamUpdateOptions) => {
    try {
      setError(null)
      await publisher.updateStream(updateOptions)
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [publisher])

  const getMediaDevices = useCallback(async () => {
    return await publisher.getMediaDevices()
  }, [publisher])

  const requestPermissions = useCallback(async (video?: boolean, audio?: boolean) => {
    return await publisher.requestPermissions(video, audio)
  }, [publisher])

  return {
    publisher,
    isStreaming,
    status,
    stats,
    streamInfo,
    localStream,
    error,
    start,
    stop,
    updateStream,
    getMediaDevices,
    requestPermissions
  }
}

