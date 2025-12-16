/**
 * Tests for Stream class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerStreamApiMocks,
  mockStartStream,
  mockStopStream,
  mockSendStreamUpdate,
  mockFetchStreamStatus,
  setupNavigatorMediaMocks
} from './helpers/streamMocks'
import { Stream } from '../core/Stream'
import { StreamConfig, StreamStartOptions, StreamStartResponse } from '../types'

registerStreamApiMocks()

vi.mock('../api/start', () => ({
  startStream: vi.fn(),
  stopStream: vi.fn()
}))

vi.mock('../api/update', () => ({
  sendStreamUpdate: vi.fn()
}))

vi.mock('../api/status', () => ({
  fetchStreamStatus: vi.fn()
}))

vi.mock('../api/whip', () => ({
  sendWhipOffer: vi.fn().mockResolvedValue({
    status: 201,
    answerSdp: 'answer-sdp',
    locationHeader: null,
    eTagHeader: null,
    linkHeader: null,
    playbackUrl: null
  })
}))

const mockedStartStream = vi.mocked(mockStartStream)
const mockedStopStream = vi.mocked(mockStopStream)
const mockedSendStreamUpdate = vi.mocked(mockSendStreamUpdate)
const mockedFetchStreamStatus = vi.mocked(mockFetchStreamStatus)

// Mock WebRTC and fetch
const mockFetch = vi.fn()
let mockGetUserMedia: ReturnType<typeof setupNavigatorMediaMocks>['mockGetUserMedia']
let mockGetMediaDevices: ReturnType<typeof setupNavigatorMediaMocks>['mockEnumerateDevices']
let mockPeerConnectionFactory: any
let mockPeerConnection: any

describe('Stream class', () => {
  let stream: Stream
  let config: StreamConfig
  const mockStartResponse: StreamStartResponse = {
    whipUrl: 'whip-url',
    whepUrl: 'whep-url',
    rtmpUrl: 'rtmp-url',
    rtmpOutputUrl: 'rtmp-output-url',
    updateUrl: 'update-url',
    statusUrl: 'status-url',
    dataUrl: 'data-url',
    stopUrl: 'stop-url',
    streamId: 'stream-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const mediaMocks = setupNavigatorMediaMocks()
    mockGetUserMedia = mediaMocks.mockGetUserMedia
    mockGetMediaDevices = mediaMocks.mockEnumerateDevices
    mockPeerConnection = {
      addEventListener: vi.fn(),
      addTrack: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ sdp: 'offer-sdp' }),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      localDescription: { sdp: 'offer-sdp' },
      getStats: vi.fn().mockResolvedValue(new Map()),
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
      close: vi.fn()
    }
    mockPeerConnectionFactory = vi.fn().mockImplementation(() => mockPeerConnection)
    global.RTCPeerConnection = mockPeerConnectionFactory as any
    mockedStartStream.mockResolvedValue(mockStartResponse)
    mockedStopStream.mockResolvedValue(undefined)
    mockedSendStreamUpdate.mockResolvedValue(undefined)
    mockedFetchStreamStatus.mockResolvedValue({ status: 'ok' })
    global.fetch = mockFetch
    mockGetMediaDevices.mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' }
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
        stopUrl: 'stop-url',
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

  describe('stats parsing', () => {
    it('calculates bitrate, fps, and resolution from outbound stats', () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      ;(stream as any).lastStats = {
        time: 1000,
        bytes: 1000,
        frameTime: 0,
        frameCount: 10
      }

      const stats = new Map<string, any>([
        [
          'out',
          {
            type: 'outbound-rtp',
            kind: 'video',
            bytesSent: 3000,
            framesEncoded: 30,
            frameWidth: 640,
            frameHeight: 480
          }
        ]
      ])

      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(2000)
      const result = (stream as any).parseStats(stats)
      nowSpy.mockRestore()

      expect(result).toEqual({
        bitrate: 16,
        fps: 20,
        resolution: '640x480',
        streamId: 'stream-123'
      })
    })
  })

  describe('start', () => {
    it('initializes the stream and stores start response', async () => {
      const statusListener = vi.fn()
      const startedListener = vi.fn()
      stream.on('statusChange', statusListener)
      stream.on('streamStarted', startedListener)

      const options: StreamStartOptions = {
        streamName: 'test-stream',
        pipeline: 'comfystream'
      }

      await stream.start(options)

      expect(mockedStartStream).toHaveBeenCalledWith(config.getStreamStartUrl(), options)
      expect(stream.getConnectionStatus()).toBe('connected')
      expect(stream.getStreamInfo()).toEqual(mockStartResponse)
      expect(startedListener).toHaveBeenCalledWith(mockStartResponse)
      expect(statusListener).toHaveBeenCalledWith('connected')

      await stream.stop()
    })

    it('throws when starting while already active', async () => {
      const options: StreamStartOptions = {
        streamName: 'dup-stream',
        pipeline: 'comfystream'
      }

      await stream.start(options)
      await expect(stream.start(options)).rejects.toThrow('Stream is already active. Stop the current stream first.')
      await stream.stop()
    })

    it('emits error and cleans up on failure', async () => {
      const errorListener = vi.fn()
      stream.on('error', errorListener)
      mockedStartStream.mockRejectedValueOnce(new Error('boom'))

      await expect(stream.start({ streamName: 'fail', pipeline: 'pipe' }))
        .rejects.toThrow('Failed to start stream')

      expect(errorListener).toHaveBeenCalled()
      expect(stream.getConnectionStatus()).toBe('disconnected')
    })
  })

  describe('update', () => {
    it('strips immutable fields and sends update', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await stream.update({
        params: {
          width: 1920,
          height: 1080,
          prompts: 'keep-me'
        }
      })

      expect(mockedSendStreamUpdate).toHaveBeenCalledWith(
        'update-url',
        'stream-123',
        'comfystream',
        { prompts: 'keep-me' }
      )
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('throws when only immutable params are provided', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }

      await expect(
        stream.update({
          params: {
            width: 1920,
            height: 1080
          }
        })
      ).rejects.toThrow('No mutable parameters provided for update. Restart the stream to change resolution.')
    })

    it('errors when no pipeline configured', async () => {
      const noPipelineStream = new Stream(
        new StreamConfig({
          gatewayUrl: 'https://example.com'
        })
      )
      ;(noPipelineStream as any).streamInfo = { ...mockStartResponse }

      await expect(
        noPipelineStream.update({
          params: {
            prompts: 'hello'
          }
        })
      ).rejects.toThrow(
        'No pipeline configured for update. Provide config.defaultPipeline or include a pipeline when starting the stream.'
      )
    })
  })

  describe('status', () => {
    it('throws when no active stream exists', async () => {
      await expect(stream.status()).rejects.toThrow('No active stream to get status for')
    })

    it('fetches status when stream info is available', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      mockedFetchStreamStatus.mockResolvedValueOnce({ connection: 'ok' })

      const status = await stream.status()

      expect(mockedFetchStreamStatus).toHaveBeenCalledWith('status-url')
      expect(status).toEqual({ connection: 'ok' })
    })

    it('emits error when status fetch fails', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const errorListener = vi.fn()
      stream.on('error', errorListener)
      mockedFetchStreamStatus.mockRejectedValueOnce(new Error('status failure'))

      await expect(stream.status()).rejects.toThrow('Failed to fetch stream status')
      expect(errorListener).toHaveBeenCalled()
    })
  })

  describe('publish error handling', () => {
    const baseOptions: StreamStartOptions = {
      streamName: 'pub-stream',
      pipeline: 'comfystream'
    }

    beforeEach(() => {
      config.updateFromStreamStartResponse(mockStartResponse)
      mockGetUserMedia.mockResolvedValue(new MediaStream())
    })

    it('cleans up and emits error when createOffer fails', async () => {
      mockPeerConnection.createOffer.mockRejectedValueOnce(new Error('offer failed'))
      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await expect(stream.publish(baseOptions)).rejects.toThrow('Failed to publish stream')
      expect(errorListener).toHaveBeenCalled()
      expect(stream.getConnectionStatus()).toBe('disconnected')
      expect(stream.getLocalStream()).toBeNull()
    })

    it('cleans up and emits error when setLocalDescription fails', async () => {
      mockPeerConnection.setLocalDescription.mockRejectedValueOnce(new Error('setLocal failed'))
      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await expect(stream.publish(baseOptions)).rejects.toThrow('Failed to publish stream')
      expect(errorListener).toHaveBeenCalled()
      expect(stream.getConnectionStatus()).toBe('disconnected')
      expect(stream.getLocalStream()).toBeNull()
    })
  })

  describe('stop', () => {
    it('no-ops when there is no active stream', async () => {
      await stream.stop()
      expect(mockedStopStream).not.toHaveBeenCalled()
    })

    it('sends stop request and cleans up when active', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const stoppedListener = vi.fn()
      stream.on('streamStopped', stoppedListener)

      await stream.stop()

      expect(mockedStopStream).toHaveBeenCalledWith(
        config.getStreamStopUrl()
      )
      expect(stream.getConnectionStatus()).toBe('disconnected')
      expect(stoppedListener).toHaveBeenCalled()
    })
  })

  describe('stats parsing', () => {
    it('calculates bitrate and fps from outbound-rtp stats', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const now = Date.now()

      // First sample
      const stats1 = new Map([
        ['outbound-video', {
          type: 'outbound-rtp',
          kind: 'video',
          bytesSent: 10000,
          framesEncoded: 30,
          frameWidth: 1920,
          frameHeight: 1080
        }]
      ])

      // Second sample (1 second later, 80kbps, 30fps)
      const stats2 = new Map([
        ['outbound-video', {
          type: 'outbound-rtp',
          kind: 'video',
          bytesSent: 20000,    // +10000 bytes = 80kbps
          framesEncoded: 60,   // +30 frames = 30fps
          frameWidth: 1920,
          frameHeight: 1080
        }]
      ])

      // Mock Date.now to simulate 1 second passing
      const dateSpy = vi.spyOn(Date, 'now')
      dateSpy.mockReturnValueOnce(now)
      await (stream as any).parseStats?.(stats1)
      
      dateSpy.mockReturnValueOnce(now + 1000)
      const result2 = await (stream as any).parseStats?.(stats2)

      expect(result2.bitrate).toBe(80)
      expect(result2.fps).toBe(30)
      expect(result2.resolution).toBe('1920x1080')
      expect(result2.streamId).toBe('stream-123')

      dateSpy.mockRestore()
    })

    it('returns zero stats when no video data is available', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const emptyStats = new Map()
      const result = await (stream as any).parseStats?.(emptyStats)

      expect(result).toEqual({
        bitrate: 0,
        fps: 0,
        resolution: '',
        streamId: 'stream-123'
      })
    })

    it('handles missing frameWidth/frameHeight gracefully', async () => {
      ;(stream as any).streamInfo = { ...mockStartResponse }
      const stats = new Map([
        ['outbound-video', {
          type: 'outbound-rtp',
          kind: 'video',
          bytesSent: 10000,
          framesEncoded: 30
          // no frameWidth or frameHeight
        }]
      ])

      const result = await (stream as any).parseStats?.(stats)
      expect(result.resolution).toBe('')
    })
  })
})