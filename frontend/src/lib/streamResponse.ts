// Helper to read EventSource stream as text
export async function* readStreamAsText(stream: ReadableStream): AsyncGenerator<string> {
  console.log("Reading stream as text...", [stream, typeof stream]);
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      if (chunk) {
        yield chunk
      }
    }
  } finally {
    reader.releaseLock()
  }
}