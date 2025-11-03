/**
 * React hook for EventStreamClient
 */

import { useState, useEffect, useCallback } from 'react'
import { EventStreamClient } from '../core/EventStreamClient'
import {
  StreamConfig,
  EventStreamOptions,
  EventLog
} from '../types'

export interface UseEventStreamOptions {
  config: StreamConfig
  onConnected?: () => void
  onDisconnected?: () => void
  onEvent?: (event: EventLog) => void
  onError?: (error: Error) => void
  autoConnect?: boolean
  streamName?: string
}

export interface UseEventStreamReturn {
  client: EventStreamClient | null
  isConnected: boolean
  events: EventLog[]
  error: Error | null
  connect: (options: EventStreamOptions) => Promise<void>
  disconnect: () => void
  clearEvents: () => void
}

export function useEventStream(options: UseEventStreamOptions): UseEventStreamReturn {
  const [client] = useState(() => new EventStreamClient(options.config))
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<EventLog[]>([])
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

    const handleEvent = (event: EventLog) => {
      setEvents(client.getEvents())
      options.onEvent?.(event)
    }

    const handleError = (err: Error) => {
      setError(err)
      options.onError?.(err)
    }

    client.on('connected', handleConnected)
    client.on('disconnected', handleDisconnected)
    client.on('event', handleEvent)
    client.on('error', handleError)

    return () => {
      client.off('connected', handleConnected)
      client.off('disconnected', handleDisconnected)
      client.off('event', handleEvent)
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

  const connect = useCallback(async (connectOptions: EventStreamOptions) => {
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

  const clearEvents = useCallback(() => {
    client.clearEvents()
    setEvents([])
  }, [client])

  return {
    client,
    isConnected,
    events,
    error,
    connect,
    disconnect,
    clearEvents
  }
}

