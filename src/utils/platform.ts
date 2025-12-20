/**
 * Platform detection and adaptation utilities
 * Helps SDK work across web, React Native, and other environments
 */

/**
 * Detect the current platform
 */
export function detectPlatform(): 'web' | 'react-native' | 'node' | 'unknown' {
  // Check for React Native
  if (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative'
  ) {
    return 'react-native'
  }

  // Check for browser
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  ) {
    return 'web'
  }

  // Check for Node.js
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node'
  }

  return 'unknown'
}

/**
 * Check if EventSource is available
 */
export function hasEventSource(): boolean {
  return typeof EventSource !== 'undefined'
}

/**
 * Check if RTCPeerConnection is available
 */
export function hasRTCPeerConnection(): boolean {
  return typeof RTCPeerConnection !== 'undefined'
}

/**
 * Get platform-specific EventSource implementation
 * 
 * Note: For React Native, you'll need to provide a polyfill:
 * - react-native-sse
 * - eventsource (with polyfills for React Native)
 */
export function getEventSource(): typeof EventSource | undefined {
  if (hasEventSource()) {
    return EventSource
  }

  // Check for polyfilled EventSource (React Native)
  if (typeof (global as any).EventSource !== 'undefined') {
    return (global as any).EventSource
  }

  return undefined
}

/**
 * Get platform capabilities
 */
export function getPlatformCapabilities(): {
  platform: ReturnType<typeof detectPlatform>
  hasEventSource: boolean
  hasRTCPeerConnection: boolean
  hasWebWorkers: boolean
  hasLocalStorage: boolean
} {
  return {
    platform: detectPlatform(),
    hasEventSource: hasEventSource(),
    hasRTCPeerConnection: hasRTCPeerConnection(),
    hasWebWorkers: typeof Worker !== 'undefined',
    hasLocalStorage: typeof localStorage !== 'undefined'
  }
}

/**
 * Log platform information for debugging
 */
export function logPlatformInfo(): void {
  const capabilities = getPlatformCapabilities()
  console.log('[BYOC SDK] Platform Info:', {
    ...capabilities,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
  })
}

/**
 * Check if current platform supports all required features
 */
export function checkRequiredFeatures(features: {
  eventSource?: boolean
  rtc?: boolean
  workers?: boolean
}): { supported: boolean; missing: string[] } {
  const capabilities = getPlatformCapabilities()
  const missing: string[] = []

  if (features.eventSource && !capabilities.hasEventSource) {
    missing.push('EventSource (SSE support)')
  }

  if (features.rtc && !capabilities.hasRTCPeerConnection) {
    missing.push('RTCPeerConnection (WebRTC support)')
  }

  if (features.workers && !capabilities.hasWebWorkers) {
    missing.push('Web Workers')
  }

  return {
    supported: missing.length === 0,
    missing
  }
}

