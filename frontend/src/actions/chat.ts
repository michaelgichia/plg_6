'use server'

import {ChatPublic} from '@/client'
import {ChatService} from '@/client/sdk.gen'
import {Result} from '@/lib/result'
import {mapApiError} from '@/lib/mapApiError'

export async function getChatHistory(courseId: string): Promise<Result<ChatPublic[]>> {
  try {
    const response = await ChatService.getApiV1ChatByCourseIdHistory({
      path: {course_id: courseId},
      headers: {credentials: 'include'},
      responseValidator: async () => {},
      requestValidator: async () => {},
    })

    return {
      ok: true,
      data: response.data ?? [],
    }
  } catch (err) {
    console.log('Error fetching chat history:', err)
    return {
      ok: false,
      error: mapApiError(err),
    }
  }
}