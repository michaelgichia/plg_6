'use server'

import { CoursePublic, CoursesService } from '@/client'
import { get } from '@/utils'

export async function getCourses(): Promise<CoursePublic[] | undefined> {
  try {
    const response = await CoursesService.getApiV1Courses()

    if (response?.error) {
      throw new Error(
        typeof response.error?.detail === 'string'
          ? response.error.detail
          : 'API request failed'
      )
    }

    return response.data?.data ?? []
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed'
    )

    throw new Error(errorMsg)
  }
}