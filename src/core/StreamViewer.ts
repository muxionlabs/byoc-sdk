/**
 * StreamViewer - Handles WebRTC stream viewing via WHEP
 */

import {
  StreamConfig,
  ViewerStartOptions,
  StreamViewerEventMap,
  ConnectionStatus,
  ConnectionStats,
  StreamError,
  ConnectionError
} from '../types'
import { EventEmitter } from '../utils/EventEmitter'
import { sendWhepOffer } from '../api/whep'

export class StreamViewer extends EventEmitter<StreamViewerEventMap> {
  private config: StreamConfig
  private peerConnection: RTCPeerConnection | null = null
  private videoElement: HTMLVideoElement | null = null
  private connectionStatus: ConnectionStatus = 'disconnected'
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
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Get video element
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }

  /**
   * Set video element for playback
   */
  setVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element
  }

  /**
   * Start viewing a stream
   */
  async start(options: ViewerStartOptions): Promise<void> {
    if (this.connectionStatus !== 'disconnected') {
      throw new StreamError('Viewer is already active. Stop the current viewer first.')
    }

    try {
      this.setStatus('connecting')

      // Use WHEP URL directly from options - it should be the full URL from gateway
      const whepUrl = options.whepUrl

      if (!whepUrl) {
        throw new StreamError('No WHEP URL provided. Pass the whepUrl from Stream.getStreamInfo()')
      }

      // Create peer connection
      this.peerConnection = await this.createPeerConnection()

      // Create offer for WHEP
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await this.peerConnection.setLocalDescription(offer)

      // Wait for ICE gathering
      await this.waitForICEGathering(this.peerConnection)

      // Send WHEP offer
      const response = await sendWhepOffer(whepUrl, this.peerConnection.localDescription!.sdp)

      // Set remote description
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: response.answerSdp
      })

      this.setStatus('connected')
      this.startStatsMonitoring()
      this.emit('viewingStarted', undefined)
    } catch (error) {
      this.setStatus('error')
      const streamError = error instanceof StreamError
        ? error
        : new ConnectionError(`Failed to start viewing: ${error instanceof Error ? error.message : String(error)}`, error)
      this.emit('error', streamError)
      await this.cleanup()
      throw streamError
    }
  }

  /**
   * Stop viewing
   */
  async stop(): Promise<void> {
    await this.cleanup()
    this.emit('viewingStopped', undefined)
  }

  /**
   * Create and configure peer connection
   */
  private async createPeerConnection(): Promise<RTCPeerConnection> {
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

    // Handle incoming stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind)
      if (this.videoElement) {
        this.videoElement.srcObject = event.streams[0]
        this.emit('videoReady', this.videoElement)
      }
    }

    // Monitor connection state
    pc.addEventListener('connectionstatechange', () => {
      console.log(`Viewer connection state: ${pc.connectionState}`)

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
      if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
        const now = Date.now()
        const bytes = stat.bytesReceived || 0
        const frameCount = stat.framesDecoded || 0

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
      resolution
    }
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

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    this.setStatus('disconnected')
  }
}

