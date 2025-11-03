/**
 * Basic Stream Publisher Example
 * 
 * This example demonstrates how to use the SDK to publish a video stream
 * with AI processing.
 */

import React, { useState } from 'react'
import { useStreamPublisher, StreamConfig } from '@eliteencoder/byoc-sdk'

const config: StreamConfig = {
  whipUrl: 'https://your-server.com/gateway/ai/stream/start',
  whepUrl: 'https://your-server.com/mediamtx',
  dataStreamUrl: 'https://your-server.com/gateway',
  kafkaEventsUrl: 'https://your-server.com/kafka/events',
  defaultPipeline: 'video-analysis'
}

export function BasicPublisher() {
  const [streamName, setStreamName] = useState(`stream-${Date.now()}`)
  const [pipeline, setPipeline] = useState('video-analysis')
  const [prompts, setPrompts] = useState('')

  const {
    isStreaming,
    status,
    stats,
    streamInfo,
    localStream,
    error,
    start,
    stop,
    updateStream,
    getMediaDevices,
    requestPermissions
  } = useStreamPublisher({
    config,
    onStatusChange: (status) => {
      console.log('Publisher status:', status)
    },
    onStatsUpdate: (stats) => {
      console.log('Stats:', stats)
    },
    onError: (error) => {
      console.error('Publisher error:', error)
    },
    onStreamStarted: (response) => {
      console.log('Stream started:', response)
    }
  })

  const handleStart = async () => {
    try {
      await start({
        streamName,
        pipeline,
        width: 1280,
        height: 720,
        fpsLimit: 30,
        enableVideoIngress: true,
        enableAudioIngress: true,
        customParams: prompts ? { prompts } : {}
      })
    } catch (error) {
      console.error('Failed to start stream:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stop()
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }

  const handleUpdatePrompts = async () => {
    try {
      await updateStream({
        params: { prompts }
      })
      alert('Stream updated successfully!')
    } catch (error) {
      console.error('Failed to update stream:', error)
    }
  }

  const handleRequestPermissions = async () => {
    try {
      await requestPermissions(true, true)
      alert('Permissions granted!')
    } catch (error) {
      console.error('Failed to request permissions:', error)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Basic Stream Publisher</h1>

      {/* Configuration */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Configuration</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Stream Name:
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              disabled={isStreaming}
              style={{ marginLeft: '10px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Pipeline:
            <input
              type="text"
              value={pipeline}
              onChange={(e) => setPipeline(e.target.value)}
              disabled={isStreaming}
              style={{ marginLeft: '10px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Prompts:
            <textarea
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              style={{ marginLeft: '10px', width: '300px', height: '60px' }}
              placeholder="Enter AI prompts here..."
            />
          </label>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleRequestPermissions}
          style={{ marginRight: '10px' }}
        >
          Request Permissions
        </button>
        <button
          onClick={handleStart}
          disabled={isStreaming}
          style={{ marginRight: '10px' }}
        >
          Start Streaming
        </button>
        <button
          onClick={handleStop}
          disabled={!isStreaming}
          style={{ marginRight: '10px' }}
        >
          Stop Streaming
        </button>
        <button
          onClick={handleUpdatePrompts}
          disabled={!isStreaming}
        >
          Update Prompts
        </button>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <p>Connection: {status}</p>
        <p>Streaming: {isStreaming ? 'Yes' : 'No'}</p>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Statistics</h2>
          <p>Bitrate: {stats.bitrate} kbps</p>
          <p>FPS: {stats.fps}</p>
          <p>Resolution: {stats.resolution}</p>
        </div>
      )}

      {/* Stream Info */}
      {streamInfo && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Stream Information</h2>
          <p>Stream ID: {streamInfo.streamId}</p>
          <p>Playback URL: {streamInfo.playbackUrl}</p>
          <p>Data URL: {streamInfo.dataUrl}</p>
        </div>
      )}

      {/* Local Preview */}
      {localStream && (
        <div>
          <h2>Local Preview</h2>
          <video
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream
              }
            }}
            style={{ width: '100%', maxWidth: '640px', border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  )
}

