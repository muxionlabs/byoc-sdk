/**
 * TranscriptionOverlay - Standalone React component for displaying real-time transcriptions
 * 
 * This component can be overlaid on any video player to show AI-generated transcriptions
 * from the BYOC data stream.
 */

import { useEffect, useState, useCallback, CSSProperties } from 'react'
import { StreamConfig, DataStreamEvent } from '../../types'
import { useDataStream } from '../useDataStream'
import { TranscriptionHelper, TranscriptionSegment } from '../../utils/transcription'

export interface TranscriptionOverlayProps {
  /**
   * StreamConfig instance with gateway URL
   */
  config: StreamConfig

  /**
   * Name of the stream to connect to
   */
  streamName?: string

  /**
   * Full data URL if different from default
   */
  dataUrl?: string

  /**
   * Whether to automatically connect
   */
  autoConnect?: boolean

  /**
   * Position of the overlay
   */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  /**
   * Maximum number of transcription lines to display
   */
  maxLines?: number

  /**
   * Maximum length of displayed text (characters)
   */
  maxLength?: number

  /**
   * Whether to show confidence scores
   */
  showConfidence?: boolean

  /**
   * Whether to show timestamps
   */
  showTimestamps?: boolean

  /**
   * Minimum confidence threshold (0-1)
   */
  minConfidence?: number

  /**
   * Custom CSS class name
   */
  className?: string

  /**
   * Custom inline styles
   */
  style?: CSSProperties

  /**
   * Callback when transcription data is received
   */
  onTranscription?: (segments: TranscriptionSegment[]) => void

  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (connected: boolean) => void
}

export function TranscriptionOverlay({
  config,
  streamName,
  dataUrl,
  autoConnect = true,
  position = 'bottom',
  maxLines = 3,
  maxLength,
  showConfidence = false,
  showTimestamps = false,
  minConfidence = 0.0,
  className = '',
  style,
  onTranscription,
  onConnectionChange
}: TranscriptionOverlayProps) {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])

  const handleData = useCallback(
    (event: DataStreamEvent) => {
      const parsed = TranscriptionHelper.parseTranscription(event)
      const filtered = TranscriptionHelper.filterByConfidence(parsed, minConfidence)

      if (filtered.length > 0) {
        setSegments((prev) => [...prev, ...filtered].slice(-maxLines))
        onTranscription?.(filtered)
      }
    },
    [maxLines, minConfidence, onTranscription]
  )

  const { isConnected, connect, disconnect } = useDataStream({
    config,
    onData: handleData,
    onConnected: () => onConnectionChange?.(true),
    onDisconnected: () => onConnectionChange?.(false),
    onError: (error) => console.error('Transcription error:', error)
  })

  // Auto-connect when streamName is provided
  useEffect(() => {
    if (autoConnect && (streamName || dataUrl)) {
      if (streamName) {
        connect({ streamName }).catch(console.error)
      } else if (dataUrl) {
        connect({ streamName: '', dataUrl }).catch(console.error)
      }
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, streamName, dataUrl, connect, disconnect])

  // Don't render if not connected or no segments
  if (!isConnected || segments.length === 0) {
    return null
  }

  // Calculate position styles
  const positionStyles = getPositionStyles(position)

  // Render segments
  const displaySegments = segments.slice(-maxLines)

  return (
    <div
      className={`byoc-transcription-overlay ${className}`}
      style={{
        ...defaultStyles,
        ...positionStyles,
        ...style
      }}
    >
      <div style={contentStyles}>
        {displaySegments.map((segment) => (
          <div key={segment.id} style={segmentStyles}>
            {showTimestamps && segment.start !== undefined && (
              <span style={timestampStyles}>
                [{formatTime(segment.start)}]
              </span>
            )}
            <span style={textStyles}>
              {maxLength && segment.text.length > maxLength
                ? segment.text.slice(0, maxLength) + '...'
                : segment.text}
            </span>
            {showConfidence && segment.confidence !== undefined && (
              <span style={confidenceStyles}>
                {Math.round(segment.confidence * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Get CSS styles based on position
 */
function getPositionStyles(position: TranscriptionOverlayProps['position']): CSSProperties {
  const basePosition: CSSProperties = {
    position: 'absolute',
    zIndex: 1000
  }

  switch (position) {
    case 'top':
      return { ...basePosition, top: '20px', left: '50%', transform: 'translateX(-50%)' }
    case 'bottom':
      return { ...basePosition, bottom: '80px', left: '50%', transform: 'translateX(-50%)' }
    case 'top-left':
      return { ...basePosition, top: '20px', left: '20px' }
    case 'top-right':
      return { ...basePosition, top: '20px', right: '20px' }
    case 'bottom-left':
      return { ...basePosition, bottom: '80px', left: '20px' }
    case 'bottom-right':
      return { ...basePosition, bottom: '80px', right: '20px' }
    default:
      return { ...basePosition, bottom: '80px', left: '20px' }
  }
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Default styles (can be overridden)
const defaultStyles: CSSProperties = {
  maxWidth: '80%',
  minWidth: '200px',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '8px',
  padding: '12px 16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  fontFamily: 'system-ui, -apple-system, sans-serif'
}

const contentStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const segmentStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#fff',
  fontSize: '14px',
  lineHeight: '1.4'
}

const textStyles: CSSProperties = {
  flex: 1
}

const timestampStyles: CSSProperties = {
  color: '#aaa',
  fontSize: '12px',
  fontFamily: 'monospace'
}

const confidenceStyles: CSSProperties = {
  color: '#6c0',
  fontSize: '12px',
  fontWeight: 'bold'
}

