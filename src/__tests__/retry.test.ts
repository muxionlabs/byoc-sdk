/**
 * Tests for retry utilities
 */

import { describe, it, expect, vi } from 'vitest'
import { retryWithBackoff, sleep } from '../utils/retry'

describe('Retry utilities', () => {
  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow some tolerance
    })
  })

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')

      const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'))

      await expect(
        retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('always fail')

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')

      const start = Date.now()
      await retryWithBackoff(fn, { 
        maxRetries: 3, 
        initialDelay: 50,
        backoffMultiplier: 2
      })
      const elapsed = Date.now() - start

      // First retry: 50ms, Second retry: 100ms = ~150ms total
      expect(elapsed).toBeGreaterThanOrEqual(140)
    })

    it('should respect max delay', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')

      const start = Date.now()
      await retryWithBackoff(fn, { 
        maxRetries: 3, 
        initialDelay: 100,
        backoffMultiplier: 10,
        maxDelay: 120
      })
      const elapsed = Date.now() - start

      // Should not exceed maxDelay
      expect(elapsed).toBeLessThan(300)
    })
  })
})

