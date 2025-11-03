/**
 * Stream Update API client
 */

/**
 * Sends an update request to modify stream parameters
 */
export async function sendStreamUpdate(
  updateUrl: string,
  streamId: string,
  pipeline: string,
  updateData: Record<string, any>
): Promise<boolean> {
  try {
    console.log('Sending stream update:', updateData)
    console.log(`Using update URL: ${updateUrl}`)

    const requestData = {
      "request": JSON.stringify({ "stream_id": streamId }),
      "parameters": JSON.stringify({}),
      "capability": pipeline,
      "timeout_seconds": 5
    }

    const livepeerHeader = btoa(JSON.stringify(requestData))

    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Livepeer': livepeerHeader
      },
      body: JSON.stringify(updateData)
    })

    if (response.status === 200) {
      console.log('Update sent successfully')
      return true
    } else {
      throw new Error(`Update failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error sending update:', error)
    throw error
  }
}

