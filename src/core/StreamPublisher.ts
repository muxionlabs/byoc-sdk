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
import { 
  generateStreamId
} from '../utils/urls'
import { sendWhipOffer, stopStream, initializeGatewayStream } from '../api/whip'
import { sendStreamUpdate } from '../api/stream-update'

export class StreamPublisher extends EventEmitter<StreamPublisherEventMap> {
  private config: StreamConfig
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private connectionStatus: ConnectionStatus = 'disconnected'
  private streamInfo: StreamStartResponse | null = null
  private currentPipeline: string | null = null
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
      this.currentPipeline = options.pipeline

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

      // Initialize session via gateway to get the actual WHIP URL
      const whipUrl = this.config.getWhipUrl({
        pipeline: options.pipeline,
        width: options.width,
        height: options.height,
        customParams: options.customParams,
        streamId
      })
      const initData = await initializeGatewayStream(whipUrl, options)
      const sessionWhipUrl = initData.whipUrl

      // Send WHIP offer to the URL returned by the gateway
      const response = await sendWhipOffer(sessionWhipUrl, this.peerConnection.localDescription!.sdp)

      // Set remote description
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: response.answerSdp
      })

      // Build stream info
      const gatewayStreamId = initData.streamId || streamId
      const resolvedStreamId = response.streamId || gatewayStreamId || streamId
      const resolvedPlaybackUrl = response.playbackUrl || initData.playbackUrl || null
      // Use whepUrl directly from gateway - it should return the full URL
      const resolvedWhepUrl = initData.whepUrl || null
      const resolvedDataUrl =
        initData.dataUrl || (options.streamName ? this.config.getDataUrl(options.streamName) : null)
      const resolvedStatusUrl =
        initData.statusUrl || (resolvedStreamId ? this.config.getStatusUrl(resolvedStreamId) : null)
      const resolvedUpdateUrl =
        initData.updateUrl || (resolvedStreamId ? this.config.getUpdateUrl(resolvedStreamId) : null)
      const resolvedRtmpUrl = initData.rtmpUrl || null

      this.streamInfo = {
        streamId: resolvedStreamId,
        playbackUrl: resolvedPlaybackUrl,
        whepUrl: resolvedWhepUrl,
        dataUrl: resolvedDataUrl,
        statusUrl: resolvedStatusUrl,
        updateUrl: resolvedUpdateUrl,
        rtmpUrl: resolvedRtmpUrl,
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
        const stopUrl = this.config.getStopUrl(this.streamInfo.streamId)
        await stopStream(
          stopUrl,
          this.streamInfo.streamId,
          this.resolveActivePipeline('stop')
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

    // Width/height are immutable once a stream starts, so strip them from updates
    const sanitizedParams: Record<string, any> = { ...(options.params ?? {}) }
    const immutableFields = ['width', 'height']
    const removedFields: string[] = []

    immutableFields.forEach((field) => {
      if (field in sanitizedParams) {
        removedFields.push(field)
        delete sanitizedParams[field]
      }
    })

    if (removedFields.length > 0) {
      console.warn(
        `[StreamPublisher] Ignoring immutable stream update fields: ${removedFields.join(
          ', '
        )}. Restart the stream to change resolution.`
      )
    }

    if (Object.keys(sanitizedParams).length === 0) {
      throw new StreamError(
        'No mutable parameters provided for update. Restart the stream to change resolution.',
        'INVALID_UPDATE_PARAMS'
      )
    }

    try {
      await sendStreamUpdate(
        this.streamInfo.updateUrl,
        this.streamInfo.streamId,
        this.resolveActivePipeline('update'),
        sanitizedParams
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
    // Use configured ICE servers or defaults
    const iceServers = this.config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]

    const pc = new RTCPeerConnection({
      iceServers,
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
   * Resolve the active pipeline for control-plane requests
   */
  private resolveActivePipeline(action: 'stop' | 'update'): string {
    const pipeline = this.currentPipeline || this.config.defaultPipeline
    if (!pipeline) {
      throw new StreamError(
        `No pipeline configured for ${action}. Provide config.defaultPipeline or include a pipeline when starting the stream.`
      )
    }
    return pipeline
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
    this.currentPipeline = null
  }
}

