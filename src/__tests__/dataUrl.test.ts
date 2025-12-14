/**
 * Tests for DataStreamClient URL construction
 * Verifies fix for Issue #16: https://github.com/muxionlabs/byoc-sdk/issues/16
 */

import { describe, it, expect } from 'vitest'
import { StreamConfig } from '../types'

describe('DataStreamClient URL construction (Issue #16)', () => {
  it('should construct correct data URL with default path', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway-usa.muxion.video/g'
    })
    
    const dataUrl = config.getDataUrl('demo-stream-f0b2a44e')
    
    // Should match the correct format from Issue #16
    expect(dataUrl).toBe('https://gateway-usa.muxion.video/g/gateway/ai/stream/demo-stream-f0b2a44e/data')
  })

  it('should construct correct data URL with trailing slash in gateway', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway.example.com:8088/'
    })
    
    const dataUrl = config.getDataUrl('my-stream')
    
    expect(dataUrl).toBe('https://gateway.example.com:8088/gateway/ai/stream/my-stream/data')
    expect(dataUrl).not.toContain('/live/video-to-video/')  // Old incorrect path
    expect(dataUrl).toContain('/gateway/ai/stream/')        // Correct path
  })

  it('should allow custom data path override', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway.example.com:8088',
      dataPath: '/custom/path/'
    })
    
    const dataUrl = config.getDataUrl('test-stream')
    
    expect(dataUrl).toBe('https://gateway.example.com:8088/custom/path/test-stream/data')
  })

  it('should respect custom data URL parameter', () => {
    const config = new StreamConfig({
      gatewayUrl: 'https://gateway.example.com:8088'
    })
    
    const customUrl = 'https://custom.example.com/data/stream/xyz'
    const dataUrl = config.getDataUrl('my-stream', customUrl)
    
    expect(dataUrl).toBe(customUrl)
  })
})
