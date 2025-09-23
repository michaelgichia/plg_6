'use server'

import {redirect} from 'next/navigation'

import {CoursePublic, CoursesService} from '@/client'
import {zCourseCreate} from '@/client/zod.gen'

import {handleError} from './handleErrors'
import {IState} from '@/types/common'

export async function getCourses(): Promise<CoursePublic[] | IState> {
  try {
    const response = await CoursesService.getApiV1Courses({
      responseValidator: async () => {},
    })
    return response.data?.data ?? []
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
      courses: [],
    }
  }
}

export async function getCourse(id: string): Promise<CoursePublic | IState> {
  try {
    const response = await CoursesService.getApiV1CoursesById({
      path: {id},
      responseValidator: async () => {},
    })
    return response.data
  } catch (error) {
    return {
      message: handleError(error),
      success: false,
    }
  }
}

export async function createCourse(_state: unknown, formData: FormData) {
  let course: CoursePublic | IState
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
      message: handleError(error),
      success: false,
    }
  }

  redirect(`/dashboard/courses/create?courseId=${course?.id}`)
}
