import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
	const body = await request.json()
  const url = `/api/v1/chat/${courseId}/stream`
  
  try {
    const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				credentials: 'include',
			},
			body: JSON.stringify({ message: body.message }),
		})

		if (!response.ok) {
			throw new Error(`Backend request failed with status ${response.status}`)
		}
    
    // Return the streaming response
    return new Response(response.body, {
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