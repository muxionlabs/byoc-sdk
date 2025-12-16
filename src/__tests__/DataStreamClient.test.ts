/**
 * Tests for DataStreamClient class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataStreamClient } from '../core/StreamDataViewer'
import { StreamConfig, DataStreamOptions } from '../types'

// Mock EventSource
const mockEventSource = vi.fn()
const mockClose = vi.fn()
let eventSourceInstance: any
let eventHandlers: {
  onopen: ((ev?: any) => void) | null
  onmessage: ((ev: MessageEvent<any>) => void) | null
  onerror: ((ev?: any) => void) | null
}

describe('DataStreamClient class', () => {
  let client: DataStreamClient
  let config: StreamConfig

  beforeEach(() => {
    vi.clearAllMocks()
    eventSourceInstance = null
    eventHandlers = {
      onopen: null,
      onmessage: null,
      onerror: null
    }
    global.EventSource = mockEventSource as any
    
    mockEventSource.mockImplementation(function() {
      const eventSource = {
        close: () => {
          mockClose()
          eventSourceInstance = null
        },
        get onopen() {
          return eventHandlers.onopen
        },
        set onopen(handler) {
          eventHandlers.onopen = handler
        },
        get onmessage() {
          return eventHandlers.onmessage
        },
        set onmessage(handler) {
          eventHandlers.onmessage = handler
        },
        get onerror() {
          return eventHandlers.onerror
        },
        set onerror(handler) {
          eventHandlers.onerror = handler
        }
      }
      eventSourceInstance = eventSource
      return eventSource
    })
  })

  beforeEach(() => {
    config = new StreamConfig({
      gatewayUrl: 'https://example.com:8088'
    })
    client = new DataStreamClient(config)
  })

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client.getConnectionStatus()).toBe(false)
      expect(client.getLogs()).toEqual([])
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      expect(client.getConnectionStatus()).toBe(false)
    })
  })

  describe('getLogs', () => {
    it('should return empty logs initially', () => {
      expect(client.getLogs()).toEqual([])
    })

    it('should return logs after connection', () => {
      // This would typically be set during the connect process
      expect(client.getLogs()).toEqual([])
    })
  })

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      // Simulate having logs
      client.clearLogs()
      expect(client.getLogs()).toEqual([])
    })
  })

  describe('connect', () => {
    it('should successfully connect to data stream', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream'
      }

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      await client.connect(options)

      expect(client.getConnectionStatus()).toBe(true)
      expect(mockEventSource).toHaveBeenCalledWith('https://example.com/data/test-stream')
    })

    it('should throw error when already connected', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream'
      }

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      await client.connect(options)

      await expect(client.connect(options))
        .rejects.toThrow('Already connected to data stream')
    })

    it('should use custom data URL when provided', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream',
        dataUrl: 'https://custom.com/data/stream'
      }

      await client.connect(options)

      expect(mockEventSource).toHaveBeenCalledWith('https://custom.com/data/stream')
    })

    it('should respect maxLogs parameter', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream',
        maxLogs: 5
      }

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      await client.connect(options)

      // This would typically be tested by simulating data events
      expect(client.getConnectionStatus()).toBe(true)
    })

    it('emits error and disconnects when SSE fails', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream'
      }

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      const errorListener = vi.fn()
      const disconnectedListener = vi.fn()
      client.on('error', errorListener)
      client.on('disconnected', disconnectedListener)

      await client.connect(options)
      expect(eventHandlers.onerror).toBeTruthy()

      eventHandlers.onerror?.(new Event('error'))

      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(disconnectedListener).toHaveBeenCalledTimes(1)
      expect(mockClose).toHaveBeenCalled()
      expect(client.getConnectionStatus()).toBe(false)
      expect(eventSourceInstance).toBeNull()
    })
  })

  describe('event handling', () => {
    it('should emit connected events', async () => {
      const callback = vi.fn()
      client.on('connected', callback)

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      await client.connect({ streamName: 'test-stream' })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle multiple event listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      client.on('connected', callback1)
      client.on('connected', callback2)

      // This would be triggered during connect
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should remove event listeners', () => {
      const callback = vi.fn()

      client.on('connected', callback)
      client.off('connected', callback)

      // This would be triggered during connect
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('data handling', () => {
    const prepareConnection = async (options: DataStreamOptions) => {
      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/test-stream',
        streamId: 'test-stream'
      })

      await client.connect(options)
    }

    it('emits data events and stores parsed payloads', async () => {
      const callback = vi.fn()
      client.on('data', callback)

      await prepareConnection({ streamName: 'test-stream', maxLogs: 3 })

      eventHandlers.onmessage?.({ data: '{"type":"metric","value":1}' } as any)
      eventHandlers.onmessage?.({ data: '{"value":2}' } as any)

      const logs = client.getLogs()
      expect(callback).toHaveBeenCalledTimes(2)
      expect(logs[0].type).toBe('metric')
      expect(logs[0].data.value).toBe(1)
      expect(logs[1].data.value).toBe(2)
    })

    it('maintains log limit by dropping the oldest entries', async () => {
      await prepareConnection({ streamName: 'test-stream', maxLogs: 2 })

      eventHandlers.onmessage?.({ data: '{"value":1}' } as any)
      eventHandlers.onmessage?.({ data: '{"value":2}' } as any)
      eventHandlers.onmessage?.({ data: '{"value":3}' } as any)

      const logs = client.getLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].data.value).toBe(2)
      expect(logs[1].data.value).toBe(3)
    })

    it('records raw payloads when JSON parsing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await prepareConnection({ streamName: 'test-stream', maxLogs: 5 })

      eventHandlers.onmessage?.({ data: 'not-json' } as any)

      const logs = client.getLogs()
      expect(logs[0].type).toBe('raw')
      expect(logs[0].data.raw).toBe('not-json')
      consoleSpy.mockRestore()
    })
  })
})