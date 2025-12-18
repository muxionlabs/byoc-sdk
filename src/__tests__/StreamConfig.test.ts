/**
 * Tests for StreamConfig class
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StreamConfig, StreamStartResponse } from '../types'

describe('StreamConfig class', () => {
  describe('constructor', () => {
    it('should initialize with gateway URL', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      expect(config.gatewayUrl).toBe('https://example.com:8088')
      expect(config.defaultPipeline).toBeUndefined()
      expect(config.iceServers).toBeUndefined()
    })

    it('should initialize with default pipeline', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088',
        defaultPipeline: 'comfystream'
      })

      expect(config.gatewayUrl).toBe('https://example.com:8088')
      expect(config.defaultPipeline).toBe('comfystream')
    })

    it('should initialize with ICE servers', () => {
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' }
      ]

      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088',
        iceServers
      })

      expect(config.gatewayUrl).toBe('https://example.com:8088')
      expect(config.iceServers).toEqual(iceServers)
    })

    it('should trim trailing slash from gateway URL', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088/'
      })

      expect(config.gatewayUrl).toBe('https://example.com:8088')
    })
  })

  describe('updateFromStreamStartResponse', () => {
    it('should update config with stream start response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const response: StreamStartResponse = {
        whipUrl: 'https://example.com/whip/stream-123',
        whepUrl: 'https://example.com/whep/stream-123',
        rtmpUrl: 'https://example.com/rtmp/stream-123',
        rtmpOutputUrl: 'https://example.com/rtmp-output/stream-123',
        updateUrl: 'https://example.com/update/stream-123',
        statusUrl: 'https://example.com/status/stream-123',
        dataUrl: 'https://example.com/data/stream-123',
        stopUrl: 'https://example.com:8088/gateway/ai/stream/stream-123/stop',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(response)

      expect(config.getWhipUrl()).toBe('https://example.com/whip/stream-123')
      expect(config.getWhepUrl()).toBe('https://example.com/whep/stream-123')
      expect(config.getStatusUrl()).toBe('https://example.com/status/stream-123')
      expect(config.getDataUrl()).toBe('https://example.com/data/stream-123')
      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')
      expect(config.getStreamStopUrl()).toBe('https://example.com:8088/gateway/ai/stream/stream-123/stop')
    })

    it('should handle empty URLs in response', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      const response: StreamStartResponse = {
        whipUrl: '',
        whepUrl: '',
        rtmpUrl: '',
        rtmpOutputUrl: '',
        updateUrl: '',
        statusUrl: '',
        dataUrl: '',
        stopUrl: '',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(response)

      expect(config.getWhipUrl()).toBe('')
      expect(config.getWhepUrl()).toBe('')
      expect(config.getStatusUrl()).toBe('')
      expect(config.getDataUrl()).toBe('')
    })
  })

  describe('URL construction methods', () => {
    let config: StreamConfig

    beforeEach(() => {
      config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
    })

    describe('getStreamStartUrl', () => {
      it('should return base start URL without stream ID', () => {
        expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')
      })
    })

    describe('getStreamStopUrl', () => {
      it('should return empty string when no stream response', () => {
        expect(config.getStreamStopUrl()).toBe('')
      })

      it('should construct stop URL from stream ID', () => {
        config.updateFromStreamStartResponse({
          whipUrl: 'whip-url',
          whepUrl: 'whep-url',
          rtmpUrl: 'rtmp-url',
          rtmpOutputUrl: 'rtmp-output-url',
          updateUrl: 'update-url',
          statusUrl: 'status-url',
          dataUrl: 'data-url',
          stopUrl: 'https://example.com:8088/gateway/ai/stream/test-stream-456/stop',
          streamId: 'test-stream-456'
        })

        expect(config.getStreamStopUrl()).toBe('https://example.com:8088/gateway/ai/stream/test-stream-456/stop')
      })
    })

    describe('getWhipUrl', () => {
      it('should return empty string when no stream response', () => {
        expect(config.getWhipUrl()).toBe('')
      })

      it('should return WHIP URL from response', () => {
        config.updateFromStreamStartResponse({
          whipUrl: 'https://example.com/whip/stream-123',
          whepUrl: 'whep-url',
          rtmpUrl: 'rtmp-url',
          rtmpOutputUrl: 'rtmp-output-url',
          updateUrl: 'update-url',
          statusUrl: 'status-url',
          dataUrl: 'data-url',
          stopUrl: 'stop-url',
          streamId: 'stream-123'
        })

        expect(config.getWhipUrl()).toBe('https://example.com/whip/stream-123')
      })
    })

    describe('getWhepUrl', () => {
      it('should return empty string when no stream response', () => {
        expect(config.getWhepUrl()).toBe('')
      })

      it('should return WHEP URL from response', () => {
        config.updateFromStreamStartResponse({
          whipUrl: 'whip-url',
          whepUrl: 'https://example.com/whep/stream-456',
          rtmpUrl: 'rtmp-url',
          rtmpOutputUrl: 'rtmp-output-url',
          updateUrl: 'update-url',
          statusUrl: 'status-url',
          dataUrl: 'data-url',
          stopUrl: 'stop-url',
          streamId: 'stream-456'
        })

        expect(config.getWhepUrl()).toBe('https://example.com/whep/stream-456')
      })
    })

    describe('getStatusUrl', () => {
      it('should return empty string when no stream response', () => {
        expect(config.getStatusUrl()).toBe('')
      })

      it('should return status URL from response', () => {
        config.updateFromStreamStartResponse({
          whipUrl: 'whip-url',
          whepUrl: 'whep-url',
          rtmpUrl: 'rtmp-url',
          rtmpOutputUrl: 'rtmp-output-url',
          updateUrl: 'update-url',
          statusUrl: 'https://example.com/status/stream-789',
          dataUrl: 'data-url',
          stopUrl: 'stop-url',
          streamId: 'stream-789'
        })

        expect(config.getStatusUrl()).toBe('https://example.com/status/stream-789')
      })
    })

    describe('getDataUrl', () => {
      it('should return empty string when no stream response', () => {
        expect(config.getDataUrl()).toBe('')
      })

      it('should return data URL from response', () => {
        config.updateFromStreamStartResponse({
          whipUrl: 'whip-url',
          whepUrl: 'whep-url',
          rtmpUrl: 'rtmp-url',
          rtmpOutputUrl: 'rtmp-output-url',
          updateUrl: 'update-url',
          statusUrl: 'status-url',
          dataUrl: 'https://example.com/data/stream-999',
          stopUrl: 'stop-url',
          streamId: 'stream-999'
        })

        expect(config.getDataUrl()).toBe('https://example.com/data/stream-999')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle gateway URL with various formats', () => {
      const config1 = new StreamConfig({
        gatewayUrl: 'https://example.com'
      })
      expect(config1.gatewayUrl).toBe('https://example.com')

      const config2 = new StreamConfig({
        gatewayUrl: 'https://example.com/'
      })
      expect(config2.gatewayUrl).toBe('https://example.com')

      const config3 = new StreamConfig({
        gatewayUrl: 'http://localhost:8088'
      })
      expect(config3.gatewayUrl).toBe('http://localhost:8088')
    })

    it('should handle stream IDs with special characters', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        stopUrl: 'https://example.com:8088/gateway/ai/stream/stream_test-123_abc/stop',
        streamId: 'stream_test-123_abc'
      })

      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')
      expect(config.getStreamStopUrl()).toBe('https://example.com:8088/gateway/ai/stream/stream_test-123_abc/stop')
    })

    it('should handle empty stream ID', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })

      config.updateFromStreamStartResponse({
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        stopUrl: '',
        streamId: ''
      })

      expect(config.getStreamStartUrl()).toBe('https://example.com:8088/gateway/ai/stream/start')
      expect(config.getStreamStopUrl()).toBe('')
    })
  })
})