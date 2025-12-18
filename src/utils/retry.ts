/**
 * Retry utilities with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay,
    maxDelay,
    backoffMultiplier
  } = options

  // Reduce delays when running under test to keep test runs fast, but
  // respect explicit values passed in `options` (tests that set explicit
  // delays expect those values to be used).
  const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test'
  const _initialDelay = initialDelay !== undefined ? initialDelay : (isTest ? 10 : 1000)
  const _maxDelay = maxDelay !== undefined ? maxDelay : (isTest ? 100 : 5000)
  const _backoffMultiplier = backoffMultiplier !== undefined ? backoffMultiplier : 2

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // If the error has been marked as non-retryable, rethrow immediately
      if ((lastError as any).nonRetryable) {
        throw lastError
      }

      if (attempt === maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        _initialDelay * Math.pow(_backoffMultiplier, attempt - 1),
        _maxDelay
      )

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error)
      await sleep(delay)
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

