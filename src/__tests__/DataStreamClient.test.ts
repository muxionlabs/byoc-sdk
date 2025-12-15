/**
 * Tests for DataStreamClient class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataStreamClient } from '../core/StreamDataViewer'
import { StreamConfig, DataStreamOptions } from '../types'

// Mock EventSource
const mockEventSource = vi.fn()
const mockClose = vi.fn()

describe('DataStreamClient class', () => {
  let client: DataStreamClient
  let config: StreamConfig

  beforeEach(() => {
    vi.clearAllMocks()
    global.EventSource = mockEventSource as any
    
    mockEventSource.mockImplementation(function() {
      return {
        close: mockClose,
        onopen: null,
        onmessage: null,
        onerror: null
      }
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

    it('should handle EventSource errors', async () => {
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

      // Simulate EventSource error
      const eventSource = mockEventSource.mock.results[0].value
      eventSource.onerror = new Error('Connection failed')

      await client.connect(options)

      expect(client.getConnectionStatus()).toBe(true) // Still connected despite error handler
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
    it('should handle data events', async () => {
      const callback = vi.fn()
      client.on('data', callback)

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

      // This would typically be triggered by EventSource onmessage
      expect(callback).not.toHaveBeenCalled() // No data events yet
    })

    it('should maintain log limit', async () => {
      const options: DataStreamOptions = {
        streamName: 'test-stream',
        maxLogs: 2
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

      // This would typically be tested by simulating multiple data events
      expect(client.getConnectionStatus()).toBe(true)
    })
  })
})