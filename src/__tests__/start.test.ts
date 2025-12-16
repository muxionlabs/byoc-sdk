/**
 * Tests for Stream Start API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startStream, stopStream } from '../api/start'
import { StreamStartOptions, StreamStartResponse } from '../types'
import { createMockFetch } from './mockServer'

describe('Stream Start API', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = createMockFetch()
  })

  describe('startStream', () => {
    it('should successfully start a stream', async () => {
      const mockResponse: StreamStartResponse = {
        whipUrl: 'http://localhost:8088/whip/stream-123',
        whepUrl: 'http://localhost:8088/whep/stream-123',
        rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
        rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
        updateUrl: 'http://localhost:8088/update/stream-123',
        statusUrl: 'http://localhost:8088/status/stream-123',
        dataUrl: 'http://localhost:8088/data/stream-123',
        stopUrl: 'http://localhost:8088/stop/stream-123',
        streamId: 'stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream',
        width: 1280,
        height: 720,
        fpsLimit: 30,
        enableVideoIngress: true,
        enableAudioIngress: true,
        enableVideoEgress: true,
        enableAudioEgress: true,
        enableDataOutput: true
      }

      const result = await startStream('http://localhost:8088/start', options)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8088/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Livepeer': expect.any(String)
        },
        body: expect.any(String)
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request'
      })

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream'
      }

      await expect(startStream('https://example.com/start', options))
        .rejects.toThrow('Failed to initialize stream (400): Invalid request')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream'
      }

      await expect(startStream('https://example.com/start', options))
        .rejects.toThrow('Network error')
    })

    it('should use default values for optional parameters', async () => {
      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        stopUrl: 'stop-url',
        streamId: 'stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream'
      }

      const result = await startStream('https://example.com/start', options)

      expect(result).toEqual(mockResponse)
    })

    it('should include custom parameters in request', async () => {
      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        stopUrl: 'stop-url',
        streamId: 'stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream',
        customParams: {
          prompts: 'test prompt',
          threshold: 0.5
        }
      }

      const result = await startStream('https://example.com/start', options)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('stopStream', () => {
    it('should successfully stop a stream', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => ''
      })

      const result = await stopStream('https://example.com/ai/stream/stream-123/stop')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/ai/stream/stream-123/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Livepeer': expect.any(String)
        },
        body: expect.any(String)
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request'
      })

      await expect(stopStream('https://example.com/ai/stream/stream-123/stop'))
        .rejects.toThrow('Failed to stop stream (400): Invalid request')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(stopStream('https://example.com/ai/stream/stream-123/stop'))
        .rejects.toThrow('Network error')
    })

    it('should return false for non-200 status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await stopStream('https://example.com/ai/stream/stream-123/stop')

      expect(result).toBe(false)
    })
  })
})