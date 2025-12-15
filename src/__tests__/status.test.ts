/**
 * Tests for Stream Status API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchStreamStatus } from '../api/status'

// Mock fetch for testing
const mockFetch = vi.fn()

describe('Stream Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  describe('fetchStreamStatus', () => {
    it('should successfully fetch stream status', async () => {
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

      const result = await fetchStreamStatus('https://example.com/status/stream-123')

      expect(result).toEqual(mockStatus)
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/status/stream-123')
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(fetchStreamStatus('https://example.com/status/stream-123'))
        .rejects.toThrow('HTTP 404: Not Found')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchStreamStatus('https://example.com/status/stream-123'))
        .rejects.toThrow('Failed to fetch status')
    })

    it('should handle generic errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error')

      await expect(fetchStreamStatus('https://example.com/status/stream-123'))
        .rejects.toThrow('Failed to fetch status')
    })

    it('should handle empty response', async () => {
      const mockStatus = {}

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      })

      const result = await fetchStreamStatus('https://example.com/status/stream-123')

      expect(result).toEqual({})
    })

    it('should handle complex status response', async () => {
      const mockStatus = {
        status: 'active',
        streamId: 'stream-123',
        connected: true,
        bitrate: 2000000,
        fps: 60,
        resolution: { width: 1920, height: 1080 },
        audio: { codec: 'AAC', bitrate: 128000 },
        video: { codec: 'H264', bitrate: 2000000 }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      })

      const result = await fetchStreamStatus('https://example.com/status/stream-123')

      expect(result).toEqual(mockStatus)
    })
  })
})