import { NextRequest } from 'next/server'

import { ChatService } from '@/client'
import API_ROUTES from '@/services/url-services';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<typeof API_ROUTES.CHAT>,
): Promise<Response> {

  const { id } = await ctx.params;

  const body = (await request.json());

  try {
    const response = await ChatService.postApiV1ChatByCourseIdStream({
      path: { course_id: id },
      body,
      responseValidator: async () => { },
      requestValidator: async () => { },
      responseType: 'stream',
    });

    const nodeStream = response.data;

    if (!nodeStream || typeof nodeStream.pipe !== 'function') {
      throw new Error('Expected Node readable stream from ChatService');
    }

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        nodeStream.on('end', () => {
          controller.close();
        });

        nodeStream.on('error', (error: Error) => {
          console.error('Chat stream error:', error);
          controller.error(error);
        });
      },

      cancel() {
        nodeStream.destroy();
      }
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Added charset
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Essential for non-buffered streaming
      },
    });
  } catch (error) {
    console.error('Failed to set up chat stream:', error);
    return Response.json(
      { detail: 'Failed to initiate or proxy chat stream' },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
}
