/**
 * React hook for DataStreamClient
 */

import { useState, useEffect, useCallback } from 'react'
import { DataStreamClient } from '../core/DataStreamClient'
import {
  StreamConfig,
  DataStreamOptions,
  DataStreamEvent,
  DataLog
} from '../types'

export interface UseDataStreamOptions {
  config: StreamConfig
  onConnected?: () => void
  onDisconnected?: () => void
  onData?: (event: DataStreamEvent) => void
  onError?: (error: Error) => void
  autoConnect?: boolean
  streamName?: string
}

export interface UseDataStreamReturn {
  client: DataStreamClient | null
  isConnected: boolean
  logs: DataLog[]
  error: Error | null
  connect: (options: DataStreamOptions) => Promise<void>
  disconnect: () => void
  clearLogs: () => void
}

export function useDataStream(options: UseDataStreamOptions): UseDataStreamReturn {
  const [client] = useState(() => new DataStreamClient(options.config))
  const [isConnected, setIsConnected] = useState(false)
  const [logs, setLogs] = useState<DataLog[]>([])
  const [error, setError] = useState<Error | null>(null)

  // Setup event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true)
      options.onConnected?.()
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      options.onDisconnected?.()
    }

    const handleData = (event: DataStreamEvent) => {
      setLogs(client.getLogs())
      options.onData?.(event)
    }

    const handleError = (err: Error) => {
      setError(err)
      options.onError?.(err)
    }

    client.on('connected', handleConnected)
    client.on('disconnected', handleDisconnected)
    client.on('data', handleData)
    client.on('error', handleError)

    return () => {
      client.off('connected', handleConnected)
      client.off('disconnected', handleDisconnected)
      client.off('data', handleData)
      client.off('error', handleError)
    }
  }, [client, options])

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && options.streamName && !isConnected) {
      connect({ streamName: options.streamName }).catch(console.error)
    }
  }, [options.autoConnect, options.streamName])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client.disconnect()
    }
  }, [client])

  const connect = useCallback(async (connectOptions: DataStreamOptions) => {
    try {
      setError(null)
      await client.connect(connectOptions)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    }
  }, [client])

  const disconnect = useCallback(() => {
    client.disconnect()
  }, [client])

  const clearLogs = useCallback(() => {
    client.clearLogs()
    setLogs([])
  }, [client])

  return {
    client,
    isConnected,
    logs,
    error,
    connect,
    disconnect,
    clearLogs
  }
}

