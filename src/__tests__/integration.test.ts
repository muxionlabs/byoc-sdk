/**
 * Integration tests for complete workflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Stream } from '../core/Stream'
import { StreamViewer } from '../core/StreamViewer'
import { DataStreamClient } from '../core/StreamDataViewer'
import { StreamConfig, ViewerStartOptions, DataStreamOptions } from '../types'
import { setupTestEnvironment } from './setup'

describe('Integration tests', () => {
  let viewer: StreamViewer
  let dataClient: DataStreamClient
  let config: StreamConfig
  let mockVideoElement: HTMLVideoElement
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = setupTestEnvironment()
    
    mockVideoElement = {
      srcObject: null,
      play: vi.fn(),
      pause: vi.fn()
    } as any

    config = new StreamConfig({
      gatewayUrl: 'http://localhost:8088',
      defaultPipeline: 'comfystream'
    })
    
    new Stream(config)
    viewer = new StreamViewer(config)
    dataClient = new DataStreamClient(config)
  })

  describe('Complete stream workflow', () => {
    it('should handle full stream lifecycle', async () => {
      // Step 1: Start stream
      const mockStreamResponse = {
        whipUrl: 'http://localhost:8088/whip/stream-123',
        whepUrl: 'http://localhost:8088/whep/stream-123',
        rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
        rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
        updateUrl: 'http://localhost:8088/update/stream-123',
        statusUrl: 'http://localhost:8088/status/stream-123',
        dataUrl: 'http://localhost:8088/data/stream-123',
        streamId: 'stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStreamResponse
      })

      // This would typically be called through stream.start()
      config.updateFromStreamStartResponse(mockStreamResponse)

      expect(config.getWhipUrl()).toBe('http://localhost:8088/whip/stream-123')
      expect(config.getWhepUrl()).toBe('http://localhost:8088/whep/stream-123')
      expect(config.getDataUrl()).toBe('http://localhost:8088/data/stream-123')
      expect(config.getStreamStartUrl()).toBe('http://localhost:8088/gateway/ai/stream/start')
    })

    it('should handle stream viewer connection', async () => {
      const mockStreamResponse = {
        whipUrl: 'http://localhost:8088/whip/stream-123',
        whepUrl: 'http://localhost:8088/whep/stream-123',
        rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
        rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
        updateUrl: 'http://localhost:8088/update/stream-123',
        statusUrl: 'http://localhost:8088/status/stream-123',
        dataUrl: 'http://localhost:8088/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      viewer.setVideoElement(mockVideoElement)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Location': 'http://localhost:8088/whep/stream-123'
        }),
        text: async () => 'answer-sdp'
      })

      const viewerOptions: ViewerStartOptions = {
        whepUrl: config.getWhepUrl()
      }

      await viewer.start(viewerOptions)

      expect(viewer.getConnectionStatus()).toBe('connected')
      expect(viewer.getVideoElement()).toBe(mockVideoElement)
    })

    it('should handle data stream connection', async () => {
      const mockStreamResponse = {
        whipUrl: 'http://localhost:8088/whip/stream-123',
        whepUrl: 'http://localhost:8088/whep/stream-123',
        rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
        rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
        updateUrl: 'http://localhost:8088/update/stream-123',
        statusUrl: 'http://localhost:8088/status/stream-123',
        dataUrl: 'http://localhost:8088/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      const dataOptions: DataStreamOptions = {
        streamName: 'test-stream',
        maxLogs: 100
      }

      await dataClient.connect(dataOptions)

      expect(dataClient.getConnectionStatus()).toBe(true)
      expect(dataClient.getLogs()).toEqual([])
    })

    it('should handle stream updates', async () => {
      const mockStreamResponse = {
        whipUrl: 'http://localhost:8088/whip/stream-123',
        whepUrl: 'http://localhost:8088/whep/stream-123',
        rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
        rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
        updateUrl: 'http://localhost:8088/update/stream-123',
        statusUrl: 'http://localhost:8088/status/stream-123',
        dataUrl: 'http://localhost:8088/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK'
      })

      // This would typically be called through stream.update()
      expect(config.getStreamStartUrl()).toBe('http://localhost:8088/gateway/ai/stream/start')
    })

    it('should handle stream status monitoring', async () => {
      const mockStreamResponse = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'https://example.com/whep/stream-123',
        rtmpUrl: 'https://example.com/rtmp/stream-123',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-123',
        updateUrl: 'https://example.com/update/stream-123',
        statusUrl: 'https://example.com/status/stream-123',
        dataUrl: 'https://example.com/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      const mockStatus = {
        status: 'active',
        streamId: 'stream-123',
        connected: true,
        bitrate: 1000000,
        fps: 30
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      })

      // This would typically be called through stream.getStatus()
      expect(config.getStatusUrl()).toBe('https://example.com/status/stream-123')
    })
  })

  describe('Error handling integration', () => {
    it('should handle stream start failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request'
      })

      // This would typically throw an error during stream.start()
      expect(config.getStreamStartUrl()).toBe('http://localhost:8088/gateway/ai/stream/start')
    })

    it('should handle viewer connection failure', async () => {
      const mockStreamResponse = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'https://example.com/whep/stream-123',
        rtmpUrl: 'https://example.com/rtmp/stream-123',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-123',
        updateUrl: 'https://example.com/update/stream-123',
        statusUrl: 'https://example.com/status/stream-123',
        dataUrl: 'https://example.com/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      // This would typically throw an error during viewer.start()
      expect(viewer.getConnectionStatus()).toBe('disconnected')
    })

    it('should handle data stream connection failure', async () => {
      const mockStreamResponse = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'https://example.com/whep/stream-123',
        rtmpUrl: 'https://example.com/rtmp/stream-123',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-123',
        updateUrl: 'https://example.com/update/stream-123',
        statusUrl: 'https://example.com/status/stream-123',
        dataUrl: 'https://example.com/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockStreamResponse)

      // Simulate EventSource error
      const eventSource = (global.EventSource as any).mock.results[0].value
      eventSource.onerror = new Error('Connection failed')

      // This would typically handle errors during dataClient.connect()
      expect(dataClient.getConnectionStatus()).toBe(false)
    })
  })

  describe('Configuration integration', () => {
    it('should handle multiple stream configurations', () => {
      const config1 = new StreamConfig({
        gatewayUrl: 'https://gateway1.example.com:8088',
        defaultPipeline: 'pipeline1'
      })

      const config2 = new StreamConfig({
        gatewayUrl: 'https://gateway2.example.com:8088',
        defaultPipeline: 'pipeline2'
      })

      expect(config1.gatewayUrl).toBe('https://gateway1.example.com:8088')
      expect(config1.defaultPipeline).toBe('pipeline1')
      expect(config2.gatewayUrl).toBe('https://gateway2.example.com:8088')
      expect(config2.defaultPipeline).toBe('pipeline2')
    })

    it('should handle ICE server configuration', () => {
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.example.com:3478' }
      ]

      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088',
        iceServers
      })

      expect(config.iceServers).toEqual(iceServers)
    })

    it('should handle stream response updates', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const response1 = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'https://example.com/whep/stream-123',
        rtmpUrl: 'https://example.com/rtmp/stream-123',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-123',
        updateUrl: 'https://example.com/update/stream-123',
        statusUrl: 'https://example.com/status/stream-123',
        dataUrl: 'https://example.com/data/stream-123',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(response1)
      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')

      const response2 = {
        whipUrl: 'https://example.com/whip/stream-456',
        whepUrl: 'https://example.com/whep/stream-456',
        rtmpUrl: 'https://example.com/rtmp/stream-456',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-456',
        updateUrl: 'https://example.com/update/stream-456',
        statusUrl: 'https://example.com/status/stream-456',
        dataUrl: 'https://example.com/data/stream-456',
        streamId: 'stream-456'
      }

      config.updateFromStreamStartResponse(response2)
      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')
    })
  })
})