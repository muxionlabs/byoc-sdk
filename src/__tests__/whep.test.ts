/**
 * Tests for WHEP API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendWhepOffer } from '../api/whep'
import { WhepOfferResponse } from '../types'
import { createMockFetch } from './mockServer'

describe('WHEP API', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = createMockFetch()
  })

  describe('sendWhepOffer', () => {
    it('should successfully send WHEP offer', async () => {
      const mockResponse: WhepOfferResponse = {
        status: 200,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whep/stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Location': mockResponse.locationHeader!
        }),
        text: async () => mockResponse.answerSdp
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhepOffer('http://localhost:8088/whep/stream-123', sdp)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8088/whep/stream-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: sdp
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid SDP'
      })

      const sdp = 'invalid-sdp'

      await expect(sendWhepOffer('http://localhost:8088/whep/stream-123', sdp))
        .rejects.toThrow('WHEP offer failed. Status: 400, Response: Invalid SDP')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'

      await expect(sendWhepOffer('http://localhost:8088/whep/stream-123', sdp))
        .rejects.toThrow('Network error')
    })

    it('should retry on failure with default retries', async () => {
      const mockResponse: WhepOfferResponse = {
        status: 200,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whep/stream-123'
      }

      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'Location': mockResponse.locationHeader!
          }),
          text: async () => mockResponse.answerSdp
        })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhepOffer('http://localhost:8088/whep/stream-123', sdp)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should respect custom retry count', async () => {
      const mockResponse: WhepOfferResponse = {
        status: 200,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: 'http://localhost:8088/whep/stream-123'
      }

      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'Location': mockResponse.locationHeader!
          }),
          text: async () => mockResponse.answerSdp
        })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhepOffer('http://localhost:8088/whep/stream-123', sdp, 5)

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })

    it('should handle missing location header gracefully', async () => {
      const mockResponse: WhepOfferResponse = {
        status: 200,
        answerSdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n',
        locationHeader: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({}),
        text: async () => mockResponse.answerSdp
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      const result = await sendWhepOffer('http://localhost:8088/whep/stream-123', sdp)

      expect(result).toEqual(mockResponse)
    })

    it('should handle non-200 status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'

      await expect(sendWhepOffer('http://localhost:8088/whep/stream-123', sdp))
        .rejects.toThrow('WHEP offer failed. Status: 404')
    })

    it('should handle various HTTP status codes', async () => {
      const statusCodes = [201, 202, 204, 200]
      
      for (const statusCode of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: statusCode,
          headers: new Headers({}),
          text: async () => 'answer-sdp'
        })

        const sdp = 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
        const result = await sendWhepOffer('http://localhost:8088/whep/stream-123', sdp)

        expect(result.status).toBe(statusCode)
      }
    })
  })
})