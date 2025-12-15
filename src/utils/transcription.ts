/**
 * Transcription utility functions for handling transcription data
 */

import { DataStreamEvent } from '../types'

export interface TranscriptionSegment {
  id: string
  text: string
  timestamp: number
  start?: number
  end?: number
  confidence?: number
  speaker?: string
  language?: string
}

export interface TranscriptionData {
  segments: TranscriptionSegment[]
  fullText: string
  language?: string
  confidence?: number
}

/**
 * Helper class for working with transcription data
 */
export class TranscriptionHelper {
  /**
   * Extract plain text from various transcription data formats
   */
  static extractText(event: DataStreamEvent): string | null {
    const data = event.data

    // Handle null/undefined
    if (!data) return null

    // Simple string
    if (typeof data === 'string') return data.trim()

    // Common transcription formats
    if (typeof data === 'object') {
      // Format: { text: "..." }
      if ('text' in data && typeof data.text === 'string') {
        return data.text.trim()
      }

      // Format: { transcription: "..." }
      if ('transcription' in data && typeof data.transcription === 'string') {
        return data.transcription.trim()
      }

      // Format: { segments: [{text: "..."}, ...] }
      if ('segments' in data && Array.isArray(data.segments)) {
        return data.segments
          .map((seg: any) => seg.text || '')
          .filter((text: string) => text.trim())
          .join(' ')
          .trim()
      }

      // Format: { results: [{alternatives: [{transcript: "..."}]}] } (Google Speech API)
      if ('results' in data && Array.isArray(data.results)) {
        return data.results
          .map((result: any) =>
            result.alternatives?.[0]?.transcript || ''
          )
          .filter((text: string) => text.trim())
          .join(' ')
          .trim()
      }
    }

    return null
  }

  /**
   * Parse transcription data into structured segments
   */
  static parseTranscription(event: DataStreamEvent): TranscriptionSegment[] {
    const data = event.data
    const segments: TranscriptionSegment[] = []

    if (!data || typeof data !== 'object') {
      // Create single segment from plain text
      const text = this.extractText(event)
      if (text) {
        segments.push({
          id: `seg-${event.timestamp}`,
          text,
          timestamp: event.timestamp
        })
      }
      return segments
    }

    // Parse structured segments
    if ('segments' in data && Array.isArray(data.segments)) {
      data.segments.forEach((seg: any, index: number) => {
        if (seg.text) {
          segments.push({
            id: seg.id || `seg-${event.timestamp}-${index}`,
            text: seg.text,
            timestamp: seg.timestamp || event.timestamp,
            start: seg.start,
            end: seg.end,
            confidence: seg.confidence,
            speaker: seg.speaker,
            language: seg.language
          })
        }
      })
    } else {
      // Single segment
      const text = this.extractText(event)
      if (text) {
        segments.push({
          id: `seg-${event.timestamp}`,
          text,
          timestamp: event.timestamp,
          confidence: (data as any).confidence,
          language: (data as any).language
        })
      }
    }

    return segments
  }

  /**
   * Format transcription data for display with optional length limit
   */
  static formatForDisplay(
    segments: TranscriptionSegment[],
    maxLength?: number
  ): string {
    const fullText = segments.map((s) => s.text).join(' ')

    if (maxLength && fullText.length > maxLength) {
      return fullText.slice(0, maxLength) + '...'
    }

    return fullText
  }

  /**
   * Export transcription segments to SRT format (SubRip)
   */
  static exportToSRT(segments: TranscriptionSegment[]): string {
    const lines: string[] = []

    segments.forEach((segment, index) => {
      const start = segment.start ?? 0
      const end = segment.end ?? start + 5

      lines.push(`${index + 1}`)
      lines.push(`${formatSRTTime(start)} --> ${formatSRTTime(end)}`)
      lines.push(segment.text)
      lines.push('') // Blank line between segments
    })

    return lines.join('\n')
  }

  /**
   * Export transcription segments to WebVTT format
   */
  static exportToVTT(segments: TranscriptionSegment[]): string {
    const lines: string[] = ['WEBVTT', '']

    segments.forEach((segment) => {
      const start = segment.start ?? 0
      const end = segment.end ?? start + 5

      lines.push(`${formatVTTTime(start)} --> ${formatVTTTime(end)}`)
      lines.push(segment.text)
      lines.push('') // Blank line between segments
    })

    return lines.join('\n')
  }

  /**
   * Merge consecutive segments by the same speaker
   */
  static mergeSegmentsBySpeaker(
    segments: TranscriptionSegment[]
  ): TranscriptionSegment[] {
    if (segments.length === 0) return []

    const merged: TranscriptionSegment[] = []
    let current = { ...segments[0] }

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]

      if (segment.speaker && segment.speaker === current.speaker) {
        // Same speaker - merge text
        current.text += ' ' + segment.text
        current.end = segment.end ?? current.end
      } else {
        // Different speaker or no speaker info - start new segment
        merged.push(current)
        current = { ...segment }
      }
    }

    merged.push(current)
    return merged
  }

  /**
   * Filter segments by confidence threshold
   */
  static filterByConfidence(
    segments: TranscriptionSegment[],
    minConfidence: number
  ): TranscriptionSegment[] {
    return segments.filter(
      (seg) => seg.confidence === undefined || seg.confidence >= minConfidence
    )
  }

  /**
   * Get statistics about transcription quality
   */
  static getStats(segments: TranscriptionSegment[]): {
    totalSegments: number
    totalWords: number
    averageConfidence: number | null
    speakers: string[]
    languages: string[]
    duration: number | null
  } {
    const speakers = new Set<string>()
    const languages = new Set<string>()
    let totalConfidence = 0
    let confidenceCount = 0
    let totalWords = 0
    let minStart: number | null = null
    let maxEnd: number | null = null

    segments.forEach((seg) => {
      if (seg.speaker) speakers.add(seg.speaker)
      if (seg.language) languages.add(seg.language)
      if (seg.confidence !== undefined) {
        totalConfidence += seg.confidence
        confidenceCount++
      }
      totalWords += seg.text.split(/\s+/).filter((w) => w.length > 0).length

      if (seg.start !== undefined) {
        minStart = minStart === null ? seg.start : Math.min(minStart, seg.start)
      }
      if (seg.end !== undefined) {
        maxEnd = maxEnd === null ? seg.end : Math.max(maxEnd, seg.end)
      }
    })

    return {
      totalSegments: segments.length,
      totalWords,
      averageConfidence:
        confidenceCount > 0 ? totalConfidence / confidenceCount : null,
      speakers: Array.from(speakers),
      languages: Array.from(languages),
      duration: minStart !== null && maxEnd !== null ? maxEnd - minStart : null
    }
  }
}

/**
 * Format seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`
}

/**
 * Format seconds to WebVTT time format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number): string {
  return num.toString().padStart(length, '0')
}

