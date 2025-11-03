/**
 * DataStreamClient - Handles Server-Sent Events (SSE) data streaming
 */

import {
  StreamConfig,
  DataStreamOptions,
  DataStreamEventMap,
  DataStreamEvent,
  DataLog
} from '../types'
import { EventEmitter } from '../utils/EventEmitter'
import { constructDataStreamUrl } from '../utils/urls'

export class DataStreamClient extends EventEmitter<DataStreamEventMap> {
  private config: StreamConfig
  private eventSource: EventSource | null = null
  private isConnected: boolean = false
  private logs: DataLog[] = []
  private maxLogs: number = 1000
  private logCounter: number = 0

  constructor(config: StreamConfig) {
    super()
    this.config = config
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get all logs
   */
  getLogs(): DataLog[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    this.logCounter = 0
  }

  /**
   * Connect to data stream
   */
  async connect(options: DataStreamOptions): Promise<void> {
    if (this.isConnected || this.eventSource) {
      throw new Error('Already connected to data stream')
    }

    try {
      // Set max logs if provided
      if (options.maxLogs !== undefined) {
        this.maxLogs = options.maxLogs
      }

      // Construct SSE URL
      const sseUrl = options.dataUrl || constructDataStreamUrl(
        this.config.dataStreamUrl,
        options.streamName
      )

      console.log(`Connecting to data stream: ${sseUrl}`)

      // Create EventSource
      this.eventSource = new EventSource(sseUrl)

      // Setup event handlers
      this.eventSource.onopen = () => {
        console.log('Connected to data stream')
        this.isConnected = true
        this.emit('connected', undefined)
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.trim())
          console.log('Data stream message received:', data)

          // Create data event
          const dataEvent: DataStreamEvent = {
            type: data.type || 'data',
            data: data,
            timestamp: Date.now()
          }

          // Create log entry
          const log: DataLog = {
            id: `data-${this.logCounter++}`,
            type: dataEvent.type,
            data: dataEvent.data,
            timestamp: dataEvent.timestamp,
            expanded: true
          }

          // Add to logs and maintain max size
          this.logs.push(log)
          if (this.logs.length > this.maxLogs) {
            this.logs.shift()
          }

          // Emit event
          this.emit('data', dataEvent)
        } catch (error) {
          console.error('Error parsing data stream message:', error)

          // Create error log entry
          const log: DataLog = {
            id: `data-${this.logCounter++}`,
            type: 'raw',
            data: { raw: event.data, error: error instanceof Error ? error.message : String(error) },
            timestamp: Date.now(),
            expanded: true
          }

          this.logs.push(log)
          if (this.logs.length > this.maxLogs) {
            this.logs.shift()
          }
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('Data stream SSE error:', error)
        this.isConnected = false
        const errorObj = new Error('Data stream connection error')
        this.emit('error', errorObj)
        this.disconnect()
      }
    } catch (error) {
      console.error('Error connecting to data stream:', error)
      throw error
    }
  }

  /**
   * Disconnect from data stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnected = false
    this.emit('disconnected', undefined)
  }
}

