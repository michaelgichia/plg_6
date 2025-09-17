'use server'

import {redirect} from 'next/navigation'

import {CoursePublic, CoursesService} from '@/client'
import {zCourseCreate} from '@/client/zod.gen'
import {get} from '@/utils'

export async function getCourses(): Promise<CoursePublic[] | undefined> {
  try {
    const response = await CoursesService.getApiV1Courses()
    return response.data?.data ?? []
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )

    throw new Error(errorMsg)
  }
}

export async function getCourse(id: string): Promise<CoursePublic | undefined> {
  try {
    const response = await CoursesService.getApiV1CoursesById({path: {id}})
    return response.data
  } catch (error) {
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed',
    )

    throw new Error(errorMsg)
  }
}

export type IState = {
  errors?: {
    name?: string[]
    description?: string[]
  }
  message?: string | null
  success: boolean | null
  course?: CoursePublic
}

export async function createCourse(_state: IState, formData: FormData) {
  let course: CoursePublic | undefined
  try {
    const payload = zCourseCreate.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
    })
    if (!payload.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: payload.error.flatten().fieldErrors,
      }
    }

    const response = await CoursesService.postApiV1Courses({
      body: payload.data,
    })
    course = response.data
  } catch (error) {
    return {
      success: false,
      message: get(
        error as Record<string, never>,
        'detail',
        'API request failed',
      ),
    }
  }

  redirect(`/dashboard/courses/create?courseId=${course?.id}`)
}
