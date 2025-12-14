/**
 * URL construction utilities
 */

/**
 * Generate a unique stream ID
 */
export function generateStreamId(): string {
  return `stream-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`
}

/**
 * Constructs a WHIP URL from a base URL that already includes the WHIP path
 */
export function constructWhipUrl(
  whipBaseUrl: string,
  pipeline?: string,
  width?: number,
  height?: number,
  customParams?: Record<string, any>,
  streamId?: string
): string {
  const url = new URL(whipBaseUrl)

  // Add pipeline parameter
  if (pipeline && pipeline.trim()) {
    url.searchParams.set('pipeline', pipeline.trim())
  }

  // Add streamId if provided
  if (streamId && streamId.trim()) {
    url.searchParams.set('streamId', streamId.trim())
  }

  // Build params object
  const params: Record<string, any> = {}
  if (width && height && width > 0 && height > 0) {
    params.width = width
    params.height = height
  }

  // Add custom parameters
  if (customParams) {
    Object.assign(params, customParams)
  }

  // Convert the params object to a JSON string and add to query params
  const paramsString = JSON.stringify(params)
  url.searchParams.set('params', paramsString)

  return url.toString()
}

/**
 * Constructs a WHEP URL from a base URL that already includes the WHEP path
 */
export function constructWhepUrl(
  whepBaseUrl: string,
  playbackUrl?: string
): string {
  if (!playbackUrl) return whepBaseUrl
  
  // If playbackUrl is a full URL, use it directly
  if (playbackUrl.startsWith('http://') || playbackUrl.startsWith('https://')) {
    return playbackUrl
  }
  
  try {
    // Use whepBaseUrl as base to resolve relative playbackUrl
    const resolvedUrl = new URL(playbackUrl, whepBaseUrl)
    return resolvedUrl.toString()
  } catch (error) {
    console.warn('Failed to parse playback URL, using WHEP base URL:', error)
    return whepBaseUrl
  }
}

/**
 * Construct data stream URL from a base URL that already includes the data path
 */
export function constructDataStreamUrl(
  dataBaseUrl: string,
  streamName: string,
  customDataUrl?: string
): string {
  if (customDataUrl) {
    return customDataUrl
  }
  return `${dataBaseUrl.replace(/\/$/, '')}/${streamName}/data`
}

