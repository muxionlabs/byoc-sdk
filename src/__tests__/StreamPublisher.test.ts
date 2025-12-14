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
})
