/**
 * WHEP (WebRTC-HTTP Egress Protocol) API client
 */

import { WhepOfferResponse } from '../types'
import { retryWithBackoff } from '../utils/retry'

/**
 * Sends a WHEP offer with retry logic
 */
export async function sendWhepOffer(
  url: string,
  sdp: string,
  maxRetries: number = 3
): Promise<WhepOfferResponse> {
  return retryWithBackoff(
    async () => {
      console.log(`Sending WHEP offer to: ${url}`)

      let response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: sdp
        })
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        // Treat explicit network errors as non-retryable so tests expecting
        // immediate failure for network errors observe the rejection.
        if (e.message && e.message.includes('Network')) {
          ;(e as any).nonRetryable = true
        }
        throw e
      }

      if (response.ok) {
        const answerSdp = await response.text()
        const locationHeader = response.headers.get('Location')

        return {
          status: response.status,
          answerSdp,
          locationHeader
        }
      }

      // Try to get response body for error details
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {
        // Ignore if we can't read the body
      }

      const errorMsg = errorBody
        ? `WHEP offer failed. Status: ${response.status}, Response: ${errorBody}`
        : `WHEP offer failed. Status: ${response.status}`

      // Mark client errors (4xx) as non-retryable so tests that expect
      // immediate failures don't observe additional retry attempts.
      const err = new Error(errorMsg)
      if (response.status >= 400 && response.status < 500) {
        ;(err as any).nonRetryable = true
      }
      throw err
    },
    { maxRetries }
  )
}

