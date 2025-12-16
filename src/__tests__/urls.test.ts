/**
 * Tests for StreamConfig URL construction methods
 */

import { describe, it, expect } from 'vitest'
import { StreamConfig, StreamStartResponse } from '../types'

describe('StreamConfig URL construction', () => {
  describe('getStreamStartUrl', () => {
    it('should return base start URL when no stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      
      const startUrl = config.getStreamStartUrl()
      
      expect(startUrl).toBe('https://example.com:8088/gateway/ai/stream/start')
    })

    it('should construct start URL from stream ID', () => {
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
        stopUrl: 'stop-url',
        streamId: 'test-stream-123'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const startUrl = config.getStreamStartUrl()
      
      expect(startUrl).toBe('https://example.com:8088/gateway/ai/stream/start')
    })

    it('should handle gateway URL with trailing slash', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088/'
      })
      
      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        stopUrl: 'stop-url',
        streamId: 'my-stream'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const startUrl = config.getStreamStartUrl()
      
      expect(startUrl).toBe('https://example.com:8088/gateway/ai/stream/start')
    })
  })

  describe('getStreamStopUrl', () => {
    it('should return empty string when no stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      
      const stopUrl = config.getStreamStopUrl()
      
      expect(stopUrl).toBe('')
    })

    it('should construct stop URL from stream ID', () => {
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
        stopUrl: 'https://example.com:8088/gateway/ai/stream/test-stream-456/stop',
        streamId: 'test-stream-456'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const stopUrl = config.getStreamStopUrl()
      
      expect(stopUrl).toBe('https://example.com:8088/gateway/ai/stream/test-stream-456/stop')
    })
  })

  describe('getWhipUrl', () => {
    it('should return empty string when no stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      
      const whipUrl = config.getWhipUrl()
      
      expect(whipUrl).toBe('')
    })

    it('should return WHIP URL from stream start response', () => {
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
        stopUrl: 'stop-url',
        streamId: 'stream-123'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const whipUrl = config.getWhipUrl()
      
      expect(whipUrl).toBe('https://example.com/whip/stream-123')
    })
  })

  describe('getWhepUrl', () => {
    it('should return empty string when no stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      
      const whepUrl = config.getWhepUrl()
      
      expect(whepUrl).toBe('')
    })

    it('should return WHEP URL from stream start response', () => {
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
        stopUrl: 'stop-url',
        streamId: 'stream-456'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const whepUrl = config.getWhepUrl()
      
      expect(whepUrl).toBe('https://example.com/whep/stream-456')
    })
  })

  describe('getStatusUrl', () => {
    it('should return empty string when no stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      
      const statusUrl = config.getStatusUrl()
      
      expect(statusUrl).toBe('')
    })

    it('should return status URL from stream start response', () => {
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
        stopUrl: 'stop-url',
        streamId: 'stream-789'
      }
      
      config.updateFromStreamStartResponse(mockResponse)
      const statusUrl = config.getStatusUrl()
      
      expect(statusUrl).toBe('https://example.com/status/stream-789')
    })
  })
})
