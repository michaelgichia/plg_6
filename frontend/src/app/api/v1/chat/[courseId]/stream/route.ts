import { NextRequest } from 'next/server'
import { ChatService } from '@/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const body = await request.json()

  try {
    const response = await ChatService.postApiV1ChatByCourseIdStream({
      path: { course_id: courseId },
      body,
      responseValidator: async () => { },
      requestValidator: async () => { },
      responseType: 'stream',
    })

    // Convert Node.js IncomingMessage to Web ReadableStream
    const nodeStream = response.data as any

    if (!nodeStream || typeof nodeStream.pipe !== 'function') {
      throw new Error('Expected Node readable stream from ChatService')
    }

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          // Convert Buffer to Uint8Array for Web ReadableStream
          controller.enqueue(new Uint8Array(chunk))
        })

        nodeStream.on('end', () => {
          controller.close()
        })

        nodeStream.on('error', (error: Error) => {
          controller.error(error)
        })
      },

      cancel() {
        nodeStream.destroy()
      }
    })

    return new Response(webStream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    return Response.json({ error: 'Failed to stream response' }, { status: 500 })
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
}
