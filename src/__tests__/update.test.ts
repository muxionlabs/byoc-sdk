/**
 * Tests for Stream Update API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendStreamUpdate } from '../api/update'

// Mock fetch for testing
const mockFetch = vi.fn()

describe('Stream Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  describe('sendStreamUpdate', () => {
    it('should successfully send stream update', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK'
      })

      const updateData = {
        fpsLimit: 60,
        bitrate: 2000000
      }

      const result = await sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/update/stream-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Livepeer': expect.any(String)
        },
        body: JSON.stringify(updateData)
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request'
      })

      const updateData = { fpsLimit: 60 }

      await expect(sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )).rejects.toThrow('Update failed: 400 Bad Request')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const updateData = { fpsLimit: 60 }

      await expect(sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )).rejects.toThrow('Network error')
    })

    it('should handle non-200 status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: 'Not Found'
      })

      const updateData = { fpsLimit: 60 }

      await expect(sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )).rejects.toThrow('Update failed: 404 Not Found')
    })

    it('should send complex update data', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK'
      })

      const updateData = {
        fpsLimit: 60,
        bitrate: 2000000,
        resolution: { width: 1920, height: 1080 },
        audioBitrate: 128000,
        customParams: {
          prompts: 'new prompt',
          threshold: 0.7
        }
      }

      const result = await sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )

      expect(result).toBe(true)
    })

    it('should handle empty update data', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK'
      })

      const updateData = {}

      const result = await sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )

      expect(result).toBe(true)
    })

    it('should include streamId in request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK'
      })

      const updateData = { fpsLimit: 60 }

      await sendStreamUpdate(
        'https://example.com/update/stream-123',
        'stream-123',
        'comfystream',
        updateData
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/update/stream-123',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Livepeer': expect.any(String)
          }),
          body: JSON.stringify(updateData)
        })
      )
    })
  })
})