import { NextRequest } from 'next/server'
import { ChatService } from '@/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const body = await request.json()
  
  try {
    const response = await ChatService.postApiV1ChatStream({
      path: { course_id: params.courseId },
      body,
    })
    
    // Return the streaming response
    return new Response(response.data, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return Response.json({ error: 'Failed to stream response' }, { status: 500 })
  }
}