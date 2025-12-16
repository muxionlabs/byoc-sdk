/**
 * React hook for StreamPublisher
 */

import { useState, useEffect, useCallback } from 'react'
import { Stream } from '../core/Stream'
import {
  StreamConfig,
  StreamStartOptions,
  StreamUpdateOptions,
  StreamStartResponse,
  ConnectionStatus,
  ConnectionStats,
  StreamError
} from '../types'

export interface UseStreamOptions {
  config: StreamConfig
  onStatusChange?: (status: ConnectionStatus) => void
  onStatsUpdate?: (stats: ConnectionStats) => void
  onError?: (error: StreamError) => void
  onStreamStarted?: (response: StreamStartResponse) => void
  onStreamStopped?: () => void
}

export interface UseStreamReturn {
  stream: Stream | null
  isStreaming: boolean
  connectionStatus: ConnectionStatus
  connectionStats: ConnectionStats | null
  streamInfo: StreamStartResponse | null
  localStream: MediaStream | null
  error: StreamError | null
  start: (options: StreamStartOptions) => Promise<StreamStartResponse | undefined>
  stop: () => Promise<void>
  status: () => Promise<any>
  update: (options: StreamUpdateOptions) => Promise<void>
  getMediaDevices: () => Promise<any>
  requestPermissions: (video?: boolean, audio?: boolean) => Promise<void>
}

export function useStream(options: UseStreamOptions): UseStreamReturn {
  const [stream] = useState(() => new Stream(options.config))
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null)
  const [streamInfo, setStreamInfo] = useState<StreamStartResponse | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<StreamError | null>(null)

  // Setup event listeners
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setConnectionStatus(newStatus)
      setIsStreaming(newStatus === 'connected')
      options.onStatusChange?.(newStatus)
    }

    const handleStatsUpdate = (newStats: ConnectionStats) => {
      setConnectionStats(newStats)
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

    stream.on('statusChange', handleStatusChange)
    stream.on('statsUpdate', handleStatsUpdate)
    stream.on('error', handleError)
    stream.on('mediaStreamReady', handleMediaStreamReady)
    stream.on('streamStarted', handleStreamStarted)
    stream.on('streamStopped', handleStreamStopped)

    return () => {
      stream.off('statusChange', handleStatusChange)
      stream.off('statsUpdate', handleStatsUpdate)
      stream.off('error', handleError)
      stream.off('mediaStreamReady', handleMediaStreamReady)
      stream.off('streamStarted', handleStreamStarted)
      stream.off('streamStopped', handleStreamStopped)
    }
  }, [stream, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stream.stop().catch(console.error)
    }
  }, [stream])

  const start = useCallback(async (startOptions: StreamStartOptions) => {
    try {
      setError(null)
      const response = await stream.start(startOptions)
      return response
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [stream])

  const status = useCallback(async () => {
    try {
      setError(null)
      const response = await stream.status()
      return response
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [stream])

  const stop = useCallback(async () => {
    try {
      setError(null)
      await stream.stop()
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [stream])

  const update = useCallback(async (updateOptions: StreamUpdateOptions) => {
    try {
      setError(null)
      await stream.update(updateOptions)
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [stream])

  const getMediaDevices = useCallback(async () => {
    return await stream.getMediaDevices()
  }, [stream])
  const requestPermissions = useCallback(async (video?: boolean, audio?: boolean) => {
    return await stream.requestPermissions(video, audio)
  }, [stream])

  return {
    stream,
    isStreaming,
    connectionStatus,
    connectionStats,
    streamInfo,
    localStream,
    error,
    start,
    status,
    stop,
    update,
    getMediaDevices,
    requestPermissions
  }
}

