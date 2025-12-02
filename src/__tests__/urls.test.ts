/**
 * Tests for URL utilities
 */

import { describe, it, expect } from 'vitest'
import {
  generateStreamId,
  constructWhipUrl,
  constructWhepUrl,
  constructDataStreamUrl,
  constructKafkaEventsUrl
} from '../utils/urls'

describe('URL utilities', () => {
  describe('generateStreamId', () => {
    it('should generate a unique stream ID', () => {
      const id1 = generateStreamId()
      const id2 = generateStreamId()

      expect(id1).toMatch(/^stream-[a-z0-9]+-[a-z0-9]+$/)
      expect(id2).toMatch(/^stream-[a-z0-9]+-[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('constructWhipUrl', () => {
    it('should construct basic WHIP URL', () => {
      const url = constructWhipUrl(
        'https://example.com/gateway/ai/stream/start',
        'my-stream',
        'comfystream'
      )

      expect(url).toContain('/my-stream/whip')
      expect(url).toContain('pipeline=comfystream')
    })

    it('should include resolution parameters', () => {
      const url = constructWhipUrl(
        'https://example.com/gateway/ai/stream/start',
        'my-stream',
        'comfystream',
        1280,
        720
      )

      expect(url).toContain('params=')
      expect(decodeURIComponent(url)).toContain('"width":1280')
      expect(decodeURIComponent(url)).toContain('"height":720')
    })

    it('should include custom parameters', () => {
      const url = constructWhipUrl(
        'https://example.com/gateway/ai/stream/start',
        'my-stream',
        'comfystream',
        undefined,
        undefined,
        { prompts: 'test prompt', threshold: 0.5 }
      )

      // URL uses + for spaces, so we need to handle that
      const decodedUrl = decodeURIComponent(url).replace(/\+/g, ' ')
      expect(decodedUrl).toContain('"prompts":"test prompt"')
      expect(decodedUrl).toContain('"threshold":0.5')
    })

    it('should include streamId if provided', () => {
      const url = constructWhipUrl(
        'https://example.com/gateway/ai/stream/start',
        'my-stream',
        'comfystream',
        undefined,
        undefined,
        undefined,
        'stream-123'
      )

      expect(url).toContain('streamId=stream-123')
    })
  })

  describe('constructWhepUrl', () => {
    it('should return base URL when no playback URL provided', () => {
      const url = constructWhepUrl('https://example.com/mediamtx')
      expect(url).toBe('https://example.com/mediamtx')
    })

    it('should return playback URL when it is a full URL', () => {
      const playbackUrl = 'https://example.com/stream/abc/whep'
      const url = constructWhepUrl('https://example.com/mediamtx', playbackUrl)
      expect(url).toBe(playbackUrl)
    })
  })

  describe('constructDataStreamUrl', () => {
    it('should construct data stream URL', () => {
      const url = constructDataStreamUrl(
        'https://example.com/gateway',
        'my-stream'
      )

      expect(url).toBe('https://example.com/gateway/live/video-to-video/my-stream/data')
    })

    it('should use custom URL if provided', () => {
      const customUrl = 'https://custom.com/data'
      const url = constructDataStreamUrl(
        'https://example.com/gateway',
        'my-stream',
        customUrl
      )

      expect(url).toBe(customUrl)
    })
  })

  describe('constructKafkaEventsUrl', () => {
    it('should construct Kafka events URL', () => {
      const url = constructKafkaEventsUrl(
        'https://example.com/kafka/events',
        'my-stream'
      )

      expect(url).toBe('https://example.com/kafka/events/live/my-stream/events')
    })

    it('should use custom URL if provided', () => {
      const customUrl = 'https://custom.com/events'
      const url = constructKafkaEventsUrl(
        'https://example.com/kafka/events',
        'my-stream',
        customUrl
      )

      expect(url).toBe(customUrl)
    })
  })
})

