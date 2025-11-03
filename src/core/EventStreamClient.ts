/**
 * EventStreamClient - Handles Server-Sent Events (SSE) for Kafka events
 */

import {
  StreamConfig,
  EventStreamOptions,
  EventStreamEventMap,
  EventLog
} from '../types'
import { EventEmitter } from '../utils/EventEmitter'
import { constructKafkaEventsUrl } from '../utils/urls'

export class EventStreamClient extends EventEmitter<EventStreamEventMap> {
  private config: StreamConfig
  private eventSource: EventSource | null = null
  private isConnected: boolean = false
  private events: EventLog[] = []
  private maxEvents: number = 1000
  private eventCounter: number = 0

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
   * Get all events
   */
  getEvents(): EventLog[] {
    return [...this.events]
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = []
    this.eventCounter = 0
  }

  /**
   * Connect to event stream
   */
  async connect(options: EventStreamOptions): Promise<void> {
    if (this.isConnected || this.eventSource) {
      throw new Error('Already connected to event stream')
    }

    try {
      // Set max events if provided
      if (options.maxEvents !== undefined) {
        this.maxEvents = options.maxEvents
      }

      // Construct SSE URL
      const sseUrl = options.kafkaEventsUrl || constructKafkaEventsUrl(
        this.config.kafkaEventsUrl,
        options.streamName
      )

      console.log(`Connecting to event stream: ${sseUrl}`)

      // Create EventSource
      this.eventSource = new EventSource(sseUrl)

      // Setup event handlers
      this.eventSource.onopen = () => {
        console.log('Connected to event stream')
        this.isConnected = true
        this.emit('connected', undefined)
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.trim())
          console.log('Event stream message received:', data)

          // Create event log
          const eventLog: EventLog = {
            id: `event-${this.eventCounter++}`,
            level: data.level || 'info',
            message: data.message || data.msg || JSON.stringify(data),
            timestamp: data.timestamp || Date.now(),
            data: data
          }

          // Add to events and maintain max size
          this.events.push(eventLog)
          if (this.events.length > this.maxEvents) {
            this.events.shift()
          }

          // Emit event
          this.emit('event', eventLog)
        } catch (error) {
          console.error('Error parsing event stream message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('Event stream SSE error:', error)
        this.isConnected = false
        const errorObj = new Error('Event stream connection error')
        this.emit('error', errorObj)
        this.disconnect()
      }
    } catch (error) {
      console.error('Error connecting to event stream:', error)
      throw error
    }
  }

  /**
   * Disconnect from event stream
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

