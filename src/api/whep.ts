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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: sdp
      })

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
      } catch (e) {
        // Ignore if we can't read the body
      }

      const errorMsg = errorBody
        ? `WHEP offer failed. Status: ${response.status}, Response: ${errorBody}`
        : `WHEP offer failed. Status: ${response.status}`

      throw new Error(errorMsg)
    },
    { maxRetries }
  )
}

