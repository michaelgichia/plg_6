import { ChatService } from "@/client"

export const createChatStream = async (courseId: string, message: string) => {
   if (typeof window === 'undefined') {
    const response = await ChatService.postApiV1ChatStream({
      path: { course_id: courseId },
      body: { message },
      responseValidator: async () => {},
    })
    return response.data
  }

  // On the client, use fetch with credentials
  const response = await fetch(`/api/v1/chat/${courseId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.body // This is the ReadableStream
}

// Helper to read EventSource stream as text
export async function* readStreamAsText(stream: ReadableStream): AsyncGenerator<string> {
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