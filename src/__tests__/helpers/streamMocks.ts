import { vi } from 'vitest'

export const mockStartStream = vi.fn()
export const mockStopStream = vi.fn()
export const mockSendStreamUpdate = vi.fn()
export const mockFetchStreamStatus = vi.fn()

export const registerStreamApiMocks = () => {
  vi.mock('../../api/start', () => ({
    startStream: mockStartStream,
    stopStream: mockStopStream
  }))

  vi.mock('../../api/update', () => ({
    sendStreamUpdate: mockSendStreamUpdate
  }))

  vi.mock('../../api/status', () => ({
    fetchStreamStatus: mockFetchStreamStatus
  }))
}

export const setupNavigatorMediaMocks = () => {
  const mockGetUserMedia = vi.fn()
  const mockEnumerateDevices = vi.fn()
  const mockGetDisplayMedia = vi.fn()

  global.navigator = {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: mockEnumerateDevices,
      getDisplayMedia: mockGetDisplayMedia
    }
  } as any

  return { mockGetUserMedia, mockEnumerateDevices, mockGetDisplayMedia }
}

