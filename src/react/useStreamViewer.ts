/**
 * React hook for StreamViewer
 */

import { useState, useEffect, useCallback } from 'react'
import { StreamViewer } from '../core/StreamViewer'
import {
  StreamConfig,
  ViewerStartOptions,
  ConnectionStatus,
  ConnectionStats,
  StreamError
} from '../types'

export interface UseStreamViewerOptions {
  config: StreamConfig
  videoRef?: React.RefObject<HTMLVideoElement | null>
  onStatusChange?: (status: ConnectionStatus) => void
  onStatsUpdate?: (stats: ConnectionStats) => void
  onError?: (error: StreamError) => void
  onViewingStarted?: () => void
  onViewingStopped?: () => void
}

export interface UseStreamViewerReturn {
  viewer: StreamViewer | null
  isViewing: boolean
  status: ConnectionStatus
  stats: ConnectionStats | null
  error: StreamError | null
  start: (options: ViewerStartOptions) => Promise<void>
  stop: () => Promise<void>
}

export function useStreamViewer(options: UseStreamViewerOptions): UseStreamViewerReturn {
  const [viewer] = useState(() => new StreamViewer(options.config))
  const [isViewing, setIsViewing] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [stats, setStats] = useState<ConnectionStats | null>(null)
  const [error, setError] = useState<StreamError | null>(null)

  // Set video element if ref is provided
  useEffect(() => {
    if (options.videoRef?.current) {
      viewer.setVideoElement(options.videoRef.current)
    }
  }, [viewer, options.videoRef])

  // Setup event listeners
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus)
      setIsViewing(newStatus === 'connected')
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

    const handleViewingStarted = () => {
      options.onViewingStarted?.()
    }

    const handleViewingStopped = () => {
      options.onViewingStopped?.()
    }

    viewer.on('statusChange', handleStatusChange)
    viewer.on('statsUpdate', handleStatsUpdate)
    viewer.on('error', handleError)
    viewer.on('viewingStarted', handleViewingStarted)
    viewer.on('viewingStopped', handleViewingStopped)

    return () => {
      viewer.off('statusChange', handleStatusChange)
      viewer.off('statsUpdate', handleStatsUpdate)
      viewer.off('error', handleError)
      viewer.off('viewingStarted', handleViewingStarted)
      viewer.off('viewingStopped', handleViewingStopped)
    }
  }, [viewer, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      viewer.stop().catch(console.error)
    }
  }, [viewer])

  const start = useCallback(async (startOptions: ViewerStartOptions) => {
    try {
      setError(null)
      await viewer.start(startOptions)
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [viewer])

  const stop = useCallback(async () => {
    try {
      setError(null)
      await viewer.stop()
    } catch (err) {
      const streamError = err instanceof StreamError ? err : new StreamError(String(err))
      setError(streamError)
      throw streamError
    }
  }, [viewer])

  return {
    viewer,
    isViewing,
    status,
    stats,
    error,
    start,
    stop
  }
}

