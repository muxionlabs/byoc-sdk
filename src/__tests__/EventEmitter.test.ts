/**
 * Tests for EventEmitter utility
 */

import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '../utils/EventEmitter'

describe('EventEmitter', () => {
  it('should register and call event listeners', () => {
    type TestEvents = {
      test: string
      number: number
    }
    
    const emitter = new EventEmitter<TestEvents>()
    const callback = vi.fn()

    emitter.on('test', callback)
    emitter.emit('test', 'hello')

    expect(callback).toHaveBeenCalledWith('hello')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should remove event listeners', () => {
    type TestEvents = { test: string }
    
    const emitter = new EventEmitter<TestEvents>()
    const callback = vi.fn()

    emitter.on('test', callback)
    emitter.off('test', callback)
    emitter.emit('test', 'hello')

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle multiple listeners for same event', () => {
    type TestEvents = { test: string }
    
    const emitter = new EventEmitter<TestEvents>()
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    emitter.on('test', callback1)
    emitter.on('test', callback2)
    emitter.emit('test', 'hello')

    expect(callback1).toHaveBeenCalledWith('hello')
    expect(callback2).toHaveBeenCalledWith('hello')
  })

  it('should remove all listeners', () => {
    type TestEvents = { test: string; other: number }
    
    const emitter = new EventEmitter<TestEvents>()
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    emitter.on('test', callback1)
    emitter.on('other', callback2)
    emitter.removeAllListeners()
    emitter.emit('test', 'hello')
    emitter.emit('other', 42)

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })

  it('should catch errors in event listeners', () => {
    type TestEvents = { test: string }
    
    const emitter = new EventEmitter<TestEvents>()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const callback = vi.fn(() => {
      throw new Error('Test error')
    })

    emitter.on('test', callback)
    emitter.emit('test', 'hello')

    expect(callback).toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
    
    consoleError.mockRestore()
  })
})

