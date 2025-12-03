export type LogLevel = 'info' | 'success' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: number
}

export interface SavedWorkflow {
  id: string
  name?: string
  title?: string
  prompts: string
}

export interface TextOverlay {
  id: string
  text: string
  timestamp: number
}

export interface StatsOverlay {
  bitrate: string
  fps: string
  resolution: string
  latency: string
}

