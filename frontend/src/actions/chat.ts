'use server'

import {CoursesService} from '@/client'
import {get} from '@/utils'

export interface ChatMessage {
  id: string
  is_system: boolean
  message: string
  author?: string
  avatar?: string
}

const mockApiRequest = (): Promise<{id: string, message: string}> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = { message: "This is system message", id: Date.now().toString() };
      resolve(data);
    }, 2000);
  });
}

export async function sendChat({ id, message }: {id?: string, message: string}): Promise<ChatMessage | undefined> {
  try {
    // change the api call when chat api is ready
    const response = await mockApiRequest();
    return {
      id: response.id,
      message: response.message,
      is_system: true
    };
  } catch (error) {
    console.error(error)
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )

    throw new Error(errorMsg)
  }
}

export async function getHistory({ cursor }: {cursor?: string}): Promise<ChatMessage[]> {
  try {
    const response = await CoursesService.getApiV1Courses()
    return [];
  } catch (error) {
    console.error(error)
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )

    throw new Error(errorMsg)
  }
}
