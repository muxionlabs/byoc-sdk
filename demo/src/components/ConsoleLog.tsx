import { RefObject } from 'react'
import { LogEntry } from '../types'

interface ConsoleLogProps {
  logs: LogEntry[]
  containerRef: RefObject<HTMLDivElement>
}

export function ConsoleLog({ logs, containerRef }: ConsoleLogProps) {
  return (
    <section className="section">
      <h2>Console Log</h2>
      <div className="log-container" ref={containerRef}>
        {logs.length === 0 && (
          <div className="log-entry log-info">No events yet. Start streaming to see logs.</div>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className={`log-entry log-${entry.level}`}>
            [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.message}
          </div>
        ))}
      </div>
    </section>
  )
}

