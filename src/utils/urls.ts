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
 * Constructs a WHIP URL with all necessary parameters
 */
export function constructWhipUrl(
  baseUrl: string,
  streamName: string,
  pipeline: string,
  width?: number,
  height?: number,
  customParams?: Record<string, any>,
  streamId?: string
): string {
  const url = new URL(baseUrl)

  // Add stream name to the path if provided, unless the URL ends in 'start' or 'whip'
  if (streamName && streamName.trim() && !baseUrl.endsWith('/start') && !baseUrl.endsWith('/whip')) {
    const safeName = streamName.trim()
    url.pathname += `/${safeName}/whip`
  }

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
 * Constructs a WHEP URL from base URL and playback URL path
 */
export function constructWhepUrl(whepUrl: string, playbackUrl?: string): string {
  if (!playbackUrl) return whepUrl
  
  // If playbackUrl is a full URL, use it directly
  if (playbackUrl.startsWith('http://') || playbackUrl.startsWith('https://')) {
    return playbackUrl
  }
  
  try {
    const playbackUrlObj = new URL(playbackUrl)
    const pathFromPlayback = playbackUrlObj.pathname
    // Remove trailing slash from whepUrl if present and append the path
    return whepUrl.replace(/\/$/, '') + pathFromPlayback
  } catch (error) {
    console.warn('Failed to parse playback URL, using WHEP URL as-is:', error)
    return whepUrl
  }
}

/**
 * Construct data stream URL
 */
export function constructDataStreamUrl(
  baseUrl: string,
  streamName: string,
  customDataUrl?: string
): string {
  if (customDataUrl) {
    return customDataUrl
  }
  return `${baseUrl}/live/video-to-video/${streamName}/data`
}

/**
 * Construct Kafka events URL
 */
export function constructKafkaEventsUrl(
  baseUrl: string,
  streamName: string,
  customEventsUrl?: string
): string {
  if (customEventsUrl) {
    return customEventsUrl
  }
  return `${baseUrl}/live/${streamName}/events`
}

