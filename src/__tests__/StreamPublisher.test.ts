/**
 * Tests for StreamPublisher URL building methods
 */

import { describe, it, expect } from 'vitest'
import { StreamConfig } from '../types'

describe('StreamConfig URL helpers', () => {
  describe('getStatusUrl', () => {
    it('builds status URL from default paths', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      const streamId = 'test-stream-123'

      const result = config.getStatusUrl(streamId)

      expect(result).toBe('https://example.com:8088/gateway/ai/stream/test-stream-123/status')
      const pathPart = result.split('://')[1]
      expect(pathPart).not.toContain('//')
    })

    it('builds status URL with custom whip path', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com',
        whipPath: '/custom/start/'
      })
      const result = config.getStatusUrl('abc')

      expect(result).toBe('https://example.com/custom/abc/status')
    })
  })

  describe('getUpdateUrl', () => {
    it('builds update URL from default paths', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      const streamId = 'test-stream-456'

      const result = config.getUpdateUrl(streamId)

      expect(result).toBe('https://example.com:8088/gateway/ai/stream/test-stream-456/update')
      const pathPart = result.split('://')[1]
      expect(pathPart).not.toContain('//')
    })

    it('builds update URL with custom whip path', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com',
        whipPath: '/custom/start/'
      })
      const result = config.getUpdateUrl('abc')

      expect(result).toBe('https://example.com/custom/abc/update')
    })
  })

  describe('getStopUrl', () => {
    it('builds stop URL from default paths', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com:8088'
      })
      const streamId = 'test-stream-789'

      const result = config.getStopUrl(streamId)

      expect(result).toBe('https://example.com:8088/gateway/ai/stream/test-stream-789/stop')
      const pathPart = result.split('://')[1]
      expect(pathPart).not.toContain('//')
    })

    it('builds stop URL with custom whip path', () => {
      const config = new StreamConfig({
        gatewayUrl: 'https://example.com',
        whipPath: '/custom/start/'
      })
      const result = config.getStopUrl('xyz')

      expect(result).toBe('https://example.com/custom/xyz/stop')
    })
  })

  describe('edge cases', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://example.com:8088'
    })

    it('handles streamId with hyphens and underscores', () => {
      const streamId = 'stream_test-123_abc'
      const statusUrl = config.getStatusUrl(streamId)
      const updateUrl = config.getUpdateUrl(streamId)
      const stopUrl = config.getStopUrl(streamId)

      expect(statusUrl).toBe('https://example.com:8088/gateway/ai/stream/stream_test-123_abc/status')
      expect(updateUrl).toBe('https://example.com:8088/gateway/ai/stream/stream_test-123_abc/update')
      expect(stopUrl).toBe('https://example.com:8088/gateway/ai/stream/stream_test-123_abc/stop')
    })

    it('handles streamId with alphanumeric characters', () => {
      const streamId = 'abc123XYZ789'
      const result = config.getStatusUrl(streamId)
      expect(result).toBe('https://example.com:8088/gateway/ai/stream/abc123XYZ789/status')
    })

    it('handles gateway URL with trailing slashes', () => {
      const configWithSlash = new StreamConfig({
        gatewayUrl: 'https://example.com:8088///'
      })
      const result = configWithSlash.getStatusUrl('test')
      expect(result).toBe('https://example.com:8088/gateway/ai/stream/test/status')
      expect(result).not.toContain('////')
    })

    it('handles custom paths with inconsistent slashes', () => {
      const configCustom = new StreamConfig({
        gatewayUrl: 'https://example.com',
        whipPath: 'custom/path/start/'
      })
      const result = configCustom.getStatusUrl('test')
      expect(result).toBe('https://example.com/custom/path/test/status')
    })
  })
})
