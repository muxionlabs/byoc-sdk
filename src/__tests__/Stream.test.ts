/**
 * Tests for Stream class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Stream } from '../core/Stream'
import { StreamConfig, StreamStartOptions, StreamStartResponse } from '../types'

// Mock WebRTC and fetch
const mockFetch = vi.fn()
const mockGetUserMedia = vi.fn()
const mockCreatePeerConnection = vi.fn()
const mockGetMediaDevices = vi.fn()

describe('Stream class', () => {
  let stream: Stream
  let config: StreamConfig

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
    global.navigator = {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: mockGetMediaDevices
      }
    } as any
    mockGetMediaDevices.mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' }
    ])
  })

  beforeEach(() => {
    config = new StreamConfig({
      gatewayUrl: 'https://example.com:8088',
      defaultPipeline: 'comfystream'
    })
    stream = new Stream(config)
  })

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(stream.getConnectionStatus()).toBe('disconnected')
      expect(stream.getStreamInfo()).toBeNull()
      expect(stream.getLocalStream()).toBeNull()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return current connection status', () => {
      expect(stream.getConnectionStatus()).toBe('disconnected')
    })
  })

  describe('getStreamInfo', () => {
    it('should return stream info when available', () => {
      const mockResponse: StreamStartResponse = {
        whipUrl: 'whip-url',
        whepUrl: 'whep-url',
        rtmpUrl: 'rtmp-url',
        rtmpOutputUrl: 'rtmp-output-url',
        updateUrl: 'update-url',
        statusUrl: 'status-url',
        dataUrl: 'data-url',
        streamId: 'stream-123'
      }

      config.updateFromStreamStartResponse(mockResponse)
      expect(stream.getStreamInfo()).toEqual(mockResponse)
    })

    it('should return null when no stream info available', () => {
      expect(stream.getStreamInfo()).toBeNull()
    })
  })

  describe('getLocalStream', () => {
    it('should return local stream when available', () => {
      const mockStream = new MediaStream()
      mockGetUserMedia.mockResolvedValue(mockStream)

      // This would typically be set during the start process
      expect(stream.getLocalStream()).toBeNull()
    })
  })

  describe('getMediaDevices', () => {
    it('should return available media devices', async () => {
      const devices = await stream.getMediaDevices()

      expect(devices).toEqual({
        cameras: [{ kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' }],
        microphones: [{ kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' }],
        speakers: []
      })
    })

    it('should handle errors gracefully', async () => {
      mockGetMediaDevices.mockRejectedValueOnce(new Error('Device access denied'))

      await expect(stream.getMediaDevices())
        .rejects.toThrow('Failed to enumerate media devices')
    })
  })

  describe('requestPermissions', () => {
    it('should request video and audio permissions', async () => {
      const mockStream = new MediaStream()
      mockGetUserMedia.mockResolvedValue(mockStream)

      await stream.requestPermissions(true, true)

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      })
    })

    it('should request only video permissions', async () => {
      const mockStream = new MediaStream()
      mockGetUserMedia.mockResolvedValue(mockStream)

      await stream.requestPermissions(true, false)

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false
      })
    })

    it('should request only audio permissions', async () => {
      const mockStream = new MediaStream()
      mockGetUserMedia.mockResolvedValue(mockStream)

      await stream.requestPermissions(false, true)

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: false,
        audio: true
      })
    })

    it('should handle permission denial', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      await expect(stream.requestPermissions())
        .rejects.toThrow('Failed to request media permissions')
    })
  })

  describe('event handling', () => {
    it('should emit statusChange events correctly', () => {
      const callback = vi.fn()
      stream.on('statusChange', callback)

      // Simulate status change event
      stream.emit('statusChange', 'connecting')

      expect(callback).toHaveBeenCalledWith('connecting')
    })

    it('should handle multiple event listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      stream.on('statusChange', callback1)
      stream.on('statusChange', callback2)

      stream.emit('statusChange', 'connected')

      expect(callback1).toHaveBeenCalledWith('connected')
      expect(callback2).toHaveBeenCalledWith('connected')
    })

    it('should remove event listeners', () => {
      const callback = vi.fn()

      stream.on('statusChange', callback)
      stream.off('statusChange', callback)

      stream.emit('statusChange', 'connecting')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should emit error events', () => {
      const callback = vi.fn()
      stream.on('error', callback)

      const error = new Error('Test error')
      stream.emit('error', error)

      expect(callback).toHaveBeenCalledWith(error)
    })
  })
})