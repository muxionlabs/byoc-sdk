/**
 * Tests for StreamViewer class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StreamViewer } from '../core/StreamViewer'
import { StreamConfig, ViewerStartOptions } from '../types'

// Mock WebRTC and fetch
const mockFetch = vi.fn()
const mockSetRemoteDescription = vi.fn()
const mockSetLocalDescription = vi.fn()

// Make the RTCPeerConnection mock constructible so tests using `new RTCPeerConnection()` work
const mockCreatePeerConnection = vi.fn().mockImplementation(function() {
  return {
    setRemoteDescription: mockSetRemoteDescription,
    setLocalDescription: mockSetLocalDescription,
    createOffer: vi.fn().mockResolvedValue({ sdp: 'offer-sdp' }),
    localDescription: { sdp: 'offer-sdp' },
    getStats: vi.fn().mockResolvedValue(new Map()),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addTrack: vi.fn(),
    close: vi.fn()
  }
})

describe('StreamViewer class', () => {
  let viewer: StreamViewer
  let config: StreamConfig
  let mockVideoElement: HTMLVideoElement

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
    global.RTCPeerConnection = mockCreatePeerConnection as any

    mockVideoElement = {
      srcObject: null,
      play: vi.fn(),
      pause: vi.fn()
    } as any
  })

  beforeEach(() => {
    config = new StreamConfig({
      gatewayUrl: 'https://example.com:8088'
    })
    viewer = new StreamViewer(config)
  })

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(viewer.getConnectionStatus()).toBe('disconnected')
      expect(viewer.getVideoElement()).toBeNull()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return current connection status', () => {
      expect(viewer.getConnectionStatus()).toBe('disconnected')
    })
  })

  describe('getVideoElement', () => {
    it('should return video element when set', () => {
      viewer.setVideoElement(mockVideoElement)
      expect(viewer.getVideoElement()).toBe(mockVideoElement)
    })

    it('should return null when no video element set', () => {
      expect(viewer.getVideoElement()).toBeNull()
    })
  })

  describe('setVideoElement', () => {
    it('should set video element for playback', () => {
      viewer.setVideoElement(mockVideoElement)
      expect(viewer.getVideoElement()).toBe(mockVideoElement)
    })

    it('should replace existing video element', () => {
      const newVideoElement = { srcObject: null } as HTMLVideoElement
      viewer.setVideoElement(mockVideoElement)
      viewer.setVideoElement(newVideoElement)
      expect(viewer.getVideoElement()).toBe(newVideoElement)
    })
  })

  describe('start', () => {
    it('should successfully start viewing a stream', async () => {
      const options: ViewerStartOptions = {
        whepUrl: 'https://example.com/whep/stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Location': 'https://example.com/whep/stream-123'
        }),
        text: async () => 'answer-sdp'
      })

      await viewer.start(options)

      expect(viewer.getConnectionStatus()).toBe('connected')
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/whep/stream-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: 'offer-sdp'
      })
    })

    it('should throw error when already active', async () => {
      const options: ViewerStartOptions = {
        whepUrl: 'https://example.com/whep/stream-123'
      }

      // First start
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({}),
        text: async () => 'answer-sdp'
      })
      await viewer.start(options)

      // Second start should throw error
      await expect(viewer.start(options))
        .rejects.toThrow('Viewer is already active. Stop the current viewer first.')
    })

    it('should throw error when no WHEP URL provided', async () => {
      const options: ViewerStartOptions = {
        whepUrl: ''
      }

      await expect(viewer.start(options))
        .rejects.toThrow('No WHEP URL provided. Pass the whepUrl from StreamPublisher.getStreamInfo()')
    })

    it('should handle HTTP errors', async () => {
      const options: ViewerStartOptions = {
        whepUrl: 'https://example.com/whep/stream-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(viewer.start(options))
        .rejects.toThrow()
    })

    it('should handle network errors', async () => {
      const options: ViewerStartOptions = {
        whepUrl: 'https://example.com/whep/stream-123'
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(viewer.start(options))
        .rejects.toThrow('Network error')
    })
  })

  describe('event handling', () => {
    it('should emit statusChange events correctly', () => {
      const callback = vi.fn()
      viewer.on('statusChange', callback)

      // Simulate status change event
      viewer.emit('statusChange', 'connecting')

      expect(callback).toHaveBeenCalledWith('connecting')
    })

    it('should handle multiple event listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      viewer.on('statusChange', callback1)
      viewer.on('statusChange', callback2)

      viewer.emit('statusChange', 'connected')

      expect(callback1).toHaveBeenCalledWith('connected')
      expect(callback2).toHaveBeenCalledWith('connected')
    })

    it('should remove event listeners', () => {
      const callback = vi.fn()

      viewer.on('statusChange', callback)
      viewer.off('statusChange', callback)

      viewer.emit('statusChange', 'connecting')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should emit error events', () => {
      const callback = vi.fn()
      viewer.on('error', callback)

      const error = new Error('Test error')
      viewer.emit('error', error)

      expect(callback).toHaveBeenCalledWith(error)
    })
  })
})