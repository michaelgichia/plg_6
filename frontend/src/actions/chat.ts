'use server'

import {ChatPublic} from '@/client'
import {ChatService} from '@/client/sdk.gen'
import {get} from '@/utils'
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

  console.log('Chat history response:', response)

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

export const createChatStream = async (courseId: string, message: string) => {
  try {
    const response = await ChatService.postApiV1ChatByCourseIdStream({
      path: {course_id: courseId},
      body: {message},
      headers: {
        credentials: 'include',
      },
      responseValidator: async () => {},
    })

    if (!response.data) {
      throw new Error('No data received from chat stream')
    }

    return response.data
  } catch (error) {
    console.log('Failed to create chat stream:', error)
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )
    throw new Error(errorMsg)
  }
}
