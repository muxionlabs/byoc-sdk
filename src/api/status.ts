/**
 * Stream Status API client
 */

/**
 * Fetch stream status data
 */
export async function fetchStreamStatus(statusUrl: string): Promise<any> {
  try {
    console.log(`Fetching stream status from: ${statusUrl}`)

    const response = await fetch(statusUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      // If it's an HTTP error we created above, preserve its message
      if (error.message.startsWith('HTTP')) {
        throw error
      }
      throw new Error('Failed to fetch status')
    }
    throw new Error('Failed to fetch status')
  }
}

