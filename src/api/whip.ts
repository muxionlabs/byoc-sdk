
import { WhipOfferResponse } from '../types'
import { retryWithBackoff } from '../utils/retry'

/**
 * Sends a WHIP offer with retry logic
 */
export async function sendWhipOffer(
  url: string,
  sdp: string,
  maxRetries: number = 3
): Promise<WhipOfferResponse> {
  return retryWithBackoff(
    async () => {
      console.log(`Sending WHIP offer to: ${url}`)

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
        if (e.message && e.message.includes('Network')) {
          ;(e as any).nonRetryable = true
        }
        throw e
      }

      if (response.status === 201) {
        const answerSdp = await response.text()
        const locationHeader = response.headers.get('Location')
        const eTagHeader = response.headers.get('ETag')
        const linkHeader = response.headers.get('Link')
        const playbackUrl = response.headers.get('Livepeer-Playback-Url')
        
        return {
          status: response.status,
          answerSdp,
          locationHeader,
          eTagHeader,
          linkHeader,
          playbackUrl,          
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
        ? `WHIP offer failed. Status: ${response.status}, Response: ${errorBody}`
        : `WHIP offer failed. Status: ${response.status}`
      
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
