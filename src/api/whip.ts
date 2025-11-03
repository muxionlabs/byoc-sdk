/**
 * WHIP (WebRTC-HTTP Ingestion Protocol) API client
 */

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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: sdp
      })

      if (response.status === 201) {
        const answerSdp = await response.text()
        const streamId = response.headers.get('X-Stream-Id')
        const playbackUrl = response.headers.get('Livepeer-Playback-Url')
        const locationHeader = response.headers.get('Location')

        return {
          status: response.status,
          answerSdp,
          streamId,
          playbackUrl,
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
        ? `WHIP offer failed. Status: ${response.status}, Response: ${errorBody}`
        : `WHIP offer failed. Status: ${response.status}`
      
      throw new Error(errorMsg)
    },
    { maxRetries }
  )
}

/**
 * Sends a stop stream request
 */
export async function stopStream(
  streamId: string,
  whipUrl: string,
  pipeline: string
): Promise<boolean> {
  try {
    console.log(`Stopping stream with ID: ${streamId}`)

    const stopUrl = whipUrl.replace('/stream/start', `/stream/${streamId}/stop`)
    const requestData = {
      "request": JSON.stringify({ "stream_id": streamId }),
      "parameters": JSON.stringify({}),
      "capability": pipeline,
      "timeout_seconds": 5
    }

    const livepeerHeader = btoa(JSON.stringify(requestData))

    const response = await fetch(stopUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Livepeer': livepeerHeader
      },
      body: JSON.stringify({ stream_id: streamId })
    })

    if (response.ok) {
      console.log('Stream stop request sent successfully')
      return true
    } else {
      console.warn('Failed to send stream stop request:', response.status)
      return false
    }
  } catch (error) {
    console.error('Error sending stop request:', error)
    return false
  }
}

