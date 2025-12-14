/**
 * Tests for StreamPublisher URL building methods
 */

import { describe, it, expect } from 'vitest'
import { StreamPublisher } from '../core/StreamPublisher'
import { StreamConfig } from '../types'

describe('StreamPublisher URL building', () => {
  const config = new StreamConfig({
    gatewayUrl: 'https://example.com:8088'
  })
  const publisher = new StreamPublisher(config)

  describe('buildStatusUrl', () => {
    it('should handle WHIP URL with query parameters', () => {
      const whipUrl = 'https://example.com/gateway/ai/stream/start?pipeline=comfystream&width=1280'
      const streamId = 'test-stream-123'
      
      // Access private method via reflection for testing
      const buildStatusUrl = (publisher as any).buildStatusUrl.bind(publisher)
      const result = buildStatusUrl(streamId, whipUrl)
      
      expect(result).toBe('https://example.com/gateway/ai/stream/test-stream-123/status')
      expect(result).not.toContain('?')
      expect(result).not.toContain('pipeline')
    })

    it('should handle WHIP URL without query parameters', () => {
      const whipUrl = 'https://example.com/gateway/ai/stream/start'
      const streamId = 'test-stream-123'
      
      const buildStatusUrl = (publisher as any).buildStatusUrl.bind(publisher)
      const result = buildStatusUrl(streamId, whipUrl)
      
      expect(result).toBe('https://example.com/gateway/ai/stream/test-stream-123/status')
    })
  })

  describe('buildUpdateUrl', () => {
    it('should handle WHIP URL with query parameters', () => {
      const whipUrl = 'https://example.com/gateway/ai/stream/start?pipeline=comfystream&width=1280&height=720'
      const streamId = 'test-stream-456'
      
      const buildUpdateUrl = (publisher as any).buildUpdateUrl.bind(publisher)
      const result = buildUpdateUrl(streamId, whipUrl)
      
      expect(result).toBe('https://example.com/gateway/ai/stream/test-stream-456/update')
      expect(result).not.toContain('?')
      expect(result).not.toContain('pipeline')
      expect(result).not.toContain('width')
    })

    it('should handle WHIP URL without query parameters', () => {
      const whipUrl = 'https://example.com/gateway/ai/stream/start'
      const streamId = 'test-stream-456'
      
      const buildUpdateUrl = (publisher as any).buildUpdateUrl.bind(publisher)
      const result = buildUpdateUrl(streamId, whipUrl)
      
      expect(result).toBe('https://example.com/gateway/ai/stream/test-stream-456/update')
    })
  })
})
