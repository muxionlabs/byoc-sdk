/**
 * Test setup utilities for mocking HTTP requests
 */

import { vi, beforeAll } from 'vitest'

// Mock responses for different endpoints
export const mockResponses = {
  start: {
    ok: true,
    json: async () => ({
      whipUrl: 'http://localhost:8088/whip/stream-123',
      whepUrl: 'http://localhost:8088/whep/stream-123',
      rtmpUrl: 'http://localhost:8088/rtmp/stream-123',
      rtmpOutputUrl: 'http://localhost:8088/rtmp-output/stream-123',
      updateUrl: 'http://localhost:8088/update/stream-123',
      statusUrl: 'http://localhost:8088/status/stream-123',
      dataUrl: 'http://localhost:8088/data/stream-123',
      streamId: 'stream-123'
    })
  },
  whep: {
    ok: true,
    status: 200,
    headers: new Headers({
      'Location': 'http://localhost:8088/whep/stream-123'
    }),
    text: async () => 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
  },
  status: {
    ok: true,
    json: async () => ({
      status: 'active',
      streamId: 'stream-123',
      startedAt: '2025-01-01T00:00:00Z'
    })
  },
  update: {
    ok: true,
    json: async () => ({
      success: true,
      message: 'Stream updated successfully'
    })
  },
  dataUrl: {
    ok: true,
    json: async () => ({
      data: 'sample data'
    })
  }
}

/**
 * Setup comprehensive fetch mocking for tests
 */
export function setupFetchMock() {
  const mockFetch = vi.fn()

  // Default mock implementation
  mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
    console.log(`Mock fetch called: ${options?.method || 'GET'} ${url}`)

    // Handle different endpoints based on URL patterns
    if (url.includes('/start')) {
      return {
        ok: true,
        json: async () => ({
          whip_url: 'http://localhost:8088/whip/stream-123',
          whep_url: 'http://localhost:8088/whep/stream-123',
          rtmp_url: 'http://localhost:8088/rtmp/stream-123',
          rtmp_output_url: 'http://localhost:8088/rtmp-output/stream-123',
          update_url: 'http://localhost:8088/update/stream-123',
          status_url: 'http://localhost:8088/status/stream-123',
          data_url: 'http://localhost:8088/data/stream-123',
          stream_id: 'stream-123'
        })
      }
    } else if (url.includes('/whep')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'Location': 'http://localhost:8088/whep/stream-123'
        }),
        text: async () => 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      }
    } else if (url.includes('/whip')) {
      return {
        ok: true,
        status: 201,
        headers: new Headers({
          'Location': 'http://localhost:8088/whip/stream-123',
          'ETag': '"abc123"',
          'Link': '<http://localhost:8088/whep/stream-123>; rel="whep"',
          'Livepeer-Playback-Url': 'http://localhost:8088/playback/stream-123'
        }),
        text: async () => 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n'
      }
    } else if (url.includes('/status')) {
      return {
        ok: true,
        json: async () => ({
          status: 'active',
          streamId: 'stream-123',
          startedAt: '2025-01-01T00:00:00Z'
        })
      }
    } else if (url.includes('/update')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          message: 'Stream updated successfully'
        })
      }
    } else if (url.includes('/data')) {
      return {
        ok: true,
        json: async () => ({
          data: 'sample data'
        })
      }
    } else if (url.includes('/stop')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      }
    }

    // Default response for unknown endpoints
    return {
      ok: true,
      status: 200,
      headers: new Headers({}),
      text: async () => 'mock response'
    }
  })

  return mockFetch
}

/**
 * Setup test environment with comprehensive mocking
 */
export function setupTestEnvironment() {
  // Clear all existing mocks
  vi.clearAllMocks()

  // Setup fetch mock
  const mockFetch = setupFetchMock()
  global.fetch = mockFetch

  // Setup other global mocks
  global.navigator = {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [],
        addTrack: () => {},
        removeTrack: () => {},
        getVideoTracks: () => [],
        getAudioTracks: () => []
      }),
      enumerateDevices: vi.fn().mockResolvedValue([])
    }
  } as any

  global.RTCPeerConnection = vi.fn().mockImplementation(function() {
    return {
      setRemoteDescription: vi.fn(),
      setLocalDescription: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ sdp: 'mock-offer-sdp' }),
      localDescription: { sdp: 'mock-offer-sdp' },
      getStats: vi.fn().mockResolvedValue(new Map()),
      addTrack: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      generateCertificate: vi.fn().mockResolvedValue({})
    } as any
  }) as any

  // Mock MediaStream as a constructible class for tests
  class MockMediaStream {
    constructor() {}
    getTracks() { return [] }
    addTrack() {}
    removeTrack() {}
    getVideoTracks() { return [] }
    getAudioTracks() { return [] }
  }

  global.MediaStream = MockMediaStream as any

  // Create EventSource mock with static properties
  const mockEventSource = vi.fn().mockImplementation(function() {
    return {
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  })

  // Add static properties to the mock constructor
  Object.defineProperty(mockEventSource, 'CONNECTING', { value: 0, writable: false })
  Object.defineProperty(mockEventSource, 'OPEN', { value: 1, writable: false })
  Object.defineProperty(mockEventSource, 'CLOSED', { value: 2, writable: false })

  global.EventSource = mockEventSource as any

  return mockFetch
}

// Vitest setup file - runs before all tests
beforeAll(() => {
  setupTestEnvironment()
})

// Export for individual test files that need custom setup
export { vi }