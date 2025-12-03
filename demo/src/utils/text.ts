export const tryParseJson = (input: string): unknown => {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

const coerceToText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.length) {
      return null
    }
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = tryParseJson(trimmed)
      if (parsed) {
        const parsedText = extractTextFromPayload(parsed)
        if (parsedText) {
          return parsedText
        }
      }
    }
    return trimmed
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

export const extractTextFromPayload = (payload: unknown): string | null => {
  const direct = coerceToText(payload)
  if (direct) return direct

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const candidate = extractTextFromPayload(item)
      if (candidate) return candidate
    }
    return null
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const candidateKeys = ['text', 'message', 'output', 'content', 'value']
    for (const key of candidateKeys) {
      const candidate = coerceToText(record[key])
      if (candidate) return candidate
    }

    if (record.data) {
      const nested = extractTextFromPayload(record.data)
      if (nested) return nested
    }

    if (record.outputs) {
      const nested = extractTextFromPayload(record.outputs)
      if (nested) return nested
    }

    if (record.messages) {
      const nested = extractTextFromPayload(record.messages)
      if (nested) return nested
    }
  }

  return null
}

