/**
 * Tests for StreamConfig data URL construction
 * Verifies fix for Issue #16: https://github.com/muxionlabs/byoc-sdk/issues/16
 */

import { describe, it, expect } from 'vitest'
import { StreamConfig, StreamStartResponse } from '../types'

describe('StreamConfig data URL construction (Issue #16)', () => {
  it('should return empty string when no stream start response', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway-usa.muxion.video/g'
    })
    
    const dataUrl = config.getDataUrl()
    
    expect(dataUrl).toBe('')
  })

  it('should return data URL from stream start response', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway-usa.muxion.video/g'
    })
    
    const mockResponse: StreamStartResponse = {
      whipUrl: 'whip-url',
      whepUrl: 'whep-url',
      rtmpUrl: 'rtmp-url',
      rtmpOutputUrl: 'rtmp-output-url',
      updateUrl: 'update-url',
      statusUrl: 'status-url',
      dataUrl: 'https://gateway-usa.muxion.video/g/gateway/ai/stream/demo-stream-f0b2a44e/data',
      streamId: 'demo-stream-f0b2a44e'
    }
    
    config.updateFromStreamStartResponse(mockResponse)
    const dataUrl = config.getDataUrl()
    
    expect(dataUrl).toBe('https://gateway-usa.muxion.video/g/gateway/ai/stream/demo-stream-f0b2a44e/data')
  })

  it('should handle gateway URL with trailing slash', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway.example.com:8088/'
    })
    
    const mockResponse: StreamStartResponse = {
      whipUrl: 'whip-url',
      whepUrl: 'whep-url',
      rtmpUrl: 'rtmp-url',
      rtmpOutputUrl: 'rtmp-output-url',
      updateUrl: 'update-url',
      statusUrl: 'status-url',
      dataUrl: 'https://gateway.example.com:8088/gateway/ai/stream/my-stream/data',
      streamId: 'my-stream'
    }
    
    config.updateFromStreamStartResponse(mockResponse)
    const dataUrl = config.getDataUrl()
    
    expect(dataUrl).toBe('https://gateway.example.com:8088/gateway/ai/stream/my-stream/data')
    expect(dataUrl).not.toContain('/live/video-to-video/')  // Old incorrect path
    expect(dataUrl).toContain('/gateway/ai/stream/')        // Correct path
  })

  it('should return empty string when dataUrl is empty in response', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway.example.com:8088'
    })
    
    const mockResponse: StreamStartResponse = {
      whipUrl: 'whip-url',
      whepUrl: 'whep-url',
      rtmpUrl: 'rtmp-url',
      rtmpOutputUrl: 'rtmp-output-url',
      updateUrl: 'update-url',
      statusUrl: 'status-url',
      dataUrl: '',
      streamId: 'test-stream'
    }
    
    config.updateFromStreamStartResponse(mockResponse)
    const dataUrl = config.getDataUrl()
    
    expect(dataUrl).toBe('')
  })
})
