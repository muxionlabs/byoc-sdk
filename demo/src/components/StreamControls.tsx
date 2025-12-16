import { ChangeEvent } from 'react'
import { StreamStartResponse } from '@muxionlabs/byoc-sdk'
import { SavedWorkflow } from '../types'

interface StreamControlsProps {
  badgeClass: string
  streamStatus: string
  isStreaming: boolean
  viewerStatus: string
  streamInfo: StreamStartResponse | null
  combinedError: string | null
  streamName: string
  pipeline: string
  pipelines: string[]
  onPipelineChange: (value: string) => void
  selectedWorkflowId: string
  workflows: SavedWorkflow[]
  onWorkflowChange: (event: ChangeEvent<HTMLSelectElement>) => void
  prompts: string
  onPromptChange: (value: string) => void
  onStart: () => void
  onStop: () => void
  onUpdatePrompts: () => void
}

export function StreamControls({
  badgeClass,
  streamStatus,
  isStreaming,
  viewerStatus,
  streamInfo,
  combinedError,
  streamName,
  pipeline,
  pipelines,
  onPipelineChange,
  selectedWorkflowId,
  workflows,
  onWorkflowChange,
  prompts,
  onPromptChange,
  onStart,
  onStop,
  onUpdatePrompts
}: StreamControlsProps) {
  return (
    <section className="section">
      <h2>Stream Controls</h2>

      <div className="status-bar">
        <span className={badgeClass}>{streamStatus.toUpperCase()}</span>
        {isStreaming && (
          <span className="live-indicator">
            <span className="live-dot" />
            <span>LIVE</span>
          </span>
        )}
        <div className="mini-info">
          <span>Stream ID: {streamInfo?.streamId || '-'}</span>
          <span>WHEP: {streamInfo?.whepUrl || '-'}</span>
          <span>Data: {streamInfo?.dataUrl || '-'}</span>
          <span>Viewer: {viewerStatus}</span>
        </div>
      </div>

      {combinedError && (
        <div className="alert alert-error">
          {combinedError}
        </div>
      )}

      <div className="controls">
        <input type="text" value={streamName} readOnly />
        <select value={pipeline} onChange={(event) => onPipelineChange(event.target.value)}>
          {pipelines.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="controls">
        <select value={selectedWorkflowId} onChange={onWorkflowChange}>
          <option value="">Custom Prompt...</option>
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name || workflow.title || workflow.id}
            </option>
          ))}
        </select>
        <textarea
          value={prompts}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Enter AI prompts or select a saved workflow..."
          rows={3}
        />
      </div>

      <div className="controls">
        <button className="btn-primary" onClick={onStart} disabled={isStreaming}>
          ▶️ Start Stream
        </button>
        <button className="btn-danger" onClick={onStop} disabled={!isStreaming}>
          ⏹️ Stop Stream
        </button>
        <button className="btn-secondary" onClick={onUpdatePrompts} disabled={!isStreaming}>
          🔄 Update Prompts
        </button>
      </div>
    </section>
  )
}

