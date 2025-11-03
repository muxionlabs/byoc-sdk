/**
 * Simple event emitter implementation for SDK events
 */

import { EventCallback } from '../types'

export class EventEmitter<EventMap extends Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<EventCallback<any>>> = new Map()

  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error)
        }
      })
    }
  }

  removeAllListeners(): void {
    this.listeners.clear()
  }
}

