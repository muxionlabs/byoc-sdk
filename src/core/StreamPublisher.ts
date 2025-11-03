/**
 * StreamPublisher - Handles WebRTC stream publishing via WHIP
 */

import {
  StreamConfig,
  StreamStartOptions,
  StreamUpdateOptions,
  StreamStartResponse,
  StreamPublisherEventMap,
  ConnectionStatus,
  ConnectionStats,
  StreamError,
  MediaError,
  ConnectionError
} from '../types'
import { EventEmitter } from '../utils/EventEmitter'
import { constructWhipUrl, generateStreamId } from '../utils/urls'
import { sendWhipOffer, stopStream } from '../api/whip'
import { sendStreamUpdate } from '../api/stream-update'

export class StreamPublisher extends EventEmitter<StreamPublisherEventMap> {
  private config: StreamConfig
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private connectionStatus: ConnectionStatus = 'disconnected'
  private streamInfo: StreamStartResponse | null = null
  private statsInterval: number | null = null
  private lastStats = {
    time: 0,
    bytes: 0,
    frameTime: 0,
    frameCount: 0
  }

  constructor(config: StreamConfig) {
    super()
    this.config = config
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Get stream information
   */
  getStreamInfo(): StreamStartResponse | null {
    return this.streamInfo
  }

  /**
   * Get local media stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get available media devices
   */
  async getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return {
        cameras: devices.filter(d => d.kind === 'videoinput'),
        microphones: devices.filter(d => d.kind === 'audioinput'),
        speakers: devices.filter(d => d.kind === 'audiooutput')
      }
    } catch (error) {
      throw new MediaError('Failed to enumerate media devices', error)
    }
  }

  /**
   * Request permissions for media devices
   */
  async requestPermissions(video: boolean = true, audio: boolean = true): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {}
      if (video) constraints.video = true
      if (audio) constraints.audio = true

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      // Stop the temporary stream immediately
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      throw new MediaError('Failed to request media permissions', error)
    }
  }

  /**
   * Start publishing a stream
   */
  async start(options: StreamStartOptions): Promise<StreamStartResponse> {
    if (this.connectionStatus !== 'disconnected') {
      throw new StreamError('Stream is already active. Stop the current stream first.')
    }

    try {
      this.setStatus('connecting')

      // Generate stream ID if not provided
      const streamId = options.streamId || generateStreamId()

      // Get media stream
      this.localStream = await this.getMediaStream(options)
      this.emit('mediaStreamReady', this.localStream)

      // Create peer connection
      this.peerConnection = await this.createPeerConnection(this.localStream)

      // Create and send WHIP offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      })
      await this.peerConnection.setLocalDescription(offer)

      // Wait for ICE gathering
      await this.waitForICEGathering(this.peerConnection)

      // Construct WHIP URL
      const whipUrl = constructWhipUrl(
        this.config.whipUrl,
        options.streamName,
        options.pipeline,
        options.width,
        options.height,
        options.customParams,
        streamId
      )

      // Send WHIP offer
      const response = await sendWhipOffer(whipUrl, this.peerConnection.localDescription!.sdp)

      // Set remote description
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: response.answerSdp
      })

      // Build stream info
      this.streamInfo = {
        streamId: response.streamId || streamId,
        playbackUrl: response.playbackUrl,
        whepUrl: response.playbackUrl,
        dataUrl: response.playbackUrl ? this.buildDataUrl(options.streamName) : null,
        statusUrl: response.playbackUrl ? this.buildStatusUrl(response.streamId || streamId) : null,
        updateUrl: response.playbackUrl ? this.buildUpdateUrl(response.streamId || streamId) : null,
        rtmpUrl: null,
        locationHeader: response.locationHeader
      }

      this.setStatus('connected')
      this.startStatsMonitoring()
      this.emit('streamStarted', this.streamInfo)

      return this.streamInfo
    } catch (error) {
      this.setStatus('error')
      const streamError = error instanceof StreamError 
        ? error 
        : new ConnectionError('Failed to start stream', error)
      this.emit('error', streamError)
      await this.cleanup()
      throw streamError
    }
  }

  /**
   * Stop publishing
   */
  async stop(): Promise<void> {
    if (!this.streamInfo) {
      return
    }

    try {
      // Send stop request if we have stream info
      if (this.streamInfo.streamId) {
        await stopStream(
          this.streamInfo.streamId,
          this.config.whipUrl,
          this.config.defaultPipeline || ''
        )
      }

      await this.cleanup()
      this.emit('streamStopped', undefined)
    } catch (error) {
      console.error('Error stopping stream:', error)
      await this.cleanup()
      throw error
    }
  }

  /**
   * Update stream parameters
   */
  async updateStream(options: StreamUpdateOptions): Promise<void> {
    if (!this.streamInfo || !this.streamInfo.updateUrl || !this.streamInfo.streamId) {
      throw new StreamError('No active stream to update')
    }

    try {
      await sendStreamUpdate(
        this.streamInfo.updateUrl,
        this.streamInfo.streamId,
        this.config.defaultPipeline || '',
        options.params
      )
      this.emit('streamUpdated', undefined)
    } catch (error) {
      const streamError = error instanceof StreamError
        ? error
        : new StreamError('Failed to update stream', undefined, error)
      this.emit('error', streamError)
      throw streamError
    }
  }

  /**
   * Get media stream based on options
   */
  private async getMediaStream(options: StreamStartOptions): Promise<MediaStream> {
    try {
      if (options.useScreenShare) {
        return await navigator.mediaDevices.getDisplayMedia({
          video: options.enableVideoIngress !== false ? {
            width: options.width,
            height: options.height,
            frameRate: options.fpsLimit
          } : false,
          audio: options.enableAudioIngress !== false
        })
      }

      const constraints: MediaStreamConstraints = {}

      if (options.enableVideoIngress !== false) {
        constraints.video = {
          deviceId: options.cameraDeviceId ? { exact: options.cameraDeviceId } : undefined,
          width: options.width ? { ideal: options.width } : undefined,
          height: options.height ? { ideal: options.height } : undefined,
          frameRate: options.fpsLimit ? { ideal: options.fpsLimit } : undefined
        }
      }

      if (options.enableAudioIngress !== false) {
        constraints.audio = {
          deviceId: options.microphoneDeviceId ? { exact: options.microphoneDeviceId } : undefined
        }
      }

      if (options.mediaConstraints) {
        Object.assign(constraints, options.mediaConstraints)
      }

      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      throw new MediaError('Failed to get media stream', error)
    }
  }

  /**
   * Create and configure peer connection
   */
  private async createPeerConnection(
    stream: MediaStream
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    })

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
    })

    // Monitor connection state
    pc.addEventListener('connectionstatechange', () => {
      console.log(`Publisher connection state: ${pc.connectionState}`)
      
      if (pc.connectionState === 'connected') {
        this.setStatus('connected')
      } else if (pc.connectionState === 'failed') {
        this.setStatus('error')
        this.emit('error', new ConnectionError('Peer connection failed'))
      } else if (pc.connectionState === 'disconnected') {
        this.setStatus('disconnected')
      }
    })

    pc.addEventListener('icegatheringstatechange', () => {
      console.log(`ICE gathering state: ${pc.iceGatheringState}`)
    })

    return pc
  }

  /**
   * Wait for ICE gathering to complete
   */
  private async waitForICEGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('ICE gathering timeout reached, continuing with available candidates')
        resolve()
      }, 3000)

      pc.addEventListener('icecandidate', (event) => {
        if (event.candidate === null) {
          console.log('ICE gathering complete, all candidates received')
          clearTimeout(timeoutId)
          resolve()
        }
      })
    })
  }

  /**
   * Start monitoring connection stats
   */
  private startStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
    }

    this.statsInterval = window.setInterval(async () => {
      if (!this.peerConnection) return

      try {
        const stats = await this.peerConnection.getStats()
        const connectionStats = this.parseStats(stats)
        this.emit('statsUpdate', connectionStats)
      } catch (error) {
        console.error('Error getting stats:', error)
      }
    }, 1000)
  }

  /**
   * Parse WebRTC stats
   */
  private parseStats(stats: RTCStatsReport): ConnectionStats {
    let bitrate = 0
    let fps = 0
    let resolution = ''

    stats.forEach(stat => {
      if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
        const now = Date.now()
        const bytes = stat.bytesSent || 0
        const frameCount = stat.framesEncoded || 0

        if (this.lastStats.time > 0) {
          const timeDelta = (now - this.lastStats.time) / 1000
          if (timeDelta > 0) {
            bitrate = Math.round(((bytes - this.lastStats.bytes) * 8) / timeDelta / 1000)
            fps = Math.round((frameCount - this.lastStats.frameCount) / timeDelta)
          }
        }

        this.lastStats = {
          time: now,
          bytes,
          frameTime: 0,
          frameCount
        }

        if (stat.frameWidth && stat.frameHeight) {
          resolution = `${stat.frameWidth}x${stat.frameHeight}`
        }
      }
    })

    return {
      bitrate,
      fps,
      resolution,
      streamId: this.streamInfo?.streamId || null
    }
  }

  /**
   * Build data URL from stream name
   */
  private buildDataUrl(streamName: string): string {
    return `${this.config.dataStreamUrl}/live/video-to-video/${streamName}/data`
  }

  /**
   * Build status URL from stream ID
   */
  private buildStatusUrl(streamId: string): string {
    return `${this.config.whipUrl.replace('/stream/start', '')}/stream/${streamId}/status`
  }

  /**
   * Build update URL from stream ID
   */
  private buildUpdateUrl(streamId: string): string {
    return `${this.config.whipUrl.replace('/stream/start', '')}/stream/${streamId}/update`
  }

  /**
   * Set connection status and emit event
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.emit('statusChange', status)
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    this.streamInfo = null
    this.setStatus('disconnected')
  }
}

