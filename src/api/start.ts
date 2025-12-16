/**
 * WHIP (WebRTC-HTTP Ingestion Protocol) API client
 */

import { StreamStartOptions,} from '../types'
import { StreamStartResponse } from '../types'

/**
 * Initializes a stream session via the gateway
 */
export async function startStream(
  url: string,
  options: StreamStartOptions,
): Promise<StreamStartResponse> {
  const resolveFlag = (value: boolean | undefined, defaultValue: boolean = true) =>
    typeof value === 'boolean' ? value : defaultValue

  const params: Record<string, any> = {
    height: options.height,
    width: options.width,
    max_framerate: options.fpsLimit || 30,
    ...options.customParams,
  }

  const reqParams = {
    enable_video_ingress: resolveFlag(options.enableVideoIngress),
    enable_audio_ingress: resolveFlag(options.enableAudioIngress),
    enable_video_egress: resolveFlag(options.enableVideoEgress),
    enable_audio_egress: resolveFlag(options.enableAudioEgress),
    enable_data_output: resolveFlag(options.enableDataOutput)
  }

  const req = {
    request: "{}",
    parameters: JSON.stringify(reqParams),
    capability: options.pipeline,
    timeout_seconds: 120
  }
  const reqStr = JSON.stringify(req)

  const startReq = {
    stream_name: options.streamName,
    params: JSON.stringify(params),
    stream_id: options.streamId || "",
    rtmp_output: "",
  }

  console.log(`Initializing gateway stream at: ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Livepeer": btoa(reqStr)
    },
    body: JSON.stringify(startReq)
  })

  if (!response.ok) {
    let errorBody = ''
    try {
      errorBody = await response.text()
    } catch {
      // Ignore if we can't read the body
    }
    const errorMsg = errorBody
      ? `Failed to initialize stream (${response.status}): ${errorBody}`
      : `Failed to initialize stream (${response.status})`
    throw new Error(errorMsg)
  }

  const data = await response.json()
  const getField = (obj: any, snake: string, camel: string) => obj?.[snake] ?? obj?.[camel]

  return {
    whipUrl: getField(data, 'whip_url', 'whipUrl'),
    whepUrl: getField(data, 'whep_url', 'whepUrl'),
    rtmpUrl: getField(data, 'rtmp_url', 'rtmpUrl'),
    rtmpOutputUrl: getField(data, 'rtmp_output_url', 'rtmpOutputUrl'),
    updateUrl: getField(data, 'update_url', 'updateUrl'),
    statusUrl: getField(data, 'status_url', 'statusUrl'),
    dataUrl: getField(data, 'data_url', 'dataUrl'),
    
    streamId: getField(data, 'stream_id', 'streamId')
  }
}


/**
 * Sends a stop stream request
 */
export async function stopStream(stopUrl: string): Promise<boolean> {
  try {
    console.log(`Stopping stream using stopUrl: ${stopUrl}`)

    const response = await fetch(stopUrl, {
      method: 'POST'
    })

    if (response.ok) {
      console.log('Stream stop request sent successfully')
      return true
    } else if (response.status === 404) {
      // Treat 404 as already stopped / idempotent
      return false
    } else {
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {
        // Ignore if we can't read the body
      }
      const errorMsg = errorBody
        ? `Failed to stop stream (${response.status}): ${errorBody}`
        : `Failed to stop stream (${response.status})`
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('Error sending stop request:', error)
    throw error
  }
}



