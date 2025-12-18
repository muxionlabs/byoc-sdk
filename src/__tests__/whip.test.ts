/**
 * Tests for WHIP API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendWhipOffer } from '../api/whip'
import { WhipOfferResponse } from '../types'
import { createMockFetch } from './mockServer'

describe('WHIP API', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = createMockFetch()
  })

  describe('sendWhipOffer', () => {
    it('should successfully send WHIP offer', async () => {
      const mockResponse: WhipOfferResponse = {
        status: 201,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whip/stream-123',
        eTagHeader: '"abc123"',
        linkHeader: '<http://localhost:8088/whep/stream-123>; rel="whep"',
        playbackUrl: 'http://localhost:8088/playback/stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: new Headers({
          'Location': mockResponse.locationHeader!,
          'ETag': mockResponse.eTagHeader!,
          'Link': mockResponse.linkHeader!,
          'Livepeer-Playback-Url': mockResponse.playbackUrl!
        }),
        text: async () => mockResponse.answerSdp
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhipOffer('http://localhost:8088/whip/stream-123', sdp)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8088/whip/stream-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: sdp
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid SDP'
      })

      const sdp = 'invalid-sdp'

      await expect(sendWhipOffer('http://localhost:8088/whip/stream-123', sdp))
        .rejects.toThrow('WHIP offer failed. Status: 400, Response: Invalid SDP')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'

      await expect(sendWhipOffer('http://localhost:8088/whip/stream-123', sdp))
        .rejects.toThrow('Network error')
    })

    it('should retry on failure with default retries', async () => {
      const mockResponse: WhipOfferResponse = {
        status: 201,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whip/stream-123',
        eTagHeader: '"abc123"',
        linkHeader: '<http://localhost:8088/whep/stream-123>; rel="whep"',
        playbackUrl: 'http://localhost:8088/playback/stream-123'
      }

      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          status: 201,
          headers: new Headers({
            'Location': mockResponse.locationHeader!,
            'ETag': mockResponse.eTagHeader!,
            'Link': mockResponse.linkHeader!,
            'Livepeer-Playback-Url': mockResponse.playbackUrl!
          }),
          text: async () => mockResponse.answerSdp
        })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhipOffer('http://localhost:8088/whip/stream-123', sdp)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should respect custom retry count', async () => {
      const mockResponse: WhipOfferResponse = {
        status: 201,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whip/stream-123',
        eTagHeader: '"abc123"',
        linkHeader: '<http://localhost:8088/whep/stream-123>; rel="whep"',
        playbackUrl: 'http://localhost:8088/playback/stream-123'
      }

      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          status: 201,
          headers: new Headers({
            'Location': mockResponse.locationHeader!,
            'ETag': mockResponse.eTagHeader!,
            'Link': mockResponse.linkHeader!,
            'Livepeer-Playback-Url': mockResponse.playbackUrl!
          }),
          text: async () => mockResponse.answerSdp
        })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhipOffer('http://localhost:8088/whip/stream-123', sdp, 5)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    it('should handle missing headers gracefully', async () => {
      const mockResponse: WhipOfferResponse = {
        status: 201,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: null,
        eTagHeader: null,
        linkHeader: null,
        playbackUrl: null
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        headers: new Headers({}),
        text: async () => mockResponse.answerSdp
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhipOffer('http://localhost:8088/whip/stream-123', sdp)

      expect(result).toEqual(mockResponse)
    })

    it('should handle non-201 status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request'
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'

      await expect(sendWhipOffer('http://localhost:8088/whip/stream-123', sdp))
        .rejects.toThrow('WHIP offer failed. Status: 400')
    })
  })
})