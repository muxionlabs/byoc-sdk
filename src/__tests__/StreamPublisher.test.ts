/**
 * Tests for StreamConfig URL building methods
 */

import { describe, it, expect } from 'vitest'
import { StreamConfig, StreamStartResponse } from '../types'

describe('StreamConfig URL helpers', () => {
  describe('getStreamStartUrl', () => {
    it('builds start URL from default paths', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      const streamId = 'test-stream-123'

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getStreamStartUrl()

      expect(result).toBe('https://example.com:8088/ai/stream/test-stream-123/start')
      const pathPart = result.split('://')[1]
      expect(pathPart).not.toContain('//')
    })

    it('handles gateway URL with trailing slash', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com/'
      })
      const result = config.getStreamStartUrl()

      expect(result).toBe('')
    })
  })

  describe('getStreamStopUrl', () => {
    it('builds stop URL from default paths', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      const streamId = 'test-stream-456'

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getStreamStopUrl()

      expect(result).toBe('https://example.com:8088/ai/stream/test-stream-456/stop')
      const pathPart = result.split('://')[1]
      expect(pathPart).not.toContain('//')
    })

    it('returns empty string when no stream response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      const result = config.getStreamStopUrl()

      expect(result).toBe('')
    })
  })

  describe('getStatusUrl', () => {
    it('returns status URL from stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'https://example.com/status/stream-789',
        dataUrl: 'data-url',
        streamId: 'stream-789'
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getStatusUrl()

      expect(result).toBe('https://example.com/status/stream-789')
    })

    it('returns empty string when no stream response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      const result = config.getStatusUrl()

      expect(result).toBe('')
    })
  })

  describe('getWhipUrl', () => {
    it('returns WHIP URL from stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getWhipUrl()

      expect(result).toBe('https://example.com/whip/stream-123')
    })

    it('returns empty string when no stream response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      const result = config.getWhipUrl()

      expect(result).toBe('')
    })
  })

  describe('getWhepUrl', () => {
    it('returns WHEP URL from stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'https://example.com/whep/stream-456',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId: 'stream-456'
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getWhepUrl()

      expect(result).toBe('https://example.com/whep/stream-456')
    })

    it('returns empty string when no stream response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      const result = config.getWhepUrl()

      expect(result).toBe('')
    })
  })

  describe('getDataUrl', () => {
    it('returns data URL from stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'https://example.com/data/stream-789',
        streamId: 'stream-789'
      }

      config.updateFromStreamStartResponse(mockResponse)
      const result = config.getDataUrl()

      expect(result).toBe('https://example.com/data/stream-789')
    })

    it('returns empty string when no stream response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      const result = config.getDataUrl()

      expect(result).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles streamId with hyphens and underscores', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId: 'stream_test-123_abc'
      }

      config.updateFromStreamStartResponse(mockResponse)

      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/ai/stream/stream_test-123_abc/start')
      expect(config.getStreamStopUrl()).toBe('https://example.com:8088/ai/stream/stream_test-123_abc/stop')
    })

    it('handles streamId with alphanumeric characters', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId: 'abc123def456'
      }

      config.updateFromStreamStartResponse(mockResponse)

      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/ai/stream/abc123def456/start')
      expect(config.getStreamStopUrl()).toBe('https://example.com:8088/ai/stream/abc123def456/stop')
    })
  })
})
